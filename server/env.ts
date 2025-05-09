/**
 * Zentrale Verwaltung von Umgebungsvariablen
 * Liest Werte aus process.env und stellt Standardwerte zur Verfügung
 */

// Cache-Einstellungen
export const env = {
  // Allgemeine Cache-Einstellungen
  CACHE_ENABLED: process.env.CACHE_ENABLED || 'true',
  CACHE_DEBUG: process.env.CACHE_DEBUG || 'false',
  CACHE_MAX_SIZE: process.env.CACHE_MAX_SIZE || '100',
  CACHE_TTL: process.env.CACHE_TTL || (60 * 60 * 1000).toString(), // 1 Stunde
  CACHE_PRUNE_INTERVAL: process.env.CACHE_PRUNE_INTERVAL || (5 * 60 * 1000).toString(), // 5 Minuten
  
  // Entity-spezifische Cache-Größen
  USER_CACHE_MAX_SIZE: process.env.USER_CACHE_MAX_SIZE || '50',
  PROJECT_CACHE_MAX_SIZE: process.env.PROJECT_CACHE_MAX_SIZE || '50',
  ROUTE_CACHE_MAX_SIZE: process.env.ROUTE_CACHE_MAX_SIZE || '20',
  SOIL_TYPE_CACHE_MAX_SIZE: process.env.SOIL_TYPE_CACHE_MAX_SIZE || '30',
  MACHINE_CACHE_MAX_SIZE: process.env.MACHINE_CACHE_MAX_SIZE || '50',
  COMPANY_CACHE_MAX_SIZE: process.env.COMPANY_CACHE_MAX_SIZE || '30',
  
  // SQL Logging
  SQL_LOGGING_ENABLED: process.env.SQL_LOGGING_ENABLED || 'true',
  SQL_LOGGING_RETENTION_DAYS: process.env.SQL_LOGGING_RETENTION_DAYS || '30',
  
  // Andere Einstellungen
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3000',
  DEBUG: process.env.DEBUG || 'false',
};

export default env;