/**
 * Such-Routen
 * 
 * Diese Routen ermöglichen die Interaktion mit dem Such-Indexierungs-Service
 * über die REST-API.
 */

import { Router } from "express";
import { searchIndexer } from "../services/search-indexer";
import { isAuthenticated } from "../middleware/auth";
import { z } from "zod";
import { logger } from "../logger";

const router = Router();

// Validierungsschema für Suchanfragen
const searchQuerySchema = z.object({
  q: z.string().min(2).max(100),
  filters: z.object({
    entityTypes: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional(),
  }).optional(),
  pagination: z.object({
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(50).default(20),
  }).optional(),
});

/**
 * Universelle Suche
 * POST /api/search
 */
router.post("/api/search", isAuthenticated, async (req, res) => {
  try {
    const validation = searchQuerySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Ungültige Suchanfrage",
        details: validation.error.format()
      });
    }
    
    const { q, filters, pagination } = validation.data;
    const userId = req.user.id.toString();
    
    const results = await searchIndexer.search(q, {
      filters,
      pagination,
      userId
    });
    
    res.json({
      success: true,
      ...results
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Suchfehler: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: "Suche fehlgeschlagen",
      message: errorMessage
    });
  }
});

/**
 * Alternative GET-Route für Suche (Browser-freundlich)
 * GET /api/search
 */
router.get("/api/search", isAuthenticated, async (req, res) => {
  try {
    const q = req.query.q as string;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Suchbegriff muss mindestens 2 Zeichen lang sein"
      });
    }
    
    // Optionale Filter extrahieren
    const entityTypes = req.query.type ? 
      Array.isArray(req.query.type) ? 
        req.query.type as string[] : 
        [req.query.type as string] 
      : undefined;
    
    const sources = req.query.source ? 
      Array.isArray(req.query.source) ? 
        req.query.source as string[] : 
        [req.query.source as string] 
      : undefined;
    
    // Paginierung
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
    
    const userId = req.user.id.toString();
    
    const results = await searchIndexer.search(q, {
      filters: {
        entityTypes,
        sources
      },
      pagination: {
        page,
        pageSize: Math.min(pageSize, 50) // Maximal 50 Ergebnisse pro Seite
      },
      userId
    });
    
    res.json({
      success: true,
      query: q,
      ...results
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Suchfehler: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: "Suche fehlgeschlagen",
      message: errorMessage
    });
  }
});

/**
 * Manuelles Indexieren eines Projekts
 * POST /api/search/index/project/:id
 */
router.post("/api/search/index/project/:id", isAuthenticated, async (req, res) => {
  try {
    // Prüfen, ob der Benutzer berechtigt ist (z.B. Administrator)
    if (req.user.role !== 'administrator') {
      return res.status(403).json({
        success: false,
        error: "Keine Berechtigung für diese Aktion"
      });
    }
    
    const projectId = parseInt(req.params.id);
    await searchIndexer.indexProject(projectId);
    
    res.json({
      success: true,
      message: `Projekt ${projectId} erfolgreich indexiert`
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Indexierungsfehler: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: "Indexierung fehlgeschlagen",
      message: errorMessage
    });
  }
});

/**
 * Manuelles Indexieren eines Dokuments
 * POST /api/search/index/document/:id
 */
router.post("/api/search/index/document/:id", isAuthenticated, async (req, res) => {
  try {
    // Prüfen, ob der Benutzer berechtigt ist
    if (req.user.role !== 'administrator' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: "Keine Berechtigung für diese Aktion"
      });
    }
    
    const documentId = req.params.id;
    const documentType = req.query.type === 'synced' ? 'synced_document' : 'attachment';
    
    await searchIndexer.indexDocument(documentId, documentType);
    
    res.json({
      success: true,
      message: `Dokument ${documentId} erfolgreich indexiert`
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Indexierungsfehler: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: "Indexierung fehlgeschlagen",
      message: errorMessage
    });
  }
});

export default router;