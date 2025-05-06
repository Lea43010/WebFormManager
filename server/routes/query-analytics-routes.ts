/**
 * Query Analytics Routes
 * 
 * Admin-Routen für die Analyse von SQL-Abfragen
 * Bietet Endpunkte zum Abrufen von langsamen Abfragen und Statistiken
 */

import { Router } from 'express';
import { requireAdmin } from '../middleware/role-check';
import { 
  getSlowestQueries, 
  getQueryStats, 
  cleanupOldQueryLogs 
} from '../sql-query-logger';
import { db, sql } from '../db';
import { logger } from '../logger';
import config from '../../config';

const router = Router();

/**
 * GET /api/admin/query-analytics/slow-queries
 * 
 * Ruft langsame Abfragen mit optionaler Filterung ab
 */
router.get('/slow-queries', requireAdmin(), async (req, res) => {
  try {
    const { 
      limit = '100',
      minDuration = '500',
      source,
      route,
      startDate,
      endDate
    } = req.query;
    
    // Basis-Query
    let queryText = `
      SELECT 
        id, query_text as query, parameters as params, duration_ms as duration, 
        executed_at as timestamp, source, row_count as "rowCount", user_id as "userId", 
        client_ip as "clientIp", route, problematic,
        analysis_notes as "analysisNotes", analyzed
      FROM query_logs 
      WHERE duration_ms >= $1
    `;
    
    // Parameter-Array beginnen
    const queryParams: any[] = [parseInt(minDuration as string, 10)];
    let paramIndex = 2;
    
    // Optionale Filter hinzufügen
    if (source) {
      queryText += ` AND source LIKE $${paramIndex}`;
      queryParams.push(`%${source}%`);
      paramIndex++;
    }
    
    if (route) {
      queryText += ` AND route LIKE $${paramIndex}`;
      queryParams.push(`%${route}%`);
      paramIndex++;
    }
    
    if (startDate) {
      queryText += ` AND executed_at >= $${paramIndex}`;
      queryParams.push(new Date(startDate as string));
      paramIndex++;
    }
    
    if (endDate) {
      queryText += ` AND executed_at <= $${paramIndex}`;
      queryParams.push(new Date(endDate as string));
      paramIndex++;
    }
    
    // Sortierung und Begrenzung
    queryText += ` ORDER BY duration_ms DESC LIMIT $${paramIndex}`;
    queryParams.push(parseInt(limit as string, 10));
    
    // Query ausführen
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const result = await db.execute(sql(queryText, queryParams));
    
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const queries = result.rows.map(row => ({
      ...row,
      params: row.params ? JSON.parse(row.params) : null
    }));
    
    res.json(queries);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Fehler beim Abrufen der langsamen Abfragen: ${errorMessage}`);
    res.status(500).json({ 
      error: 'Fehler beim Abrufen der langsamen Abfragen',
      details: errorMessage
    });
  }
});

/**
 * GET /api/admin/query-analytics/stats
 * 
 * Ruft Statistiken über ausgeführte Abfragen ab
 */
router.get('/stats', requireAdmin(), async (req, res) => {
  try {
    const stats = await getQueryStats();
    
    // Zusätzliche Statistiken über häufig auftretende Abfragen
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const frequentQueries = await db.execute(sql`
      SELECT 
        regexp_replace(query_text, '\\$\\d+', '?', 'g') as normalized_query,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration,
        MAX(duration_ms) as max_duration,
        MIN(duration_ms) as min_duration
      FROM query_logs
      GROUP BY normalized_query
      ORDER BY count DESC
      LIMIT 20
    `);
    
    // Statistiken über Abfragen nach Quelle
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const sourceStats = await db.execute(sql`
      SELECT 
        source,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration,
        MAX(duration_ms) as max_duration
      FROM query_logs
      GROUP BY source
      ORDER BY count DESC
      LIMIT 20
    `);
    
    // Statistiken über Abfragen nach Route
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const routeStats = await db.execute(sql`
      SELECT 
        route,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration,
        MAX(duration_ms) as max_duration
      FROM query_logs
      GROUP BY route
      ORDER BY count DESC
      LIMIT 20
    `);
    
    // Statistiken über Ausführungszeit nach Stunde
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const timeStats = await db.execute(sql`
      SELECT 
        EXTRACT(HOUR FROM executed_at) as hour,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration
      FROM query_logs
      GROUP BY hour
      ORDER BY hour
    `);
    
    res.json({
      overview: stats,
      // @ts-ignore - Neon DB Typen sind nicht immer korrekt
      frequentQueries: frequentQueries.rows,
      // @ts-ignore - Neon DB Typen sind nicht immer korrekt
      sourceStats: sourceStats.rows,
      // @ts-ignore - Neon DB Typen sind nicht immer korrekt
      routeStats: routeStats.rows,
      // @ts-ignore - Neon DB Typen sind nicht immer korrekt
      timeStats: timeStats.rows
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Fehler beim Abrufen der Query-Statistiken: ${errorMessage}`);
    res.status(500).json({ 
      error: 'Fehler beim Abrufen der Query-Statistiken',
      details: errorMessage
    });
  }
});

/**
 * POST /api/admin/query-analytics/analyze-query/:id
 * 
 * Speichert Analyse-Notizen für eine bestimmte Abfrage
 */
