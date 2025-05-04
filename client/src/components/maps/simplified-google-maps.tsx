import React, { useState, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from '@react-google-maps/api';

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
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-simple',
    googleMapsApiKey: apiKey,
    libraries: ["places", "geometry"] as Libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<SimpleMarkerInfo | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(function callback() {
    mapRef.current = null;
  }, []);

  if (!isLoaded) {
    return <div>Karte wird geladen...</div>;
  }

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <GoogleMap
        mapContainerStyle={{ height: "100%", width: "100%" }}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {markers.map((marker, idx) => (
          <Marker
            key={idx}
            position={{
              lat: marker.position[0],
              lng: marker.position[1]
            }}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={{
              lat: selectedMarker.position[0],
              lng: selectedMarker.position[1]
            }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div>
              <h3>{selectedMarker.title || `Marker ${markers.indexOf(selectedMarker) + 1}`}</h3>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}