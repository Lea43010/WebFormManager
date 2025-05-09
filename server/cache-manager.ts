/**
 * Cache Manager
 * 
 * Verwaltet alle Entity-Cache-Instanzen zentral und bietet
 * Funktionen für globale Cache-Operationen
 */

import { EntityCache } from './entity-cache';
import { storage } from './storage';
import { createLogger } from './logger';
import { env } from './env';

const logger = createLogger('cache-manager');

// Cache-Konfiguration aus Umgebungsvariablen
const cacheConfig = {
  isEnabled: env.CACHE_ENABLED !== 'false',
  debugMode: env.CACHE_DEBUG === 'true',
  maxSize: parseInt(env.CACHE_MAX_SIZE || '100', 10),
  ttl: parseInt(env.CACHE_TTL || (60 * 60 * 1000).toString(), 10),  // Default 1 Stunde
  pruneInterval: parseInt(env.CACHE_PRUNE_INTERVAL || (5 * 60 * 1000).toString(), 10) // Default 5 Minuten
};

// User Cache (bereits existierend, wird hier referenziert)
// Projekte Cache
export const projectCache = new EntityCache<any>(
  'Projekt',
  {
    ...cacheConfig,
    maxSize: parseInt(env.PROJECT_CACHE_MAX_SIZE || '50', 10) // Speziell für Projekte
  }
);

// Routen Cache
export const routeCache = new EntityCache<any>(
  'Route',
  {
    ...cacheConfig,
    maxSize: parseInt(env.ROUTE_CACHE_MAX_SIZE || '20', 10) // Speziell für Routen
  }
);

// Bodenarten Cache (selten ändernd, daher lange TTL)
export const soilTypeCache = new EntityCache<any>(
  'Bodenart',
  {
    ...cacheConfig,
    maxSize: parseInt(env.SOIL_TYPE_CACHE_MAX_SIZE || '30', 10),
    ttl: 24 * 60 * 60 * 1000 // 24 Stunden, da sich Bodenarten selten ändern
  }
);

// Maschinen Cache (selten ändernd, daher lange TTL)
export const machineCache = new EntityCache<any>(
  'Maschine', 
  {
    ...cacheConfig,
    maxSize: parseInt(env.MACHINE_CACHE_MAX_SIZE || '50', 10),
    ttl: 12 * 60 * 60 * 1000 // 12 Stunden
  }
);

// Cache für Firmen (Unternehmen)
export const companyCache = new EntityCache<any>(
  'Firma',
  {
    ...cacheConfig,
    maxSize: parseInt(env.COMPANY_CACHE_MAX_SIZE || '30', 10)
  }
);

/**
 * Alle Caches zurücksetzen
 */
export function invalidateAllCaches(): void {
  logger.info('Setze alle Caches zurück...');
  
  projectCache.invalidateAll();
  routeCache.invalidateAll();
  soilTypeCache.invalidateAll();
  machineCache.invalidateAll();
  companyCache.invalidateAll();
  
  // User-Cache wird über externe Funktion zurückgesetzt
  if (storage.userCache && typeof storage.userCache.invalidateAll === 'function') {
    storage.userCache.invalidateAll();
  }
  
  logger.info('Alle Caches erfolgreich zurückgesetzt');
}

/**
 * Vorwärmen der Caches mit häufig abgefragten Daten
 */
export async function warmupCaches(): Promise<void> {
  logger.info('Starte Vorwärmen der Caches...');
  
  try {
    // Bodenarten vorwärmen (alle, da wenige)
    const soilTypes = await storage.getAllSoilTypes();
    if (soilTypes && soilTypes.length > 0) {
      soilTypes.forEach(soil => {
        soilTypeCache.set(soil.id, soil);
      });
      logger.info(`${soilTypes.length} Bodenarten in den Cache geladen`);
    }
    
    // Maschinen vorwärmen (alle aktiven)
    if (typeof storage.getActiveMachines === 'function') {
      const machines = await storage.getActiveMachines();
      if (machines && machines.length > 0) {
        machines.forEach(machine => {
          machineCache.set(machine.id, machine);
        });
        logger.info(`${machines.length} aktive Maschinen in den Cache geladen`);
      }
    }
    
    // Aktive Projekte vorwärmen
    if (typeof storage.getActiveProjects === 'function') {
      const projects = await storage.getActiveProjects();
      if (projects && projects.length > 0) {
        projects.forEach(project => {
          projectCache.set(project.id, project);
        });
        logger.info(`${projects.length} aktive Projekte in den Cache geladen`);
      }
    }
    
    logger.info('Cache-Vorwärmung erfolgreich abgeschlossen');
  } catch (error) {
    logger.error('Fehler beim Vorwärmen der Caches:', error);
  }
}

/**
 * Cache-Statistiken für alle Caches ausgeben
 */
export function getCacheStats(): Record<string, any> {
  const stats: Record<string, any> = {
    enabled: cacheConfig.isEnabled,
    debugMode: cacheConfig.debugMode,
    timestamp: new Date().toISOString(),
    caches: {}
  };
  
  // Projekt-Cache
  stats.caches.project = projectCache.getStats();
  
  // Routen-Cache
  stats.caches.route = routeCache.getStats();
  
  // Bodenarten-Cache
  stats.caches.soilType = soilTypeCache.getStats();
  
  // Maschinen-Cache
  stats.caches.machine = machineCache.getStats();
  
  // Firmen-Cache
  stats.caches.company = companyCache.getStats();
  
  // User-Cache, falls verfügbar
  if (storage.userCache && typeof storage.userCache.getStats === 'function') {
    stats.caches.user = storage.userCache.getStats();
  }
  
  return stats;
}

// Event-Handler für Cache-Invalidierung bei Änderungen
export function setupCacheInvalidationEvents(eventEmitter: any): void {
  if (!eventEmitter) return;
  
  // Projekt-Änderungen
  eventEmitter.on('project:update', (projectId: number) => {
    projectCache.invalidate(projectId);
    logger.debug(`Projekt ${projectId} aus dem Cache entfernt nach Aktualisierung`);
  });
  
  eventEmitter.on('project:delete', (projectId: number) => {
    projectCache.invalidate(projectId);
    logger.debug(`Projekt ${projectId} aus dem Cache entfernt nach Löschung`);
  });
  
  // Routen-Änderungen
  eventEmitter.on('route:update', (routeId: number) => {
    routeCache.invalidate(routeId);
    logger.debug(`Route ${routeId} aus dem Cache entfernt nach Aktualisierung`);
  });
  
  // Weitere Event-Handler nach Bedarf...
}

// Export als Default
export default {
  projectCache,
  routeCache,
  soilTypeCache,
  machineCache,
  companyCache,
  invalidateAllCaches,
  warmupCaches,
  getCacheStats,
  setupCacheInvalidationEvents
};