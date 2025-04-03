import * as express from "express";
import { Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { upload, handleUploadErrors, cleanupOnError } from "../upload";
import { storage } from "../storage";
import { analyzeAsphaltImage, generateRstoVisualization } from "./asphalt-classification";
import { insertSurfaceAnalysisSchema } from "@shared/schema";

// Schemata für die API-Validierung
const createSurfaceAnalysisSchema = z.object({
  projectId: z.number().optional(),
  latitude: z.number(),
  longitude: z.number(),
  locationName: z.string().optional(),
  street: z.string().optional(),
  houseNumber: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

// PDF-Generation für die Analyse
async function generatePdf(analysisId: number): Promise<Buffer> {
  const analysis = await storage.getSurfaceAnalysis(analysisId);
  if (!analysis) {
    throw new Error("Analyse nicht gefunden");
  }

  // Hier würden wir PDFKit oder eine ähnliche Bibliothek verwenden, um ein PDF zu generieren
  // Für dieses Beispiel erstellen wir nur ein einfaches HTML, das als PDF heruntergeladen werden kann
  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Oberflächenanalyse Bericht</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #6a961f; }
        .report-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .report-section { margin-bottom: 20px; }
        .images { display: flex; gap: 20px; margin-bottom: 20px; }
        .image-container { width: 48%; }
        img { max-width: 100%; border: 1px solid #ddd; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; font-size: 0.8em; color: #666; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div>
          <h1>Oberflächenanalyse Bericht</h1>
          <p>Erstelldatum: ${new Date().toLocaleDateString('de-DE')}</p>
        </div>
        <div>
          <p>Baustellen App</p>
          <p>Analyse-ID: ${analysis.id}</p>
        </div>
      </div>

      <div class="report-section">
        <h2>Standortinformationen</h2>
        <table>
          <tr>
            <th>Koordinaten</th>
            <td>${analysis.latitude}, ${analysis.longitude}</td>
          </tr>
          ${analysis.locationName ? `<tr><th>Standortname</th><td>${analysis.locationName}</td></tr>` : ''}
          ${analysis.street ? `<tr><th>Straße</th><td>${analysis.street}${analysis.houseNumber ? ' ' + analysis.houseNumber : ''}</td></tr>` : ''}
          ${analysis.postalCode || analysis.city ? `<tr><th>Ort</th><td>${analysis.postalCode || ''} ${analysis.city || ''}</td></tr>` : ''}
          ${analysis.notes ? `<tr><th>Notizen</th><td>${analysis.notes}</td></tr>` : ''}
        </table>
      </div>

      <div class="report-section">
        <h2>Analyse-Ergebnisse</h2>
        <table>
          <tr>
            <th>Belastungsklasse</th>
            <td>${analysis.belastungsklasse}</td>
          </tr>
          <tr>
            <th>Asphalttyp</th>
            <td>${analysis.asphalttyp || 'Nicht spezifiziert'}</td>
          </tr>
          <tr>
            <th>Zuverlässigkeit</th>
            <td>${analysis.confidence ? (analysis.confidence * 100).toFixed(0) + '%' : 'Nicht verfügbar'}</td>
          </tr>
          ${analysis.analyseDetails ? `<tr><th>Details</th><td>${analysis.analyseDetails}</td></tr>` : ''}
        </table>
      </div>

      <div class="report-section">
        <h2>Bildanalyse</h2>
        <div class="images">
          <div class="image-container">
            <p><strong>Originalaufnahme</strong></p>
            <img src="${analysis.imageFilePath}" alt="Originalaufnahme der Straßenoberfläche">
          </div>
          <div class="image-container">
            <p><strong>RStO-Visualisierung</strong></p>
            <img src="${analysis.visualizationFilePath}" alt="RStO-Visualisierung">
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Dieser Bericht wurde automatisch generiert durch die Baustellen App.</p>
        <p>© ${new Date().getFullYear()} Alle Rechte vorbehalten.</p>
      </div>
    </body>
    </html>
  `;

  // In einer vollständigen Implementierung würden wir hier HTML-zu-PDF umwandeln
  // Für dieses Beispiel geben wir einfach den HTML-Code als Buffer zurück
  return Buffer.from(html);
}

export function setupSurfaceAnalysisRoutes(app: express.Express) {
  // Analyse abrufen
  app.get("/api/surface-analyses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getSurfaceAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Oberflächenanalyse nicht gefunden" });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Fehler beim Abrufen der Oberflächenanalyse:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  // Analysen für ein Projekt abrufen
  app.get("/api/projects/:projectId/surface-analyses", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const analyses = await storage.getSurfaceAnalyses(projectId);
      res.json(analyses);
    } catch (error) {
      console.error("Fehler beim Abrufen der Oberflächenanalysen:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  // Neue Analyse erstellen
  app.post(
    "/api/surface-analyses",
    upload.single("image"),
    handleUploadErrors,
    cleanupOnError,
    async (req: Request, res: Response) => {
      try {
        // Validiere die Eingabedaten
        const validationResult = createSurfaceAnalysisSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ error: validationResult.error });
        }

        // Prüfe, ob eine Bilddatei hochgeladen wurde
        if (!req.file) {
          return res.status(400).json({ error: "Keine Bilddatei hochgeladen" });
        }

        const { 
          projectId, 
          latitude, 
          longitude, 
          locationName, 
          street,
          houseNumber,
          postalCode,
          city,
          notes 
        } = validationResult.data;

        // Führe die Asphaltanalyse durch
        const imagePath = path.join(process.cwd(), req.file.path);
        const { belastungsklasse, asphalttyp, confidence, analyseDetails } = await analyzeAsphaltImage(imagePath);

        // Erstelle eine RStO-Visualisierung
        const visualizationPath = await generateRstoVisualization(belastungsklasse, path.join('public', 'generated', `viz_${Date.now()}.png`));

        // Speichere die Analyse in der Datenbank
        const analysis = await storage.createSurfaceAnalysis({
          projectId: projectId || 1, // Standardprojekt, falls keines angegeben
          latitude,
          longitude,
          locationName: locationName || null,
          street: street || null,
          houseNumber: houseNumber || null,
          postalCode: postalCode || null,
          city: city || null,
          notes: notes || null,
          imageFilePath: req.file.path,
          visualizationFilePath: visualizationPath,
          belastungsklasse,
          asphalttyp: asphalttyp || null,
          confidence: confidence || null,
          analyseDetails: analyseDetails || null
        });

        res.status(201).json(analysis);
      } catch (error) {
        console.error("Fehler beim Erstellen der Oberflächenanalyse:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
      }
    }
  );

  // Analyse als PDF herunterladen
  app.get("/api/surface-analyses/:id/pdf", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getSurfaceAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Oberflächenanalyse nicht gefunden" });
      }
      
      const pdfBuffer = await generatePdf(id);
      
      // Setze die entsprechenden Header
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="oberflaechen-analyse-${id}.html"`);
      
      // Sende das PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Fehler beim Generieren des PDF:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  // Analyse löschen
  app.delete("/api/surface-analyses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getSurfaceAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Oberflächenanalyse nicht gefunden" });
      }
      
      // Lösche die Dateien, falls sie existieren
      if (analysis.imageFilePath && fs.existsSync(analysis.imageFilePath)) {
        fs.unlinkSync(analysis.imageFilePath);
      }
      
      // Lösche den Eintrag aus der Datenbank
      await storage.deleteSurfaceAnalysis(id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Fehler beim Löschen der Oberflächenanalyse:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
}