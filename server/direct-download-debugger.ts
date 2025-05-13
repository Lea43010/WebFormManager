/**
 * Direkter Download-Debugger für Bau-Structura
 * 
 * Diese Datei enthält Funktionen zum Testen und Debuggen der Download-Funktionalität
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { storage } from './storage';

// Bekannte Upload-Verzeichnisse zum Durchsuchen
const UPLOAD_DIRECTORIES = [
  './uploads',
  './public/uploads',
  '/home/runner/workspace/uploads',
  '.'
];

// Einfache Funktion zur Überprüfung eines direkten Downloads
export async function checkDirectDownload(id: number) {
  try {
    // Anhang aus der Datenbank abrufen
    const attachment = await storage.getAttachment(id);
    if (!attachment) {
      console.log(`❌ Anhang mit ID ${id} nicht in der Datenbank gefunden`);
      return {
        found: false,
        message: "Anhang nicht in der Datenbank gefunden"
      };
    }
    
    console.log(`✅ Anhang gefunden in der Datenbank:`);
    console.log(JSON.stringify(attachment, null, 2));
    
    // Versuche, die Datei auf der Festplatte zu finden
    const filenameFromPath = path.basename(attachment.filePath || '');
    const originalName = attachment.originalName;
    const fileName = attachment.fileName;
    
    console.log(`🔍 Suche nach Datei: ${filenameFromPath} oder ${fileName}`);
    
    let fileFound = false;
    let foundPaths = [];
    
    // Prüfen, ob der direkte Pfad existiert
    if (attachment.filePath && fs.existsSync(attachment.filePath)) {
      console.log(`✅ Datei existiert am angegebenen Pfad: ${attachment.filePath}`);
      fileFound = true;
      foundPaths.push({ 
        path: attachment.filePath, 
        type: "original" 
      });
    }
    
    // Verzeichnisse durchsuchen
    for (const dir of UPLOAD_DIRECTORIES) {
      try {
        // Überprüfe, ob das Verzeichnis existiert
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          console.log(`📂 ${files.length} Dateien in ${dir}`);
          
          // Suche nach passenden Dateien
          for (const file of files) {
            if (file === filenameFromPath || file === fileName || 
                (file.includes(filenameFromPath) && filenameFromPath !== '') || 
                (fileName && file.includes(fileName))) {
              console.log(`✅ Passende Datei gefunden: ${dir}/${file}`);
              fileFound = true;
              foundPaths.push({
                path: path.join(dir, file),
                type: file === filenameFromPath ? "exact" : "partial"
              });
            }
          }
        } else {
          console.log(`❌ Verzeichnis existiert nicht: ${dir}`);
        }
      } catch (error) {
        console.error(`❌ Fehler beim Durchsuchen von ${dir}:`, error);
      }
    }
    
    if (fileFound) {
      return {
        found: true,
        attachment,
        foundPaths
      };
    } else {
      return {
        found: false,
        attachment,
        message: "Datei nicht auf der Festplatte gefunden"
      };
    }
  } catch (error) {
    console.error("❌ Fehler beim Überprüfen des Downloads:", error);
    return {
      found: false,
      error: String(error)
    };
  }
}

// Funktion, die direkt einen Router zurückgibt für Express
export function createDebugRouter() {
  const router = express.Router();
  
  // GET /debug/download/:id - Informationen über einen Download anzeigen
  router.get('/download/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ungültige ID" });
      }
      
      const result = await checkDirectDownload(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: "Fehler bei der Download-Überprüfung", 
        error: String(error) 
      });
    }
  });
  
  // GET /debug/download/test/:id - Direkten Download testen
  router.get('/download/test/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ungültige ID" });
      }
      
      const result = await checkDirectDownload(id);
      
      if (!result.found || !result.foundPaths || result.foundPaths.length === 0) {
        return res.status(404).json({ 
          message: "Datei nicht gefunden", 
          details: result 
        });
      }
      
      // Versuche, die erste gefundene Datei zu senden
      const filePath = result.foundPaths[0].path;
      const fileName = path.basename(filePath);
      
      // MIME-Typ bestimmen
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      // Häufige Dateitypen
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      
      // Header setzen
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Datei streamen
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (err) => {
        console.error(`Fehler beim Streamen der Datei: ${err}`);
        if (!res.headersSent) {
          res.status(500).send('Fehler beim Lesen der Datei');
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Fehler beim Testen des Downloads", 
        error: String(error) 
      });
    }
  });
  
  // GET /debug/files - Alle Dateien in den Upload-Verzeichnissen anzeigen
  router.get('/files', (req, res) => {
    try {
      const results = [];
      
      for (const dir of UPLOAD_DIRECTORIES) {
        try {
          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            
            results.push({
              directory: dir,
              files: files.map(file => ({
                name: file,
                path: path.join(dir, file),
                size: fs.statSync(path.join(dir, file)).size
              }))
            });
          } else {
            results.push({
              directory: dir,
              error: "Verzeichnis existiert nicht"
            });
          }
        } catch (error) {
          results.push({
            directory: dir,
            error: String(error)
          });
        }
      }
      
      res.json({ results });
    } catch (error) {
      res.status(500).json({ 
        message: "Fehler beim Auflisten der Dateien", 
        error: String(error) 
      });
    }
  });
  
  return router;
}

// Funktion zum Registrieren des Routers an einer Express-App
export function setupDownloadDebugger(app: express.Express) {
  app.use('/api/debug-download', createDebugRouter());
  console.log("[DEBUG] Download-Debugger API unter /api/debug-download aktiviert");
}