// Das Token von MapBox für die Kartendarstellung exportieren
// Bei Deployment sollte die Umgebungsvariable VITE_MAPBOX_TOKEN verwendet werden
// Zugriff auf das gespeicherte MAPBOX_ACCESS_TOKEN über die Umgebungsvariablen
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.MAPBOX_ACCESS_TOKEN;