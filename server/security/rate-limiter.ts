/**
 * Rate-Limiter für Zugriffsbeschränkungen
 * 
 * Dieser Dienst bietet Schutz vor Brute-Force-Angriffen und DoS-Angriffen
 * durch Begrenzung der Anzahl von Anfragen, die ein Client in einem
 * bestimmten Zeitraum stellen kann.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// Rate-Limit-Konfigurationen
export enum RateLimitType {
  GENERAL = 'general',       // Allgemeine API-Anfragen
  LOGIN = 'login',           // Login-Versuche
  REGISTER = 'register',     // Registrierungsversuche
  PASSWORD_RESET = 'password_reset', // Passwort-Zurücksetzen
  API_KEY = 'api_key'        // API-Schlüssel-Anfragen
}

// Standard-Konfigurationen für verschiedene Limit-Typen
const defaultLimits: Record<RateLimitType, { windowMs: number, max: number }> = {
  [RateLimitType.GENERAL]: {
    windowMs: 60 * 1000, // 1 Minute
    max: 100 // 100 Anfragen pro Minute
  },
  [RateLimitType.LOGIN]: {
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 5 // 5 fehlgeschlagene Login-Versuche pro 15 Minuten
  },
  [RateLimitType.REGISTER]: {
    windowMs: 60 * 60 * 1000, // 1 Stunde
    max: 3 // 3 Registrierungsversuche pro Stunde
  },
  [RateLimitType.PASSWORD_RESET]: {
    windowMs: 60 * 60 * 1000, // 1 Stunde
    max: 3 // 3 Passwort-Zurücksetzungen pro Stunde
  },
  [RateLimitType.API_KEY]: {
    windowMs: 60 * 1000, // 1 Minute
    max: 30 // 30 API-Anfragen pro Minute
  }
};

/**
 * Initialisiert die Tabelle für die Speicherung von Rate-Limit-Verstößen
 */
export async function initializeRateLimitTable() {
  try {
    // Erstelle Tabelle für Rate-Limit-Verstöße
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS rate_limit_violations (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        user_id INTEGER,
        endpoint VARCHAR(255) NOT NULL,
        limit_type VARCHAR(50) NOT NULL,
        count INTEGER NOT NULL DEFAULT 1,
        first_violation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_violation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        blocked_until TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES tbluser(id) ON DELETE CASCADE
      )
    `);
    
    // Index für schnellere Abfragen
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint ON rate_limit_violations(ip_address, endpoint)
    `);
    
    console.log('[Rate-Limiter] Rate-Limit-Tabelle initialisiert');
    return true;
  } catch (error) {
    console.error('[Rate-Limiter] Fehler bei der Initialisierung der Rate-Limit-Tabelle:', error);
    return false;
  }
}

/**
 * Erstellt ein Rate-Limit-Middleware für den angegebenen Typ
 */
export function createRateLimit(type: RateLimitType, options: Partial<typeof defaultLimits[RateLimitType]> = {}) {
  const config = {
    ...defaultLimits[type],
    ...options
  };
  
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      message: `Zu viele Anfragen. Bitte versuchen Sie es in ${Math.ceil(config.windowMs / 60000)} Minuten erneut.`
    },
    handler: (req: Request, res: Response, next: NextFunction, options: any) => {
      // Verstoß in Datenbank protokollieren
      logRateLimitViolation(req, type)
        .catch(err => console.error('[Rate-Limiter] Fehler beim Protokollieren des Verstoßes:', err));
      
      // Standardantwort senden
      res.status(options.statusCode).send(options.message);
    }
  });
}

/**
 * Protokolliert einen Rate-Limit-Verstoß in der Datenbank
 */
async function logRateLimitViolation(req: Request, limitType: RateLimitType) {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userId = (req.user as any)?.id || null;
    const endpoint = req.originalUrl || req.url;
    
    // Prüfen, ob bereits ein Eintrag existiert
    const result = await db.execute(sql`
      SELECT id, count FROM rate_limit_violations
      WHERE ip_address = ${ipAddress} AND endpoint = ${endpoint}
      ORDER BY last_violation DESC LIMIT 1
    `);
    
    // Wenn bereits ein Eintrag existiert, aktualisieren
    if (result.length > 0) {
      const violation = result[0];
      await db.execute(sql`
        UPDATE rate_limit_violations
        SET count = count + 1, 
            last_violation = CURRENT_TIMESTAMP,
            blocked_until = CASE
              WHEN count >= 10 THEN CURRENT_TIMESTAMP + INTERVAL '24 hours'
              WHEN count >= 5 THEN CURRENT_TIMESTAMP + INTERVAL '1 hour'
              ELSE blocked_until
            END
        WHERE id = ${violation.id}
      `);
    } else {
      // Ansonsten neuen Eintrag erstellen
      await db.execute(sql`
        INSERT INTO rate_limit_violations
        (ip_address, user_id, endpoint, limit_type)
        VALUES (${ipAddress}, ${userId}, ${endpoint}, ${limitType})
      `);
    }
    
    return true;
  } catch (error) {
    console.error('[Rate-Limiter] Fehler beim Protokollieren des Verstoßes:', error);
    return false;
  }
}

/**
 * Prüft, ob eine IP-Adresse/ein Benutzer derzeit gesperrt ist
 */
export function checkBlockedStatus() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      
      // Prüfen, ob die IP-Adresse gesperrt ist
      const result = await db.execute(sql`
        SELECT blocked_until FROM rate_limit_violations
        WHERE ip_address = ${ipAddress}
          AND blocked_until IS NOT NULL
          AND blocked_until > CURRENT_TIMESTAMP
        LIMIT 1
      `);
      
      if (result.length > 0) {
        const { blocked_until } = result[0];
        const blockTime = new Date(blocked_until);
        const remainingTime = Math.ceil((blockTime.getTime() - Date.now()) / 60000);
        
        return res.status(403).json({
          status: 'error',
          message: `Ihr Zugriff wurde temporär gesperrt. Bitte versuchen Sie es in ${remainingTime} Minuten erneut.`
        });
      }
      
      next();
    } catch (error) {
      console.error('[Rate-Limiter] Fehler beim Prüfen des Sperrstatus:', error);
      next();
    }
  };
}

/**
 * Bereinigt alte Rate-Limit-Einträge
 */
export async function cleanupRateLimitEntries() {
  try {
    // Lösche Einträge, die älter als 30 Tage sind und nicht gesperrt sind
    await db.execute(sql`
      DELETE FROM rate_limit_violations
      WHERE last_violation < CURRENT_TIMESTAMP - INTERVAL '30 days'
        AND (blocked_until IS NULL OR blocked_until < CURRENT_TIMESTAMP)
    `);
    
    return true;
  } catch (error) {
    console.error('[Rate-Limiter] Fehler bei der Bereinigung alter Einträge:', error);
    return false;
  }
}