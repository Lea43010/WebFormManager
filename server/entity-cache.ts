/**
 * Entity Cache System
 * 
 * Erweitert den vorhandenen Benutzer-Cache auf andere Entitätstypen.
 * Implementiert Cache-Invalidierung, automatische Bereinigung und Statistiken.
 */

import { createLogger } from './logger';

const logger = createLogger('entity-cache');

// Cache-Konfiguration
export interface EntityCacheConfig {
  maxSize: number;            // Maximale Anzahl an Elementen im Cache
  ttl: number;                // Time to live in Millisekunden
  pruneInterval: number;      // Bereinigungsintervall in Millisekunden
  isEnabled: boolean;         // Ob der Cache aktiviert ist
  debugMode: boolean;         // Aktiviert erweiterte Logging (sollte in Produktion ausgeschaltet sein)
}

// Standard-Konfiguration
const DEFAULT_CONFIG: EntityCacheConfig = {
  maxSize: 100,               // Standard: 100 Entitäten
  ttl: 60 * 60 * 1000,        // Standard: 1 Stunde
  pruneInterval: 5 * 60 * 1000, // Standard: 5 Minuten
  isEnabled: true,            // Standard: aktiviert
  debugMode: false,           // Standard: Debug-Modus aus
};

// Cache-Statistiken
interface CacheStats {
  hits: number;               // Anzahl der Cache-Treffer
  misses: number;             // Anzahl der Cache-Fehltreffer
  items: number;              // Aktuelle Anzahl an Elementen im Cache
  evictions: number;          // Anzahl der automatisch entfernten Elemente
  oldestItem?: Date;          // Zeitstempel des ältesten Elements
  newestItem?: Date;          // Zeitstempel des neuesten Elements
  frequentAccess: Record<string, number>; // Statistik der häufigsten Zugriffe (ID -> Anzahl)
}

// Cache-Eintrag
interface CacheEntry<T> {
  value: T;                   // Gespeicherter Wert
  timestamp: number;          // Zeitstempel der letzten Aktualisierung
  accessCount: number;        // Zugriffszähler für Statistik
}

