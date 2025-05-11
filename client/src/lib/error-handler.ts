/**
 * Zentraler Error-Handler für die gesamte Anwendung
 * 
 * Dieses Modul bietet zentrale Funktionen zum Fehlerlogging, zur Fehleranalyse
 * und zur konsistenten Fehlerbehandlung in der gesamten Anwendung.
 */

// Definiert die Struktur für Fehlerdaten
export interface ErrorData {
  message: string;
  code?: number | string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: Date;
  errorId: string;
}

// Fehlerursachen gruppieren
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorHistory: ErrorData[] = [];
  private maxHistoryLength = 10;
  private errorCallback?: (error: ErrorData) => void;

  private constructor() {
    // Singleton-Instanz
  }

  // Singleton-Zugriff
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Generiert eine eindeutige Fehler-ID
  private generateErrorId(): string {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  }

  // Kategorisiert Fehler basierend auf Fehlertyp oder Statuscode
  public categorizeError(error: any): ErrorCategory {
    // Netzwerkfehler
    if (error instanceof TypeError && error.message.includes('network')) {
      return ErrorCategory.NETWORK;
    }

    // HTTP-Statuscode basierte Fehler
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      
      if (status === 401) return ErrorCategory.AUTHENTICATION;
      if (status === 403) return ErrorCategory.AUTHORIZATION;
      if (status >= 400 && status < 500) return ErrorCategory.CLIENT;
      if (status >= 500) return ErrorCategory.SERVER;
    }

    // Validierungsfehler
    if (error.name === 'ValidationError' || 
        (error.errors && Array.isArray(error.errors)) ||
        error.message?.includes('validation')) {
      return ErrorCategory.VALIDATION;
    }

    return ErrorCategory.UNKNOWN;
  }

  // Hauptmethode zum Erfassen und Verarbeiten von Fehlern
  public captureError(
    error: any, 
    context: Record<string, any> = {}
  ): ErrorData {
    const errorId = this.generateErrorId();
    const timestamp = new Date();
    
    const errorData: ErrorData = {
      message: error.message || 'Ein unbekannter Fehler ist aufgetreten',
      code: error.status || error.statusCode || error.code,
      stack: error.stack,
      context: {
        ...context,
        category: this.categorizeError(error),
        originalError: process.env.NODE_ENV === 'development' ? error : undefined
      },
      timestamp,
      errorId
    };

    // Fehlerhistorie aktualisieren
    this.errorHistory.unshift(errorData);
    
    // Historie auf maximale Länge beschränken
    if (this.errorHistory.length > this.maxHistoryLength) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistoryLength);
    }

    // Fehler immer in der Konsole protokollieren
    console.error(
      `[ERROR ${errorData.errorId}]`, 
      errorData.message, 
      errorData.context
    );

    // Callback aufrufen, falls vorhanden
    if (this.errorCallback) {
      this.errorCallback(errorData);
    }

    return errorData;
  }

  // API-Fehler verarbeiten
  public handleApiError(error: any): ErrorData {
    let errorMessage = 'Bei der Verbindung zum Server ist ein Fehler aufgetreten.';
    let statusCode: number | undefined;

    try {
      // Response-Fehler extrahieren
      if (error.response) {
        statusCode = error.response.status;
        
        // Versuch, Fehlermeldung aus der Antwort zu extrahieren
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = typeof error.response.data.error === 'string' 
              ? error.response.data.error 
              : error.response.data.error.message || errorMessage;
          }
        }

        // Statuscode-basierte Standardnachrichten
        if (statusCode === 401) {
          errorMessage = 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.';
        } else if (statusCode === 403) {
          errorMessage = 'Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.';
        } else if (statusCode === 404) {
          errorMessage = 'Die angeforderte Ressource wurde nicht gefunden.';
        } else if (statusCode >= 500) {
          errorMessage = 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
        }
      } else if (error.request) {
        // Anfrage gesendet, aber keine Antwort erhalten
        errorMessage = 'Der Server hat nicht geantwortet. Bitte überprüfen Sie Ihre Internetverbindung.';
      }
    } catch (e) {
      console.error('Fehler beim Extrahieren der API-Fehlermeldung:', e);
    }

    // Fehler mit Kontext erfassen
    return this.captureError(
      { 
        message: errorMessage, 
        statusCode,
        originalError: error 
      },
      { source: 'api' }
    );
  }

  // Die letzten erfassten Fehler abrufen
  public getErrorHistory(): ErrorData[] {
    return [...this.errorHistory];
  }

  // Callback registrieren, der bei neuen Fehlern aufgerufen wird
  public setErrorCallback(callback: (error: ErrorData) => void): void {
    this.errorCallback = callback;
  }

  // Fehlerhistorie löschen
  public clearErrorHistory(): void {
    this.errorHistory = [];
  }
}

// Export der Singleton-Instanz
export const errorHandler = ErrorHandler.getInstance();

// Hilfreiche Funktionen für allgemeine Fehlerfälle
export function handleGenericError(error: any, context?: Record<string, any>): ErrorData {
  return errorHandler.captureError(error, context);
}

export function handleNetworkError(error: any, endpoint?: string): ErrorData {
  return errorHandler.captureError(error, { 
    source: 'network',
    endpoint 
  });
}

export function handleFormError(error: any, formId?: string): ErrorData {
  return errorHandler.captureError(error, { 
    source: 'form',
    formId 
  });
}

// Export eines vereinfachten Error-Logging
export function logError(message: string, context?: Record<string, any>): ErrorData {
  return errorHandler.captureError(new Error(message), context);
}