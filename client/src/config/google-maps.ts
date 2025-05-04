// Das Token von Google Maps für die Kartendarstellung exportieren
// Wir verwenden die Umgebungsvariable GOOGLE_MAPS_API_KEY oder GOOGLE_API_KEY
export const GOOGLE_MAPS_API_KEY = import.meta.env.GOOGLE_MAPS_API_KEY || import.meta.env.GOOGLE_API_KEY || '';
// Debug-Log für API-Key (ohne den Key selbst zu zeigen)
console.log("Google Maps API Key konfiguriert:", GOOGLE_MAPS_API_KEY ? "Ja" : "Nein");

// Google Maps Bibliotheken
export const GOOGLE_MAPS_LIBRARIES = ["places", "geometry"];

// Standardoptionen für die Google Maps Karte
export const DEFAULT_MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  mapTypeControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ]
};

// Standardoptionen für Marker
export const DEFAULT_MARKER_OPTIONS = {
  draggable: true,
};

// Standardposition (Nürnberg)
export const DEFAULT_CENTER = {
  lat: 49.44,
  lng: 11.07
};