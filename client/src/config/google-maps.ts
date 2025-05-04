// Das Token von Google Maps für die Kartendarstellung exportieren
// Bei Deployment sollte die Umgebungsvariable GOOGLE_MAPS_API_KEY verwendet werden
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.GOOGLE_MAPS_API_KEY || '';

// Google Maps Bibliotheken
export const GOOGLE_MAPS_LIBRARIES: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places", "geometry"];

// Standardoptionen für die Google Maps Karte
export const DEFAULT_MAP_OPTIONS: google.maps.MapOptions = {
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
export const DEFAULT_MARKER_OPTIONS: google.maps.MarkerOptions = {
  animation: google.maps.Animation.DROP,
  draggable: true,
};

// Standardposition (Nürnberg)
export const DEFAULT_CENTER: google.maps.LatLngLiteral = {
  lat: 49.44,
  lng: 11.07
};