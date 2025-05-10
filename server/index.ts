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

// Sofortige Server-Start-Funktion
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

  // Vereinfachte Port-Konfiguration - nur ein Port für die Einfachheit
  // Port 5000 für Replit (wird vom Replit Workflow System erwartet)
  const PORT = 5000;
  let serverStarted = false;

  // Server starten
  server.listen(PORT, "0.0.0.0")
    .on('listening', () => {
      serverStarted = true;
      
      // Umgebungsspezifische Startmeldung
      const environment = config.isDevelopment ? ' (Entwicklungsumgebung)' : ' (Produktionsumgebung)';
      logger.info(`Server gestartet auf Port ${PORT}${environment}`);
      log(`serving on port ${PORT}`);
      
      // Verzögerte Initialisierungen - auf ein Minimum reduziert
      
      // Cron-Jobs für Testphasen-Ablauf-Benachrichtigungen initialisieren
      // Als verzögerte Operation, um den anfänglichen Serverstart zu beschleunigen
      setTimeout(() => {
        try {
          cronJobManager.initialize().then(() => {
            logger.info('Cron-Jobs erfolgreich initialisiert');
          });
        } catch (error) {
          logger.error('Fehler beim Initialisieren der Cron-Jobs:', error);
        }
      }, 5000); // 5 Sekunden Verzögerung
      
      // Benutzer-Cache beim Start vorwärmen für bessere Performance - vorübergehend deaktiviert
      logger.info('Benutzer-Cache-Vorwärmung übersprungen (deaktiviert für Fehlerbehebung)');
    })
    .on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} ist bereits in Verwendung. Server kann nicht gestartet werden.`);
        console.error(`[express] KRITISCHER FEHLER: Port ${PORT} ist bereits in Verwendung! Server kann nicht gestartet werden.`);
        
        // Bei Portkonflikt versuchen wir Port 3000
        const FALLBACK_PORT = 3000;
        console.log(`[express] Versuche alternativen Port ${FALLBACK_PORT}...`);
        
        server.listen(FALLBACK_PORT, "0.0.0.0")
          .on('listening', () => {
            serverStarted = true;
            logger.info(`Server gestartet auf Fallback-Port ${FALLBACK_PORT}${config.isDevelopment ? ' (Entwicklungsumgebung)' : ' (Produktionsumgebung)'}`);
            log(`serving on fallback port ${FALLBACK_PORT}`);
            
            // Verzögerte Initialisierungen auf Fallback-Port
            setTimeout(() => {
              try {
                cronJobManager.initialize().then(() => {
                  logger.info('Cron-Jobs erfolgreich initialisiert');
                });
              } catch (error) {
                logger.error('Fehler beim Initialisieren der Cron-Jobs:', error);
              }
            }, 5000);
            
            logger.info('Benutzer-Cache-Vorwärmung übersprungen (deaktiviert für Fehlerbehebung)');
          })
          .on('error', (fallbackErr: any) => {
            // Auch der Fallback-Port ist nicht verfügbar
            logger.error(`Auch Fallback-Port ${FALLBACK_PORT} ist nicht verfügbar. Server kann nicht gestartet werden.`);
            console.error(`[express] KRITISCHER FEHLER: Auch Fallback-Port ${FALLBACK_PORT} ist nicht verfügbar! Server kann nicht gestartet werden.`);
            process.exit(1);
          });
      } else {
        // Anderer Fehler beim Starten des Servers
        logger.error('Fehler beim Starten des Servers:', err);
        process.exit(1); // Beende den Prozess mit Fehlercode
      }
    });
})();