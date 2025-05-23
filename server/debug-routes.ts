/**
 * Debug-API für Systemtests
 * 
 * Diese Routen sind nur für Entwicklungszwecke gedacht und sollten in Produktion deaktiviert werden.
 */

import { Router, Express } from 'express';
import { userCache } from './user-cache';
import { storage } from './storage';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { logger } from './logger';

const debugRouter = Router();
const debugLogger = logger.createLogger('debug-api');

// Middleware, das sicherstellt, dass die Debug-API nur in Entwicklungsumgebungen verfügbar ist
const devOnlyMiddleware = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found in production mode' });
  }
  next();
};

// Route für Cache-Statistiken
debugRouter.get('/cache-stats', devOnlyMiddleware, (req: any, res: any) => {
  const stats = userCache.getStats();
  debugLogger.info(`Cache-Statistiken abgerufen: ${stats.size} Einträge, ${stats.memory} Speicher`);
  res.json(stats);
});

// Route zum Leeren des Caches
debugRouter.post('/clear-cache', devOnlyMiddleware, (req: any, res: any) => {
  const statsBefore = userCache.getStats();
  userCache.clear();
  debugLogger.info(`Cache geleert (vorher: ${statsBefore.size} Einträge)`);
  res.json({ success: true, message: `Cache geleert (${statsBefore.size} Einträge entfernt)` });
});

// Test-Route für Cache-Effizienz - prüft Performance des Cache vs. direkte DB-Abfragen
debugRouter.get('/cache-test/:userId/:iterations', devOnlyMiddleware, async (req: any, res: any) => {
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
    // Direkte DB-Abfrage ohne Cache
    await db.execute(
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
debugRouter.get('/cache-consistency/:userId', devOnlyMiddleware, async (req: any, res: any) => {
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
    
    if (!user2 || !updatedUser) {
      return res.status(500).json({ error: 'Fehler beim Aktualisieren oder erneuten Laden des Benutzers' });
    }
    
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

// Route zur Cache-Vorwärmung für häufig abgerufene Benutzer
debugRouter.post('/warm-cache/:count', devOnlyMiddleware, async (req: any, res: any) => {
  try {
    const count = parseInt(req.params.count) || 10;
    
    // Prüfen, ob Cache aktiviert ist
    if (!userCache.isEnabled()) {
      return res.status(400).json({ 
        error: 'Cache ist deaktiviert', 
        message: 'Aktivieren Sie zuerst den Cache mit /debug/api/toggle-cache'
      });
    }
    
    // Vorwärmen basierend auf Zugriffsfrequenz
    await userCache.warmupMostFrequent(count, async (id) => {
      return await storage.getUser(id);
    });
    
    const stats = userCache.getStats();
    
    debugLogger.info(`Cache-Vorwärmung für ${count} Benutzer durchgeführt. Aktuelle Cache-Größe: ${stats.size}`);
    res.json({ 
      success: true, 
      message: `Cache-Vorwärmung für die ${count} am häufigsten abgerufenen Benutzer abgeschlossen`,
      stats
    });
  } catch (error) {
    debugLogger.error(`Fehler bei der Cache-Vorwärmung: ${error}`);
    res.status(500).json({ error: 'Fehler bei der Cache-Vorwärmung', details: String(error) });
  }
});

// Route zum Aktivieren/Deaktivieren des Caches
debugRouter.post('/toggle-cache', devOnlyMiddleware, (req: any, res: any) => {
  const currentStatus = userCache.isEnabled();
  const newStatus = !currentStatus;
  
  userCache.setEnabled(newStatus);
  
  debugLogger.info(`Cache-Status geändert: ${newStatus ? 'aktiviert' : 'deaktiviert'}`);
  res.json({ 
    success: true, 
    cache: newStatus ? 'aktiviert' : 'deaktiviert',
    stats: newStatus ? userCache.getStats() : null
  });
});

// Route für detaillierte Cache-Statistiken
debugRouter.get('/detailed-cache-stats', devOnlyMiddleware, (req: any, res: any) => {
  if (!userCache.isEnabled()) {
    return res.json({ 
      warning: 'Cache ist deaktiviert',
      stats: { size: 0, enabled: false }
    });
  }
  
  const detailedStats = userCache.getDetailedStats();
  const basicStats = userCache.getStats();
  
  debugLogger.info(`Detaillierte Cache-Statistiken abgerufen: ${basicStats.size} Einträge, ${basicStats.frequencyTracking} Frequenzzähler`);
  res.json({
    summary: basicStats,
    details: detailedStats
  });
});

export function setupDebugRoutes(app: Express) {
  app.use('/debug/api', debugRouter);
  debugLogger.info('Debug-API-Endpunkte für Systemtests aktiviert');
  
  // Wir geben das Router-Objekt zurück, damit es von anderen Teilen der Anwendung erweitert werden kann
  return debugRouter;
}

// Standard-Export
export default setupDebugRoutes;