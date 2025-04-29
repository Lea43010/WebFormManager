import { Express, Request, Response } from "express";
import { roadDamageStorage } from "./road-damage-storage";
import { insertRoadDamageSchema } from "@shared/schema-road-damage";
import { z } from "zod";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

// Multer Konfiguration für File-Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Stellen Sie sicher, dass die Verzeichnisse existieren
    const imgDir = path.join(process.cwd(), "uploads", "road-damages", "images");
    const audioDir = path.join(process.cwd(), "uploads", "road-damages", "audio");
    
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
    }
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    const dest = file.mimetype.startsWith("image") ? imgDir : audioDir;
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

export function registerRoadDamageRoutes(app: Express) {
  // Alle Straßenschäden abrufen
  app.get("/api/road-damages", async (req: Request, res: Response) => {
    try {
      const roadDamages = await roadDamageStorage.getAllRoadDamages();
      res.json(roadDamages);
    } catch (error) {
      console.error("Fehler beim Abrufen der Straßenschäden:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  // Straßenschäden nach Projekt-ID abrufen
  app.get("/api/projects/:projectId/road-damages", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Ungültige Projekt-ID" });
      }
      
      const roadDamages = await roadDamageStorage.getRoadDamagesByProject(projectId);
      res.json(roadDamages);
    } catch (error) {
      console.error("Fehler beim Abrufen der Straßenschäden für Projekt:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  // Einen einzelnen Straßenschaden abrufen
  app.get("/api/road-damages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Ungültige ID" });
      }
      
      const roadDamage = await roadDamageStorage.getRoadDamage(id);
      if (!roadDamage) {
        return res.status(404).json({ error: "Straßenschaden nicht gefunden" });
      }
      
      res.json(roadDamage);
    } catch (error) {
      console.error("Fehler beim Abrufen des Straßenschadens:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  // Einen neuen Straßenschaden erstellen
  app.post("/api/road-damages", async (req: Request, res: Response) => {
    try {
      const validatedData = insertRoadDamageSchema.parse(req.body);
      const newRoadDamage = await roadDamageStorage.createRoadDamage(validatedData);
      res.status(201).json(newRoadDamage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validierungsfehler", 
          details: error.errors 
        });
      }
      console.error("Fehler beim Erstellen des Straßenschadens:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  // Bild für Straßenschaden hochladen
  app.post("/api/road-damages/upload-image", upload.single("image"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Keine Datei hochgeladen" });
      }
      
      // Relativen Pfad zurückgeben, der über das Web zugänglich ist
      const imageUrl = `/uploads/road-damages/images/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Fehler beim Hochladen des Bildes:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  // Audio für Straßenschaden hochladen
  app.post("/api/road-damages/upload-audio", upload.single("audio"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Keine Datei hochgeladen" });
      }
      
      // Relativen Pfad zurückgeben, der über das Web zugänglich ist
      const audioUrl = `/uploads/road-damages/audio/${req.file.filename}`;
      res.json({ audioUrl });
    } catch (error) {
      console.error("Fehler beim Hochladen der Audiodatei:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  // Einen Straßenschaden aktualisieren
  app.put("/api/road-damages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Ungültige ID" });
      }
      
      // Wir validieren nur die vorhandenen Felder, die aktualisiert werden sollen
      const validatedData = insertRoadDamageSchema.partial().parse(req.body);
      const updatedRoadDamage = await roadDamageStorage.updateRoadDamage(id, validatedData);
      
      if (!updatedRoadDamage) {
        return res.status(404).json({ error: "Straßenschaden nicht gefunden" });
      }
      
      res.json(updatedRoadDamage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validierungsfehler", 
          details: error.errors 
        });
      }
      console.error("Fehler beim Aktualisieren des Straßenschadens:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  // Einen Straßenschaden löschen
  app.delete("/api/road-damages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Ungültige ID" });
      }
      
      const success = await roadDamageStorage.deleteRoadDamage(id);
      if (!success) {
        return res.status(404).json({ error: "Straßenschaden nicht gefunden" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Fehler beim Löschen des Straßenschadens:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
}