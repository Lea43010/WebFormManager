import { Express, Request, Response } from "express";
import { db, sql, drizzleSql, executeWithRetry } from "./db";
import * as os from "os";
import config from "../config";

/**
 * Health-Check-Modul
 * 
 * Stellt einen /health-Endpunkt bereit, der die Erreichbarkeit kritischer 
 * Systemkomponenten überprüft und einen Status zurückgibt.
 */

interface SystemInfo {
  uptime: number;
  responseTime: number;
  memoryUsage: {
    total: number;
    free: number;
    usedPercent: number;
  };
  cpuLoad: number[];
}

interface HealthResponse {
  status: "ok" | "degraded" | "unhealthy";
  timestamp: string;
  databaseStatus: {
    connected: boolean;
    responseTime?: number;
    error?: string;
    reconnectAttempts?: number;
  };
  systemInfo: SystemInfo;
  version: string;
}

/**
 * Überprüft die Datenbank-Konnektivität
 * 
 * @returns Object mit Status und ggf. Fehlermeldung
 */
async function checkDatabaseConnection(): Promise<{ connected: boolean; responseTime?: number; error?: string; reconnectAttempts?: number }> {
  const startTime = Date.now();
  let reconnectAttempts = 0;
  
  try {
    // Einfache Abfrage mit Retry-Logik und kürzerem Timeout für den Health-Check
    await executeWithRetry(
      async () => {
        reconnectAttempts++;
        return await sql`SELECT 1 AS health_check`;
      },
      2, // Maximal 2 Versuche für Health-Check
      2000 // 2 Sekunden Timeout
    );

    return {
      connected: true,
      responseTime: Date.now() - startTime,
      reconnectAttempts: reconnectAttempts > 1 ? reconnectAttempts : undefined
    };
  } catch (error) {
    console.error("Fehler bei der Datenbankverbindung:", error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unbekannter Datenbankfehler",
      reconnectAttempts: reconnectAttempts
    };
  }
}

/**
 * Sammelt Systeminformationen
 * 
 * @returns Informationen über Systemzustand (Speicher, CPU, Uptime)
 */
function getSystemInfo(): SystemInfo {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedPercent = ((totalMem - freeMem) / totalMem) * 100;

  return {
    uptime: os.uptime(),
    responseTime: process.uptime(),
    memoryUsage: {
      total: Math.round(totalMem / (1024 * 1024)),
      free: Math.round(freeMem / (1024 * 1024)),
      usedPercent: Math.round(usedPercent * 100) / 100
    },
    cpuLoad: os.loadavg()
  };
}

/**
 * Registriert den Health-Check-Endpunkt in der Express-App
 * 
 * @param app Express-Anwendungsinstanz
 */
export function setupHealthRoutes(app: Express) {
  // Einfacher In-Memory-Cache für Rate-Limiting
  const rateLimitCache = {
    ipRequests: new Map<string, { count: number; resetTime: number }>(),
    cleanupInterval: setInterval(() => {
      const now = Date.now();
      // Verwende Array.from für die Iteration, um TypeScript-Kompatibilität zu gewährleisten
      Array.from(rateLimitCache.ipRequests.keys()).forEach(ip => {
        const data = rateLimitCache.ipRequests.get(ip);
        if (data && data.resetTime <= now) {
          rateLimitCache.ipRequests.delete(ip);
        }
      });
    }, 60000) // Cleanup jede Minute
  };

  // Rate-Limiting-Middleware
  const rateLimit = (maxRequests: number, windowMs: number) => {
    return (req: Request, res: Response, next: () => void) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      
      // Initialisiere oder hole den Cache-Eintrag für diese IP
      let ipData = rateLimitCache.ipRequests.get(ip);
      if (!ipData || ipData.resetTime <= now) {
        ipData = { count: 0, resetTime: now + windowMs };
        rateLimitCache.ipRequests.set(ip, ipData);
      }
      
      // Prüfe, ob das Limit überschritten wurde
      if (ipData.count >= maxRequests) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
          retryAfter: Math.ceil((ipData.resetTime - now) / 1000)
        });
      }
      
      // Erhöhe den Zähler
      ipData.count++;
      
      // Setze Rate-Limit-Header
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - ipData.count).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(ipData.resetTime / 1000).toString());
      
      next();
    };
  };

  // Öffentlicher Health-Check-Endpunkt mit umgebungsabhängigem Rate-Limiting
  const healthEndpointLimit = config.security.rateLimits.healthCheck || 30;
  app.get("/health", rateLimit(healthEndpointLimit, 60 * 1000), async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    // Überprüfe die Datenbankverbindung
    const databaseStatus = await checkDatabaseConnection();
    
    // Sammle Systeminformationen
    const systemInfo = getSystemInfo();
    
    // Bestimme den Gesamtstatus der Anwendung
    let status: "ok" | "degraded" | "unhealthy" = "ok";
    
    if (!databaseStatus.connected) {
      status = "unhealthy";
    } else if (systemInfo.memoryUsage.usedPercent > 85) {
      // Degradierter Status bei hoher Speicherauslastung
      status = "degraded";
    }
    
    // Erstelle die Antwort
    const healthResponse: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      databaseStatus,
      systemInfo,
      version: process.env.npm_package_version || "1.0.0",
    };
    
    // In Entwicklungsumgebung oder wenn DEBUG=true, füge mehr Debugging-Informationen hinzu
    if (config.isDevelopment) {
      Object.assign(healthResponse, {
        environment: config.env,
        debugInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          isDevelopment: config.isDevelopment,
          pid: process.pid
        }
      });
    }
    
    // Setze den HTTP-Statuscode basierend auf dem Gesundheitszustand
    const httpStatus = status === "ok" ? 200 : status === "degraded" ? 200 : 503;
    
    // Füge die Antwortzeit für den Health-Check selbst hinzu
    healthResponse.systemInfo.responseTime = (Date.now() - startTime) / 1000;
    
    // Setze Cache-Control-Header, um Caching zu verhindern
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    // Sende die Antwort
    res.status(httpStatus).json(healthResponse);
  });
  
  // Einfache Ping-Route für grundlegende Verfügbarkeitsprüfungen mit höherem Rate-Limit
  app.get("/ping", rateLimit(60, 60 * 1000), (req: Request, res: Response) => {
    const environment = config.isDevelopment ? ' (Dev)' : '';
    res.status(200).send(`pong${environment}`);
  });
}