import { Express, Request, Response } from "express";
import { db, sql } from "./db";
import * as os from "os";

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
  };
  systemInfo: SystemInfo;
  version: string;
}

/**
 * Überprüft die Datenbank-Konnektivität
 * 
 * @returns Object mit Status und ggf. Fehlermeldung
 */
async function checkDatabaseConnection(): Promise<{ connected: boolean; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  try {
    // Einfache Abfrage, um die Datenbankverbindung zu testen
    // Verwende direkt die sql-Verbindung statt der Drizzle-ORM-Instanz
    await sql`SELECT 1 AS health_check`;
    return {
      connected: true,
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    console.error("Fehler bei der Datenbankverbindung:", error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unbekannter Datenbankfehler"
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
  // Öffentlicher Health-Check-Endpunkt
  app.get("/health", async (req: Request, res: Response) => {
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
      version: process.env.npm_package_version || "1.0.0"
    };
    
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
  
  // Einfache Ping-Route für grundlegende Verfügbarkeitsprüfungen
  app.get("/ping", (req: Request, res: Response) => {
    res.status(200).send("pong");
  });
}