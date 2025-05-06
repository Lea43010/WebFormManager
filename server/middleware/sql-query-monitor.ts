/**
 * SQL Query Monitor Middleware
 * 
 * Diese Middleware überwacht und protokolliert SQL-Abfragen in der Anwendung.
 * Sie sammelt Informationen über Abfragezeiten, Parameter und Ergebnisse,
 * um langsame oder ineffiziente Abfragen zu identifizieren.
 */

import { NextFunction, Request, Response } from 'express';
import { logQuery } from '../sql-query-logger';
import { logger } from '../logger';
import config from '../../config';

// Speichere Original-Funktionen für Monkey-Patching
let originalDbExecute: any;
let isPatched = false;

/**
 * Hilfsfunktion zum Ermitteln der IP-Adresse
 */
function getClientIp(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Middleware für das Überwachen und Protokollieren von SQL-Abfragen
 */
export function sqlQueryMonitor() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Füge Request-spezifische Daten zum req-Objekt hinzu
    (req as any).sqlMetrics = {
      route: req.originalUrl,
      clientIp: getClientIp(req),
      userId: req.user?.id,
      startTime: new Date()
    };
    
    next();
  };
}

/**
 * Patcht die Datenbankfunktionen, um Abfragemetriken zu sammeln
 */
export function patchDatabaseFunctions(db: any): void {
  if (isPatched || !config.logging.sqlQueryLogging) {
    return;
  }
  
  try {
    // Speichere die originale execute-Funktion
    originalDbExecute = db.execute;
    
    // Ersetze execute mit einer neuen Funktion, die Metriken sammelt
    db.execute = async function(...args: any[]) {
      const startTime = performance.now();
      let source = 'api';
      let clientIp = 'unknown';
      let userId = null;
      let route = 'unknown';
      
      // Versuche, den Aufrufer zu ermitteln (über Stack-Trace)
      try {
        const stackLines = new Error().stack?.split('\n') || [];
        if (stackLines.length > 2) {
          source = stackLines[2].trim();
          
          // Extrahiere den Dateinamen aus dem Stack-Trace
          const match = source.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
          if (match) {
            source = match[2].split('/').slice(-2).join('/');
          }
        }
      } catch (error) {
        // Ignoriere Fehler beim Ermitteln des Aufrufers
      }
      
      try {
        // Führe die originale Datenbankfunktion aus
        const result = await originalDbExecute.apply(db, args);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        // Ermittle, ob wir diese Abfrage protokollieren sollten
        const shouldLog =
          config.logging.logAllQueries ||
          (duration >= config.logging.queryThresholds?.INFO) ||
          (Math.random() < config.logging.querySamplingRate);
        
        // Wenn Abfrage protokolliert werden soll
        if (shouldLog) {
          let query = args[0];
          let params: any[] = [];
          
          // Extrahiere Abfrage und Parameter
          if (typeof query === 'object' && query.strings) {
            // Template-String-Abfrage
            query = query.strings.join('?');
            params = args.slice(1);
          } else if (typeof query === 'string' && args.length > 1) {
            // Parametrisierte Abfrage
            params = args[1];
          }
          
          // Sammle Request-spezifische Daten, falls verfügbar
          try {
            // Suche im aktuellen Request-Kontext (falls verfügbar)
            const asyncLocalStorage = require('async_hooks').AsyncLocalStorage;
            const store = asyncLocalStorage.getStore();
            
            if (store && store.req) {
              const req = store.req;
              clientIp = getClientIp(req);
              userId = req.user?.id;
              route = req.originalUrl;
            }
          } catch (error) {
            // Ignoriere Fehler, wenn Request-Kontext nicht verfügbar ist
          }
          
          // Protokolliere die Abfrage
          await logQuery({
            query: typeof query === 'string' ? query : query.toString(),
            params,
            duration,
            timestamp: new Date(),
            source,
            rowCount: result.rowCount || result.rows?.length || 0,
            user_id: userId,
            client_ip: clientIp,
            route
          });
        }
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        // Bei Fehlern immer protokollieren
        try {
          await logQuery({
            query: typeof args[0] === 'string' ? args[0] : args[0].toString(),
            params: args.length > 1 ? args[1] : [],
            duration,
            timestamp: new Date(),
            source: `${source} (ERROR)`,
            user_id: userId,
            client_ip: clientIp,
            route
          });
        } catch (logError) {
          logger.error('Fehler beim Protokollieren einer fehlgeschlagenen Abfrage', logError);
        }
        
        throw error;
      }
    };
    
    isPatched = true;
    logger.info('SQL Query-Monitoring aktiviert - Datenbankfunktionen gepatcht');
  } catch (error) {
    logger.error('Fehler beim Patchen der Datenbankfunktionen für SQL-Monitoring', error);
  }
}

/**
 * Stellt die originalen Datenbankfunktionen wieder her
 */
export function unpatchDatabaseFunctions(db: any): void {
  if (!isPatched) {
    return;
  }
  
  try {
    // Stelle die originale execute-Funktion wieder her
    db.execute = originalDbExecute;
    isPatched = false;
    logger.info('SQL Query-Monitoring deaktiviert - Originale Datenbankfunktionen wiederhergestellt');
  } catch (error) {
    logger.error('Fehler beim Wiederherstellen der originalen Datenbankfunktionen', error);
  }
}

export default { sqlQueryMonitor, patchDatabaseFunctions, unpatchDatabaseFunctions };