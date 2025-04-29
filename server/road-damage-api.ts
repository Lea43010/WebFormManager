import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { roadDamageStorage } from "./road-damage-storage";
import { insertRoadDamageSchema } from "@shared/schema-road-damage";
import { saveTempAudioFile, processAudio } from "./services/speech-to-text";

// Multer-Konfiguration für Datei-Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads", "road-damages");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${Date.now()}-${randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB maximale Dateigröße
  },
  fileFilter: (req, file, cb) => {
    // Akzeptierte Dateitypen
    if (file.fieldname === "image") {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Nur Bilder sind erlaubt"));
      }
    } else if (file.fieldname === "audioFile") {
      const allowedMimeTypes = [
        "audio/webm",
        "audio/wav",
        "audio/mpeg",
        "audio/mp4",
        "audio/ogg",
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("Nur Audiodateien sind erlaubt"));
      }
    }
    cb(null, true);
  },
});

/**
 * API-Routen für Straßenschäden registrieren
 */
export function registerRoadDamageAPI(app: any) {
  const router = Router();
  
  // Middleware zur Authentifizierungsprüfung
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nicht authentifiziert" });
    }
    next();
  };
  
  // Straßenschaden erstellen
  router.post("/road-damages", isAuthenticated, async (req, res, next) => {
    try {
      // Validiere die Daten
      const data = insertRoadDamageSchema.parse(req.body);
      
      // Erstelle den Straßenschaden
      const roadDamage = await roadDamageStorage.createRoadDamage(data);
      
      res.status(201).json(roadDamage);
    } catch (error) {
      console.error("Fehler beim Erstellen eines Straßenschadens:", error);
      next(error);
    }
  });
  
  // Straßenschaden aktualisieren
  router.put("/road-damages/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prüfe, ob der Straßenschaden existiert
      const existingDamage = await roadDamageStorage.getRoadDamage(id);
      if (!existingDamage) {
        return res.status(404).json({ message: "Straßenschaden nicht gefunden" });
      }
      
      // Validiere die Daten
      const validData = insertRoadDamageSchema.partial().parse(req.body);
      
      // Aktualisiere den Straßenschaden
      const updatedDamage = await roadDamageStorage.updateRoadDamage(id, validData);
      
      res.json(updatedDamage);
    } catch (error) {
      console.error("Fehler beim Aktualisieren eines Straßenschadens:", error);
      next(error);
    }
  });
  
  // Straßenschaden löschen
  router.delete("/road-damages/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prüfe, ob der Straßenschaden existiert
      const existingDamage = await roadDamageStorage.getRoadDamage(id);
      if (!existingDamage) {
        return res.status(404).json({ message: "Straßenschaden nicht gefunden" });
      }
      
      // Lösche den Straßenschaden
      await roadDamageStorage.deleteRoadDamage(id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Fehler beim Löschen eines Straßenschadens:", error);
      next(error);
    }
  });
  
  // Bild zu einem Straßenschaden hinzufügen
  router.post("/road-damages/:id/image", isAuthenticated, upload.single("image"), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prüfe, ob der Straßenschaden existiert
      const existingDamage = await roadDamageStorage.getRoadDamage(id);
      if (!existingDamage) {
        return res.status(404).json({ message: "Straßenschaden nicht gefunden" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "Keine Datei hochgeladen" });
      }
      
      // Pfad zur Datei erstellen
      const imageUrl = `/uploads/road-damages/${req.file.filename}`;
      
      // Bild zum Straßenschaden hinzufügen
      const updatedDamage = await roadDamageStorage.addImageToRoadDamage(id, imageUrl);
      
      res.json(updatedDamage);
    } catch (error) {
      console.error("Fehler beim Hinzufügen eines Bildes:", error);
      next(error);
    }
  });
  
  // Straßenschaden anhand von Sprachaufnahme erstellen
  router.post("/road-damages/speech", isAuthenticated, upload.single("audioFile"), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Keine Audiodatei hochgeladen" });
      }
      
      const { projectId, createdBy } = req.body;
      
      if (!projectId || !createdBy) {
        return res.status(400).json({ message: "Projekt-ID und Benutzer-ID sind erforderlich" });
      }
      
      // Temporäre Audiodatei speichern
      const audioFilePath = req.file.path;
      
      // Audiodatei analysieren
      const analysis = await processAudio(audioFilePath);
      
      // Pfad zur Audio-Datei erzeugen
      const audioDir = path.join(process.cwd(), "uploads", "road-damages", "audio");
      fs.mkdirSync(audioDir, { recursive: true });
      
      const audioFilename = `${Date.now()}-${randomUUID()}${path.extname(req.file.originalname)}`;
      const audioDestination = path.join(audioDir, audioFilename);
      
      // Datei kopieren, bevor processAudio sie löscht
      fs.copyFileSync(audioFilePath, audioDestination);
      
      // Relative URL zur Audio-Datei
      const audioUrl = `/uploads/road-damages/audio/${audioFilename}`;
      
      // Erstelle den Straßenschaden mit den extrahierten Daten
      const roadDamageData = {
        projectId: parseInt(projectId as string),
        createdBy: parseInt(createdBy as string),
        damageType: analysis.analyzedData.damageType || "sonstiges",
        severity: analysis.analyzedData.severity || "mittel",
        position: analysis.analyzedData.position || null,
        description: analysis.analyzedData.description || analysis.transcription,
        recommendedAction: analysis.analyzedData.recommendedAction || null,
        audioUrl,
        audioTranscription: analysis.transcription,
        estimatedRepairCost: analysis.analyzedData.estimatedCost || null,
      };
      
      // Validiere und erstelle den Straßenschaden
      const validData = insertRoadDamageSchema.parse(roadDamageData);
      const roadDamage = await roadDamageStorage.createRoadDamage(validData);
      
      res.status(201).json({
        ...roadDamage,
        analysis: {
          confidence: analysis.confidence,
          transcription: analysis.transcription,
        },
      });
    } catch (error) {
      console.error("Fehler bei der Sprachverarbeitung:", error);
      next(error);
    }
  });
  
  // Alle Straßenschäden für ein Projekt abrufen
  router.get("/projects/:projectId/road-damages", isAuthenticated, async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      const roadDamages = await roadDamageStorage.getRoadDamagesByProject(projectId);
      
      res.json(roadDamages);
    } catch (error) {
      console.error("Fehler beim Abrufen von Straßenschäden:", error);
      next(error);
    }
  });
  
  // Straßenschaden-Statistiken für ein Projekt abrufen
  router.get("/projects/:projectId/road-damages/stats", isAuthenticated, async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Statistiken abrufen
      const stats = await roadDamageStorage.getRoadDamageStatsByProject(projectId);
      
      res.json(stats);
    } catch (error) {
      console.error("Fehler beim Abrufen der Straßenschadens-Statistiken:", error);
      next(error);
    }
  });
  
  // Einzelnen Straßenschaden abrufen
  router.get("/road-damages/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      const roadDamage = await roadDamageStorage.getRoadDamage(id);
      
      if (!roadDamage) {
        return res.status(404).json({ message: "Straßenschaden nicht gefunden" });
      }
      
      res.json(roadDamage);
    } catch (error) {
      console.error("Fehler beim Abrufen eines Straßenschadens:", error);
      next(error);
    }
  });
  
  app.use("/api", router);
}