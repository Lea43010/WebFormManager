/**
 * SQL Query Monitor Middleware
 * 
 * Diese Middleware überwacht SQL-Abfragen und protokolliert sie
 * Sie verwendet den SQL-Query-Logger, um Abfragen zu erfassen
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from '@neondatabase/serverless';
import { logQuery, QUERY_THRESHOLDS } from '../sql-query-logger';
import { logger } from '../logger';
import config from '../../config';

// Logger für diese Middleware
const monitorLogger = logger.createLogger('sql-monitor');

// Interface für erweiterte Request mit SQL-Tracking
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
  // Flag, das angibt, ob die Überwachung bereits eingerichtet wurde
  let monitoringSet = false;
  
  // Informationen zum SQL-Query-Monitoring
  monitorLogger.info(`SQL Query Monitoring: ${config.logging.sqlQueryLogging ? 'aktiviert' : 'deaktiviert'}`);
  if (config.logging.sqlQueryLogging) {
    monitorLogger.info(`- Alle Abfragen protokollieren: ${config.logging.logAllQueries ? 'ja' : 'nein'}`);
    monitorLogger.info(`- Langsame Abfragen speichern: ${config.logging.storeSlowQueries ? 'ja' : 'nein'}`);
    monitorLogger.info(`- Sampling-Rate: ${config.logging.querySamplingRate * 100}%`);
  }
  
  // Überschreibe die Methoden des Pools nur einmal
  function setupMonitoring() {
    if (monitoringSet || !config.logging.sqlQueryLogging) return;
    
    // Speichere die ursprüngliche query-Methode
    const originalQuery = pool.query.bind(pool);
    
    // Überschreibe die query-Methode zur Überwachung
    // @ts-ignore - Das ist ein gültiges Überschreiben, aber TypeScript kann es nicht erkennen
    pool.query = function monitoredQuery(text: string, params?: any[], callback?: Function) {
      // Stack-Trace erfassen, um die Quelle der Abfrage zu ermitteln
      const stack = new Error().stack || '';
      const stackLines = stack.split('\n').slice(2); // Entferne die ersten beiden Zeilen (Error und diese Funktion)
      let source = 'unbekannt';
      
      // Versuche, die Quelle aus dem Stack-Trace zu extrahieren
      for (const line of stackLines) {
        const match = line.match(/at\s+(.*?)\s+\(?(.*?)(?::(\d+):(\d+))?\)?$/);
        if (match && match[2] && !match[2].includes('node_modules') && !match[2].includes('internal/')) {
          source = match[2].replace(process.cwd(), '').substring(1);
          break;
        }
      }
      
      // Tracking-Informationen aus der aktuellen Anfrage abrufen (falls vorhanden)
      let req: RequestWithSQLTracking | undefined;
      let res: Response | undefined;
      
      // Domain-API ist veraltet, aber immer noch nützlich
      // @ts-ignore
      const asyncHooks = process.domain?._events;
      if (asyncHooks) {
        for (const key in asyncHooks) {
          const handler = asyncHooks[key];
          if (typeof handler === 'function' && handler.name === 'bound dispatch') {
            // @ts-ignore - Wir wissen, dass handler.req existiert
            req = handler.req;
            // @ts-ignore - Wir wissen, dass handler.res existiert
            res = handler.res;
            break;
          }
        }
      }
      
      // Sollten wir diese Abfrage überwachen? (basierend auf Sampling-Rate)
      const shouldMonitor = Math.random() < config.logging.querySamplingRate;
      
      // Wenn wir nicht überwachen oder keine Abfrageparameter haben, führe die ursprüngliche Methode aus
      if (!shouldMonitor || !text) {
        return originalQuery(text, params, callback);
      }
      
      // Initialisiere die Tracking-Map für diese Anfrage
      if (req && !req._sqlQueriesStarted) {
        req._sqlQueriesStarted = new Map();
      }
      
      // Speichere Informationen zur Startzeit und zur Abfrage
      const startTime = Date.now();
      const queryInfo = { 
        query: typeof text === 'string' ? text : text.text || 'unbekannt', 
        params: params || [], 
        startTime, 
        source 
      };
      
      // Generiere einen eindeutigen Schlüssel für diese Abfrage
      const queryKey = {};
      
      // Bei einer überwachten Anfrage, füge die Abfrage zum Tracking hinzu
      if (req?._sqlQueriesStarted) {
        req._sqlQueriesStarted.set(queryKey, queryInfo);
      }
      
      // Hilfs-Callback zur Erfassung von Abfragemetriken
      const captureQueryMetrics = (error: Error | null, result: any) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Abfragemetriken erstellen
        const metrics = {
          query: queryInfo.query,
          params: queryInfo.params,
          duration,
          timestamp: new Date(),
          source: queryInfo.source,
          rowCount: result?.rowCount,
          user_id: req?.user?.id,
          client_ip: req?.ip || req?.headers['x-forwarded-for'] as string || null,
          route: req?._sqlRouteIdentifier || req?.originalUrl
        };
        
        // Protokolliere die Metriken (hier werden die Schwellenwerte angewendet)
        try {
          logQuery(metrics);
        } catch (loggingError) {
          monitorLogger.error(`Fehler beim Protokollieren der Abfragemetriken: ${loggingError}`);
        }
        
        // Entferne die Abfrage aus dem Tracking
        if (req?._sqlQueriesStarted) {
          req._sqlQueriesStarted.delete(queryKey);
        }
        
        // Rufe den ursprünglichen Callback auf (falls vorhanden)
        if (callback && typeof callback === 'function') {
          callback(error, result);
        }
      };
      
      // Handle Callback-Stil
      if (callback && typeof callback === 'function') {
        return originalQuery(text, params, (error: Error | null, result: any) => {
          captureQueryMetrics(error, result);
        });
      }
      
      // Handle Promise-Stil
      try {
        const queryPromise = originalQuery(text, params);
        return queryPromise.then((result: any) => {
          captureQueryMetrics(null, result);
          return result;
        }).catch((error: Error) => {
          captureQueryMetrics(error, null);
          throw error;
        });
      } catch (error) {
        captureQueryMetrics(error as Error, null);
        throw error;
      }
    };
    
    monitoringSet = true;
    monitorLogger.info('SQL Query Monitoring wurde erfolgreich eingerichtet');
  }
  
  // Express-Middleware zurückgeben
  return (req: RequestWithSQLTracking, res: Response, next: NextFunction) => {
    // Richte die Überwachung ein, falls noch nicht geschehen
    setupMonitoring();
    
    // Speichere den Routennamen für eine bessere Identifizierung in Logs
    // Verwende das Format "METHOD /path/to/route"
    req._sqlRouteIdentifier = `${req.method} ${req.route?.path || req.path}`;
    
    // Wenn die Anfrage beendet ist, protokolliere alle noch laufenden Abfragen
    res.on('finish', () => {
      if (req._sqlQueriesStarted && req._sqlQueriesStarted.size > 0) {
        monitorLogger.warn(`${req._sqlQueriesStarted.size} SQL-Abfragen wurden nicht abgeschlossen, bevor die Antwort gesendet wurde`);
        
        // Protokolliere jede nicht abgeschlossene Abfrage
        req._sqlQueriesStarted.forEach((queryInfo) => {
          const duration = Date.now() - queryInfo.startTime;
          monitorLogger.warn(`Nicht abgeschlossene Abfrage (${duration}ms): ${queryInfo.query}`);
        });
      }
    });
    
    next();
  };
}