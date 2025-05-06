/**
 * SQL-Abfrage-Analytik-Routen
 * 
 * Diese Routen bieten Zugriff auf die SQL-Abfrage-Protokolle und Analysen.
 * Alle Routen erfordern Administratorrechte.
 */

import express from 'express';
import { Request, Response } from 'express';
import { logger } from '../logger';
import { pool } from '../db';
import { getSlowestQueries, getQueryStats, cleanupOldQueryLogs, QUERY_THRESHOLDS } from '../sql-query-logger';
import { requireAdmin } from '../middleware/role-check';
import config from '../../config';

// Logger für diese Komponente
const analyticsLogger = logger.createLogger('query-analytics');

// Router erstellen
const router = express.Router();

// Alle Routen benötigen Administratorrechte
router.use(requireAdmin());

/**
 * Status des SQL-Query-Loggings abrufen
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = {
      enabled: config.logging.sqlQueryLogging,
      logAllQueries: config.logging.logAllQueries,
      storeSlowQueries: config.logging.storeSlowQueries,
      samplingRate: config.logging.querySamplingRate,
      thresholds: QUERY_THRESHOLDS,
      cleanupDays: config.logging.queryCleanupDays || 30
    };
    
    res.json(status);
  } catch (error) {
    analyticsLogger.error('Fehler beim Abrufen des Logging-Status:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Logging-Status' });
  }
});

/**
 * Statistiken über die gespeicherten Abfragen abrufen
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getQueryStats();
    res.json(stats);
  } catch (error) {
    analyticsLogger.error('Fehler beim Abrufen der Query-Statistiken:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Query-Statistiken' });
  }
});

/**
 * Die langsamsten Abfragen abrufen
 */
router.get('/slow-queries', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const queries = await getSlowestQueries(limit);
    
    // Formatiere die Antwort für bessere Lesbarkeit und Sicherheit
    const formattedQueries = queries.map(query => ({
      ...query,
      params: JSON.parse(query.params || '[]'),
      // Die Abfrage selbst wird nicht formatiert, um die Originaldaten zu erhalten
    }));
    
    res.json(formattedQueries);
  } catch (error) {
    analyticsLogger.error('Fehler beim Abrufen der langsamen Abfragen:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der langsamen Abfragen' });
  }
});

/**
 * Abfragen nach bestimmten Filtern abrufen
 */
router.get('/queries', async (req: Request, res: Response) => {
  try {
    const { 
      limit = 100, 
      source, 
      minDuration, 
      route,
      problematic, 
      order = 'duration-desc'
    } = req.query;
    
    // Basis-SQL-Abfrage
    let sql = 'SELECT * FROM sql_query_logs WHERE 1=1';
    const params: any[] = [];
    
    // Filter anwenden
    if (source) {
      sql += ' AND source LIKE $' + (params.length + 1);
      params.push('%' + source + '%');
    }
    
    if (minDuration) {
      sql += ' AND duration >= $' + (params.length + 1);
      params.push(parseInt(minDuration as string));
    }
    
    if (route) {
      sql += ' AND route LIKE $' + (params.length + 1);
      params.push('%' + route + '%');
    }
    
    if (problematic) {
      sql += ' AND problematic = $' + (params.length + 1);
      params.push(problematic === 'true');
    }
    
    // Sortierung
    if (order === 'duration-desc') {
      sql += ' ORDER BY duration DESC';
    } else if (order === 'duration-asc') {
      sql += ' ORDER BY duration ASC';
    } else if (order === 'timestamp-desc') {
      sql += ' ORDER BY timestamp DESC';
    } else if (order === 'timestamp-asc') {
      sql += ' ORDER BY timestamp ASC';
    }
    
    // Limit anwenden
    sql += ' LIMIT $' + (params.length + 1);
    params.push(parseInt(limit as string));
    
    // Abfrage ausführen
    const result = await pool.query(sql, params);
    
    // Formatiere die Antwort
    const formattedQueries = result.rows.map(query => ({
      ...query,
      params: JSON.parse(query.params || '[]'),
    }));
    
    res.json(formattedQueries);
  } catch (error) {
    analyticsLogger.error('Fehler beim Abrufen der gefilterten Abfragen:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der gefilterten Abfragen' });
  }
});

/**
 * Abfragen nach einer bestimmten Quelle gruppieren
 */
router.get('/group-by-source', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        source,
        COUNT(*) as count,
        AVG(duration) as avg_duration,
        MAX(duration) as max_duration,
        MIN(duration) as min_duration,
        COUNT(*) FILTER (WHERE problematic = true) as problematic_count
      FROM sql_query_logs
      GROUP BY source
      ORDER BY count DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    analyticsLogger.error('Fehler beim Gruppieren nach Quelle:', error);
    res.status(500).json({ error: 'Fehler beim Gruppieren nach Quelle' });
  }
});

/**
 * Abfragen nach einer bestimmten Route gruppieren
 */
router.get('/group-by-route', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        route,
        COUNT(*) as count,
        AVG(duration) as avg_duration,
        MAX(duration) as max_duration,
        MIN(duration) as min_duration,
        COUNT(*) FILTER (WHERE problematic = true) as problematic_count
      FROM sql_query_logs
      GROUP BY route
      ORDER BY count DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    analyticsLogger.error('Fehler beim Gruppieren nach Route:', error);
    res.status(500).json({ error: 'Fehler beim Gruppieren nach Route' });
  }
});

