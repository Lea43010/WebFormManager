/**
 * Benutzer-Cache-Service
 * 
 * Implementiert einen Memory-Cache für Benutzerinformationen, um wiederholte Datenbankabfragen zu reduzieren.
 * Dies verbessert die Leistung erheblich, besonders bei häufigen Zugriffen auf Benutzerinformationen.
 */

import { logger } from './logger';
import { User } from '@shared/schema';

// Logger für Cache-Operationen
const cacheLogger = logger.createLogger('user-cache');

// Cache-Einstellungen aus Umgebungsvariablen oder Standardwerte
const CACHE_TTL = parseInt(process.env.USER_CACHE_TTL || '900000', 10); // 15 Minuten (900000ms) Time-to-Live für Cache-Einträge
const CLEANUP_INTERVAL = parseInt(process.env.USER_CACHE_CLEANUP_INTERVAL || '1800000', 10); // 30 Minuten (1800000ms) Intervall für Cache-Bereinigung
const MAX_CACHE_SIZE = parseInt(process.env.USER_CACHE_MAX_SIZE || '1000', 10); // Maximal 1000 Benutzer im Cache
const CACHE_ENABLED = process.env.USER_CACHE_ENABLED !== 'false'; // Cache ist standardmäßig aktiviert

// Häufigkeitszähler-Schnittstelle für Access-Frequenz-Tracking
interface FrequencyCounter {
  [userId: number]: number;
}

// Cache-Eintragsschnittstelle
interface CacheEntry {
  user: User;
  expiresAt: number;
  accessCount: number; // Neue Eigenschaft zum Zählen der Zugriffe
}

/**
 * Benutzer-Cache-Service
 */
class UserCacheService {
  private cache: Map<number, CacheEntry>;
  private cleanupTimer: NodeJS.Timer | null = null;
  private frequencyCounter: FrequencyCounter = {}; // Zählt Zugriffe auf Benutzer
  private enabled: boolean = CACHE_ENABLED;

  constructor() {
    this.cache = new Map<number, CacheEntry>();
    this.startCleanupTimer();
    cacheLogger.info(`Benutzer-Cache-Service initialisiert (TTL: ${CACHE_TTL}ms, Bereinigung: ${CLEANUP_INTERVAL}ms, Max. Größe: ${MAX_CACHE_SIZE}, Aktiviert: ${this.enabled})`);
  }

