/**
 * Zentrale Fehlerbehandlung für die Anwendung
 * 
 * Bietet eine einheitliche Fehlerbehandlung für alle API-Routen.
 * Die Detailliertheit der Fehlerinformationen hängt von der Umgebung ab.
 */

import { Request, Response, NextFunction } from 'express';
import config from '../config';
import { logger } from './logger';

// Verwende spezifischen Logger für Fehler
const errorLogger = logger.createLogger('error');

/**
 * Benutzerdefinierte Fehlerklasse für API-Fehler
 */
export class ApiError extends Error {
  statusCode: number;
  details?: Record<string, any>;
  
  constructor(message: string, statusCode: number = 500, details?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Fehlerbehandlungs-Middleware für Express
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Standardwerte
  let statusCode = 500;
  let errorMessage = 'Ein interner Serverfehler ist aufgetreten';
  let errorDetails: Record<string, any> | undefined = undefined;
  
  // Bei bekannten API-Fehlern die bereitgestellten Informationen verwenden
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    errorDetails = err.details;
  }
  
  // Alle Fehler loggen, aber mit unterschiedlichem Detail-Level je nach Schwere
  if (statusCode >= 500) {
    errorLogger.error(err);
  } else {
    errorLogger.warn(`${statusCode} - ${errorMessage}`);
  }
  
  // Antwort formatieren
  const errorResponse: Record<string, any> = {
    error: {
      message: errorMessage,
      statusCode
    }
  };
  
  // In Entwicklungsumgebung mehr Details hinzufügen
  if (config.isDevelopment) {
    // Stack-Trace nur in Entwicklung senden
    errorResponse.error.stack = err.stack;
    
    // Wenn verfügbar, Details hinzufügen
    if (errorDetails) {
      errorResponse.error.details = errorDetails;
    }
    
    // Request-Informationen für Debugging
    errorResponse.request = {
      method: req.method,
      path: req.path,
      query: req.query,
      body: config.errorHandling.showRequestBody ? req.body : '[ausgeblendet]',
      headers: config.errorHandling.showRequestHeaders ? 
        // Sensitive Header ausfiltern
        Object.entries(req.headers)
          .filter(([key]) => !['authorization', 'cookie', 'set-cookie'].includes(key.toLowerCase()))
          .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}) 
        : '[ausgeblendet]'
    };
  }
  
  // Antwort senden
  res.status(statusCode).json(errorResponse);
}

/**
 * Middleware für nicht gefundene Routen
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const apiRoute = req.path.startsWith('/api/');
  
  // Nur API-Routen mit 404 behandeln, andere an den Client weiterleiten
  if (apiRoute) {
    const err = new ApiError(`Route nicht gefunden: ${req.method} ${req.path}`, 404);
    next(err);
  } else {
    // Bei Nicht-API-Routen die React-App ausliefern
    next();
  }
}

/**
 * Utility-Funktionen zum Erzeugen gängiger API-Fehler
 */
export const Errors = {
  badRequest: (message: string, details?: Record<string, any>) => 
    new ApiError(message, 400, details),
    
  unauthorized: (message: string = 'Nicht autorisiert') => 
    new ApiError(message, 401),
    
  forbidden: (message: string = 'Zugriff verweigert') => 
    new ApiError(message, 403),
    
  notFound: (resource: string = 'Ressource') => 
    new ApiError(`${resource} wurde nicht gefunden`, 404),
    
  conflict: (message: string) => 
    new ApiError(message, 409),
    
  validationError: (details: Record<string, any>) => 
    new ApiError('Validierungsfehler', 422, details),
    
  serverError: (message: string = 'Ein interner Serverfehler ist aufgetreten') => 
    new ApiError(message, 500)
};