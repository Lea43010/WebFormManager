/**
 * Google Maps Konfiguration
 */

// Google Maps API-Schlüssel
export const GOOGLE_MAPS_API_KEY = "AIzaSyCzmiIk0Xi0bKKPaqg0I53rULhQzmA5-cg";

// Standard-Zentrum (München)
export const DEFAULT_CENTER = { lat: 48.137154, lng: 11.576124 };

// Standard-Kartenoptionen
export const DEFAULT_MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
};

// Belastungsklassen-Farbcodierung
export const BELASTUNGSKLASSEN_COLORS = {
  Bk100: "#e74c3c", // Rot - höchste Belastung
  Bk32: "#e67e22",  // Orange
  Bk10: "#f39c12",  // Helleres Orange
  Bk3: "#f1c40f",   // Gelb
  Bk1: "#2ecc71",   // Grün
  Bk0_3: "#3498db", // Blau - niedrigste Belastung
  none: "#95a5a6"   // Grau - keine Belastungsklasse
};