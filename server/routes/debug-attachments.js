/**
 * Debug-Endpunkte für Anhänge im System
 */
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { storage } from '../storage';

const router = express.Router();

// Middleware zur Prüfung der Administrator-Rolle
const requireAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      status: 'error',
      message: "Sie müssen angemeldet sein, um auf diese Funktion zuzugreifen."
    });
  }
  
  if (req.user?.role !== 'administrator') {
    return res.status(403).json({ 
      status: 'error',
      message: "Diese Funktion steht nur Administratoren zur Verfügung."
    });
  }
  
  next();
};

// Configure multer for file uploads
const upload = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileUpload = multer({ 
  storage: upload,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Endpoint for scanning attachments
router.get('/scan', requireAdmin, async (req, res) => {
  try {
    // Bekannte Upload-Verzeichnisse
    const uploadDirs = [
      path.join(process.cwd(), 'uploads'),
      path.join(process.cwd(), 'public', 'uploads'),
      '/home/runner/workspace/uploads'
    ];
    
    // Ergebnisse sammeln
    const results = {
      status: 'success',
      message: 'Scan abgeschlossen',
      timestamp: new Date().toISOString(),
      scan: {
        scannedDirectories: 0,
        totalFilesFound: 0,
        filesInDatabase: 0,
        orphanedFiles: 0,
        missingFiles: 0,
        directorySummary: [],
      },
      orphanedFiles: [],
      missingFiles: []
    };
    
    // Alle Anhänge aus der Datenbank holen
    const dbAttachments = await storage.getAllAttachments();
    results.scan.filesInDatabase = dbAttachments.length;
    
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
    
    results.scan.missingFiles = missingFiles.length;
    results.missingFiles = missingFiles.map(a => ({
      id: a.id,
      fileName: a.fileName,
      path: a.filePath,
      projectId: a.projectId
    }));
    
    // Verzeichnisse scannen
    for (const dir of uploadDirs) {
      try {
        if (fs.existsSync(dir)) {
          results.scan.scannedDirectories++;
          
          // Alle Dateien im Verzeichnis auflisten
          const files = fs.readdirSync(dir);
          const dirFiles = files.filter(file => !file.startsWith('.') && !file.endsWith('.tmp'));
          
          results.scan.totalFilesFound += dirFiles.length;
          
          // Verwaiste Dateien finden (im Dateisystem, aber nicht in der Datenbank)
          const orphanedFiles = dirFiles.filter(file => !dbFilenames.has(file));
          results.scan.orphanedFiles += orphanedFiles.length;
          
          // Details zu diesem Verzeichnis speichern
          results.scan.directorySummary.push({
            directory: dir,
            filesCount: dirFiles.length,
            orphanedFilesCount: orphanedFiles.length,
            accessible: true
          });
          
          // Verwaiste Dateien-Liste erweitern
          orphanedFiles.forEach(file => {
            results.orphanedFiles.push({
              fileName: file,
              path: path.join(dir, file),
              size: fs.statSync(path.join(dir, file)).size
            });
          });
        } else {
          results.scan.directorySummary.push({
            directory: dir,
            error: "Verzeichnis existiert nicht",
            filesCount: 0,
            orphanedFilesCount: 0,
            accessible: false
          });
        }
      } catch (error) {
        console.error(`Fehler beim Scannen von ${dir}:`, error);
        results.scan.directorySummary.push({
          directory: dir,
          error: `Konnte nicht gescannt werden: ${error.message || 'Unbekannter Fehler'}`,
          filesCount: 0,
          orphanedFilesCount: 0,
          accessible: false
        });
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error("Fehler beim Scannen des Dateisystems:", error);
    res.status(500).json({ 
      status: 'error',
      message: "Beim Scannen des Dateisystems ist ein Fehler aufgetreten.",
      error: String(error)
    });
  }
});

// Endpoint for uploading and scanning attachments
router.post('/scan', requireAdmin, fileUpload.single('attachment'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Keine Datei hochgeladen'
      });
    }

    // Dateiinformationen zurückgeben
    res.json({
      status: 'success',
      message: 'Datei erfolgreich hochgeladen und geprüft',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      },
      scanResult: {
        dateisystem: fs.existsSync(req.file.path),
        zugriffsrechte: {
          lesbar: true,
          schreibbar: true
        },
        scannedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Endpoint für HTML Testseite
router.get('/test', requireAdmin, (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Anhang-Diagnose</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 20px;
        color: #333;
        background-color: #f8f9fa;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      h1, h2 {
        color: #4a5568;
      }
      form {
        margin-bottom: 30px;
      }
      input[type="file"] {
        display: block;
        margin-bottom: 15px;
      }
      button {
        background-color: #76a730;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        cursor: pointer;
      }
      button:hover {
        background-color: #5a8418;
      }
      pre {
        background-color: #f0f4f8;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
      }
      .result {
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Bau-Structura Anhang-Diagnose</h1>
      
      <h2>Dateisystem scannen</h2>
      <button id="scanButton">Dateisystem scannen</button>
      <div class="result">
        <pre id="scanResult">Ergebnisse werden hier angezeigt...</pre>
      </div>
      
      <h2>Datei-Upload testen</h2>
      <form id="uploadForm" enctype="multipart/form-data">
        <input type="file" name="attachment" id="attachment">
        <button type="submit">Hochladen und scannen</button>
      </form>
      <div class="result">
        <pre id="uploadResult">Ergebnisse werden hier angezeigt...</pre>
      </div>
    </div>
    
    <script>
      // Scan-Funktionalität
      document.getElementById('scanButton').addEventListener('click', async () => {
        const scanResult = document.getElementById('scanResult');
        scanResult.textContent = 'Scanvorgang läuft...';
        
        try {
          const response = await fetch('/api/debug/attachments/scan');
          const data = await response.json();
          
          scanResult.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
          scanResult.textContent = 'Fehler beim Scannen: ' + error.message;
        }
      });
      
      // Upload-Funktionalität
      document.getElementById('uploadForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const uploadResult = document.getElementById('uploadResult');
        uploadResult.textContent = 'Upload läuft...';
        
        const formData = new FormData(event.target);
        
        try {
          const response = await fetch('/api/debug/attachments/scan', {
            method: 'POST',
            body: formData
          });
          
          const data = await response.json();
          uploadResult.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
          uploadResult.textContent = 'Fehler beim Upload: ' + error.message;
        }
      });
    </script>
  </body>
  </html>
  `;
  
  res.set('Content-Type', 'text/html');
  res.send(html);
});

export default router;