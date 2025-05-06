/**
 * SQL Query Logger
 * 
 * Dieses Modul protokolliert SQL-Abfragen mit Ausführungszeit und Metadaten,
 * um langsame oder ineffiziente Abfragen zu identifizieren und zu optimieren.
 */

import { logger } from './logger';
import { db, sql } from './db';
import config from '../config';

// Spezifischer Logger für SQL-Abfragen
const sqlLogger = logger.createLogger('sql-query');

// Schwellenwerte für Abfrage-Ausführungszeiten (in Millisekunden)
const QUERY_THRESHOLDS = {
  INFO: 100,    // Abfragen über 100ms werden als INFO protokolliert
  WARN: 500,    // Abfragen über 500ms werden als WARNUNG protokolliert
  ERROR: 2000   // Abfragen über 2s werden als FEHLER protokolliert
};

// Interface für Abfrage-Metriken
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

// Interface für die Abfragemetriken in der Datenbank
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
  const { query, params, duration, timestamp, source, rowCount, user_id, client_ip, route, cached } = metrics;
  
  // Bestimme den Schweregrad basierend auf der Ausführungszeit
  let logLevel = 'debug';
  let isProblematic = false;
  
  if (duration >= QUERY_THRESHOLDS.ERROR) {
    logLevel = 'error';
    isProblematic = true;
  } else if (duration >= QUERY_THRESHOLDS.WARN) {
    logLevel = 'warn';
    isProblematic = true;
  } else if (duration >= QUERY_THRESHOLDS.INFO) {
    logLevel = 'info';
  }
  
  // Erstelle den Log-Eintrag
  const logEntry = {
    query: query.replace(/\s+/g, ' ').trim(),
    params: params ? JSON.stringify(params) : null,
    duration,
    timestamp: timestamp.toISOString(),
    source: source || 'unbekannt',
    rowCount: rowCount || null,
    user_id: user_id || null,
    client_ip: client_ip || null,
    route: route || null,
    cached: cached || false,
    problematic: isProblematic
  };
  
  // Protokolliere in Logger
  if (logLevel === 'error') {
    sqlLogger.error(`Langsame Abfrage (${duration}ms): ${logEntry.query}`, logEntry);
  } else if (logLevel === 'warn') {
    sqlLogger.warn(`Abfrage über Schwellenwert (${duration}ms): ${logEntry.query}`, logEntry);
  } else if (logLevel === 'info') {
    sqlLogger.info(`Abfrage (${duration}ms): ${logEntry.query}`, logEntry);
  } else {
    sqlLogger.debug(`Abfrage (${duration}ms): ${logEntry.query}`, logEntry);
  }
  
  try {
    // In der Datenbank speichern (nur wenn aktiviert)
    if (config.logging.storeSlowQueries && isProblematic) {
      await db.execute(sql`
        INSERT INTO query_logs (
          query_text, 
          parameters, 
          duration_ms, 
          executed_at, 
          source, 
          row_count, 
          user_id, 
          client_ip, 
          route, 
          problematic
        ) 
        VALUES (
          ${logEntry.query}, 
          ${logEntry.params}, 
          ${logEntry.duration}, 
          ${logEntry.timestamp}::timestamp, 
          ${logEntry.source}, 
          ${logEntry.rowCount}, 
          ${logEntry.user_id}, 
          ${logEntry.client_ip}, 
          ${logEntry.route}, 
          ${logEntry.problematic}
        )
      `);
    }
  } catch (error) {
    sqlLogger.error(`Fehler beim Speichern des Query-Logs: ${error}`);
  }
}

/**
 * Initialisiert das Query-Logging-System und erstellt die benötigte DB-Tabelle
 */
export async function initQueryLogging(): Promise<void> {
  try {
    // Erstelle die Tabelle für Query-Logs, falls noch nicht vorhanden
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS query_logs (
        id SERIAL PRIMARY KEY,
        query_text TEXT NOT NULL,
        parameters TEXT,
        duration_ms INTEGER NOT NULL,
        executed_at TIMESTAMP NOT NULL,
        source VARCHAR(100),
        row_count INTEGER,
        user_id INTEGER,
        client_ip VARCHAR(50),
        route VARCHAR(200),
        problematic BOOLEAN DEFAULT false,
        analyzed BOOLEAN DEFAULT false,
        analysis_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Erstelle Indizes für bessere Abfrageleistung
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_query_logs_problematic ON query_logs (problematic);
      CREATE INDEX IF NOT EXISTS idx_query_logs_duration ON query_logs (duration_ms DESC);
      CREATE INDEX IF NOT EXISTS idx_query_logs_executed_at ON query_logs (executed_at);
    `);
    
    sqlLogger.info('SQL Query-Logging-System initialisiert');
  } catch (error) {
    sqlLogger.error(`Fehler beim Initialisieren des Query-Logging-Systems: ${error}`);
  }
}

/**
 * Ruft die langsamsten Abfragen ab
 */
export async function getSlowestQueries(limit: number = 100): Promise<StoredQueryMetric[]> {
  try {
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const result = await db.execute(sql`
      SELECT 
        id, query_text as query, parameters as params, duration_ms as duration, 
        executed_at as timestamp, source, row_count, user_id, 
        client_ip, route, problematic
      FROM query_logs 
      ORDER BY duration_ms DESC 
      LIMIT ${limit}
    `);
    
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    return result.rows;
  } catch (error) {
    sqlLogger.error(`Fehler beim Abrufen der langsamsten Abfragen: ${error}`);
    return [];
  }
}

/**
 * Bereinigt alte Query-Logs
 */
export async function cleanupOldQueryLogs(daysToKeep: number = 30): Promise<number> {
  try {
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const result = await db.execute(sql`
      DELETE FROM query_logs 
      WHERE executed_at < NOW() - INTERVAL '${daysToKeep} days'
      RETURNING id
    `);
    
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const deletedCount = result.rows.length;
    sqlLogger.info(`${deletedCount} alte Query-Logs wurden bereinigt`);
    
    return deletedCount;
  } catch (error) {
    sqlLogger.error(`Fehler beim Bereinigen alter Query-Logs: ${error}`);
    return 0;
  }
}

/**
 * Sammelt Statistiken über die gespeicherten Abfragen
 */
export async function getQueryStats(): Promise<any> {
  try {
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_queries,
        COUNT(CASE WHEN problematic = true THEN 1 END) as problematic_queries,
        AVG(duration_ms) as avg_duration,
        MAX(duration_ms) as max_duration,
        MIN(duration_ms) as min_duration,
        percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms) as median_duration,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration,
        percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_duration
      FROM query_logs
    `);
    
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    return result.rows[0];
  } catch (error) {
    sqlLogger.error(`Fehler beim Abrufen der Query-Statistiken: ${error}`);
    return {
      total_queries: 0,
      problematic_queries: 0,
      avg_duration: 0,
      max_duration: 0,
      min_duration: 0,
      median_duration: 0,
      p95_duration: 0,
      p99_duration: 0
    };
  }
}

// Exportiere die Funktionen
export default {
  logQuery,
  initQueryLogging,
  getSlowestQueries,
  cleanupOldQueryLogs,
  getQueryStats
};