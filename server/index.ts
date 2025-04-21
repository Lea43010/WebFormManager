import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler, notFoundHandler } from "./error-handler";
import { setupHealthRoutes } from "./health";
import { setupApiDocs } from "./api-docs";
import config from "../config";
import { logger } from "./logger";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Health-Check-Endpunkte vor der Hauptroutenkonfiguration einrichten
  setupHealthRoutes(app);
  
  // API-Dokumentation einrichten (nur in Entwicklungsumgebung)
  setupApiDocs(app);
  
  // Alle API-Routen registrieren
  const server = await registerRoutes(app);
  
  // Nicht gefundene Routen abfangen (nach allen definierten Routen)
  app.use(notFoundHandler);
  
  // Zentrale Fehlerbehandlung mit Umgebungsunterscheidung
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use a different port if 5000 is in use
  // this serves both the API and the client.
  const ports = [5000, 5001, 5002, 5003, 5004, 5005];
  let currentPortIndex = 0;
  let serverStarted = false;

  const tryPort = () => {
    if (currentPortIndex >= ports.length) {
      log(`Failed to start server: all ports (${ports.join(', ')}) are in use`);
      return;
    }
    
    const port = ports[currentPortIndex];
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    })
    .on('listening', () => {
      serverStarted = true;
      
      // Umgebungsspezifische Startmeldung
      const environment = config.isDevelopment ? ' (Entwicklungsumgebung)' : ' (Produktionsumgebung)';
      logger.info(`Server gestartet auf Port ${port}${environment}`);
      log(`serving on port ${port}`);
    })
    .on('error', (err: any) => {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'EADDRINUSE') {
        log(`Port ${port} is in use, trying next port...`);
        currentPortIndex++;
        tryPort();
      } else {
        log(`Error starting server: ${err.message}`);
      }
    });
  };

  tryPort();
})();
