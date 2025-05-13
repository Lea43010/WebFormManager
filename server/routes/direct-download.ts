/**
 * Direkte Download-Routen für Bau-Structura
 * Diese vereinfachte Version umgeht den komplexen Pfadsuch-Mechanismus 
 * und sucht Dateien direkt im uploads-Verzeichnis
 */
import express, { Request, Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';
import { storage } from '../storage';

const router = express.Router();

/**
 * GET /download/:id - Direkter Download eines Anhangs
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Ungültige Anhangs-ID" });
    }
    
    const attachment = await storage.getAttachment(id);
    if (!attachment) {
      return res.status(404).json({ message: "Anhang nicht gefunden" });
    }
    
    console.log(`🔍 Direkter Download für Anhang ID ${id} angefordert`);
    console.log(`📋 Anhangsdaten: ${JSON.stringify(attachment, null, 2)}`);
    
    // Extrahiere den Dateinamen vom Original-Pfad und dem Original-Namen
    const filenameFromPath = path.basename(attachment.filePath);
    const originalName = attachment.originalName;
    
    console.log(`📁 Suche nach Datei: ${filenameFromPath} oder ${originalName}`);
    
    // Prüfe verschiedene Verzeichnisse
    const directoriesToCheck = [
      './uploads',
      './public/uploads',
      '/home/runner/workspace/uploads'
    ];
    
    let fileFound = false;
    let foundFilePath = '';
    
    // Überprüfe jedes Verzeichnis
    for (const dir of directoriesToCheck) {
      try {
        // Überprüfe, ob das Verzeichnis existiert
        if (fs.existsSync(dir)) {
          console.log(`📁 Überprüfe Verzeichnis: ${dir}`);
          
          // Liste alle Dateien im Verzeichnis auf
          const files = fs.readdirSync(dir);
          console.log(`📂 ${files.length} Dateien gefunden in ${dir}`);
          
          // Versuche, eine passende Datei zu finden
          const matchingFiles = files.filter((file: string) => 
            file.includes(filenameFromPath) || 
            filenameFromPath.includes(file) ||
            (originalName && file.includes(originalName)) ||
            (originalName && originalName.includes(file))
          );
          
          if (matchingFiles.length > 0) {
            console.log(`✅ Passende Dateien gefunden: ${matchingFiles.join(', ')}`);
            foundFilePath = path.join(dir, matchingFiles[0]);
            fileFound = true;
            break;
          }
        }
      } catch (error) {
        console.error(`Fehler beim Durchsuchen von ${dir}:`, error);
      }
    }
    
    if (fileFound) {
      console.log(`📤 Sende Datei: ${foundFilePath}`);
      
      // Sende die gefundene Datei zum Client
      return res.sendFile(path.resolve(foundFilePath), {
        headers: {
          'Content-Disposition': `attachment; filename="${encodeURIComponent(originalName || filenameFromPath)}"`,
          'Content-Type': getContentType(foundFilePath)
        }
      });
    } else {
      console.log('❌ Keine passende Datei gefunden!');
      return res.status(404).json({ 
        message: "Datei nicht gefunden", 
        filename: filenameFromPath,
        originalName,
        path: attachment.filePath
      });
    }
  } catch (error) {
    console.error('Fehler beim Direkten Download:', error);
    return res.status(500).json({ 
      message: "Interner Serverfehler beim Direkten Download", 
      error: String(error)
    });
  }
});

/**
 * Ermittelt den Content-Type basierend auf der Dateiendung
 */
function getContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  
  // MIME-Types für gängige Dateiformate
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.gz': 'application/gzip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

export default router;