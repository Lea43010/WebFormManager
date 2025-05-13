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
    const filenameFromPath = path.basename(attachment.filePath || '');
    const originalName = attachment.originalName;
    const fileName = attachment.fileName;
    
    console.log(`📁 Suche nach Datei: ${filenameFromPath} oder ${fileName} oder ${originalName}`);
    
    // Prüfe verschiedene Verzeichnisse
    const directoriesToCheck = [
      './uploads',
      './public/uploads',
      '/home/runner/workspace/uploads',
      path.dirname(attachment.filePath || ''),
      '.'
    ];
    
    let fileFound = false;
    let foundFilePath = '';
    
    // Falls die Datei direkt im angegebenen Pfad existiert, verwende sie als erstes
    if (attachment.filePath && fs.existsSync(attachment.filePath)) {
      console.log(`✅ Datei existiert direkt am angegebenen Pfad: ${attachment.filePath}`);
      foundFilePath = attachment.filePath;
      fileFound = true;
    } else {
      // Überprüfe jedes Verzeichnis
      for (const dir of directoriesToCheck) {
        try {
          // Überprüfe, ob das Verzeichnis existiert
          if (fs.existsSync(dir)) {
            console.log(`📁 Überprüfe Verzeichnis: ${dir}`);
            
            // Liste alle Dateien im Verzeichnis auf
            const files = fs.readdirSync(dir);
            console.log(`📂 ${files.length} Dateien gefunden in ${dir}`);
          
          // Versuche, eine passende Datei zu finden mit erweiterten Kriterien
          const matchingFiles = files.filter((file: string) => {
            // Exakter Pfad-Match
            if (file === filenameFromPath) {
              console.log(`✅ Exakter Pfad-Match gefunden: ${file}`);
              return true;
            }
            
            // Dateiname-Match
            if (fileName && (file === fileName || file.includes(fileName) || fileName.includes(file))) {
              console.log(`✅ Dateiname-Match gefunden: ${file}`);
              return true;
            }
            
            // Fallback auf Teil-Matchings
            if (file.includes(filenameFromPath) || 
                filenameFromPath.includes(file) ||
                (originalName && file.includes(originalName)) ||
                (originalName && originalName.includes(file))) {
              console.log(`✅ Teil-Match gefunden: ${file}`);
              return true;
            }
            
            return false;
          });
          
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
      
      try {
        // Prüfe ob die Datei existiert und lesbar ist
        await fs.access(foundFilePath, fs.constants.R_OK);
        
        // Sende die gefundene Datei zum Client
        return res.sendFile(path.resolve(foundFilePath), {
          headers: {
            'Content-Disposition': `attachment; filename="${encodeURIComponent(originalName || fileName || filenameFromPath)}"`,
            'Content-Type': getContentType(foundFilePath)
          },
          // Zusätzlicher Error-Handler für sendFile
          dotfiles: 'allow'
        }, (err) => {
          if (err) {
            console.error('❌ Fehler beim Senden der Datei:', err);
            res.status(500).json({ 
              message: "Die Datei konnte nicht gesendet werden",
              userFriendly: true,
              technicalDetails: String(err)
            });
          }
        });
      } catch (accessError) {
        // Datei existiert, ist aber nicht lesbar
        console.error('❌ Datei existiert, ist aber nicht lesbar:', accessError);
        await storage.markAttachmentFileMissing(id);
        return res.status(403).json({ 
          message: "Die Datei existiert, kann aber nicht gelesen werden. Der Administrator wurde benachrichtigt.",
          userFriendly: true
        });
      }
    } else {
      console.log('❌ Keine passende Datei gefunden!');
      // Markiere die Datei als fehlend in der Datenbank
      await storage.markAttachmentFileMissing(id);
      
      return res.status(404).json({ 
        message: "Die angeforderte Datei konnte nicht gefunden werden. Der Administrator wurde benachrichtigt.",
        userFriendly: true,
        technicalDetails: {
          filename: filenameFromPath,
          fileName,
          originalName,
          path: attachment.filePath
        }
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