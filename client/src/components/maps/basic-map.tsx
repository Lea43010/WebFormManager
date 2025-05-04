import React, { useEffect, useRef } from 'react';

interface BasicMapProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; title?: string }>;
  height?: string;
  width?: string;
}

export default function BasicMap({
  apiKey,
  center = { lat: 48.137154, lng: 11.576124 }, // München als Standard
  zoom = 10,
  markers = [],
  height = '400px',
  width = '100%'
}: BasicMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Funktion zum Laden der Google Maps API
  useEffect(() => {
    // Prüfen, ob bereits geladen
    if (window.google?.maps || document.querySelector('script[src*="maps.googleapis.com/maps/api"]')) {
      initMap();
      return;
    }

    // Script-Tag erstellen und API-Schlüssel einfügen
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.head.appendChild(script);
    scriptRef.current = script;

    // Aufräumen beim Unmounten
    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
      }
      
      // Marker entfernen
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
      }
    };
  }, [apiKey]);

  // Funktion zum Initialisieren der Karte
  const initMap = () => {
    if (!mapRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      // Karte erstellen
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });
    } else {
      // Karte aktualisieren
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);
    }

    // Bestehende Marker entfernen
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Neue Marker hinzufügen
    markers.forEach(markerData => {
      const marker = new google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map: mapInstanceRef.current,
        title: markerData.title,
      });
      markersRef.current.push(marker);
    });
  };

  // Aktualisiere die Karte bei Änderungen der Props
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);

      // Bestehende Marker entfernen
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Neue Marker hinzufügen
      markers.forEach(markerData => {
        const marker = new google.maps.Marker({
          position: { lat: markerData.lat, lng: markerData.lng },
          map: mapInstanceRef.current,
          title: markerData.title,
        });
        markersRef.current.push(marker);
      });
    }
  }, [center, zoom, markers]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height, 
        width, 
        borderRadius: '0.375rem',
      }}
    >
      {!window.google?.maps && (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f5f5f5',
          borderRadius: '0.375rem',
        }}>
          Karte wird geladen...
        </div>
      )}
    </div>
  );
}