/**
 * Debug-Routen für Anhänge
 * Diese Routen bieten Tools zur Diagnose und Reparatur von Problemen mit Anhangs-Dateien
 */
import express from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';
import { storage } from '../storage';

const router = express.Router();

/**
 * GET /api/debug/attachments/scan
 * Scannt alle Anhänge und prüft, ob die Dateien tatsächlich existieren
 */
router.get('/scan', async (req, res) => {
  try {
    console.log('Starte Scan aller Anhänge...');
    
    const attachments = await storage.getAllAttachments();
    const totalAttachments = attachments.length;
    console.log(`Gefunden: ${totalAttachments} Anhänge in der Datenbank`);
    
    const results: any[] = [];
    let missingFiles = 0;
    let foundFiles = 0;
    
    // Mögliche Upload-Verzeichnisse
    const possibleDirectories = [
      './uploads',
      './public/uploads',
      '/home/runner/workspace/uploads'
    ];
    
    // Prüfe alle Verzeichnisse auf Existenz
    const validDirectories = [];
    for (const dir of possibleDirectories) {
      try {
        if (await fs.pathExists(dir)) {
          validDirectories.push(dir);
          console.log(`Verzeichnis gefunden: ${dir}`);
        }
      } catch (err) {
        console.error(`Fehler beim Prüfen des Verzeichnisses ${dir}:`, err);
      }
    }
    
    if (validDirectories.length === 0) {
      return res.status(500).json({
        message: 'Keine gültigen Upload-Verzeichnisse gefunden',
        checkedDirectories: possibleDirectories
      });
    }
    
    // Alle Dateien in allen Upload-Verzeichnissen auflisten
    const allFiles: string[] = [];
    for (const dir of validDirectories) {
      try {
        const files = await fs.readdir(dir);
        console.log(`${files.length} Dateien in ${dir} gefunden`);
        
        // Füge vollständige Pfade zur Dateiliste hinzu
        const fullPaths = files.map(file => path.join(dir, file));
        allFiles.push(...fullPaths);
      } catch (err) {
        console.error(`Fehler beim Lesen des Verzeichnisses ${dir}:`, err);
      }
    }
    
    console.log(`Insgesamt ${allFiles.length} Dateien in allen Upload-Verzeichnissen gefunden`);
    
    // Prüfe jeden Anhang
    for (const attachment of attachments) {
      const result: any = {
        id: attachment.id,
        fileName: attachment.fileName,
        originalName: attachment.originalName,
        registeredPath: attachment.filePath,
        status: 'nicht gefunden'
      };
      
      // Versuche die Datei direkt unter dem registrierten Pfad zu finden
      let fileFound = false;
      if (attachment.filePath) {
        const absolutePath = path.resolve(attachment.filePath);
        try {
          if (await fs.pathExists(absolutePath)) {
            result.status = 'gefunden';
            result.actualPath = absolutePath;
            fileFound = true;
            foundFiles++;
          }
        } catch (err) {
          console.error(`Fehler beim Prüfen von ${absolutePath}:`, err);
        }
      }
      
      // Wenn die Datei nicht unter dem registrierten Pfad gefunden wurde,
      // suche in allen Upload-Verzeichnissen nach einer Datei mit dem gleichen Namen
      if (!fileFound) {
        const fileName = attachment.fileName || path.basename(attachment.filePath || '');
        const originalName = attachment.originalName;
        
        // Suche in allen gefundenen Dateien
        for (const filePath of allFiles) {
          const basename = path.basename(filePath);
          
          // Vergleiche mit verschiedenen Namensvarianten
          if (
            basename === fileName || 
            basename.includes(fileName) || 
            (originalName && basename === originalName) ||
            (originalName && basename.includes(originalName))
          ) {
            result.status = 'gefunden unter alternativem Pfad';
            result.actualPath = filePath;
            fileFound = true;
            foundFiles++;
            break;
          }
        }
        
        if (!fileFound) {
          missingFiles++;
        }
      }
      
      results.push(result);
    }
    
    // Sende die Ergebnisse
    res.json({
      total: totalAttachments,
      found: foundFiles,
      missing: missingFiles,
      foundPercentage: Math.round((foundFiles / totalAttachments) * 100),
      checkedDirectories: validDirectories,
      results
    });
    
  } catch (error) {
    console.error('Fehler beim Scan der Anhänge:', error);
    res.status(500).json({
      message: 'Fehler beim Scannen der Anhänge',
      error: String(error)
    });
  }
});

/**
 * GET /api/debug/attachments/fix-all
 * Versucht, die Pfade aller Anhänge zu reparieren
 */
