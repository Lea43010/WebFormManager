import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import multer from 'multer';
import { 
  analyzeAsphaltImage, 
  analyzeGroundImage,
  generateRstoVisualization, 
  useStaticVisualization,
  belastungsklassen, 
  asphaltTypen,
  bodenklassen,
  bodentragfaehigkeitsklassen
} from './asphalt-classification';
import { storage } from '../storage';
import { upload } from '../upload';

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
        // Bei einem Fehler mit statischen SVGs ausweichen
        try {
          visualizationUrl = await useStaticVisualization(analysisResult.belastungsklasse, visualizationPath);
        } catch (fallbackError) {
          console.error('Auch Fallback fehlgeschlagen:', fallbackError);
          // Letzter Fallback: direkte URL
          visualizationUrl = `/static/rsto_visualizations/Bk3.2.svg`;
        }
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
  
  // Route zur direkten Oberflächenanalyse von Marker-Fotos
  app.post('/api/map-surface-analysis', upload.single('image'), async (req, res, next) => {
    try {
      // Prüfen, ob Benutzer authentifiziert ist
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Nicht autorisiert' });
      }
      
      // Prüfen, ob eine Datei hochgeladen wurde
      if (!req.file) {
        return res.status(400).json({ message: 'Keine Bilddatei hochgeladen' });
      }
      
      const uploadedFile = req.file;
      
      // Analyse des hochgeladenen Bildes durchführen
      const analysisResult = await analyzeAsphaltImage(uploadedFile.path);
      
      // Visualisierungsdatei generieren
      const visualizationDir = path.join(process.cwd(), 'uploads', 'visualizations');
      await fs.ensureDir(visualizationDir);
      
      const fileName = `map_surface_${Date.now()}`;
      const visualizationPath = path.join(visualizationDir, `${fileName}.png`);
      
      // RStO-Visualisierung generieren
      let visualizationUrl = '';
      try {
        const result = await generateRstoVisualization(
          analysisResult.belastungsklasse,
          visualizationPath
        );
        
        if (result.startsWith('/static/')) {
          visualizationUrl = result;
        } else {
          visualizationUrl = '/uploads/visualizations/' + path.basename(result);
        }
      } catch (error) {
        console.error('Fehler bei der Visualisierungsgenerierung:', error);
        // Bei einem Fehler mit direkter statischer Visualisierung ausweichen
        try {
          visualizationUrl = await useStaticVisualization(analysisResult.belastungsklasse, visualizationPath);
        } catch (fallbackError) {
          console.error('Auch Fallback fehlgeschlagen:', fallbackError);
          // Letzter Fallback: direkte URL
          visualizationUrl = `/static/rsto_visualizations/Bk3.2.svg`;
        }
      }
      
      // Antwort mit allen Analysedaten
      res.json({
        ...analysisResult,
        belastungsklasseDetails: belastungsklassen[analysisResult.belastungsklasse],
        asphaltTypDetails: asphaltTypen[analysisResult.asphalttyp],
        visualizationUrl,
        imageUrl: `/uploads/${path.basename(uploadedFile.path)}`
      });
      
    } catch (error) {
      console.error('Fehler bei der Marker-Oberflächenanalyse:', error);
      next(error);
    }
  });
  
  // Route zur direkten Bodenanalyse von Marker-Fotos
  app.post('/api/map-ground-analysis', upload.single('image'), async (req, res, next) => {
    try {
      // Prüfen, ob Benutzer authentifiziert ist
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Nicht autorisiert' });
      }
      
      // Prüfen, ob eine Datei hochgeladen wurde
      if (!req.file) {
        return res.status(400).json({ message: 'Keine Bilddatei hochgeladen' });
      }
      
      const uploadedFile = req.file;
      
      // Bodenanalyse des hochgeladenen Bildes durchführen
      const analysisResult = await analyzeGroundImage(uploadedFile.path);
      
      // Visualisierungsdatei generieren
      const visualizationDir = path.join(process.cwd(), 'uploads', 'visualizations');
      await fs.ensureDir(visualizationDir);
      
      const fileName = `map_ground_${Date.now()}`;
      const visualizationPath = path.join(visualizationDir, `${fileName}.png`);
      
      // RStO-Visualisierung generieren
      let visualizationUrl = '';
      try {
        const result = await generateRstoVisualization(
          analysisResult.belastungsklasse,
          visualizationPath
        );
        
        if (result.startsWith('/static/')) {
          visualizationUrl = result;
        } else {
          visualizationUrl = '/uploads/visualizations/' + path.basename(result);
        }
      } catch (error) {
        console.error('Fehler bei der Visualisierungsgenerierung:', error);
        // Bei einem Fehler mit direkter statischer Visualisierung ausweichen
        try {
          visualizationUrl = await useStaticVisualization(analysisResult.belastungsklasse, visualizationPath);
        } catch (fallbackError) {
          console.error('Auch Fallback fehlgeschlagen:', fallbackError);
          // Letzter Fallback: direkte URL
          visualizationUrl = `/static/rsto_visualizations/Bk3.2.svg`;
        }
      }
      
      // Antwort mit allen Analysedaten
      res.json({
        ...analysisResult,
        belastungsklasseDetails: belastungsklassen[analysisResult.belastungsklasse],
        bodenklasseDetails: bodenklassen[analysisResult.bodenklasse],
        bodentragfaehigkeitsklasseDetails: bodentragfaehigkeitsklassen[analysisResult.bodentragfaehigkeitsklasse],
        visualizationUrl,
        imageUrl: `/uploads/${path.basename(uploadedFile.path)}`
      });
      
    } catch (error) {
      console.error('Fehler bei der Marker-Bodenanalyse:', error);
      next(error);
    }
  });
}