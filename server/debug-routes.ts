import express, { Router, NextFunction, Request, Response } from 'express';
import { logger } from './logger';
import { fixDatabaseStructureIssues } from './db-structure-fix';

const debugRouter = Router();

// Middleware zum Prüfen, ob der Benutzer ein Administrator ist
const isAdministrator = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user || req.user.role !== 'administrator') {
    logger.warn(`Unbefugter Zugriff auf Debug-Route von ${req.ip}`);
    return res.status(403).json({ message: 'Zugriff verweigert. Nur Administratoren haben Zugriff auf Debug-Funktionen.' });
  }
  next();
};

// Debug-Endpunkt zur Datenbankstrukturreparatur (mit Administratorprüfung)
debugRouter.post('/db-structure/fix', isAdministrator, async (req, res, next) => {
  try {
    logger.info(`API-Aufruf zum Beheben der Datenbankstrukturprobleme von Admin-Benutzer ${req.user?.username || 'unbekannt'}`);
    
    // Führe die Funktion aus
    const result = await fixDatabaseStructureIssues();
    
    // Rückgabe der Ergebnisse
    res.json(result);
  } catch (error) {
    logger.error("Fehler bei der Behebung der Datenbankstrukturprobleme:", error);
    next(error);
  }
});

// Einfacher Test-Endpunkt (mit Administratorprüfung)
debugRouter.get('/ping', isAdministrator, (req, res) => {
  res.json({ 
    message: 'Debug-Router ist aktiv',
    user: req.user?.username,
    timestamp: new Date().toISOString()
  });
});

export function setupDebugRoutes(app: express.Express) {
  app.use('/api/debug', debugRouter);
  logger.info("[DEBUG] Debug-API-Endpunkte aktiviert");
}