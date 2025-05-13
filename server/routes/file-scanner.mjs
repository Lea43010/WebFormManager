/**
 * Einfache Datei-Scanner-Route für Bau-Structura
 * Diese Route ist für Debugging und Fehlersuche gedacht.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Standardverzeichnisse zum Suchen
const DIRECTORIES = [
  './uploads',
  './public/uploads',
  '/home/runner/workspace/uploads',
  '.'
];

// Status-Endpunkt
router.get('/', (req, res) => {
  res.json({
    message: "Datei-Scanner API aktiv",
    endpoints: [
      { path: "/scan", description: "Scannt alle Verzeichnisse nach Dateien" },
      { path: "/file/:filename", description: "Sucht eine bestimmte Datei" },
      { path: "/download/:filename", description: "Lädt eine Datei herunter" },
    ]
  });
});

// Scan-Endpunkt
router.get('/scan', (req, res) => {
  const results = [];
  
  for (const dir of DIRECTORIES) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        
        results.push({
          directory: dir,
          exists: true,
          files: files.slice(0, 10), // Nur die ersten 10 Dateien zeigen
          totalCount: files.length
        });
      } else {
        results.push({
          directory: dir,
          exists: false
        });
      }
    } catch (error) {
      results.push({
        directory: dir,
        error: error.message
      });
    }
  }
  
  res.json({
    results
  });
});

// Datei-Suche-Endpunkt
router.get('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const results = [];
  let found = false;
  
  for (const dir of DIRECTORIES) {
    try {
      if (fs.existsSync(dir)) {
        const filePath = path.join(dir, filename);
        
        if (fs.existsSync(filePath)) {
          found = true;
          const stats = fs.statSync(filePath);
          
          results.push({
            directory: dir,
            filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          });
        }
      }
    } catch (error) {
      results.push({
        directory: dir,
        error: error.message
      });
    }
  }
  
  if (found) {
    res.json({
      filename,
      found: true,
      locations: results
    });
  } else {
    res.status(404).json({
      filename,
      found: false,
      message: `Datei ${filename} wurde nicht gefunden`
    });
  }
});

// Download-Endpunkt
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  let found = false;
  
  for (const dir of DIRECTORIES) {
    try {
      if (fs.existsSync(dir)) {
        const filePath = path.join(dir, filename);
        
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          found = true;
          console.log(`Datei gefunden: ${filePath}`);
          
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
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          
          // Datei streamen
          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
          
          fileStream.on('error', (err) => {
            console.error(`Fehler beim Streamen der Datei: ${err}`);
            if (!res.headersSent) {
              res.status(500).send('Fehler beim Lesen der Datei');
            }
          });
          
          return; // Beenden, wenn gefunden
        }
      }
    } catch (error) {
      console.error(`Fehler beim Suchen von ${filename} in ${dir}: ${error.message}`);
    }
  }
  
  if (!found) {
    res.status(404).send({
      message: `Datei ${filename} wurde nicht gefunden`
    });
  }
});

export default router;