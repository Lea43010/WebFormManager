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

// Cache-Einstellungen
const CACHE_TTL = 15 * 60 * 1000; // 15 Minuten Time-to-Live für Cache-Einträge
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 Minuten Intervall für Cache-Bereinigung

// Cache-Eintragsschnittstelle
interface CacheEntry {
  user: User;
  expiresAt: number;
}

/**
 * Benutzer-Cache-Service
 */
class UserCacheService {
  private cache: Map<number, CacheEntry>;
  private cleanupTimer: NodeJS.Timer | null = null;

  constructor() {
    this.cache = new Map<number, CacheEntry>();
    this.startCleanupTimer();
    cacheLogger.info('Benutzer-Cache-Service initialisiert');
  }

  /**
   * Startet den Timer für regelmäßige Cache-Bereinigung
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      // @ts-ignore - NodeJS.Timer vs Timeout Kompatibilitätsproblem
      clearInterval(this.cleanupTimer);
    }

    // @ts-ignore - NodeJS.Timer vs Timeout Kompatibilitätsproblem
    this.cleanupTimer = setInterval(() => {
      this.cleanExpiredEntries();
    }, CLEANUP_INTERVAL);
  }

  /**
   * Bereinigt abgelaufene Einträge aus dem Cache
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    let expiredCount = 0;

    // @ts-ignore - Iterator-Kompatibilitätsproblem in stricteren TypeScript-Einstellungen
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      cacheLogger.debug(`${expiredCount} abgelaufene Cache-Einträge entfernt. Aktueller Cache-Größe: ${this.cache.size}`);
    }
  }

  /**
   * Speichert einen Benutzer im Cache
   */
  set(user: User): void {
    if (!user || !user.id) {
      return;
    }

    this.cache.set(user.id, {
      user,
      expiresAt: Date.now() + CACHE_TTL
    });

    cacheLogger.debug(`Benutzer ${user.id} (${user.username}) im Cache gespeichert`);
  }

  /**
   * Ruft einen Benutzer aus dem Cache ab
   */
  get(userId: number): User | null {
    const entry = this.cache.get(userId);

    if (!entry) {
      cacheLogger.debug(`Cache-Miss für Benutzer ${userId}`);
      return null;
    }

    // Überprüfen, ob der Eintrag abgelaufen ist
    if (entry.expiresAt <= Date.now()) {
      cacheLogger.debug(`Abgelaufener Cache-Eintrag für Benutzer ${userId}`);
      this.cache.delete(userId);
      return null;
    }

    // Cache-Hit - Cache-Lebenszeit erneuern
    entry.expiresAt = Date.now() + CACHE_TTL;
    cacheLogger.debug(`Cache-Hit für Benutzer ${userId}`);
    
    return entry.user;
  }

  /**
   * Entfernt einen Benutzer aus dem Cache
   */
  invalidate(userId: number): void {
    if (this.cache.has(userId)) {
      this.cache.delete(userId);
      cacheLogger.debug(`Cache für Benutzer ${userId} ungültig gemacht`);
    }
  }

  /**
   * Leert den gesamten Cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    cacheLogger.info(`Benutzer-Cache vollständig geleert (${size} Einträge)`);
  }

  /**
   * Gibt Cache-Statistiken zurück
   */
  getStats(): {size: number, memory: string} {
    // Ungefähre Speicherverbrauch-Schätzung (sehr grob)
    const estimatedBytes = this.cache.size * 2048; // ~2KB pro Benutzer geschätzt
    const memory = estimatedBytes < 1048576 
      ? `${Math.round(estimatedBytes / 1024)} KB` 
      : `${Math.round(estimatedBytes / 1048576)} MB`;

    return {
      size: this.cache.size,
      memory
    };
  }
}

// Singleton-Instanz exportieren
export const userCache = new UserCacheService();

// Standard-Export für einfachen Import
export default userCache;