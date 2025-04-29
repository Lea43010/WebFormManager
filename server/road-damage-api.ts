import { Express, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { roadDamageStorage } from "./road-damage-storage";
import {
  insertRoadDamageSchema,
  roadDamageWithSpeechSchema,
  RoadDamageType,
  DamageSeverity
} from "@shared/schema-road-damage";
import { 
  transcribeAudio, 
  saveAudioTemporarily, 
  cleanupTempAudio, 
  analyzeDamageText 
} from "./services/speech-to-text";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Konfiguration für Multer (File-Upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    // Erlaube nur Audio-Dateien
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Nur Audio-Dateien sind erlaubt."));
    }
  },
});

// Ordner für Bildupload
const UPLOADS_DIR = path.join(process.cwd(), "uploads", "road-damages");

// Stellen Sie sicher, dass der Upload-Ordner existiert
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Registriert die API-Endpunkte für die Straßenschaden-Verwaltung
 * @param app Express-Anwendung
 */
export function registerRoadDamageAPI(app: Express): void {
  // Endpunkt zum Erstellen eines neuen Straßenschadens
  app.post("/api/road-damages", async (req, res) => {
    try {
      const validatedData = insertRoadDamageSchema.parse(req.body);
      const roadDamage = await roadDamageStorage.createRoadDamage(validatedData);
      res.status(201).json(roadDamage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Ungültige Daten", errors: error.errors });
      } else {
        console.error("Fehler beim Erstellen des Straßenschadens:", error);
        res.status(500).json({ message: "Interner Serverfehler" });
      }
    }
  });

  // Endpunkt für die Spracherkennung und Schadenserfassung
  app.post(
    "/api/road-damages/speech",
    upload.single("audioFile"),
    async (req: Request, res: Response) => {
      let audioFilePath: string | null = null;

      try {
        const { projectId, createdBy } = req.body;

        if (!projectId || !createdBy) {
          return res.status(400).json({ message: "Projekt-ID und Ersteller-ID sind erforderlich" });
        }

        const audioFile = req.file;
        if (!audioFile) {
          return res.status(400).json({ message: "Keine Audio-Datei gefunden" });
        }

        // Speichere die Audio-Datei temporär
        audioFilePath = await saveAudioTemporarily(audioFile.buffer);

        // Transkribiere die Audio-Datei
        const transcription = await transcribeAudio(audioFilePath);

        // Analysiere den transkribierten Text
        const analysis = await analyzeDamageText(transcription);

        // Speichere den Straßenschaden in der Datenbank
        const roadDamage = await roadDamageStorage.createRoadDamage({
          projectId: parseInt(projectId),
          damageType: analysis.damageType,
          severity: analysis.severity,
          description: analysis.description,
          recommendedAction: analysis.recommendedAction || '',
          audioTranscription: transcription,
          createdBy: parseInt(createdBy),
        });

        // Erfolgreiche Antwort
        res.status(201).json({
          roadDamage,
          transcription,
          analysis,
        });
      } catch (error) {
        console.error("Fehler bei der Spracherkennung:", error);
        res.status(500).json({ message: "Fehler bei der Verarbeitung der Sprachdaten" });
      } finally {
        // Bereinige die temporäre Audio-Datei
        if (audioFilePath) {
          await cleanupTempAudio(audioFilePath);
        }
      }
    }
  );

  // Endpunkt zum Hochladen eines Bildes für einen Straßenschaden
  app.post("/api/road-damages/:id/image", upload.single("image"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const roadDamage = await roadDamageStorage.getRoadDamageById(id);

      if (!roadDamage) {
        return res.status(404).json({ message: "Straßenschaden nicht gefunden" });
      }

      const image = req.file;
      if (!image) {
        return res.status(400).json({ message: "Kein Bild gefunden" });
      }

      // Generiere einen eindeutigen Dateinamen
      const fileExt = path.extname(image.originalname) || ".jpg";
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      // Speichere das Bild
      await fs.promises.writeFile(filePath, image.buffer);

      // Aktualisiere den Straßenschaden mit der Bild-URL
      const imageUrl = `/uploads/road-damages/${fileName}`;
      const updatedRoadDamage = await roadDamageStorage.updateRoadDamage(id, {
        imageUrl,
      });

      res.status(200).json(updatedRoadDamage);
    } catch (error) {
      console.error("Fehler beim Hochladen des Bildes:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Endpunkt zum Abrufen aller Straßenschäden für ein Projekt
  app.get("/api/projects/:projectId/road-damages", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const roadDamages = await roadDamageStorage.getRoadDamagesByProjectId(projectId);
      res.status(200).json(roadDamages);
    } catch (error) {
      console.error("Fehler beim Abrufen der Straßenschäden:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Endpunkt zum Abrufen eines einzelnen Straßenschadens
  app.get("/api/road-damages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const roadDamage = await roadDamageStorage.getRoadDamageById(id);

      if (!roadDamage) {
        return res.status(404).json({ message: "Straßenschaden nicht gefunden" });
      }

      res.status(200).json(roadDamage);
    } catch (error) {
      console.error("Fehler beim Abrufen des Straßenschadens:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Endpunkt zum Aktualisieren eines Straßenschadens
  app.put("/api/road-damages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRoadDamageSchema.partial().parse(req.body);

      const roadDamage = await roadDamageStorage.getRoadDamageById(id);
      if (!roadDamage) {
        return res.status(404).json({ message: "Straßenschaden nicht gefunden" });
      }

      const updatedRoadDamage = await roadDamageStorage.updateRoadDamage(id, validatedData);
      res.status(200).json(updatedRoadDamage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Ungültige Daten", errors: error.errors });
      } else {
        console.error("Fehler beim Aktualisieren des Straßenschadens:", error);
        res.status(500).json({ message: "Interner Serverfehler" });
      }
    }
  });

  // Endpunkt zum Löschen eines Straßenschadens
  app.delete("/api/road-damages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const roadDamage = await roadDamageStorage.getRoadDamageById(id);
      if (!roadDamage) {
        return res.status(404).json({ message: "Straßenschaden nicht gefunden" });
      }

      // Lösche auch das zugehörige Bild, falls vorhanden
      if (roadDamage.imageUrl) {
        const imagePath = path.join(process.cwd(), roadDamage.imageUrl);
        if (fs.existsSync(imagePath)) {
          await fs.promises.unlink(imagePath);
        }
      }

      await roadDamageStorage.deleteRoadDamage(id);
      res.status(204).send();
    } catch (error) {
      console.error("Fehler beim Löschen des Straßenschadens:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Endpunkt zum Filtern von Straßenschäden nach Typ und Schweregrad
  app.get("/api/projects/:projectId/road-damages/filter", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const damageType = req.query.type as RoadDamageType | undefined;
      const severity = req.query.severity as DamageSeverity | undefined;

      const roadDamages = await roadDamageStorage.getRoadDamagesByTypeAndSeverity(
        projectId,
        damageType,
        severity
      );

      res.status(200).json(roadDamages);
    } catch (error) {
      console.error("Fehler beim Filtern der Straßenschäden:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Endpunkt für Statistiken zu Straßenschäden
  app.get("/api/projects/:projectId/road-damages/stats", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Hole alle benötigten Statistiken parallel
      const [byType, bySeverity, all] = await Promise.all([
        roadDamageStorage.countDamagesByType(projectId),
        roadDamageStorage.countDamagesBySeverity(projectId),
        roadDamageStorage.getRoadDamagesByProjectId(projectId),
      ]);

      // Berechne die Gesamtzahl der Schäden
      const totalDamages = all.length;

      // Berechne die geschätzten Gesamtkosten, falls verfügbar
      const totalEstimatedCost = all.reduce((sum, damage) => {
        return sum + (damage.estimatedCost || 0);
      }, 0);

      res.status(200).json({
        totalDamages,
        totalEstimatedCost,
        byType,
        bySeverity,
      });
    } catch (error) {
      console.error("Fehler beim Abrufen der Statistiken:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });
}