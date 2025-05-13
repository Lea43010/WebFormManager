/**
 * Debug-Routen für Anhänge
 * Diese Routen bieten spezielle Debugging-Funktionen für Anhänge
 */

import { Router } from 'express';
import { storage } from '../storage';
import fs from 'fs-extra';
import path from 'path';

const router = Router();

/**
 * GET /api/debug/attachments
 * Liste aller Anhänge mit Statusprüfung der Dateien
 */
router.get('/', async (req, res) => {
  try {
    // Alle Anhänge aus der Datenbank abrufen
    const attachments = await storage.getAllAttachments();
    console.log(`Debugger: Überprüfe ${attachments.length} Anhänge auf fehlende Dateien...`);

    // Liste der Verzeichnisse, die geprüft werden sollen
    const directoriesToCheck = [
      './uploads',
      './public/uploads',
      '/home/runner/workspace/uploads'
    ];

    // Tatsächliche Dateien in den Verzeichnissen
    const actualFiles: Record<string, string[]> = {};
    for (const dir of directoriesToCheck) {
      try {
        if (await fs.pathExists(dir)) {
          actualFiles[dir] = await fs.readdir(dir);
          console.log(`Debugger: ${actualFiles[dir].length} Dateien im Verzeichnis ${dir} gefunden`);
        } else {
          console.log(`Debugger: Verzeichnis ${dir} existiert nicht`);
          actualFiles[dir] = [];
        }
      } catch (error) {
        console.error(`Debugger: Fehler beim Lesen des Verzeichnisses ${dir}:`, error);
        actualFiles[dir] = [];
      }
    }

    // Status für jeden Anhang überprüfen
    const attachmentStatus = await Promise.all(attachments.map(async (attachment) => {
      const fileName = path.basename(attachment.filePath);
      
      // In allen Verzeichnissen suchen
      let fileFound = false;
      let foundInDirectory = "";
      let matchedFileName = "";
      
      for (const dir of directoriesToCheck) {
        // Exakte Datei suchen
        if (actualFiles[dir].includes(fileName)) {
          fileFound = true;
          foundInDirectory = dir;
          matchedFileName = fileName;
          break;
        }
        
        // Auch nach ähnlichen Dateinamen suchen
        const similarFiles = actualFiles[dir].filter(file => 
          file.includes(fileName) || 
          fileName.includes(file) ||
          (fileName.split('-').pop() && file.includes(fileName.split('-').pop() || '')) ||
          (attachment.originalName && file.includes(attachment.originalName))
        );
        
        if (similarFiles.length > 0) {
          fileFound = true;
          foundInDirectory = dir;
          matchedFileName = similarFiles[0];
          break;
        }
      }

      return {
        id: attachment.id,
        projectId: attachment.projectId,
        fileName: attachment.fileName,
        originalName: attachment.originalName,
        filePath: attachment.filePath,
        fileSize: attachment.fileSize,
        fileMissing: attachment.fileMissing,
        fileFound,
        foundInDirectory: fileFound ? foundInDirectory : null,
        matchedFileName: fileFound ? matchedFileName : null,
        dataInconsistent: fileFound !== !attachment.fileMissing,
        repairNeeded: fileFound && attachment.fileMissing,
        missingShouldBeMarked: !fileFound && !attachment.fileMissing
      };
    }));

    // Statistiken berechnen
    const statistics = {
      total: attachmentStatus.length,
      found: attachmentStatus.filter(a => a.fileFound).length,
      missing: attachmentStatus.filter(a => !a.fileFound).length,
      missingMarked: attachmentStatus.filter(a => a.fileMissing).length,
      needsRepair: attachmentStatus.filter(a => a.dataInconsistent).length,
      needsFixing: attachmentStatus.filter(a => a.repairNeeded).length,
      needsMarking: attachmentStatus.filter(a => a.missingShouldBeMarked).length,
      directoriesChecked: directoriesToCheck,
      filesFound: actualFiles
    };

    // Debug-Informationen zurückgeben
    return res.json({
      status: 'success',
      statistics,
      attachments: attachmentStatus
    });

  } catch (error) {
    console.error('Debugger: Fehler beim Debuggen der Anhänge:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Fehler beim Debuggen der Anhänge',
      error: String(error)
    });
  }
});

/**
 * GET /api/debug/uploads
 * Liste aller Dateien im Uploads-Verzeichnis
 */