router.get('/fix-all', async (req, res) => {
  try {
    console.log('Starte Reparatur aller Anhänge...');
    
    const attachments = await storage.getAllAttachments();
    console.log(`Gefunden: ${attachments.length} Anhänge in der Datenbank`);
    
    const results: any[] = [];
    let fixedCount = 0;
    let errorCount = 0;
    
    // Mögliche Upload-Verzeichnisse
    const possibleDirectories = [
      './uploads',
      './public/uploads',
      '/home/runner/workspace/uploads'
    ];
    
    // Prüfe alle Verzeichnisse auf Existenz
    const validDirectories = [];
    for (const dir of possibleDirectories) {
      try {
        if (await fs.pathExists(dir)) {
          validDirectories.push(dir);
        }
      } catch (err) {
        console.error(`Fehler beim Prüfen des Verzeichnisses ${dir}:`, err);
      }
    }
    
    // Alle Dateien in allen Upload-Verzeichnissen auflisten
    const allFiles: string[] = [];
    for (const dir of validDirectories) {
      try {
        const files = await fs.readdir(dir);
        
        // Füge vollständige Pfade zur Dateiliste hinzu
        const fullPaths = files.map(file => path.join(dir, file));
        allFiles.push(...fullPaths);
      } catch (err) {
        console.error(`Fehler beim Lesen des Verzeichnisses ${dir}:`, err);
      }
    }
    
    // Prüfe jeden Anhang
    for (const attachment of attachments) {
      const result: any = {
        id: attachment.id,
        fileName: attachment.fileName,
        originalName: attachment.originalName,
        oldPath: attachment.filePath,
        status: 'keine Änderung'
      };
      
      // Prüfe, ob die Datei unter dem registrierten Pfad existiert
      let fileFound = false;
      if (attachment.filePath) {
        try {
          if (await fs.pathExists(attachment.filePath)) {
            result.status = 'bereits korrekt';
            fileFound = true;
          }
        } catch (err) {
          console.error(`Fehler beim Prüfen von ${attachment.filePath}:`, err);
        }
      }
      
      // Wenn die Datei nicht unter dem registrierten Pfad gefunden wurde,
      // suche in allen Upload-Verzeichnissen nach einer Datei mit dem gleichen Namen
      if (!fileFound) {
        const fileName = attachment.fileName || path.basename(attachment.filePath || '');
        const originalName = attachment.originalName;
        
        // Suche in allen gefundenen Dateien
        for (const filePath of allFiles) {
          const basename = path.basename(filePath);
          
          // Vergleiche mit verschiedenen Namensvarianten
          if (
            basename === fileName || 
            basename.includes(fileName) || 
            (originalName && basename === originalName) ||
            (originalName && basename.includes(originalName))
          ) {
            try {
              // Datei gefunden, aktualisiere den Pfad in der Datenbank
              // Zuerst markiere als nicht-fehlend
              const updatedAttachment = await storage.resetAttachmentFileMissing(attachment.id);
              
              result.status = 'repariert';
              result.newPath = filePath;
              fixedCount++;
              break;
            } catch (err) {
              console.error(`Fehler beim Aktualisieren des Pfads für Anhang ${attachment.id}:`, err);
              result.status = 'Fehler bei der Reparatur';
              result.error = String(err);
              errorCount++;
            }
          }
        }
      }
      
      results.push(result);
    }
    
    // Sende die Ergebnisse
    res.json({
      total: attachments.length,
      fixed: fixedCount,
      errors: errorCount,
      noChange: attachments.length - fixedCount - errorCount,
      results
    });
    
  } catch (error) {
    console.error('Fehler bei der Reparatur der Anhänge:', error);
    res.status(500).json({
      message: 'Fehler bei der Reparatur der Anhänge',
      error: String(error)
    });
  }
});

/**
 * GET /api/debug/attachments/list-missing
 * Listet alle Anhänge auf, die als fehlend markiert sind
 */
router.get('/list-missing', async (req, res) => {
  try {
    const attachments = await storage.getAllAttachments();
    const missingAttachments = attachments.filter(a => a.fileMissing);
    
    res.json({
      total: attachments.length,
      missing: missingAttachments.length,
      attachments: missingAttachments
    });
  } catch (error) {
    console.error('Fehler beim Auflisten fehlender Anhänge:', error);
    res.status(500).json({
      message: 'Fehler beim Auflisten fehlender Anhänge',
      error: String(error)
    });
  }
});

/**
 * POST /api/debug/attachments/:id/fix
 * Versucht, den Pfad eines bestimmten Anhangs zu reparieren
 */
router.post('/:id/fix', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Ungültige Anhangs-ID' });
    }
    
    const attachment = await storage.getAttachment(id);
    if (!attachment) {
      return res.status(404).json({ message: 'Anhang nicht gefunden' });
    }
    
    // Mögliche Upload-Verzeichnisse
    const possibleDirectories = [
      './uploads',
      './public/uploads',
      '/home/runner/workspace/uploads'
    ];
    
    // Alle Dateien in allen Upload-Verzeichnissen auflisten
    const allFiles: string[] = [];
    for (const dir of possibleDirectories) {
      try {
        if (await fs.pathExists(dir)) {
          const files = await fs.readdir(dir);
          const fullPaths = files.map(file => path.join(dir, file));
          allFiles.push(...fullPaths);
        }
      } catch (err) {
        console.error(`Fehler beim Lesen des Verzeichnisses ${dir}:`, err);
      }
    }
    
    // Suche nach der Datei
    const fileName = attachment.fileName || path.basename(attachment.filePath || '');
    const originalName = attachment.originalName;
    
    let fileFound = false;
    let foundPath = '';
    
    // Suche in allen gefundenen Dateien
    for (const filePath of allFiles) {
      const basename = path.basename(filePath);
      
      // Vergleiche mit verschiedenen Namensvarianten
      if (
        basename === fileName || 
        basename.includes(fileName) || 
        (originalName && basename === originalName) ||
        (originalName && basename.includes(originalName))
      ) {
        fileFound = true;
        foundPath = filePath;
        break;
      }
    }
    
    if (fileFound) {
      // Datei gefunden, setze den "file_missing" Status zurück
      const updatedAttachment = await storage.resetAttachmentFileMissing(attachment.id);
      
      res.json({
        message: 'Anhang erfolgreich repariert',
        oldPath: attachment.filePath,
        newPath: foundPath,
        attachment: updatedAttachment
      });
    } else {
      // Datei nicht gefunden, markiere als fehlend
      await storage.markAttachmentFileMissing(attachment.id);
      
      res.status(404).json({
        message: 'Datei konnte nicht gefunden werden',
        attachment
      });
    }
  } catch (error) {
    console.error('Fehler bei der Reparatur des Anhangs:', error);
    res.status(500).json({
      message: 'Fehler bei der Reparatur des Anhangs',
      error: String(error)
    });
  }
});

export default router;