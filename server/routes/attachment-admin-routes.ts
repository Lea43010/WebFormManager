/**
 * Administrator-Werkzeuge für die Verwaltung von Anhängen
 * Diese Routen bieten spezielle Werkzeuge zur Verwaltung und Reparatur von Anhängen
 */

import { Router } from 'express';
import { storage } from '../storage';
import fs from 'fs-extra';
import path from 'path';
import { isAdmin } from '../middleware/auth-middleware';

const router = Router();

// Administratorschutz für alle Routen
router.use(isAdmin);

// Verzeichnisse, die auf Dateien überprüft werden sollen
const directoriesToCheck = [
  './uploads',
  './public/uploads',
  './data/uploads',
  '/home/runner/workspace/uploads'
];

/**
 * GET /api/admin/attachments/scan
 * Überprüft alle Anhänge in der Datenbank und aktualisiert ihren Status
 */
router.get('/scan', async (req, res) => {
  try {
    // Alle Anhänge aus der Datenbank abrufen
    const attachments = await storage.getAllAttachments();
    console.log(`Überprüfe ${attachments.length} Anhänge auf fehlende Dateien...`);

    const results = {
      total: attachments.length,
      missing: 0,
      found: 0,
      repaired: 0,
      filesFoundIn: {} as Record<string, number>,
      updatedAttachments: []
    };

    // Überprüfen Sie jeden Anhang
    for (const attachment of attachments) {
      let fileFound = false;
      let foundPath = '';
      let foundDirectory = '';

      // Extrahieren Sie den Dateinamen aus dem in der Datenbank gespeicherten Pfad
      const fileName = path.basename(attachment.filePath);
      
      // Suchen Sie die Datei in allen Verzeichnissen
      for (const dir of directoriesToCheck) {
        try {
          const testPath = path.join(dir, fileName);
          if (await fs.pathExists(testPath)) {
            fileFound = true;
            foundPath = testPath;
            foundDirectory = dir;
            
            // Zählen Sie, wie viele Dateien in jedem Verzeichnis gefunden wurden
            results.filesFoundIn[dir] = (results.filesFoundIn[dir] || 0) + 1;
            break;
          }
        } catch (error) {
          console.error(`Fehler beim Überprüfen von ${dir}:`, error);
        }
      }

      // Aktualisieren Sie den Status und Pfad des Anhangs, wenn die Datei gefunden wurde
      if (fileFound && attachment.fileMissing) {
        // Die Datei existiert, aber ist als fehlend markiert - reparieren
        try {
          await storage.updateAttachmentPath(attachment.id, foundPath);
          results.repaired++;
          results.updatedAttachments.push({
            id: attachment.id,
            oldPath: attachment.filePath,
            newPath: foundPath
          });
        } catch (error) {
          console.error(`Fehler beim Aktualisieren des Anhangs ${attachment.id}:`, error);
        }
      } else if (!fileFound && !attachment.fileMissing) {
        // Die Datei existiert nicht, ist aber nicht als fehlend markiert
        try {
          await storage.markAttachmentAsMissing(attachment.id);
          results.missing++;
        } catch (error) {
          console.error(`Fehler beim Markieren des Anhangs ${attachment.id} als fehlend:`, error);
        }
      } else if (fileFound) {
        results.found++;
      } else {
        results.missing++;
      }
    }

    // Geben Sie einen Bericht zurück
    return res.json({
      status: 'success',
      message: `Anhang-Scan abgeschlossen: ${results.found} gefunden, ${results.missing} fehlen, ${results.repaired} repariert`,
      results
    });

  } catch (error) {
    console.error('Fehler beim Scannen der Anhänge:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Fehler beim Scannen der Anhänge',
      error: String(error)
    });
  }
});

/**
 * POST /api/admin/attachments/repair/:id
 * Versucht, einen fehlenden Anhang zu reparieren, indem nach der Datei in allen Verzeichnissen gesucht wird
 */
router.post('/repair/:id', async (req, res) => {
  try {
    const attachmentId = parseInt(req.params.id);
    
    // Anhang aus der Datenbank abrufen
    const attachment = await storage.getAttachment(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        status: 'error',
        message: `Anhang mit ID ${attachmentId} nicht gefunden`
      });
    }

    // Extrahieren Sie den Dateinamen aus dem in der Datenbank gespeicherten Pfad
    const fileName = path.basename(attachment.filePath);
    let fileFound = false;
    let foundPath = '';

    // Suchen Sie die Datei in allen Verzeichnissen
    for (const dir of directoriesToCheck) {
      try {
        const testPath = path.join(dir, fileName);
        if (await fs.pathExists(testPath)) {
          fileFound = true;
          foundPath = testPath;
          break;
        }
      } catch (error) {
        console.error(`Fehler beim Überprüfen von ${dir}:`, error);
      }
    }

    if (fileFound) {
      // Aktualisieren Sie den Pfad und Status des Anhangs
      await storage.updateAttachmentPath(attachmentId, foundPath);
      return res.json({
        status: 'success',
        message: `Anhang mit ID ${attachmentId} repariert`,
        oldPath: attachment.filePath,
        newPath: foundPath
      });
    } else {
      return res.status(404).json({
        status: 'error',
        message: `Datei für Anhang ${attachmentId} nicht gefunden`
      });
    }

  } catch (error) {
    console.error(`Fehler beim Reparieren des Anhangs:`, error);
    return res.status(500).json({
      status: 'error',
      message: 'Fehler beim Reparieren des Anhangs',
      error: String(error)
    });
  }
});

export default router;