router.get('/uploads', async (req, res) => {
  try {
    const uploadsDir = './uploads';
    
    if (!await fs.pathExists(uploadsDir)) {
      return res.status(404).json({
        status: 'error',
        message: 'Uploads-Verzeichnis nicht gefunden'
      });
    }
    
    const files = await fs.readdir(uploadsDir);
    const fileDetails = await Promise.all(files.map(async (file) => {
      const filePath = path.join(uploadsDir, file);
      const stats = await fs.stat(filePath);
      return {
        name: file,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory()
      };
    }));
    
    return res.json({
      status: 'success',
      directory: uploadsDir,
      fileCount: files.length,
      files: fileDetails
    });
    
  } catch (error) {
    console.error('Debugger: Fehler beim Auflisten des Uploads-Verzeichnisses:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Fehler beim Auflisten des Uploads-Verzeichnisses',
      error: String(error)
    });
  }
});

/**
 * POST /api/debug/attachments/fix-all
 * Repariere alle inkonsistenten Anhänge
 */
router.post('/fix-all', async (req, res) => {
  try {
    // Alle Anhänge aus der Datenbank abrufen
    const attachments = await storage.getAllAttachments();
    console.log(`Debugger: Repariere ${attachments.length} Anhänge...`);

    // Liste der Verzeichnisse, die geprüft werden sollen
    const directoriesToCheck = [
      './uploads',
      './public/uploads',
      '/home/runner/workspace/uploads'
    ];

    // Tatsächliche Dateien in den Verzeichnissen
    const actualFiles: Record<string, string[]> = {};
    for (const dir of directoriesToCheck) {
      try {
        if (await fs.pathExists(dir)) {
          actualFiles[dir] = await fs.readdir(dir);
        } else {
          actualFiles[dir] = [];
        }
      } catch (error) {
        console.error(`Debugger: Fehler beim Lesen des Verzeichnisses ${dir}:`, error);
        actualFiles[dir] = [];
      }
    }

    // Reparaturstatistik
    const repairs = {
      total: attachments.length,
      markedAsMissing: 0,
      markedAsFound: 0,
      pathsUpdated: 0,
      repaired: [] as any[],
      errors: [] as any[]
    };

    // Jeden Anhang überprüfen und reparieren
    for (const attachment of attachments) {
      const fileName = path.basename(attachment.filePath);
      let fileFound = false;
      let foundInDirectory = "";
      let matchedFileName = "";
      
      // In allen Verzeichnissen suchen
      for (const dir of directoriesToCheck) {
        // Exakte Datei suchen
        if (actualFiles[dir].includes(fileName)) {
          fileFound = true;
          foundInDirectory = dir;
          matchedFileName = fileName;
          break;
        }
        
        // Auch nach ähnlichen Dateinamen suchen
        const similarFiles = actualFiles[dir].filter(file => 
          file.includes(fileName) || 
          fileName.includes(file) ||
          (fileName.split('-').pop() && file.includes(fileName.split('-').pop() || '')) ||
          (attachment.originalName && file.includes(attachment.originalName))
        );
        
        if (similarFiles.length > 0) {
          fileFound = true;
          foundInDirectory = dir;
          matchedFileName = similarFiles[0];
          break;
        }
      }

      try {
        // Falls die Datei existiert, aber als fehlend markiert ist
        if (fileFound && attachment.fileMissing) {
          // Aktualisiere den Pfad und markiere als nicht fehlend
          const newPath = path.join(foundInDirectory, matchedFileName);
          await storage.updateAttachmentPath(attachment.id, newPath);
          repairs.markedAsFound++;
          repairs.pathsUpdated++;
          repairs.repaired.push({
            id: attachment.id,
            action: 'Pfad und Status aktualisiert',
            oldPath: attachment.filePath,
            newPath
          });
        } 
        // Falls die Datei nicht existiert und nicht als fehlend markiert ist
        else if (!fileFound && !attachment.fileMissing) {
          // Markiere als fehlend
          await storage.markAttachmentAsMissing(attachment.id);
          repairs.markedAsMissing++;
          repairs.repaired.push({
            id: attachment.id,
            action: 'Als fehlend markiert',
            path: attachment.filePath
          });
        }
      } catch (error) {
        repairs.errors.push({
          id: attachment.id,
          error: String(error)
        });
      }
    }

    return res.json({
      status: 'success',
      message: `Reparatur abgeschlossen: ${repairs.markedAsMissing} als fehlend markiert, ${repairs.markedAsFound} als gefunden markiert, ${repairs.pathsUpdated} Pfade aktualisiert`,
      repairs
    });

  } catch (error) {
    console.error('Debugger: Fehler beim Reparieren der Anhänge:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Fehler beim Reparieren der Anhänge',
      error: String(error)
    });
  }
});

export default router;