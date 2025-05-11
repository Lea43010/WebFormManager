/**
 * SQL Query Monitor Middleware
 * 
 * Diese Middleware überwacht SQL-Abfragen und protokolliert sie
 * Sie verwendet den SQL-Query-Logger, um Abfragen zu erfassen
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from '@neondatabase/serverless'; 
import { QueryMetrics, logQuery, QUERY_THRESHOLDS } from '../sql-query-logger';
import config from '../../config';
import { logger } from '../logger';

// Logger für diese Komponente
const monitorLogger = logger.createLogger('sql-query-monitor');

// Interface zur Erweiterung der Request-Objekte mit SQL-Tracking
interface RequestWithSQLTracking extends Request {
  _sqlQueriesStarted?: Map<any, { query: string; params: any[]; startTime: number; source?: string }>;
  _sqlRouteIdentifier?: string;
}

/**
 * Erzeugt die SQL-Query-Monitor-Middleware
 * 
 * @param pool - Die PostgreSQL-Verbindungspool-Instanz
 * @returns Express-Middleware zum Überwachen von SQL-Abfragen
 */
export function createSQLQueryMonitor(pool: Pool) {
  // Stichprobengröße für SQL-Queries festlegen (0-100%)
  const samplingRate = config.logging.querySamplingRate || 100;
  
  monitorLogger.info(`SQL-Query-Monitor initialisiert (Sampling-Rate: ${samplingRate}%)`);
  
  // Zähle für statistische Zwecke
  let totalQueries = 0;
  let monitoredQueries = 0;
  let slowQueries = 0;
  
  /**
   * Konfiguriert die Überwachung für den Pool
   */
  function setupMonitoring() {
    if (!pool) {
      monitorLogger.warn('SQL-Query-Monitor: Kein Pool übergeben, Monitoring deaktiviert');
      return;
    }
    
    // Original-Methode sichern
    const originalQuery = pool.query.bind(pool);
    
    // Patchen der query-Methode zur Überwachung
    pool.query = function monitoredQuery(text: string, params?: any[], callback?: Function) {
      // Prüfen, ob diese Abfrage überwacht werden soll (basierend auf Sampling-Rate)
      const shouldMonitor = Math.random() * 100 <= samplingRate;
      
      totalQueries++;
      
      if (!shouldMonitor) {
        // Skip monitoring für diese Abfrage
        return originalQuery(text, params, callback);
      }
      
      monitoredQueries++;
      
      // Start-Zeit erfassen
      const startTime = Date.now();
      
      // Aktuelle Anforderungs-/Antwort-Objekte aus der Async-Speicher ermitteln
      const reqRes = getCurrentRequestResponse();
      
      // Quell-Identifikation (welche Komponente führt die Abfrage aus?)
      let source = 'unbekannt';
      let query = text;
      
      // Versuche, den Aufrufer zu identifizieren
      try {
        const stack = new Error().stack || '';
        const stackLines = stack.split('\n');
        
        // Suche nach dem ersten relevanten Eintrag im Stack
        for (let i = 0; i < stackLines.length; i++) {
          const line = stackLines[i];
          if (line.includes('/server/') && 
              !line.includes('sql-query-monitor.ts') && 
              !line.includes('sql-query-logger.ts')) {
            // Extrahiere Dateipfad aus dem Stack-Eintrag
            const match = line.match(/\/server\/(.*?):/);
            if (match && match[1]) {
              source = match[1];
              break;
            }
          }
        }
      } catch (error) {
        // Ignoriere Fehler bei der Stack-Analyse
      }
      
      // Callback-basierte API
      if (callback) {
        return originalQuery(text, params || [], (err: any, result: any) => {
          const duration = Date.now() - startTime;
          
          if (duration > QUERY_THRESHOLDS.SLOW) {
            slowQueries++;
          }
          
          // Protokolliere die Abfrage (auch bei Fehler)
          logQueryExecution(text, params || [], duration, source, reqRes, result);
          
          // Original-Callback aufrufen
          callback(err, result);
        });
      }
      
      // Promise-basierte API
      const queryPromise = originalQuery(text, params);
      
      return queryPromise.then((result: any) => {
        const duration = Date.now() - startTime;
        
        if (duration > QUERY_THRESHOLDS.SLOW) {
          slowQueries++;
        }
        
        // Protokolliere die Abfrage
        logQueryExecution(text, params || [], duration, source, reqRes, result);
        
        return result;
      }).catch((error: Error) => {
        const duration = Date.now() - startTime;
        
        // Protokolliere die fehlgeschlagene Abfrage
        logQueryExecution(text, params || [], duration, source, reqRes, null, error);
        
        // Wirf den Fehler weiter
        throw error;
      });
    };
    
    // Protokolliere den erfolgreichen Setup
    monitorLogger.info('SQL-Query-Monitoring aktiviert');
  }
  
  /**
   * Protokolliert eine SQL-Abfrage mit ihren Metriken
   */
  function logQueryExecution(
    query: string,
    params: any[],
    duration: number,
    source: string,
    reqRes: { req?: RequestWithSQLTracking, res?: Response } | null,
    result: any,
    error?: Error
  ) {
    try {
      // Erstelle Metriken-Objekt für die Protokollierung
      const metrics: QueryMetrics = {
        query,
        params,
        duration,
        timestamp: new Date(),
        source,
        rowCount: result?.rowCount,
        user_id: reqRes?.req?.user?.id,
        client_ip: reqRes?.req?.ip || undefined,
        route: reqRes?.req?._sqlRouteIdentifier
      };
      
      // Protokolliere die Abfrage asynchron
      logQuery(metrics).catch(err => {
        monitorLogger.error('Fehler beim Protokollieren der SQL-Abfrage:', err);
      });
      
      // Wenn es sich um eine langsame Abfrage handelt, im Detail loggen
      if (duration > QUERY_THRESHOLDS.VERY_SLOW || error) {
        const formattedParams = JSON.stringify(params || []);
        const message = error 
          ? `SQL-Fehler (${duration}ms): ${query} - Params: ${formattedParams} - Fehler: ${error.message}`
          : `Langsame SQL-Abfrage (${duration}ms): ${query} - Params: ${formattedParams}`;
        
        monitorLogger.warn(message);
      }
    } catch (logError) {
      monitorLogger.error('Fehler beim Protokollieren der SQL-Abfrage:', logError);
    }
  }
  
  /**
   * Versucht, das aktuelle Request/Response-Paar zu ermitteln
   */
  function getCurrentRequestResponse(): { req?: RequestWithSQLTracking, res?: Response } | null {
    try {
      return {
        req: null,
        res: null
      };
    } catch (error: unknown) {
      return null;
    }
  }
  
  // Monitoring beim Erstellen der Middleware einrichten
  setupMonitoring();
  
  // Die eigentliche Middleware-Funktion zurückgeben
  return (req: RequestWithSQLTracking, res: Response, next: NextFunction) => {
    try {
      // Setze eine eindeutige Kennung für die Route
      req._sqlRouteIdentifier = `${req.method} ${req.path}`;
      
      // Sammle Informationen über begonnene SQL-Abfragen
      req._sqlQueriesStarted = new Map();
      
      next();
    } catch (error: unknown) {
      monitorLogger.error('Fehler in der SQL-Monitor-Middleware:', 
        error instanceof Error ? error.message : String(error));
      next();
    }
  };
}