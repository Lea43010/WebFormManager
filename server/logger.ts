/**
 * Logger-Modul
 * 
 * Stellt einen zentralen Logger bereit, der je nach Umgebung unterschiedlich konfiguriert ist.
 * In Produktionsumgebungen werden nur wichtige Informationen geloggt,
 * in Entwicklungsumgebungen werden alle Details angezeigt.
 */

import config from '../config';

// Log-Level-Typen
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Farben für die verschiedenen Log-Level (nur in Entwicklungsumgebung)
const colors = {
  debug: '\x1b[34m', // Blau
  info: '\x1b[32m',  // Grün
  warn: '\x1b[33m',  // Gelb
  error: '\x1b[31m', // Rot
  reset: '\x1b[0m',  // Reset
};

// Log-Level-Prioritäten (höhere Zahl = wichtiger)
const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Konfigurierter Log-Level aus der Konfiguration
const configuredLevel = (config.logging.level as LogLevel) || 'info';

/**
 * Hauptlogger-Klasse
 */
class Logger {
  private context: string;
  
  constructor(context: string = 'app') {
    this.context = context;
  }
  
  /**
   * Überprüft, ob ein bestimmtes Log-Level basierend auf der Konfiguration angezeigt werden soll
   */
  private shouldLog(level: LogLevel): boolean {
    return levelPriority[level] >= levelPriority[configuredLevel];
  }
  
  /**
   * Erzeugt eine formatierte Lognachricht
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;
    
    // In Entwicklung: farbige Logs für bessere Lesbarkeit
    if (config.isDevelopment) {
      return `${colors[level]}${prefix} ${message}${colors.reset}`;
    }
    
    // In Produktion: einfaches Format ohne Farben
    return `${prefix} ${message}`;
  }
  
  /**
   * Log-Methoden für verschiedene Log-Level
   */
  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog('debug')) return;
    const formattedMsg = this.formatMessage('debug', message);
    console.log(formattedMsg, ...args);
  }
  
  info(message: string, ...args: any[]): void {
    if (!this.shouldLog('info')) return;
    const formattedMsg = this.formatMessage('info', message);
    console.info(formattedMsg, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog('warn')) return;
    const formattedMsg = this.formatMessage('warn', message);
    console.warn(formattedMsg, ...args);
  }
  
  error(message: string | Error, ...args: any[]): void {
    if (!this.shouldLog('error')) return;
    
    let errorMessage: string;
    let stack: string | undefined;
    
    if (message instanceof Error) {
      errorMessage = message.message;
      stack = message.stack;
    } else {
      errorMessage = message;
    }
    
    const formattedMsg = this.formatMessage('error', errorMessage);
    console.error(formattedMsg, ...args);
    
    // Wenn verfügbar, auch den Stack-Trace ausgeben, aber nur in Entwicklung ausführlich
    if (stack && config.isDevelopment) {
      console.error(stack);
    }
  }
  
  /**
   * Erzeugt einen neuen Logger mit spezifischem Kontext
   */
  createLogger(context: string): Logger {
    return new Logger(context);
  }
}

// Exportiere eine Singleton-Instanz des Loggers
export const logger = new Logger();

// Aliase für verschiedene Kontexte, um die Verwendung zu erleichtern
export const dbLogger = logger.createLogger('db');
export const authLogger = logger.createLogger('auth');
export const apiLogger = logger.createLogger('api');
export const healthLogger = logger.createLogger('health');

// Standardexport für einfachen Import
export default logger;