/**
 * Ähnliche Abfragen gruppieren und aggregieren
 */
router.get('/similar-queries', async (req: Request, res: Response) => {
  try {
    // Diese Abfrage ist komplex und nutzt PostgreSQL-spezifische Funktionen
    // Sie gruppiert Abfragen basierend auf ihrem "Fingerabdruck" (ohne Parameter)
    const result = await pool.query(`
      WITH fingerprints AS (
        SELECT 
          -- Entferne Zahlen in Klammern, die wahrscheinlich Parameter sind
          regexp_replace(query, '\\$\\d+', '$?', 'g') as query_fingerprint,
          query,
          duration,
          source,
          timestamp,
          problematic
        FROM sql_query_logs
      )
      SELECT 
        query_fingerprint,
        COUNT(*) as execution_count,
        AVG(duration) as avg_duration,
        MAX(duration) as max_duration,
        MIN(duration) as min_duration,
        COUNT(*) FILTER (WHERE problematic = true) as problematic_count,
        MAX(timestamp) as last_executed,
        MIN(timestamp) as first_executed,
        ARRAY_AGG(DISTINCT source) as sources
      FROM fingerprints
      GROUP BY query_fingerprint
      HAVING COUNT(*) > 1  -- Nur Abfragen, die mehrfach ausgeführt wurden
      ORDER BY execution_count DESC, avg_duration DESC
      LIMIT 50
    `);
    
    res.json(result.rows);
  } catch (error) {
    analyticsLogger.error('Fehler beim Gruppieren ähnlicher Abfragen:', error);
    res.status(500).json({ error: 'Fehler beim Gruppieren ähnlicher Abfragen' });
  }
});

/**
 * Eine bestimmte Abfrage im Detail anzeigen
 */
router.get('/query/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Ungültige ID' });
    }
    
    const result = await pool.query('SELECT * FROM sql_query_logs WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Abfrage nicht gefunden' });
    }
    
    // Formatiere die Antwort
    const query = {
      ...result.rows[0],
      params: JSON.parse(result.rows[0].params || '[]'),
    };
    
    res.json(query);
  } catch (error) {
    analyticsLogger.error('Fehler beim Abrufen der Abfrage:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Abfrage' });
  }
});

/**
 * Exportiere Abfragen als CSV (vereinfachte Version)
 */
router.get('/export-csv', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 1000;
    const queries = await getSlowestQueries(limit);
    
    // CSV-Header
    let csv = 'id,query,duration,timestamp,source,row_count,user_id,client_ip,route,problematic\n';
    
    // CSV-Daten
    queries.forEach(query => {
      csv += `${query.id},"${query.query.replace(/"/g, '""')}",${query.duration},"${query.timestamp}","${query.source}",${query.row_count},${query.user_id || ''},"${query.client_ip}","${query.route}",${query.problematic}\n`;
    });
    
    // Als Datei senden
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sql-queries.csv');
    res.send(csv);
  } catch (error) {
    analyticsLogger.error('Fehler beim Exportieren der Abfragen als CSV:', error);
    res.status(500).json({ error: 'Fehler beim Exportieren der Abfragen als CSV' });
  }
});

/**
 * Alte Abfragen bereinigen
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const daysToKeep = req.body.daysToKeep || 30;
    
    if (daysToKeep < 1) {
      return res.status(400).json({ error: 'daysToKeep muss mindestens 1 sein' });
    }
    
    const deletedRows = await cleanupOldQueryLogs(daysToKeep);
    
    res.json({ 
      success: true, 
      message: `${deletedRows} alte Abfragen wurden bereinigt`,
      deletedCount: deletedRows
    });
  } catch (error) {
    analyticsLogger.error('Fehler beim Bereinigen alter Abfragen:', error);
    res.status(500).json({ error: 'Fehler beim Bereinigen alter Abfragen' });
  }
});

/**
 * Alle Abfragen löschen (nur für Administratoren mit zusätzlicher Bestätigung)
 */
router.post('/delete-all', async (req: Request, res: Response) => {
  try {
    const { confirmation } = req.body;
    
    if (confirmation !== 'DELETE_ALL_QUERY_LOGS') {
      return res.status(400).json({ 
        error: 'Bitte bestätigen Sie die Löschung aller Abfragen mit dem Bestätigungscode "DELETE_ALL_QUERY_LOGS"' 
      });
    }
    
    const result = await pool.query('DELETE FROM sql_query_logs');
    
    res.json({ 
      success: true, 
      message: `Alle Abfragen wurden gelöscht`,
      deletedCount: result.rowCount || 0
    });
    
    analyticsLogger.warn(`Benutzer ${req.user?.id || 'unbekannt'} hat alle SQL-Query-Logs gelöscht`);
  } catch (error) {
    analyticsLogger.error('Fehler beim Löschen aller Abfragen:', error);
    res.status(500).json({ error: 'Fehler beim Löschen aller Abfragen' });
  }
});

export default router;