import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';
import { sql as drizzleSql } from 'drizzle-orm';
import config from '../config';

// Configure neon
neonConfig.fetchConnectionCache = true;

// Konfigurierbare Timeouts über die zentrale Konfiguration
const DB_QUERY_TIMEOUT = config.database.connectionTimeout || 5000; 
const DB_HEALTH_CHECK_TIMEOUT = 2000; // Immer schnelles Timeout für Health-Checks
const MAX_RETRIES = config.isProduction ? 5 : (config.isStaging ? 4 : 3); // Abgestufte Wiederholungsversuche je nach Umgebung

// Sichere Validierung der Datenbank-URL
const dbUrl = config.database.url || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('Keine Datenbankverbindung konfiguriert. Bitte DATABASE_URL in .env definieren.');
}

// Protokollierung der Datenbankverbindung in Entwicklungs- und Staging-Umgebungen
if (config.isDevelopment || config.isStaging) {
  // Sicherer Log der Datenbankverbindung (ohne Passwort)
  const safeDbUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log(`[DB] Verbindung zu ${safeDbUrl} (${config.env})`);
}

// Konfiguration des Connection Poolings basierend auf der Umgebung
neonConfig.fetchConnectionCache = config.isProduction; // Nur in Produktion Connection Pooling aktivieren

// Erstelle die Datenbankverbindung
export const sql = neon(dbUrl);

/**
 * Führt eine SQL-Abfrage mit automatischem Reconnect-Versuch aus
 * 
 * @param query SQL-Abfrage-Funktion
 * @param maxRetries Maximale Anzahl an Wiederholungsversuchen
 * @param timeout Query-Timeout in Millisekunden
 * @returns Ergebnis der SQL-Abfrage
 */
export async function executeWithRetry<T>(
  query: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  timeout: number = DB_QUERY_TIMEOUT
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await query();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Datenbankabfrage fehlgeschlagen (Versuch ${attempt}/${maxRetries}): ${lastError.message}`);
      
      // Nur bei Timeout- oder Verbindungsfehlern erneut versuchen
      if (!lastError.message.includes('timeout') && 
          !lastError.message.includes('connection') &&
          !lastError.message.includes('network')) {
        throw lastError; // Bei anderen Fehlern (z.B. Syntax-Fehler) direkt werfen
      }
      
      // Kurze Pause vor dem nächsten Versuch
      if (attempt < maxRetries) {
        const delay = Math.min(100 * Math.pow(2, attempt), 2000); // Exponentielles Backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Wenn alle Versuche fehlschlagen, den letzten Fehler werfen
  throw lastError;
}

// Export drizzleSql for raw SQL queries
export { drizzleSql };

// Erstelle die Drizzle-Datenbankinstanz mit schema
// In Entwicklungs- und Staging-Umgebungen fügen wir Debug-Logs für SQL-Abfragen hinzu
export const db = drizzle(sql, { 
  schema,
  logger: (config.isDevelopment || config.isStaging) ? {
    logQuery: (query, params) => {
      // In Staging nur Fehler und Warnungen loggen
      if (config.isStaging && !query.toLowerCase().includes('select')) {
        console.log(`[SQL] ${query} - Params: ${JSON.stringify(params)}`);
      } 
      // In Development alle Queries loggen
      else if (config.isDevelopment) {
        console.log(`[SQL] ${query} - Params: ${JSON.stringify(params)}`);
      }
    }
  } : undefined
});
