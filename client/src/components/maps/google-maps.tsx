import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow, Libraries } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES, DEFAULT_MAP_OPTIONS, DEFAULT_CENTER } from "@/config/google-maps";

// Typdefinitionen
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
  onMarkerDragEnd?: (index: number, lat: number, lng: number) => void;
  onMarkerClick?: (index: number) => void;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  height?: string;
  width?: string;
  selectedBelastungsklasse?: string;
}

export default function GoogleMapsComponent({
  markers,
  onMarkerAdd,
  onMarkerDragEnd,
  onMarkerClick,
  center = DEFAULT_CENTER,
  zoom = 13,
  height = "100%",
  width = "100%",
  selectedBelastungsklasse = "none"
}: GoogleMapsProps) {
  console.log("API Key aus env:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBhUVnGEq8JIEsbkwGvlCjM1ZEv2DGVuds",
    libraries: GOOGLE_MAPS_LIBRARIES as Libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [infoWindowData, setInfoWindowData] = useState<{ marker: MarkerInfo, index: number } | null>(null);

  // Callback für wenn die Karte geladen wird
  const onLoad = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
  }, []);

  // Callback für wenn die Karte entladen wird
  const onUnmount = useCallback(function callback() {
    mapRef.current = null;
  }, []);

  // Handler für Klick auf die Karte
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (onMarkerAdd && e.latLng) {
      onMarkerAdd(e.latLng.lat(), e.latLng.lng());
    }
  }, [onMarkerAdd]);

  // Handler für das Ziehen eines Markers
  const handleMarkerDragEnd = useCallback((index: number, e: google.maps.MapMouseEvent) => {
    if (onMarkerDragEnd && e.latLng) {
      onMarkerDragEnd(index, e.latLng.lat(), e.latLng.lng());
    }
  }, [onMarkerDragEnd]);

  // Handler für Klick auf einen Marker
  const handleMarkerClick = useCallback((index: number, marker: MarkerInfo) => {
    setInfoWindowData({ marker, index });
    if (onMarkerClick) {
      onMarkerClick(index);
    }
  }, [onMarkerClick]);

  // Polyline-Pfad erstellen
  const polylinePath = useMemo(() => {
    return markers.map(marker => ({
      lat: marker.position[0],
      lng: marker.position[1]
    }));
  }, [markers]);

  // Icon für Marker basierend auf Belastungsklasse
  const getMarkerIcon = (belastungsklasse?: string): google.maps.Symbol | undefined => {
    if (!isLoaded) {
      return undefined; // Wenn google noch nicht geladen ist
    }
    
    const color = belastungsklasse 
      ? belastungsklassenColors[belastungsklasse as keyof typeof belastungsklassenColors] 
      : belastungsklassenColors.none;
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#ffffff',
      scale: 8
    };
  };

  if (!isLoaded) {
    return <div className="h-full w-full flex items-center justify-center bg-muted/20">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  return (
    <div className="h-full w-full rounded-md overflow-hidden relative">
      <GoogleMap
        mapContainerStyle={{ height, width }}
        center={center}
        zoom={zoom}
        options={DEFAULT_MAP_OPTIONS}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
      >
        {/* Marker für alle Standorte */}
        {markers.map((marker, idx) => (
          <Marker
            key={idx}
            position={{
              lat: marker.position[0],
              lng: marker.position[1]
            }}
            draggable={true}
            icon={getMarkerIcon(marker.belastungsklasse)}
            label={{
              text: (idx + 1).toString(),
              color: '#ffffff',
              fontWeight: 'bold',
            }}
            onDragEnd={(e) => handleMarkerDragEnd(idx, e)}
            onClick={() => handleMarkerClick(idx, marker)}
          />
        ))}

        {/* Info-Fenster für Marker-Details */}
        {infoWindowData && (
          <InfoWindow
            position={{
              lat: infoWindowData.marker.position[0],
              lng: infoWindowData.marker.position[1]
            }}
            onCloseClick={() => setInfoWindowData(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-bold text-base">
                {infoWindowData.marker.strasse 
                  ? `${infoWindowData.marker.strasse} ${infoWindowData.marker.hausnummer || ''}`
                  : `Standort ${infoWindowData.index + 1}`}
              </h3>
              {infoWindowData.marker.plz || infoWindowData.marker.ort ? (
                <p className="mb-2 text-sm">
                  {infoWindowData.marker.plz} {infoWindowData.marker.ort}
                </p>
              ) : null}
              {infoWindowData.marker.belastungsklasse && (
                <p className="text-sm">
                  <span className="font-medium">Belastungsklasse:</span> {infoWindowData.marker.belastungsklasse}
                </p>
              )}
              {infoWindowData.marker.notes && (
                <p className="text-sm mt-2">
                  <span className="font-medium">Notizen:</span> {infoWindowData.marker.notes}
                </p>
              )}
            </div>
          </InfoWindow>
        )}

        {/* Polyline für die Route */}
        {markers.length >= 2 && (
          <Polyline
            path={polylinePath}
            options={{
              strokeColor: '#3b82f6', // Blau (Tailwind blue-500)
              strokeOpacity: 0.8,
              strokeWeight: 5,
            }}
          />
        )}
      </GoogleMap>

      {/* Copyright / Attribution */}
      <div className="absolute bottom-0 right-0 bg-white/80 text-xs p-1 z-10">
        <span>© Google Maps</span>
      </div>
    </div>
  );
}