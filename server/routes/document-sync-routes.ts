/**
 * Dokument-Synchronisations-Routen
 * 
 * Diese Routen ermöglichen die Interaktion mit dem Dokument-Synchronisations-Service
 * über die REST-API.
 */

import { Router } from "express";
import { documentSyncService } from "../services/document-sync-service";
import multer from "multer";
import { isAuthenticated } from "../middleware/auth";
import { externalSystemEnum } from "@shared/schema";
import { logger } from "../logger";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Manuelles Synchronisieren eines Dokuments
 * PUT /api/documents/:id/sync
 */
router.put("/api/documents/:id/sync", isAuthenticated, async (req, res) => {
  try {
    const docId = req.params.id;
    const userId = req.user.id.toString();
    
    const result = await documentSyncService.syncDocument(docId, userId);
    res.json({
      success: true,
      document: result
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Synchronisationsfehler: ${errorMessage}`);
    res.status(500).json({ 
      success: false,
      error: "Synchronisation fehlgeschlagen",
      message: errorMessage
    });
  }
});

/**
 * Datei hochladen und mit externem System synchronisieren
 * POST /api/documents/upload
 */
router.post("/api/documents/upload", isAuthenticated, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { projectId, externalSystem } = req.body;
    const userId = req.user.id.toString();
    
    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: "Keine Datei hochgeladen" 
      });
    }
    
    if (!projectId) {
      return res.status(400).json({ 
        success: false,
        error: "Projekt-ID ist erforderlich" 
      });
    }
    
    if (!externalSystem || !Object.values(externalSystemEnum).includes(externalSystem as externalSystemEnum)) {
      return res.status(400).json({ 
        success: false,
        error: "Gültiges externes System ist erforderlich" 
      });
    }
    
    const result = await documentSyncService.uploadAndSync(
      file.buffer,
      file.originalname,
      file.mimetype,
      parseInt(projectId),
      userId,
      externalSystem as externalSystemEnum
    );
    
    res.json({
      success: true,
      document: result
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Upload-Fehler: ${errorMessage}`);
    res.status(500).json({ 
      success: false,
      error: "Upload fehlgeschlagen",
      message: errorMessage
    });
  }
});

/**
 * Dokument abrufen
 * GET /api/documents/:id
 */
router.get("/api/documents/:id", isAuthenticated, async (req, res) => {
  try {
    const docId = req.params.id;
    const document = await documentSyncService.getDocument(docId);
    
    res.json({
      success: true,
      document
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Fehler beim Abrufen des Dokuments: ${errorMessage}`);
    res.status(404).json({ 
      success: false,
      error: "Dokument nicht gefunden",
      message: errorMessage
    });
  }
});

/**
 * Dokumentversionen abrufen
 * GET /api/documents/:id/versions
 */
router.get("/api/documents/:id/versions", isAuthenticated, async (req, res) => {
  try {
    const docId = req.params.id;
    const versions = await documentSyncService.getDocumentVersions(docId);
    
    res.json({
      success: true,
      versions
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Fehler beim Abrufen der Dokumentversionen: ${errorMessage}`);
    res.status(500).json({ 
      success: false,
      error: "Versionen konnten nicht abgerufen werden",
      message: errorMessage
    });
  }
});

/**
 * Dokumente für ein Projekt abrufen
 * GET /api/projects/:id/documents
 */
router.get("/api/projects/:id/documents", isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const documents = await documentSyncService.getDocumentsByProject(projectId);
    
    res.json({
      success: true,
      documents
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Fehler beim Abrufen der Projektdokumente: ${errorMessage}`);
    res.status(500).json({ 
      success: false,
      error: "Projektdokumente konnten nicht abgerufen werden",
      message: errorMessage
    });
  }
});

export default router;