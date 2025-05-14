import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler, notFoundHandler } from "./error-handler";
import { setupHealthRoutes } from "./health";
import { setupApiDocs } from "./api-docs";
import { setupApiTests } from "./api-test";
import { setupBackupRoutes, initBackupSystem } from "./backup";
import { cronJobManager } from "./cron-jobs";
import { createSQLQueryMonitor } from "./middleware/sql-query-monitor";
import { initQueryLogging } from "./sql-query-logger"; 
import { pool } from "./db";
import config from "../config";
import { logger } from "./logger";
import { userCache } from "./user-cache";
import { storage } from "./storage";

// Hauptfunktion zum Starten des Servers
(async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // SQL Query Monitor einrichten, wenn aktiviert
  if (config.logging.sqlQueryLogging) {
    app.use(createSQLQueryMonitor(pool));
    // Datenbankstruktur für Query-Logs erstellen
    initQueryLogging().catch(err => {
      logger.error("Fehler beim Initialisieren des SQL-Query-Loggings:", err);
    });
  }

  // API-Dokumentation (Swagger) einrichten, wenn aktiviert
  if (config.isDevelopment) {
    setupApiDocs(app);
  }

  // Health-Check-Endpunkte einrichten
  setupHealthRoutes(app);

  // Debugging/Test-Endpunkte im Entwicklungsmodus aktivieren
  if (config.isDevelopment) {
    setupApiTests(app);
  }

  // Backup-Routen aktivieren
  setupBackupRoutes(app);

  // Registriere alle Routen
  const server = await registerRoutes(app);

  // Fehlerbehandlung
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Statische Dateien bereitstellen (Vite-Dev-Server im Entwicklungsmodus)
  if (config.isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Für Replit Autoscale, PORT Umgebungsvariable mit Fallback für lokale Entwicklung
  const PORT = process.env.PORT || 5000;

  // Funktionen für den Serverstart
  function initializeDelayedTasks() {
    try {
      cronJobManager.initialize().then(() => {
        logger.info('Cron-Jobs erfolgreich initialisiert');
      });
    } catch (error) {
      logger.error('Fehler beim Initialisieren der Cron-Jobs:', error);
    }
  }

  // Server starten - WICHTIG: Keinen spezifischen Host binden, nur PORT verwenden
  server.listen(PORT)
    .on('listening', () => {
      const environment = config.isDevelopment ? ' (Entwicklungsumgebung)' : ' (Produktionsumgebung)';
      logger.info(`Server gestartet auf Port ${PORT}${environment}`);
      log(`serving on port ${PORT}`);
      
      // Verzögerte Initialisierungen
      setTimeout(initializeDelayedTasks, 5000);
    })
    .on('error', (err: any) => {
      logger.error('Fehler beim Starten des Servers:', err);
      process.exit(1);
    });
})();