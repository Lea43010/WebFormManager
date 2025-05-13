/**
 * Debug-Routen für Anhänge
 * 
 * Diese Routen bieten Admin-Tools zur Diagnose und Reparatur von Anhängen.
 * Nur für Administratoren zugänglich.
 */
import express, { Request, Response, NextFunction } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';
import { storage } from '../storage';

const router = express.Router();

// Middleware zur Prüfung der Administrator-Rolle
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      message: "Sie müssen angemeldet sein, um auf diese Funktion zuzugreifen.",
      userFriendly: true
    });
  }
  
  if (req.user?.role !== 'administrator') {
    return res.status(403).json({ 
      message: "Diese Funktion steht nur Administratoren zur Verfügung.",
      userFriendly: true
    });
  }
  
  next();
};

/**
 * GET /api/debug/attachments - Zeigt eine Übersicht der Anhänge mit Status
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const attachments = await storage.getAllAttachments();
    
    // Ergänze die Daten um den Dateistatus
    const attachmentsWithStatus = await Promise.all(
      attachments.map(async (attachment) => {
        let fileExists = false;
        
        try {
          if (attachment.filePath) {
            fileExists = await fs.pathExists(attachment.filePath);
          }
        } catch (error) {
          console.error(`Fehler beim Prüfen von ${attachment.filePath}:`, error);
        }
        
        return {
          ...attachment,
          realFileExists: fileExists
        };
      })
    );
    
    res.json({
      totalCount: attachments.length,
      missingCount: attachmentsWithStatus.filter(a => !a.realFileExists).length,
      attachments: attachmentsWithStatus
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der Debug-Informationen:", error);
    res.status(500).json({ 
      message: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      technicalDetails: String(error),
      userFriendly: true
    });
  }
});

/**
 * GET /api/debug/attachments/scan - Scannt das Dateisystem nach Anhängen und vergleicht mit der Datenbank
 */
router.get('/scan', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Bekannte Upload-Verzeichnisse
    const uploadDirs = [
      './uploads',
      './public/uploads',
      '/home/runner/workspace/uploads'
    ];
    
    // Ergebnisse sammeln
    const results = {
      scannedDirectories: 0,
      totalFilesFound: 0,
      filesInDatabase: 0,
      orphanedFiles: 0,
      missingFiles: 0,
      directoryDetails: [],
      orphanedFilesList: [],
      missingFilesList: []
    };
    
    // Alle Anhänge aus der Datenbank holen
    const dbAttachments = await storage.getAllAttachments();
    results.filesInDatabase = dbAttachments.length;
    
    // Dateinamen aus der Datenbank extrahieren
    const dbFilenames = new Set(
      dbAttachments.map(a => path.basename(a.filePath || ''))
        .filter(name => name.length > 0)
    );
    
    // Sammlung fehlender Dateien
    const missingFiles = dbAttachments.filter(a => {
      try {
        return a.filePath && !fs.existsSync(a.filePath);
      } catch (error) {
        console.error(`Fehler beim Prüfen von ${a.filePath}:`, error);
        return true; // Wenn ein Fehler auftritt, behandeln wir die Datei als fehlend
      }
    });
    
    results.missingFiles = missingFiles.length;
    results.missingFilesList = missingFiles.map(a => ({
      id: a.id,
      fileName: a.fileName,
      path: a.filePath
    }));
    
    // Verzeichnisse scannen
    for (const dir of uploadDirs) {
      try {
        if (fs.existsSync(dir)) {
          results.scannedDirectories++;
          
          // Alle Dateien im Verzeichnis auflisten
          const files = fs.readdirSync(dir);
          const dirFiles = files.filter(file => !file.startsWith('.') && !file.endsWith('.tmp'));
          
          results.totalFilesFound += dirFiles.length;
          
          // Verwaiste Dateien finden (im Dateisystem, aber nicht in der Datenbank)
          const orphanedFiles = dirFiles.filter(file => !dbFilenames.has(file));
          results.orphanedFiles += orphanedFiles.length;
          
          // Details zu diesem Verzeichnis speichern
          results.directoryDetails.push({
            directory: dir,
            filesCount: dirFiles.length,
            orphanedFilesCount: orphanedFiles.length
          });
          
          // Verwaiste Dateien-Liste erweitern
          orphanedFiles.forEach(file => {
            results.orphanedFilesList.push({
              fileName: file,
              path: path.join(dir, file)
            });
          });
        }
      } catch (error) {
        console.error(`Fehler beim Scannen von ${dir}:`, error);
        results.directoryDetails.push({
          directory: dir,
          error: `Konnte nicht gescannt werden: ${error.message || 'Unbekannter Fehler'}`,
          filesCount: 0,
          orphanedFilesCount: 0
        });
      }
    }
    
    res.json({
      scanResults: results,
      userFriendly: true
    });
  } catch (error) {
    console.error("Fehler beim Scannen des Dateisystems:", error);
    res.status(500).json({ 
      message: "Beim Scannen des Dateisystems ist ein Fehler aufgetreten.",
      technicalDetails: String(error),
      userFriendly: true
    });
  }
});

export default router;