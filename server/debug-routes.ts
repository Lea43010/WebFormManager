/**
 * Debug-API für Systemtests
 * 
 * Diese Routen sind nur für Entwicklungszwecke gedacht und sollten in Produktion deaktiviert werden.
 */

import { Router } from 'express';
import { userCache } from './user-cache';
import { storage } from './storage';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { logger } from './logger';

const debugRouter = Router();
const debugLogger = logger.createLogger('debug-api');

// Middleware, das sicherstellt, dass die Debug-API nur in Entwicklungsumgebungen verfügbar ist
const devOnlyMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found in production mode' });
  }
  next();
};

// Route für Cache-Statistiken
debugRouter.get('/cache-stats', devOnlyMiddleware, (req, res) => {
  const stats = userCache.getStats();
  debugLogger.info(`Cache-Statistiken abgerufen: ${stats.size} Einträge, ${stats.memory} Speicher`);
  res.json(stats);
});

// Route zum Leeren des Caches
debugRouter.post('/clear-cache', devOnlyMiddleware, (req, res) => {
  const statsBefore = userCache.getStats();
  userCache.clear();
  debugLogger.info(`Cache geleert (vorher: ${statsBefore.size} Einträge)`);
  res.json({ success: true, message: `Cache geleert (${statsBefore.size} Einträge entfernt)` });
});

// Test-Route für Cache-Effizienz - prüft Performance des Cache vs. direkte DB-Abfragen
debugRouter.get('/cache-test/:userId/:iterations', devOnlyMiddleware, async (req, res) => {
  const userId = parseInt(req.params.userId);
  const iterations = parseInt(req.params.iterations) || 10;
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Ungültige Benutzer-ID' });
  }

  // Cache leeren, um sicherzustellen, dass wir bei 0 anfangen
  userCache.clear();
  
  // Test: Direkte Datenbankabfragen (ohne Cache)
  const dbStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    // @ts-ignore - Wir umgehen hier die Storage-Schicht, um direkt die DB zu treffen
    const [user] = await db.execute(
      sql`SELECT * FROM tbluser WHERE id = ${userId}`
    );
  }
  const dbTime = Date.now() - dbStartTime;
  
  // Cache leeren für den nächsten Test
  userCache.clear();
  
  // Test: Mit Cache
  const cacheStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    await storage.getUser(userId);
  }
  const cacheTime = Date.now() - cacheStartTime;
  
  // Ergebnisse berechnen
  const improvement = dbTime > 0 ? ((dbTime - cacheTime) / dbTime * 100).toFixed(2) : '0';
  
  const results = {
    iterations,
    dbTime: `${dbTime}ms`,
    cacheTime: `${cacheTime}ms`,
    improvement: `${improvement}%`,
    cacheStats: userCache.getStats()
  };
  
  debugLogger.info(`Cache-Performance-Test: ${iterations} Iterationen, Verbesserung: ${improvement}%`);
  res.json(results);
});

// Test-Route für Cache-Konsistenz - prüft, ob Cache aktualisiert wird, wenn Benutzer geändert werden
debugRouter.get('/cache-consistency/:userId', devOnlyMiddleware, async (req, res) => {
  const userId = parseInt(req.params.userId);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Ungültige Benutzer-ID' });
  }

  try {
    // Cache leeren
    userCache.clear();
    
    // Schritt 1: Benutzer laden (wird im Cache gespeichert)
    const user1 = await storage.getUser(userId);
    if (!user1) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    
    // Schritt 2: Prüfen, ob Benutzer im Cache ist
    const cacheStats1 = userCache.getStats();
    
    // Schritt 3: Benutzer aktualisieren
    const randomSuffix = Math.floor(Math.random() * 1000);
    const updatedUser = await storage.updateUser(userId, {
      name: `${user1.name || 'TestUser'}_${randomSuffix}`
    });
    
    // Schritt 4: Benutzer erneut laden und prüfen, ob Cache aktualisiert wurde
    const user2 = await storage.getUser(userId);
    
    // Ergebnisse zusammenstellen
    const results = {
      originalName: user1.name,
      updatedName: user2.name,
      cacheStatsAfterFirstLoad: cacheStats1,
      cacheStatsAfterUpdate: userCache.getStats(),
      consistencyOk: user2.name === updatedUser.name
    };
    
    debugLogger.info(`Cache-Konsistenz-Test: ${results.consistencyOk ? 'Erfolgreich' : 'Fehlgeschlagen'}`);
    res.json(results);
  } catch (error) {
    debugLogger.error(`Fehler im Cache-Konsistenz-Test: ${error}`);
    res.status(500).json({ error: 'Interner Serverfehler', details: String(error) });
  }
});

export function setupDebugRoutes(app) {
  app.use('/debug/api', debugRouter);
  debugLogger.info('Debug-API-Endpunkte für Systemtests aktiviert');
  
  // Wir geben das Router-Objekt zurück, damit es von anderen Teilen der Anwendung erweitert werden kann
  return debugRouter;
}

// Standard-Export
export default setupDebugRoutes;