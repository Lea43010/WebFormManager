/**
 * SQL Query Logger
 * 
 * Dieses Modul protokolliert SQL-Abfragen mit Ausführungszeit und Metadaten,
 * um langsame oder ineffiziente Abfragen zu identifizieren und zu optimieren.
 */

import { pool } from './db';
import config from '../config';
import { logger } from './logger';

// Logger für diese Komponente
const sqlLogger = logger.createLogger('sql-logger');

// Definition der Schwellenwerte für die SQL-Abfragen
export const QUERY_THRESHOLDS = {
  SLOW: 500,       // Abfragen > 500ms gelten als langsam
  VERY_SLOW: 1000, // Abfragen > 1000ms gelten als sehr langsam
  CRITICAL: 3000   // Abfragen > 3000ms gelten als kritisch langsam
};

// Interface für die Abfragemetriken
export interface QueryMetrics {
  query: string;
  params?: any[];
  duration: number;
  timestamp: Date;
  source?: string;
  rowCount?: number;
  user_id?: number;
  client_ip?: string;
  route?: string;
  cached?: boolean;
}

// Interface für die gespeicherten Abfragemetriken
interface StoredQueryMetric {
  id: number;
  query: string;
  params: string; // JSON-String
  duration: number;
  timestamp: Date;
  source: string;
  row_count: number;
  user_id: number | null;
  client_ip: string;
  route: string;
  problematic: boolean;
}

/**
 * Protokolliert eine SQL-Abfrage mit Ausführungszeit und Metadaten
 */
export async function logQuery(metrics: QueryMetrics): Promise<void> {
  try {
    // Prüfen, ob wir die Abfrage speichern sollen
    const shouldStore = 
      // Speichere immer langsame Abfragen
      (config.logging.storeSlowQueries && metrics.duration > QUERY_THRESHOLDS.SLOW) || 
      // Oder alle Abfragen, wenn konfiguriert
      config.logging.logAllQueries;
      
    // Wenn die Abfrage nicht gespeichert werden soll, nur loggen
    if (!shouldStore) {
      // Einfache Konsolen-Protokollierung für schnelle Abfragen
      if (metrics.duration > QUERY_THRESHOLDS.SLOW) {
        sqlLogger.warn(`Langsame SQL-Abfrage (${metrics.duration}ms): ${metrics.query.substring(0, 100)}${metrics.query.length > 100 ? '...' : ''}`);
      }
      return;
    }
    
    // Bestimme, ob die Abfrage als problematisch markiert werden soll
    const isProblematic = metrics.duration > QUERY_THRESHOLDS.SLOW;
    
    // Speichere die Abfrage in der Datenbank
    await pool.query(
      `
      INSERT INTO sql_query_logs (
        query, 
        params, 
        duration, 
        timestamp, 
        source, 
        row_count, 
        user_id, 
        client_ip,
        route,
        problematic
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        metrics.query,
        JSON.stringify(metrics.params || []),
        metrics.duration,
        metrics.timestamp,
        metrics.source || 'unbekannt',
        metrics.rowCount || 0,
        metrics.user_id || null,
        metrics.client_ip || 'unbekannt',
        metrics.route || 'unbekannt',
        isProblematic
      ]
    );
    
    // Protokolliere langsame Abfragen auch im Server-Log
    if (metrics.duration > QUERY_THRESHOLDS.VERY_SLOW) {
      sqlLogger.warn(`Sehr langsame SQL-Abfrage (${metrics.duration}ms) in ${metrics.source || 'unbekannt'}: ${metrics.query.substring(0, 100)}${metrics.query.length > 100 ? '...' : ''}`);
    } else if (metrics.duration > QUERY_THRESHOLDS.CRITICAL) {
      sqlLogger.error(`KRITISCH LANGSAME SQL-Abfrage (${metrics.duration}ms) in ${metrics.source || 'unbekannt'}: ${metrics.query.substring(0, 100)}${metrics.query.length > 100 ? '...' : ''}`);
    }
  } catch (error) {
    sqlLogger.error('Fehler beim Protokollieren der SQL-Abfrage:', error);
  }
}

/**
 * Initialisiert das Query-Logging-System und erstellt die benötigte DB-Tabelle
 */
export async function initQueryLogging(): Promise<void> {
  if (!config.logging.sqlQueryLogging) {
    sqlLogger.info('SQL-Query-Logging ist deaktiviert');
    return;
  }
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sql_query_logs (
        id SERIAL PRIMARY KEY,
        query TEXT NOT NULL,
        params TEXT,
        duration INTEGER NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        source VARCHAR(255),
        row_count INTEGER,
        user_id INTEGER,
        client_ip VARCHAR(50),
        route VARCHAR(255),
        problematic BOOLEAN DEFAULT FALSE
      )
    `);
    
    // Indizes separat erstellen (wenn sie nicht existieren)
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_timestamp ON sql_query_logs (timestamp)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_duration ON sql_query_logs (duration)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_problematic ON sql_query_logs (problematic)');
      
      sqlLogger.info('SQL-Query-Logging-Indizes erfolgreich erstellt');
    } catch (indexError) {
      sqlLogger.warn('Fehler beim Erstellen der Indizes:', indexError);
      // Trotz Fehlern bei den Indizes fortfahren
    }
    
    sqlLogger.info('SQL-Query-Logging-Tabelle erfolgreich initialisiert');
    
    // Automatische Bereinigung alter Logs starten
    const cleanupDays = config.logging.queryCleanupDays || 30;
    sqlLogger.info(`Automatische Bereinigung von SQL-Query-Logs älter als ${cleanupDays} Tage eingerichtet`);
    
    // Führe gleich eine initiale Bereinigung durch
    const deletedRows = await cleanupOldQueryLogs(cleanupDays);
    if (deletedRows > 0) {
      sqlLogger.info(`${deletedRows} alte SQL-Query-Logs wurden bereinigt`);
    }
  } catch (error) {
    sqlLogger.error('Fehler beim Initialisieren des SQL-Query-Loggings:', error);
    throw error;
  }
}

/**
 * Ruft die langsamsten Abfragen ab
 */
export async function getSlowestQueries(limit: number = 100): Promise<StoredQueryMetric[]> {
  try {
    const result = await pool.query(`
      SELECT * FROM sql_query_logs
      ORDER BY duration DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows as StoredQueryMetric[];
  } catch (error) {
    sqlLogger.error('Fehler beim Abrufen der langsamsten Abfragen:', error);
    throw error;
  }
}

/**
 * Bereinigt alte Query-Logs
 */
export async function cleanupOldQueryLogs(daysToKeep: number = 30): Promise<number> {
  try {
    const result = await pool.query(`
      DELETE FROM sql_query_logs
      WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
    `);
    
    return result.rowCount || 0;
  } catch (error) {
    sqlLogger.error('Fehler beim Bereinigen alter Query-Logs:', error);
    throw error;
  }
}

/**
 * Sammelt Statistiken über die gespeicherten Abfragen
 */
export async function getQueryStats(): Promise<any> {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_queries,
        COUNT(*) FILTER (WHERE problematic = true) as problematic_queries,
        AVG(duration) as avg_duration,
        MAX(duration) as max_duration,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY duration) as p95_duration,
        MIN(timestamp) as oldest_query,
        MAX(timestamp) as newest_query
      FROM sql_query_logs
    `);
    
    return result.rows[0];
  } catch (error) {
    sqlLogger.error('Fehler beim Abrufen der Query-Statistiken:', error);
    throw error;
  }
}