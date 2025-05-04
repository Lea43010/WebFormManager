import { useCallback, useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Marker-Icon-Problem in Leaflet beheben
// (Icon-Bilder werden in neueren Versionen nicht automatisch geladen)
// @see https://github.com/PaulLeCam/react-leaflet/issues/453
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Stellen sicher, dass die Icons korrekt geladen werden
// (wird nur einmal beim Import ausgeführt)
(function fixLeafletIcons() {
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });
})();

// Farbdefinitionen für Belastungsklassen
export const belastungsklassenColors = {
  'Bk100': '#FF0000', // Rot
  'Bk32': '#FFA500',  // Orange
  'Bk10': '#FFFF00',  // Gelb
  'Bk3.2': '#008000', // Grün
  'Bk1.8': '#0000FF', // Blau
  'Bk1.0': '#800080', // Lila
  'Bk0.3': '#A52A2A', // Braun
  'none': '#808080'   // Grau (Standard)
};

// MapCenter-Komponente zum Setzen und Aktualisieren des Kartenzentrums
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
}

// Interface für einen Marker
export interface MarkerInfo {
  position: [number, number]; // [lat, lng]
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  belastungsklasse?: string;
  notes?: string;
}

// Props für die Leaflet-Maps-Komponente
export interface LeafletMapsProps {
  center: [number, number];
  zoom: number;
  markers: MarkerInfo[];
  onMarkerAdd?: (lat: number, lng: number) => void;
  onMarkerClick?: (index: number) => void;
  onMarkerDragEnd?: (index: number, lat: number, lng: number) => void;
  height?: string;
  width?: string;
  selectedBelastungsklasse?: string;
}

// Hauptkomponente für Leaflet-Karte
export default function LeafletMapsComponent({
  center,
  zoom,
  markers,
  onMarkerAdd,
  onMarkerClick,
  onMarkerDragEnd,
  height = "100%",
  width = "100%",
  selectedBelastungsklasse = "none"
}: LeafletMapsProps) {
  // Polyline-Daten für die Verbindung der Marker
  const polylinePositions = useMemo(() => {
    return markers.map(marker => marker.position);
  }, [markers]);

  // Angepasste Marker-Icons für verschiedene Belastungsklassen
  const getCustomIcon = (belastungsklasse?: string) => {
    const color = belastungsklasse 
      ? belastungsklassenColors[belastungsklasse as keyof typeof belastungsklassenColors] 
      : belastungsklassenColors.none;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color}; 
        border: 2px solid white; 
        border-radius: 50%; 
        width: 16px; 
        height: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  };

  // Event-Handler für Kartenklick
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (onMarkerAdd) {
      onMarkerAdd(e.latlng.lat, e.latlng.lng);
    }
  }, [onMarkerAdd]);

  return (
    <div style={{ height, width }} className="rounded-md overflow-hidden relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        // Tap-Option entfernt, da nicht unterstützt in dieser Version
      >
        {/* Hauptkartenlayer (OpenStreetMap) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* MapCenter-Komponente für Zentrumsaktualisierung */}
        <MapCenter center={center} />
        
        {/* Marker für alle Standorte */}
        {markers.map((marker, idx) => (
          <Marker 
            key={idx}
            position={marker.position}
            icon={getCustomIcon(marker.belastungsklasse)}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(idx),
              dragend: (e) => {
                const { lat, lng } = (e.target as L.Marker).getLatLng();
                onMarkerDragEnd && onMarkerDragEnd(idx, lat, lng);
              }
            }}
            draggable={true}
          >
            <Popup>
              <div className="p-2 max-w-xs">
                <h3 className="font-bold text-base">
                  {marker.strasse 
                    ? `${marker.strasse} ${marker.hausnummer || ''}`
                    : `Standort ${idx + 1}`}
                </h3>
                {marker.plz || marker.ort ? (
                  <p className="mb-2 text-sm">
                    {marker.plz} {marker.ort}
                  </p>
                ) : null}
                {marker.belastungsklasse && (
                  <p className="text-sm">
                    <span className="font-medium">Belastungsklasse:</span> {marker.belastungsklasse}
                  </p>
                )}
                {marker.notes && (
                  <p className="text-sm mt-2">
                    <span className="font-medium">Notizen:</span> {marker.notes}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Polyline für die Verbindung der Marker */}
        {markers.length >= 2 && (
          <Polyline 
            positions={polylinePositions}
            pathOptions={{ 
              color: '#3b82f6', // Blau (Tailwind blue-500)
              weight: 5,
              opacity: 0.8
            }}
          />
        )}
        
        {/* Event-Listener für Kartenklicks */}
        <div 
          onClick={handleMapClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 400, // Unter den Markern und Popups, aber über der Karte
            pointerEvents: 'none' // Lässt Klicks durch
          }}
        />
      </MapContainer>
      
      {/* Copyright / Attribution */}
      <div className="absolute bottom-0 right-0 bg-white/80 text-xs p-1 z-10">
        <span>© OpenStreetMap</span>
      </div>
    </div>
  );
}