router.post('/analyze-query/:id', requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { analysisNotes } = req.body;
    
    // Aktualisiere die Analyse-Notizen in der Datenbank
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const result = await db.execute(sql`
      UPDATE query_logs
      SET analysis_notes = ${analysisNotes}, analyzed = true
      WHERE id = ${parseInt(id, 10)}
      RETURNING id, query_text, analysis_notes, analyzed
    `);
    
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Abfrage nicht gefunden' });
    }
    
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    res.json(result.rows[0]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Fehler beim Speichern der Analyse-Notizen: ${errorMessage}`);
    res.status(500).json({ 
      error: 'Fehler beim Speichern der Analyse-Notizen',
      details: errorMessage
    });
  }
});

/**
 * POST /api/admin/query-analytics/cleanup
 * 
 * Bereinigt alte Query-Logs
 */
router.post('/cleanup', requireAdmin(), async (req, res) => {
  try {
    const { days = config.logging.queryCleanupDays } = req.body;
    
    const daysToKeep = parseInt(days.toString(), 10);
    const deletedCount = await cleanupOldQueryLogs(daysToKeep);
    
    res.json({ 
      success: true, 
      message: `${deletedCount} alte Query-Logs wurden bereinigt`,
      deletedCount
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Fehler beim Bereinigen alter Query-Logs: ${errorMessage}`);
    res.status(500).json({ 
      error: 'Fehler beim Bereinigen alter Query-Logs',
      details: errorMessage
    });
  }
});

/**
 * GET /api/admin/query-analytics/explain/:id
 * 
 * Führt eine EXPLAIN ANALYZE für eine bestimmte Abfrage aus
 */
router.get('/explain/:id', requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hole die Abfrage aus der Datenbank
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const queryResult = await db.execute(sql`
      SELECT query_text, parameters
      FROM query_logs
      WHERE id = ${parseInt(id, 10)}
    `);
    
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    if (queryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Abfrage nicht gefunden' });
    }
    
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const { query_text, parameters } = queryResult.rows[0];
    
    // Bereite die EXPLAIN-Abfrage vor
    const queryWithParams = replacePlaceholders(query_text, parameters ? JSON.parse(parameters) : []);
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${queryWithParams}`;
    
    // Führe die EXPLAIN-Abfrage aus
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const explainResult = await db.execute(sql(explainQuery));
    
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    if (explainResult.rows.length === 0) {
      return res.status(500).json({ error: 'EXPLAIN-Abfrage lieferte keine Ergebnisse' });
    }
    
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    res.json(explainResult.rows[0]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Fehler beim Ausführen der EXPLAIN-Abfrage: ${errorMessage}`);
    res.status(500).json({ 
      error: 'Fehler beim Ausführen der EXPLAIN-Abfrage',
      details: errorMessage
    });
  }
});

/**
 * GET /api/admin/query-analytics/suggest-indexes
 * 
 * Analysiert alle langsamen Abfragen und schlägt potenzielle Indizes vor
 */
router.get('/suggest-indexes', requireAdmin(), async (req, res) => {
  try {
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const suggestionsResult = await db.execute(sql`
      WITH problematic_queries AS (
        SELECT query_text
        FROM query_logs
        WHERE problematic = true
        ORDER BY duration_ms DESC
        LIMIT 100
      ),
      extracted_tables AS (
        SELECT 
          LOWER(regexp_matches(query_text, 'from\\s+([\\w\\."]+)', 'i')) AS table_name,
          LOWER(regexp_matches(query_text, 'where\\s+([\\w\\."]+)\\s*=', 'i')) AS where_column
        FROM problematic_queries
      )
      SELECT 
        table_name[1] AS table_name,
        where_column[1] AS column_name,
        COUNT(*) AS frequency
      FROM extracted_tables
      WHERE table_name IS NOT NULL AND where_column IS NOT NULL
      GROUP BY table_name[1], where_column[1]
      ORDER BY frequency DESC, table_name[1], column_name
      LIMIT 20
    `);
    
    // @ts-ignore - Neon DB Typen sind nicht immer korrekt
    const suggestions = suggestionsResult.rows.map(row => ({
      table: row.table_name,
      column: row.column_name,
      frequency: row.frequency,
      suggestedIndex: `CREATE INDEX IF NOT EXISTS idx_${row.table_name}_${row.column_name} ON ${row.table_name} (${row.column_name});`
    }));
    
    res.json(suggestions);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Fehler beim Vorschlagen von Indizes: ${errorMessage}`);
    res.status(500).json({ 
      error: 'Fehler beim Vorschlagen von Indizes',
      details: errorMessage
    });
  }
});

// Hilfsfunktion, um Platzhalter in einer SQL-Abfrage zu ersetzen
function replacePlaceholders(query: string, params: any[]): string {
  let paramIndex = 0;
  return query.replace(/\$\d+/g, () => {
    if (paramIndex < params.length) {
      const param = params[paramIndex++];
      if (param === null) {
        return 'NULL';
      } else if (typeof param === 'string') {
        return `'${param.replace(/'/g, "''")}'`;
      } else if (typeof param === 'number') {
        return param.toString();
      } else if (param instanceof Date) {
        return `'${param.toISOString()}'`;
      } else if (typeof param === 'boolean') {
        return param ? 'TRUE' : 'FALSE';
      } else {
        return `'${JSON.stringify(param)}'`;
      }
    }
    return '$?';
  });
}

export default router;