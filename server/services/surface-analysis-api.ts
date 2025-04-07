import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { 
  analyzeAsphaltImage, 
  analyzeGroundImage,
  generateRstoVisualization, 
  useStaticVisualization,
  getImageAsBase64,
  belastungsklassen, 
  asphaltTypen,
  bodenklassen,
  bodentragfaehigkeitsklassen
} from './asphalt-classification';
import { storage } from '../storage';

// Definition der Rückgabetypen für die Analyse-Funktionen
type AsphaltAnalysisResult = {
  belastungsklasse: keyof typeof belastungsklassen;
  asphalttyp: keyof typeof asphaltTypen;
  confidence: number;
  analyseDetails: string;
};

type GroundAnalysisResult = {
  belastungsklasse: keyof typeof belastungsklassen;
  bodenklasse: keyof typeof bodenklassen;
  bodentragfaehigkeitsklasse: keyof typeof bodentragfaehigkeitsklassen;
  confidence: number;
  analyseDetails: string;
};

export function setupSurfaceAnalysisRoutes(app: express.Express) {
  // Route zur Analyse eines hochgeladenen Bildes (Asphalt oder Boden)
  app.post('/api/analyze-surface/:attachmentId', async (req, res, next) => {
    try {
      // Prüfen, ob Benutzer authentifiziert ist
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Nicht autorisiert' });
      }
      
      // Analyse-Typ aus dem Request-Body extrahieren (Standardmäßig Asphalt)
      const analysisType = req.body.analysisType || 'asphalt';
      
      // Attachment-ID abrufen und prüfen
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
      
      // Bild analysieren je nach Typ
      let analysisResult: AsphaltAnalysisResult | GroundAnalysisResult;
      if (analysisType === 'ground') {
        analysisResult = await analyzeGroundImage(attachment.filePath) as GroundAnalysisResult;
      } else {
        analysisResult = await analyzeAsphaltImage(attachment.filePath) as AsphaltAnalysisResult;
      }
      
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
        // Diese Funktion gibt entweder einen lokalen Pfad zurück (wenn die API funktioniert)
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
        // Bei einem Fehler mit direkter statischer Visualisierung ausweichen
        try {
          visualizationUrl = await useStaticVisualization(analysisResult.belastungsklasse, visualizationPath);
        } catch (fallbackError) {
          console.error('Auch Fallback fehlgeschlagen:', fallbackError);
          // Letzter Fallback: direkte URL
          visualizationUrl = `/static/rsto_visualizations/Bk3.2.svg`;
        }
      }
      
      // Analyseergebnisse in der Datenbank speichern (optional)
      try {
        const analysisData: any = {
          projectId: attachment.projectId,
          latitude: 0,  // Nullwerte vermeiden - stattdessen 0 verwenden
          longitude: 0, // Nullwerte vermeiden - stattdessen 0 verwenden
          locationName: "",
          street: "",
          houseNumber: "",
          postalCode: "",
          city: "",
          notes: "",
          imageFilePath: attachment.filePath,
          visualizationFilePath: visualizationPath,
          belastungsklasse: analysisResult.belastungsklasse,
          confidence: analysisResult.confidence,
          analyseDetails: analysisResult.analyseDetails,
          analysisType: analysisType as 'asphalt' | 'ground'
        };
        
        // Typ-spezifische Daten hinzufügen
        if (analysisType === 'asphalt' && 'asphalttyp' in analysisResult) {
          analysisData.asphalttyp = analysisResult.asphalttyp;
          analysisData.bodenklasse = null;
          analysisData.bodentragfaehigkeitsklasse = null;
        } else if (analysisType === 'ground' && 'bodenklasse' in analysisResult && 'bodentragfaehigkeitsklasse' in analysisResult) {
          analysisData.asphalttyp = null;
          analysisData.bodenklasse = analysisResult.bodenklasse;
          analysisData.bodentragfaehigkeitsklasse = analysisResult.bodentragfaehigkeitsklasse;
        }
        
        await storage.createSurfaceAnalysis(analysisData);
      } catch (dbError) {
        console.error('Fehler beim Speichern der Analysedetails in der Datenbank:', dbError);
        // Fehler beim Speichern sollte nicht die gesamte Analyse fehlschlagen lassen
      }
      
      // Bild als Base64 einlesen
      const imageBase64 = await getImageAsBase64(attachment.filePath);
      
      // Antwort mit allen Analysedaten vorbereiten
      const responseData: Record<string, any> = {
        ...analysisResult,
        belastungsklasseDetails: belastungsklassen[analysisResult.belastungsklasse],
        visualizationUrl,
        // Bild als Base64 direkt in der Antwort mitschicken
        imageBase64: imageBase64
      };
      
      // Typ-spezifische Daten hinzufügen
      if (analysisType === 'asphalt' && 'asphalttyp' in analysisResult) {
        responseData.asphaltTypDetails = asphaltTypen[analysisResult.asphalttyp];
      } else if (analysisType === 'ground' && 'bodenklasse' in analysisResult && 'bodentragfaehigkeitsklasse' in analysisResult) {
        responseData.bodenklasseDetails = bodenklassen[analysisResult.bodenklasse];
        responseData.bodentragfaehigkeitsklasseDetails = bodentragfaehigkeitsklassen[analysisResult.bodentragfaehigkeitsklasse];
      }
      
      // Vollständige Antwort senden
      res.json(responseData);
      
    } catch (error) {
      console.error(`Fehler bei der ${req.body.analysisType === 'ground' ? 'Boden' : 'Asphalt'}analyse:`, error);
      next(error);
    }
  });
  
  // Bestehende /api/analyze-asphalt/:attachmentId Route weiterhin unterstützen (Abwärtskompatibilität)
  app.post('/api/analyze-asphalt/:attachmentId', async (req, res, next) => {
    // Automatische Weiterleitung an die neue kombinierte Route mit analysisType=asphalt
    req.body.analysisType = 'asphalt';
    app._router.handle(req, res, next);
  });
  
  // Neue Routes für Bodenklassen und Bodentragfähigkeitsklassen
  app.get('/api/soil-classes', (req, res) => {
    res.json(bodenklassen);
  });
  
  app.get('/api/soil-bearing-classes', (req, res) => {
    res.json(bodentragfaehigkeitsklassen);
  });
}