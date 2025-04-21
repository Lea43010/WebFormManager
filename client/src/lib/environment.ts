/**
 * Umgebungskonfiguration für den Client
 * 
 * Stellt Umgebungsvariablen und Konfigurationswerte für die Frontend-Anwendung bereit.
 * Verwendet Vite-Umgebungsvariablen (import.meta.env), die zur Build-Zeit eingebunden werden.
 */

// Umgebungsmodus (development oder production)
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const mode = isDevelopment ? 'development' : 'production';

// Externe API-Konfigurationen
export const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Basis-URL für API-Anfragen (falls nicht relativ)
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

// Websocket-Konfiguration
export const websocketUrl = (() => {
  // Wenn eine explizite WebSocket-URL definiert ist, verwende diese
  if (import.meta.env.VITE_WEBSOCKET_URL) {
    return import.meta.env.VITE_WEBSOCKET_URL;
  }
  
  // Andernfalls konstruiere sie basierend auf dem aktuellen Protokoll und Host
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
})();

// Feature-Flags basierend auf Umgebung
export const features = {
  // Features können für verschiedene Umgebungen ein-/ausgeschaltet werden
  enableAnalytics: isProduction,
  debugMode: isDevelopment,
  showDevTools: isDevelopment,
  
  // Spezifische Funktionen
  enableImageUpload: true,
  enableSpeechToText: true,
  enableMapView: !!mapboxToken, // Nur aktivieren, wenn Token vorhanden
};

// Anwendungsname und Version
export const appName = 'Bau - Structura App';
export const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Timeouts für verschiedene Operationen (in ms)
export const timeouts = {
  apiRequest: isDevelopment ? 30000 : 15000, // Längere Timeouts in Entwicklung
  websocketReconnect: 5000,
  debounceSearch: 300,
  debounceAutoSave: 2000,
};

// Sonstiges
export const maxFileUploadSize = isDevelopment ? 
  50 * 1024 * 1024 : // 50MB in Entwicklung
  15 * 1024 * 1024;  // 15MB in Produktion

// Export als Default für einfachen Import
export default {
  isDevelopment,
  isProduction,
  mode,
  mapboxToken,
  apiBaseUrl,
  websocketUrl,
  features,
  appName,
  appVersion,
  timeouts,
  maxFileUploadSize,
};