// Typsicherer generischer Cache für beliebige Entitäten
export class EntityCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: EntityCacheConfig;
  private pruneTimer: NodeJS.Timeout | null = null;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    items: 0,
    evictions: 0,
    frequentAccess: {}
  };
  private entityName: string;

  constructor(
    entityName: string,
    config: Partial<EntityCacheConfig> = {}
  ) {
    this.entityName = entityName;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Logging der Konfiguration
    logger.info(`${entityName}-Cache initialisiert mit Konfiguration:`, {
      maxSize: this.config.maxSize,
      ttl: `${this.config.ttl / 1000 / 60} Minuten`,
      pruneInterval: `${this.config.pruneInterval / 1000 / 60} Minuten`,
      isEnabled: this.config.isEnabled,
      debugMode: this.config.debugMode
    });
    
    // Starte automatische Bereinigung, wenn aktiviert
    if (this.config.isEnabled) {
      this.startPruneTimer();
    }
  }

  /**
   * Holt ein Element aus dem Cache oder lädt es mit der Ladefunktion
   */
  async get(id: string | number, loadFn: () => Promise<T | undefined>): Promise<T | undefined> {
    const cacheKey = String(id);
    
    // Cache deaktiviert -> direkt zur Datenbank
    if (!this.config.isEnabled) {
      return loadFn();
    }

    // Prüfe ob Element im Cache und nicht abgelaufen
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const now = Date.now();
      
      // Prüfe TTL
      if (now - cached.timestamp <= this.config.ttl) {
        // Cache-Hit
        cached.accessCount++;
        this.stats.hits++;
        this.stats.frequentAccess[cacheKey] = (this.stats.frequentAccess[cacheKey] || 0) + 1;
        
        if (this.config.debugMode) {
          logger.debug(`Cache-Hit für ${this.entityName} ${id} (Zugriffe: ${cached.accessCount})`);
        }
        
        return cached.value;
      } else {
        // Abgelaufen - entfernen
        this.cache.delete(cacheKey);
      }
    }

    // Cache-Miss - Laden aus der Datenbank
    this.stats.misses++;
    try {
      const value = await loadFn();
      
      // Nur cachen, wenn Wert existiert
      if (value) {
        this.set(cacheKey, value);
      }
      
      return value;
    } catch (error) {
      logger.error(`Fehler beim Laden von ${this.entityName} ${id} aus der Datenbank:`, error);
      return undefined;
    }
  }

  /**
   * Setzt oder aktualisiert ein Element im Cache
   */
  set(id: string | number, value: T): void {
    if (!this.config.isEnabled) return;
    
    const cacheKey = String(id);
    
    // Prüfe ob Cache-Größe überschritten wurde
    if (this.cache.size >= this.config.maxSize) {
      this.pruneOldestEntries(1);
    }
    
    // Bestehenden Eintrag aktualisieren oder neuen erstellen
    const existing = this.cache.get(cacheKey);
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: existing ? existing.accessCount + 1 : 1
    };
    
    this.cache.set(cacheKey, entry);
    this.stats.items = this.cache.size;
    
    // Aktualisiere Statistiken
    this.updateTimestampStats();
    
    if (this.config.debugMode) {
      const action = existing ? 'aktualisiert' : 'hinzugefügt';
      logger.debug(`${this.entityName} ${id} zum Cache ${action}`);
    }
  }

  /**
   * Löscht ein Element aus dem Cache
   */
  invalidate(id: string | number): void {
    const cacheKey = String(id);
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
      this.stats.items = this.cache.size;
      
      if (this.config.debugMode) {
        logger.debug(`${this.entityName} ${id} aus dem Cache entfernt (manuell)`);
      }
    }
  }

  /**
   * Löscht alle Elemente aus dem Cache
   */
  invalidateAll(): void {
    const oldSize = this.cache.size;
    this.cache.clear();
    this.stats.items = 0;
    logger.info(`${this.entityName}-Cache komplett geleert (${oldSize} Einträge entfernt)`);
  }

  /**
   * Automatische Bereinigung starten
   */
  private startPruneTimer(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
    }
    
    this.pruneTimer = setInterval(() => {
      this.pruneExpiredEntries();
    }, this.config.pruneInterval);
    
    logger.debug(`${this.entityName}-Cache automatische Bereinigung aktiviert (Intervall: ${this.config.pruneInterval / 1000}s)`);
  }

  /**
   * Bereinigt abgelaufene Einträge
   */
  private pruneExpiredEntries(): void {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      this.stats.evictions += removed;
      this.stats.items = this.cache.size;
      
      if (this.config.debugMode) {
        logger.debug(`${removed} abgelaufene Einträge aus dem ${this.entityName}-Cache entfernt`);
      }
    }
    
    this.updateTimestampStats();
  }

  /**
   * Bereinigt die ältesten Einträge
   */
  private pruneOldestEntries(count: number): void {
    if (this.cache.size === 0) return;
    
    // Sortiere nach Zeitstempel (älteste zuerst)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Entferne die ältesten Einträge
    const toRemove = Math.min(count, entries.length);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
    
    this.stats.evictions += toRemove;
    this.stats.items = this.cache.size;
    
    if (this.config.debugMode && toRemove > 0) {
      logger.debug(`${toRemove} älteste Einträge aus dem ${this.entityName}-Cache entfernt wegen Platzmangelbereinigung`);
    }
    
    this.updateTimestampStats();
  }

  /**
   * Aktualisiert die Zeitstempel-Statistiken
   */
  private updateTimestampStats(): void {
    if (this.cache.size === 0) {
      this.stats.oldestItem = undefined;
      this.stats.newestItem = undefined;
      return;
    }
    
    let oldest = Infinity;
    let newest = 0;
    
    for (const entry of this.cache.values()) {
      oldest = Math.min(oldest, entry.timestamp);
      newest = Math.max(newest, entry.timestamp);
    }
    
    this.stats.oldestItem = new Date(oldest);
    this.stats.newestItem = new Date(newest);
  }

  /**
   * Gibt die aktuellen Cache-Statistiken zurück
   */
  getStats(): CacheStats {
    this.updateTimestampStats();
    return { ...this.stats };
  }

  /**
   * Liefert die häufigsten Cache-Zugriffe zurück
   */
  getTopFrequentAccess(limit = 10): { id: string; count: number }[] {
    return Object.entries(this.stats.frequentAccess)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, count]) => ({ id, count }));
  }

  /**
   * Cache-Vorwärmen: Lädt die häufigsten Elemente in den Cache
   */
  async warmup(
    ids: (string | number)[],
    loadFn: (id: string | number) => Promise<T | undefined>
  ): Promise<void> {
    logger.info(`${this.entityName}-Cache Vorwärmung mit ${ids.length} Elementen gestartet`);
    
    const warmedUp = [];
    for (const id of ids) {
      try {
        const value = await loadFn(id);
        if (value) {
          this.set(id, value);
          warmedUp.push(id);
        }
      } catch (error) {
        logger.error(`Fehler bei der Cache-Vorwärmung für ${this.entityName} ${id}:`, error);
      }
    }
    
    logger.info(`${this.entityName}-Cache Vorwärmung abgeschlossen: ${warmedUp.length} von ${ids.length} Elemente geladen`);
  }
}