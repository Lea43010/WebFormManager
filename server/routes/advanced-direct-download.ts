/**
 * Verbesserter direkter Download für Bau-Structura
 * 
 * Diese Datei enthält eine verbesserte Version der Download-Funktionalität
 * mit besserer Fehlerbehandlung und alternativen Pfadstrategien
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { storage } from '../storage';
import { errorHandler } from '../error-handler';

// Bekannte Upload-Verzeichnisse
const UPLOAD_DIRECTORIES = [
  './uploads',
  './public/uploads',
  '/home/runner/workspace/uploads',
  '.'
];

// Funktion zum Finden einer Datei in verschiedenen Verzeichnissen
export async function findFile(originalPath: string, fileName: string): Promise<string | null> {
  // Zuerst prüfen, ob der Original-Pfad existiert
  if (originalPath && fs.existsSync(originalPath)) {
    console.log(`[Download] Datei gefunden am Originalpfad: ${originalPath}`);
    return originalPath;
  }
  
  // Den Dateinamen aus dem Pfad extrahieren
  const baseFileName = path.basename(originalPath || fileName || '');
  
  // Prüfen, ob irgendeine Datei in den bekannten Verzeichnissen existiert
  for (const dir of UPLOAD_DIRECTORIES) {
    try {
      if (fs.existsSync(dir)) {
        const filePath = path.join(dir, baseFileName);
        if (fs.existsSync(filePath)) {
          console.log(`[Download] Datei gefunden in alternativem Verzeichnis: ${filePath}`);
          return filePath;
        }
        
        // Prüfe, ob der Dateiname im Verzeichnis enthalten ist (teilweise Übereinstimmung)
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file.includes(baseFileName) && baseFileName.length > 10) {
            console.log(`[Download] Ähnliche Datei gefunden: ${path.join(dir, file)}`);
            return path.join(dir, file);
          }
        }
      }
    } catch (error) {
      console.error(`[Download] Fehler beim Suchen in ${dir}:`, error);
    }
  }
  
  return null;
}

// Lese MIME-Typ anhand der Dateiendung
export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  // MIME-Typen-Mapping
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.zip': 'application/zip',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.json': 'application/json',
    '.xml': 'application/xml'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// Express-Router für verbesserte Downloads
export function createAdvancedDownloadRouter() {
  const router = express.Router();
  
  // GET /api/download/:id - Datei herunterladen
  router.get('/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          error: 'Ungültige ID', 
          message: 'Die angegebene ID ist keine gültige Zahl.'
        });
      }
      
      console.log(`[Download] Download angefordert für ID: ${id}`);
      
      // Datei-Informationen aus der Datenbank abrufen
      const attachment = await storage.getAttachment(id);
      
      if (!attachment) {
        console.error(`[Download] Anhang mit ID ${id} nicht gefunden in der Datenbank`);
        return res.status(404).json({ 
          error: 'Datei nicht gefunden', 
          message: 'Die angeforderte Datei wurde in der Datenbank nicht gefunden.'
        });
      }
      
      // Log-Eintrag
      console.log(`[Download] Anhang gefunden in der Datenbank: ${attachment.fileName}`);
      
      // Datei auf dem Dateisystem suchen
      const filePath = await findFile(
        attachment.filePath || '', 
        attachment.fileName || attachment.originalName || ''
      );
      
      if (!filePath) {
        console.error(`[Download] Datei für Anhang mit ID ${id} nicht auf dem Dateisystem gefunden`);
        
        // Status in der Datenbank aktualisieren, wenn die Datei physisch fehlt
        try {
          // Nur ausführen, wenn die Methode existiert
          if (typeof storage.updateAttachmentStatus === 'function') {
            await storage.updateAttachmentStatus(id, 'file_missing');
          } else {
            console.log('[Download] updateAttachmentStatus nicht verfügbar');
          }
        } catch (statusError) {
          console.error('[Download] Fehler beim Aktualisieren des Status:', statusError);
        }
        
        return res.status(404).json({ 
          error: 'Datei nicht gefunden', 
          message: 'Die physische Datei wurde nicht auf dem Server gefunden.',
          databaseInfo: attachment
        });
      }
      
      // Dateistatistik abrufen
      let fileStats;
      try {
        fileStats = fs.statSync(filePath);
      } catch (error) {
        console.error(`[Download] Fehler beim Lesen der Dateistatistik: ${error}`);
        return res.status(500).json({ 
          error: 'Dateifehler', 
          message: 'Fehler beim Lesen der Dateiinformationen',
          details: String(error)
        });
      }
      
      // MIME-Typ bestimmen
      const contentType = getMimeType(filePath);
      
      // Dateinamen für den Download festlegen (entweder Original oder aus der Datenbank)
      const downloadName = attachment.originalName || attachment.fileName || path.basename(filePath);
      
      // Header setzen
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileStats.size);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Stream erzeugen und Fehlerbehandlung
      const fileStream = fs.createReadStream(filePath);
      
      // Stream-Fehlerbehandlung
      fileStream.on('error', (err) => {
        console.error(`[Download] Stream-Fehler beim Senden der Datei: ${err}`);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Fehler beim Lesen', 
            message: 'Die Datei konnte nicht gelesen werden.',
            details: String(err)
          });
        }
      });
      
      // Stream an die Response übergeben
      fileStream.pipe(res);
      
      // Log-Eintrag
      console.log(`[Download] Datei wird gestreamt: ${filePath}`);
    } catch (error) {
      // Zentrale Fehlerbehandlung
      console.error('[Download] Unerwarteter Fehler:', error);
      next(error);
    }
  });
  
  // Fehlerbehandlung für den Router
  router.use(errorHandler);
  
  return router;
}

// Funktion zum Einrichten der Route
export function setupAdvancedDirectDownload(app: express.Express) {
  const router = createAdvancedDownloadRouter();
  app.use('/api/download', router);
  console.log("[INFO] Verbesserte Download-API unter /api/download aktiviert");
}