import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';
import { sql as drizzleSql } from 'drizzle-orm';

// Configure neon
neonConfig.fetchConnectionCache = true;

// Konfigurierbare Timeouts (in Millisekunden)
const DB_QUERY_TIMEOUT = 5000; // 5 Sekunden Timeout für reguläre Abfragen
const DB_HEALTH_CHECK_TIMEOUT = 2000; // 2 Sekunden Timeout für Health-Checks
const MAX_RETRIES = 3; // Maximale Anzahl an Verbindungsversuchen

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// Erstelle die Datenbankverbindung
export const sql = neon(process.env.DATABASE_URL);

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

// Create the drizzle database instance with timeouts
export const db = drizzle(sql, { schema });
