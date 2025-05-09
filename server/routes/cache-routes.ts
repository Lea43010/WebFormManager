/**
 * Cache-Verwaltungs-API-Routen
 */

import express from 'express';
import { requireAdmin } from '../middleware/auth';
import cacheManager from '../cache-manager';
import logger from '../logger';

const router = express.Router();

/**
 * GET /api/cache/stats
 * 
 * Gibt Statistiken zu allen Caches zurück
 * Benötigt Admin-Rechte
 */
router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const stats = cacheManager.getCacheStats();
    
    // Erhöhe den Cache-Timeout für diese Antwort
    res.setHeader('Cache-Control', 'private, max-age=5');
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Cache-Statistiken:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Cache-Statistiken',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/cache/reset
 * 
 * Setzt alle Caches zurück
 * Benötigt Admin-Rechte
 */
router.post('/reset', requireAdmin, async (_req, res) => {
  try {
    cacheManager.invalidateAllCaches();
    
    res.json({
      success: true,
      message: 'Alle Caches wurden erfolgreich zurückgesetzt',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Fehler beim Zurücksetzen der Caches:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Zurücksetzen der Caches',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/cache/warmup
 * 
 * Wärmt die Caches mit häufig abgefragten Daten vor
 * Benötigt Admin-Rechte
 */
router.post('/warmup', requireAdmin, async (_req, res) => {
  try {
    await cacheManager.warmupCaches();
    
    res.json({
      success: true,
      message: 'Cache-Vorwärmung erfolgreich durchgeführt',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Fehler bei der Cache-Vorwärmung:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler bei der Cache-Vorwärmung',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/cache/reset/:type/:id
 * 
 * Setzt den Cache für eine bestimmte Entität zurück
 * Benötigt Admin-Rechte
 */
router.post('/reset/:type/:id', requireAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    
    // Wähle den richtigen Cache basierend auf dem Typ
    let cache;
    switch (type.toLowerCase()) {
      case 'project':
      case 'projekt':
        cache = cacheManager.projectCache;
        break;
      case 'route':
        cache = cacheManager.routeCache;
        break;
      case 'soiltype':
      case 'bodenart':
        cache = cacheManager.soilTypeCache;
        break;
      case 'machine':
      case 'maschine':
        cache = cacheManager.machineCache;
        break;
      case 'company':
      case 'firma':
        cache = cacheManager.companyCache;
        break;
      case 'user':
      case 'benutzer':
        // Verwende den UserCache aus storage
        if (req.app.locals.storage && req.app.locals.storage.userCache) {
          cache = req.app.locals.storage.userCache;
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Unbekannter Cache-Typ: ${type}`
        });
    }
    
    if (!cache) {
      return res.status(404).json({
        success: false,
        message: `Cache für Typ ${type} nicht gefunden`
      });
    }
    
    // Cache-Eintrag invalidieren
    cache.invalidate(id);
    
    res.json({
      success: true,
      message: `Cache für ${type} mit ID ${id} zurückgesetzt`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Fehler beim Zurücksetzen des spezifischen Caches:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Zurücksetzen des spezifischen Caches',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;