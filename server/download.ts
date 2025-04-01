import express from 'express';
import path from 'path';
import fs from 'fs-extra';

export function setupDownloadRoutes(app: express.Express) {
  // Direkter Download-Endpoint für die SQL-Migrationsdateien
  app.get('/downloads/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'public', filename);
    
    // Prüfen, ob die Datei existiert
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return res.status(404).send('Datei nicht gefunden');
      }
      
      // Setze den Content-Type basierend auf der Dateiendung
      if (filename.endsWith('.sql')) {
        res.setHeader('Content-Type', 'application/x-sql');
        // Setze den Content-Disposition-Header für Download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      
      // Sende die Datei
      res.sendFile(filePath);
    } catch (error) {
      console.error("Fehler beim Dateizugriff:", error);
      res.status(500).send('Interner Serverfehler');
    }
  });
}