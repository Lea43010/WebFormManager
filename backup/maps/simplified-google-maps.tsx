import React, { useState } from "react";
import BasicMap from "./basic-map";

// Minimalisierte Typdefinition
export interface SimpleMarkerInfo {
  position: [number, number]; 
  title?: string;
}

interface SimpleGoogleMapsProps {
  markers: SimpleMarkerInfo[];
  apiKey: string;
  center?: { lat: number, lng: number };
  zoom?: number;
}

// Vereinfachte Google Maps-Komponente für Fehlerbehebung
export default function SimpleGoogleMapsComponent({
  markers = [],
  apiKey,
  center = { lat: 48.137154, lng: 11.576124 }, // München
  zoom = 13
}: SimpleGoogleMapsProps) {
  // Format der Marker konvertieren
  const formattedMarkers = markers.map(marker => ({
    lat: marker.position[0],
    lng: marker.position[1],
    title: marker.title
  }));
  
  return (
    <div style={{ height: "400px", width: "100%" }}>
      <BasicMap
        apiKey={apiKey}
        markers={formattedMarkers}
        center={center}
        zoom={zoom}
        height="100%"
      />
    </div>
  );
}