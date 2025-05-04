import React, { useState } from "react";
import BasicMap from "./basic-map";
import { GOOGLE_MAPS_API_KEY, DEFAULT_CENTER } from "@/config/google-maps";

// Typdefinitionen für Marker
export interface MarkerInfo {
  position: [number, number]; // Position als [latitude, longitude]
  belastungsklasse?: string;  // Z.B. "Bk100", "Bk32", etc.
  name?: string;              // Optionaler Name für den Marker
  strasse?: string;           // Straßenname
  hausnummer?: string;        // Hausnummer
  plz?: string;               // Postleitzahl
  ort?: string;               // Ort
  notes?: string;             // Optionale Notizen zum Standort
  
  // Oberflächenanalyse-Daten
  surfaceAnalysis?: {
    imageUrl?: string;         // URL des aufgenommenen/hochgeladenen Bildes
    belastungsklasse?: string; // Analysierte Belastungsklasse
    asphalttyp?: string;       // Analysierter Asphalttyp
    confidence?: number;       // Konfidenz der Analyse (0-100)
    analyseDetails?: string;   // Detaillierte Analyseergebnisse
    visualizationUrl?: string; // URL der generierten RStO-Visualisierung
    timestamp?: number;        // Zeitstempel der Analyse
  };
  
  // Bodenanalyse-Daten
  groundAnalysis?: {
    imageUrl?: string;                  // URL des aufgenommenen/hochgeladenen Bildes
    belastungsklasse?: string;          // Empfohlene Belastungsklasse
    bodenklasse?: string;               // Analysierte Bodenklasse (z.B. Sand, Lehm, Ton)
    bodentragfaehigkeitsklasse?: string; // Bodentragfähigkeitsklasse (F1, F2, F3)
    confidence?: number;                // Konfidenz der Analyse (0-100)
    analyseDetails?: string;            // Detaillierte Analyseergebnisse
    visualizationUrl?: string;          // URL der generierten RStO-Visualisierung
    timestamp?: number;                 // Zeitstempel der Analyse
  };
}

// Farbschema für Belastungsklassen
const belastungsklassenColors = {
  Bk100: "#e74c3c", // Rot - höchste Belastung
  Bk32: "#e67e22",  // Orange
  Bk10: "#f39c12",  // Helleres Orange
  Bk3: "#f1c40f",   // Gelb
  Bk1: "#2ecc71",   // Grün
  Bk0_3: "#3498db", // Blau - niedrigste Belastung
  none: "#95a5a6"   // Grau - keine Belastungsklasse
};

interface GoogleMapsProps {
  markers: MarkerInfo[];
  onMarkerAdd?: (lat: number, lng: number) => void;
  onMarkerClick?: (index: number) => void;
  center?: { lat: number, lng: number };
  zoom?: number;
  height?: string;
  width?: string;
  selectedBelastungsklasse?: string;
}

export default function GoogleMapsComponent({
  markers,
  onMarkerAdd,
  onMarkerClick,
  center = DEFAULT_CENTER,
  zoom = 13,
  height = "100%",
  width = "100%",
  selectedBelastungsklasse = "none"
}: GoogleMapsProps) {
  // Marker für die BasicMap formatieren
  const formattedMarkers = markers.map((marker, index) => ({
    lat: marker.position[0],
    lng: marker.position[1],
    title: marker.name || marker.strasse || `Standort ${index + 1}`
  }));

  return (
    <div className="h-full w-full rounded-md overflow-hidden relative">
      <BasicMap
        apiKey={GOOGLE_MAPS_API_KEY}
        center={center}
        zoom={zoom}
        markers={formattedMarkers}
        height={height}
        width={width}
      />

      {/* Copyright / Attribution */}
      <div className="absolute bottom-0 right-0 bg-white/80 text-xs p-1 z-10">
        <span>© Google Maps</span>
      </div>
    </div>
  );
}