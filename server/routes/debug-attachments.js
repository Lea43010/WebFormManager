/**
 * Debug-Endpunkte für Bau-Structura Dateianlagen
 * Bietet Diagnosefunktionen zur Fehlerbehebung bei Dateianhängen
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Verzeichnisse zum Suchen von Anhängen
const UPLOAD_DIRECTORIES = [
  './uploads',
  './public/uploads',
  '/home/runner/workspace/uploads',
  '.'
];

/**
 * GET /api/debug/attachments - Startseite der Debug-Funktionen
 */
router.get('/', (req, res) => {
  res.json({
    message: "Debug-Funktionen für Anhänge",
    endpoints: [
      { path: "/api/debug/attachments/scan", description: "Durchsucht Verzeichnisse nach Anhängen" },
      { path: "/api/debug/attachments/file/:id", description: "Zeigt Details zu einem Anhang" },
      { path: "/api/debug/attachments/check-paths", description: "Überprüft Pfade für Anlagen" }
    ]
  });
});

/**
 * GET /api/debug/attachments/scan - Scanning-Funktion
 */
router.get('/scan', (req, res) => {
  try {
    const results = [];

    // Durchsuche alle definierten Verzeichnisse
    for (const dir of UPLOAD_DIRECTORIES) {
      try {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          const filesInDir = files.length;
          console.log(`Gefunden: ${filesInDir} Dateien in ${dir}`);
          
          // Füge die ersten 10 Dateien als Beispiel hinzu
          const sampleFiles = files.slice(0, 10).map(file => ({
            fileName: file,
            path: path.join(dir, file),
            size: fs.statSync(path.join(dir, file)).size
          }));
          
          results.push({
            directory: dir,
            exists: true,
            totalFiles: filesInDir,
            sampleFiles: sampleFiles
          });
        } else {
          results.push({
            directory: dir,
            exists: false,
            message: "Verzeichnis existiert nicht"
          });
        }
      } catch (error) {
        results.push({
          directory: dir,
          error: true,
          message: `Fehler beim Durchsuchen: ${error.message}`
        });
      }
    }

    res.json({
      message: "Verzeichnisse gescannt",
      results: results
    });
  } catch (error) {
    res.status(500).json({
      message: "Fehler beim Scannen der Verzeichnisse",
      error: error.message
    });
  }
});

/**
 * GET /api/debug/attachments/check-paths - Pfade prüfen
 */
router.get('/check-paths', (req, res) => {
  // Liste wichtiger Pfade, die überprüft werden sollen
  const pathsToCheck = [
    { name: 'Current Working Directory', path: process.cwd() },
    { name: 'Uploads Directory', path: path.resolve('./uploads') },
    { name: 'Public Uploads Directory', path: path.resolve('./public/uploads') },
    { name: 'Absolute Workspace Uploads', path: '/home/runner/workspace/uploads' },
    { name: 'Node Modules Directory', path: path.resolve('./node_modules') },
    { name: 'Parent Directory', path: path.resolve('..') }
  ];

  const results = pathsToCheck.map(item => {
    try {
      const exists = fs.existsSync(item.path);
      const isDirectory = exists ? fs.statSync(item.path).isDirectory() : false;
      const stats = exists ? fs.statSync(item.path) : null;
      
      return {
        ...item,
        exists,
        isDirectory,
        stats: stats ? {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          permissions: stats.mode.toString(8).slice(-3)
        } : null
      };
    } catch (error) {
      return {
        ...item,
        error: error.message
      };
    }
  });

  res.json({
    message: "Pfadprüfung abgeschlossen",
    results: results
  });
});

/**
 * GET /api/debug/attachments/file/:filename - Details zu einer Datei
 */
router.get('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const results = [];
  let fileFound = false;

  // Suche die Datei in allen Verzeichnissen
  for (const dir of UPLOAD_DIRECTORIES) {
    try {
      if (fs.existsSync(dir)) {
        const filePath = path.join(dir, filename);
        
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          fileFound = true;
          
          results.push({
            directory: dir,
            filePath: filePath,
            exists: true,
            isDirectory: stats.isDirectory(),
            stats: {
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              permissions: stats.mode.toString(8).slice(-3)
            }
          });
          
          // Wenn es eine Textdatei ist, versuche den Inhalt anzuzeigen
          const fileExtension = path.extname(filePath).toLowerCase();
          if (['.txt', '.log', '.json', '.js', '.ts', '.html', '.css'].includes(fileExtension)) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              results[results.length - 1].content = content.substring(0, 1000) + 
                (content.length > 1000 ? '... (truncated)' : '');
            } catch (readError) {
              results[results.length - 1].readError = readError.message;
            }
          }
        }
      }
    } catch (error) {
      results.push({
        directory: dir,
        filePath: path.join(dir, filename),
        error: error.message
      });
    }
  }

  if (fileFound) {
    res.json({
      message: `Datei '${filename}' gefunden`,
      results: results
    });
  } else {
    res.status(404).json({
      message: `Datei '${filename}' wurde nicht gefunden`,
      searchedIn: UPLOAD_DIRECTORIES
    });
  }
});

// Funktion zum Testen einer direkten Dateiauslieferung
router.get('/test-download/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // Versuche die Datei in allen bekannten Verzeichnissen zu finden
  for (const dir of UPLOAD_DIRECTORIES) {
    const filePath = path.join(dir, filename);
    
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        console.log(`Datei gefunden: ${filePath}`);
        
        // Bestimme den MIME-Typ basierend auf der Dateiendung
        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'application/octet-stream'; // Standard
        
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        
        // Sende die Datei
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Stream die Datei zum Client
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        // Logge Fehler
        fileStream.on('error', (err) => {
          console.error(`Fehler beim Streamen der Datei: ${err}`);
          if (!res.headersSent) {
            res.status(500).send('Fehler beim Lesen der Datei');
          }
        });
        
        return; // Beende die Funktion, wenn die Datei gefunden wurde
      }
    } catch (error) {
      console.error(`Fehler beim Überprüfen von ${filePath}: ${error.message}`);
    }
  }
  
  // Wenn keine Datei gefunden wurde
  res.status(404).send({
    message: `Datei '${filename}' wurde nicht gefunden`,
    searchedIn: UPLOAD_DIRECTORIES
  });
});

module.exports = router;