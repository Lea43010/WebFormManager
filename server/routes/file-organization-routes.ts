import express, { Request, Response } from "express";
import { db } from "../db";
import { fileOrganizationSuggestions, attachments } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import fileOrganizationService from "../services/file-organization-service";
import { z } from "zod";

const router = express.Router();

// Schema für die Projektanfrage
const projectIdSchema = z.object({
  projectId: z.coerce.number(),
});

// Schema für die Vorschlagsanfrage
const suggestionIdSchema = z.object({
  suggestionId: z.coerce.number(),
});

// Schema für die Dateigruppenanfrage
const fileGroupSchema = z.object({
  projectId: z.coerce.number(),
  fileIds: z.array(z.coerce.number()),
});

// Schema für die Dateianfrage
const fileIdSchema = z.object({
  fileId: z.coerce.number(),
  projectId: z.coerce.number(),
});

/**
 * Erstellt automatisch Vorschläge für alle unorganisierten Dateien eines Projekts
 */
router.post("/api/file-organization/suggestions/generate", async (req: Request, res: Response) => {
  try {
    // Validiere die Anfragedaten
    const validationResult = projectIdSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Ungültige Projekt-ID" });
    }
    
    const { projectId } = validationResult.data;
    
    // Erstelle Vorschläge für das Projekt
    const suggestions = await fileOrganizationService.createSuggestionsForProject(projectId);
    
    return res.status(200).json(suggestions);
  } catch (error) {
    console.error("Fehler beim Generieren von Dateiorganisationsvorschlägen:", error);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
});

/**
 * Gibt alle Vorschläge für ein Projekt zurück
 */
router.get("/api/file-organization/suggestions/:projectId", async (req: Request, res: Response) => {
  try {
    // Validiere die Projekt-ID
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: "Ungültige Projekt-ID" });
    }
    
    // Hole alle Vorschläge für das Projekt
    const suggestions = await db.select()
      .from(fileOrganizationSuggestions)
      .where(eq(fileOrganizationSuggestions.projectId, projectId));
    
    // Für jeden Vorschlag die zugehörigen Dateien laden
    const suggestionsWithFiles = await Promise.all(
      suggestions.map(async (suggestion) => {
        const fileIds = suggestion.fileIds.split(',').map(id => parseInt(id, 10));
        
        const files = await db.select()
          .from(attachments)
          .where(inArray(attachments.id, fileIds));
        
        return {
          ...suggestion,
          files,
        };
      })
    );
    
    return res.status(200).json(suggestionsWithFiles);
  } catch (error) {
    console.error("Fehler beim Abrufen von Dateiorganisationsvorschlägen:", error);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
});

/**
 * Wendet einen Vorschlag auf die entsprechenden Dateien an
 */
router.post("/api/file-organization/suggestions/apply", async (req: Request, res: Response) => {
  try {
    // Validiere die Anfragedaten
    const validationResult = suggestionIdSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Ungültige Vorschlags-ID" });
    }
    
    const { suggestionId } = validationResult.data;
    
    // Wende den Vorschlag an
    const success = await fileOrganizationService.applySuggestion(suggestionId);
    
    if (success) {
      return res.status(200).json({ message: "Vorschlag erfolgreich angewendet" });
    } else {
      return res.status(404).json({ error: "Vorschlag konnte nicht angewendet werden" });
    }
  } catch (error) {
    console.error("Fehler beim Anwenden eines Dateiorganisationsvorschlags:", error);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
});

/**
 * Analysiert eine Gruppe von Dateien und gibt einen Vorschlag zurück
 */
router.post("/api/file-organization/analyze-group", async (req: Request, res: Response) => {
  try {
    // Validiere die Anfragedaten
    const validationResult = fileGroupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Ungültige Anfragedaten" });
    }
    
    const { projectId, fileIds } = validationResult.data;
    
    // Analysiere die Dateigruppe
    const suggestion = await fileOrganizationService.analyzeFilesForGrouping(projectId, fileIds);
    
    if (suggestion) {
      return res.status(200).json(suggestion);
    } else {
      return res.status(404).json({ error: "Keine Analyse möglich" });
    }
  } catch (error) {
    console.error("Fehler bei der Gruppenanalyse:", error);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
});

/**
 * Findet ähnliche Dateien zu einer gegebenen Datei
 */
router.post("/api/file-organization/similar-files", async (req: Request, res: Response) => {
  try {
    // Validiere die Anfragedaten
    const validationResult = fileIdSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Ungültige Anfragedaten" });
    }
    
    const { fileId, projectId } = validationResult.data;
    
    // Suche ähnliche Dateien
    const similarFiles = await fileOrganizationService.findSimilarFiles(fileId, projectId);
    
    return res.status(200).json(similarFiles);
  } catch (error) {
    console.error("Fehler beim Suchen ähnlicher Dateien:", error);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
});

export function setupFileOrganizationRoutes(app: express.Express) {
  app.use(router);
}

export default router;