import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { analyzeAsphaltImage, generateRstoVisualization, belastungsklassen, asphaltTypen } from './asphalt-classification';
import { storage } from '../storage';

export function setupImageAnalysisRoutes(app: express.Express) {
  // Route zur Analyse eines hochgeladenen Asphaltbildes
  app.post('/api/analyze-asphalt/:attachmentId', async (req, res, next) => {
    try {
      // Prüfen, ob Benutzer authentifiziert ist
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Nicht autorisiert' });
      }
      
      const attachmentId = parseInt(req.params.attachmentId);
      const attachment = await storage.getAttachment(attachmentId);
      
      if (!attachment) {
        return res.status(404).json({ message: 'Anhang nicht gefunden' });
      }
      
      // Prüfen, ob es sich um ein Bild handelt
      if (attachment.fileType !== 'image') {
        return res.status(400).json({ 
          message: 'Der Anhang ist kein Bild. Nur Bilder können analysiert werden.' 
        });
      }
      
      // Prüfen, ob die Datei existiert
      if (!await fs.pathExists(attachment.filePath)) {
        return res.status(404).json({ message: 'Bilddatei nicht gefunden' });
      }
      
      // Bild analysieren
      const analysisResult = await analyzeAsphaltImage(attachment.filePath);
      
      // Ausgabepfad für das generierte Visualisierungsbild
      const visualizationDir = path.join(process.cwd(), 'uploads', 'visualizations');
      await fs.ensureDir(visualizationDir);
      
      const visualizationPath = path.join(
        visualizationDir, 
        `rsto_viz_${attachmentId}_${Date.now()}.png`
      );
      
      // RStO-Visualisierung generieren
      let visualizationUrl = '';
      try {
        // Diese Funktion gibt nun entweder einen lokalen Pfad zurück (wenn die API funktioniert)
        // oder direkt eine URL zu einer statischen SVG-Datei (als Fallback)
        const result = await generateRstoVisualization(
          analysisResult.belastungsklasse,
          visualizationPath
        );
        
        // Prüfen, ob das Ergebnis bereits eine URL ist (statische SVG)
        if (result.startsWith('/static/')) {
          visualizationUrl = result;
        } else {
          // Sonst normalen Pfad verwenden (API-generiertes Bild)
          visualizationUrl = '/uploads/visualizations/' + path.basename(result);
        }
      } catch (error) {
        console.error('Fehler bei der Visualisierungsgenerierung:', error);
        // Fehler bei der Visualisierung sollte nicht die gesamte Analyse fehlschlagen lassen
      }
      
      // Vollständige Antwort senden
      res.json({
        ...analysisResult,
        belastungsklasseDetails: belastungsklassen[analysisResult.belastungsklasse],
        asphaltTypDetails: asphaltTypen[analysisResult.asphalttyp],
        visualizationUrl
      });
      
    } catch (error) {
      console.error('Fehler bei der Asphaltanalyse:', error);
      next(error);
    }
  });
  
  // Route zum Abrufen aller RStO-Belastungsklassen
  app.get('/api/rsto-classes', (req, res) => {
    res.json(belastungsklassen);
  });
  
  // Route zum Abrufen aller Asphalttypen
  app.get('/api/asphalt-types', (req, res) => {
    res.json(asphaltTypen);
  });
}