  /**
   * Aktiviert oder deaktiviert den Cache
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    cacheLogger.info(`Benutzer-Cache ${enabled ? 'aktiviert' : 'deaktiviert'}`);
    
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Prüft, ob der Cache aktiviert ist
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Startet den Timer für regelmäßige Cache-Bereinigung
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer as NodeJS.Timeout);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanExpiredEntries();
      this.pruneCache();
    }, CLEANUP_INTERVAL) as unknown as NodeJS.Timer;
  }

  /**
   * Bereinigt abgelaufene Einträge aus dem Cache
   */
  private cleanExpiredEntries(): void {
    if (!this.enabled) return;
    
    const now = Date.now();
    let expiredCount = 0;

    // Array.from verwenden, um Iterator-Kompatibilitätsprobleme zu vermeiden
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        expiredCount++;
      }
    });

    if (expiredCount > 0) {
      cacheLogger.debug(`${expiredCount} abgelaufene Cache-Einträge entfernt. Aktuelle Cache-Größe: ${this.cache.size}`);
    }
  }

  /**
   * Entfernt die am wenigsten verwendeten Einträge, wenn der Cache die maximale Größe überschreitet
   */
  private pruneCache(): void {
    if (!this.enabled || this.cache.size <= MAX_CACHE_SIZE) return;
    
    // Konvertiere Cache-Einträge in ein Array zur Sortierung nach Zugriffsanzahl
    const entries = Array.from(this.cache.entries())
      .map(([userId, entry]) => ({
        userId,
        accessCount: entry.accessCount
      }))
      .sort((a, b) => a.accessCount - b.accessCount);
      
    // Entferne die am wenigsten verwendeten Einträge
    const entriesToRemove = entries.slice(0, this.cache.size - MAX_CACHE_SIZE);
    for (const entry of entriesToRemove) {
      this.cache.delete(entry.userId);
    }
    
    cacheLogger.info(`Cache beschnitten: ${entriesToRemove.length} am wenigsten verwendete Einträge entfernt. Neue Größe: ${this.cache.size}`);
  }

  /**
   * Speichert einen Benutzer im Cache
   */
  set(user: User): void {
    if (!this.enabled || !user || !user.id) {
      return;
    }

    // Bestehenden Eintrag abrufen und Zugriffszähler erhöhen, falls vorhanden
    const existingEntry = this.cache.get(user.id);
    const accessCount = existingEntry ? existingEntry.accessCount + 1 : 1;

    this.cache.set(user.id, {
      user,
      expiresAt: Date.now() + CACHE_TTL,
      accessCount
    });

    cacheLogger.debug(`Benutzer ${user.id} (${user.username}) im Cache gespeichert (Zugriffe: ${accessCount})`);
    
    // Cache beschneiden, wenn die maximale Größe überschritten wird
    if (this.cache.size > MAX_CACHE_SIZE) {
      this.pruneCache();
    }
  }

  /**
   * Ruft einen Benutzer aus dem Cache ab
   */
  get(userId: number): User | null {
    if (!this.enabled) return null;
    
    const entry = this.cache.get(userId);

    if (!entry) {
      cacheLogger.debug(`Cache-Miss für Benutzer ${userId}`);
      // Erhöhe den Frequenzzähler für diesen Benutzer, auch bei Cache-Miss
      this.frequencyCounter[userId] = (this.frequencyCounter[userId] || 0) + 1;
      return null;
    }

    // Überprüfen, ob der Eintrag abgelaufen ist
    if (entry.expiresAt <= Date.now()) {
      cacheLogger.debug(`Abgelaufener Cache-Eintrag für Benutzer ${userId}`);
      this.cache.delete(userId);
      return null;
    }

    // Cache-Hit - Cache-Lebenszeit erneuern und Zugriffszähler erhöhen
    entry.expiresAt = Date.now() + CACHE_TTL;
    entry.accessCount += 1;
    cacheLogger.debug(`Cache-Hit für Benutzer ${userId} (Zugriffe: ${entry.accessCount})`);
    
    return entry.user;
  }

  /**
   * Vorwärmen des Caches mit einer Liste von Benutzer-IDs
   */
  async warmup(userIds: number[], fetchUserFn: (id: number) => Promise<User | undefined>): Promise<void> {
    if (!this.enabled) return;
    
    cacheLogger.info(`Cache-Vorwärmung gestartet für ${userIds.length} Benutzer...`);
    let loadedCount = 0;
    
    for (const userId of userIds) {
      // Prüfen, ob der Benutzer bereits im Cache ist
      if (this.cache.has(userId)) continue;
      
      try {
        const user = await fetchUserFn(userId);
        if (user) {
          this.set(user);
          loadedCount++;
        }
      } catch (error) {
        cacheLogger.error(`Fehler beim Vorwärmen des Caches für Benutzer ${userId}: ${error}`);
      }
    }
    
    cacheLogger.info(`Cache-Vorwärmung abgeschlossen: ${loadedCount} Benutzer geladen`);
  }

  /**
   * Vorwärmen des Caches basierend auf Zugriffsfrequenz
   * Lädt die X am häufigsten abgerufenen Benutzer in den Cache
   */
  async warmupMostFrequent(count: number, fetchUserFn: (id: number) => Promise<User | undefined>): Promise<void> {
    if (!this.enabled) return;
    
    // Sortiere Benutzer nach Zugriffsfrequenz
    const sortedUsers = Object.entries(this.frequencyCounter)
      .map(([id, count]) => ({ id: parseInt(id), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, count)
      .map(item => item.id);
    
    if (sortedUsers.length > 0) {
      cacheLogger.info(`Vorwärmen der ${sortedUsers.length} am häufigsten abgerufenen Benutzer...`);
      await this.warmup(sortedUsers, fetchUserFn);
    }
  }

  /**
   * Entfernt einen Benutzer aus dem Cache
   */
  invalidate(userId: number): void {
    if (!this.enabled) return;
    
    if (this.cache.has(userId)) {
      this.cache.delete(userId);
      cacheLogger.debug(`Cache für Benutzer ${userId} ungültig gemacht`);
    }
    
    // Entferne auch den Frequenzzähler für diesen Benutzer
    if (this.frequencyCounter[userId]) {
      delete this.frequencyCounter[userId];
    }
  }

  /**
   * Führt Batch-Operationen für mehrere Benutzer durch
   */
  batchInvalidate(userIds: number[]): void {
    if (!this.enabled) return;
    
    let count = 0;
    for (const userId of userIds) {
      if (this.cache.has(userId)) {
        this.cache.delete(userId);
        count++;
        
        // Entferne auch den Frequenzzähler
        if (this.frequencyCounter[userId]) {
          delete this.frequencyCounter[userId];
        }
      }
    }
    
    if (count > 0) {
      cacheLogger.debug(`Batch-Invalidierung: ${count} Benutzer aus dem Cache entfernt`);
    }
  }

  /**
   * Leert den gesamten Cache
   */
  clear(): void {
    if (!this.enabled) return;
    
    const size = this.cache.size;
    this.cache.clear();
    this.frequencyCounter = {}; // Auch die Frequenzzähler zurücksetzen
    cacheLogger.info(`Benutzer-Cache vollständig geleert (${size} Einträge)`);
  }

  /**
   * Gibt Cache-Statistiken zurück
   */
  getStats(): {size: number, memory: string, enabled: boolean, maxSize: number, frequencyTracking: number, configuration: object} {
    // Ungefähre Speicherverbrauch-Schätzung (sehr grob)
    const estimatedBytes = this.cache.size * 2048; // ~2KB pro Benutzer geschätzt
    const memory = estimatedBytes < 1048576 
      ? `${Math.round(estimatedBytes / 1024)} KB` 
      : `${Math.round(estimatedBytes / 1048576)} MB`;

    return {
      size: this.cache.size,
      memory,
      enabled: this.enabled,
      maxSize: MAX_CACHE_SIZE,
      frequencyTracking: Object.keys(this.frequencyCounter).length,
      configuration: {
        cacheTTL: CACHE_TTL,
        cleanupInterval: CLEANUP_INTERVAL,
        maxCacheSize: MAX_CACHE_SIZE
      }
    };
  }

  /**
   * Gibt detaillierte Cache-Statistiken für Debugging zurück
   */
  getDetailedStats(): {
    entries: {userId: number, username: string, expiresIn: number, accessCount: number}[],
    frequentUsers: {userId: number, accessCount: number}[]
  } {
    const now = Date.now();
    
    // Detaillierte Cache-Einträge
    const entries = Array.from(this.cache.entries())
      .map(([userId, entry]) => ({
        userId,
        username: entry.user.username,
        expiresIn: Math.max(0, Math.round((entry.expiresAt - now) / 1000)), // Sekunden bis zum Ablauf
        accessCount: entry.accessCount
      }))
      .sort((a, b) => b.accessCount - a.accessCount); // Nach Zugriffszahl sortieren
      
    // Am häufigsten angeforderte Benutzer (auch solche, die nicht im Cache sind)
    const frequentUsers = Object.entries(this.frequencyCounter)
      .map(([userId, count]) => ({
        userId: parseInt(userId),
        accessCount: count
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 20); // Top 20
    
    return {
      entries,
      frequentUsers
    };
  }
}

// Singleton-Instanz exportieren
export const userCache = new UserCacheService();

// Standard-Export für einfachen Import
export default userCache;