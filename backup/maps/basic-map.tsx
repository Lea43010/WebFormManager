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
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Funktion zum Laden der Google Maps API
  useEffect(() => {
    let isApiLoaded = false;

    // Hilfsfunktionen für Google Maps API
    function loadGoogleMaps() {
      // Wenn wir bereits versuchen zu laden, nicht erneut starten
      if (document.getElementById('google-maps-api-script')) {
        return;
      }

      // Script-Tag erstellen und API-Schlüssel einfügen
      const script = document.createElement('script');
      script.id = 'google-maps-api-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        isApiLoaded = true;
        initMap();
      };
      document.head.appendChild(script);
      scriptRef.current = script;
    }

    // Prüfen, ob Google Maps bereits geladen wurde
    if (window.google?.maps) {
      isApiLoaded = true;
      initMap();
    } else {
      loadGoogleMaps();
    }

    // Aufräumen beim Unmounten
    return () => {
      // Marker entfernen
      if (markersRef.current) {
        markersRef.current.forEach(marker => {
          if (marker && marker.setMap) {
            marker.setMap(null);
          }
        });
      }
      
      // Globalen Zustand nicht durch Entfernen des Script-Tags ändern
      // Es könnten andere Komponenten sein, die Google Maps verwenden
    };
  }, [apiKey]);

  // Funktion zum Initialisieren der Karte
  const initMap = () => {
    if (!mapRef.current || !window.google?.maps) return;

    // Google Maps Klassen
    const { Map, Marker } = window.google.maps;

    if (!mapInstanceRef.current) {
      // Karte erstellen
      mapInstanceRef.current = new Map(mapRef.current, {
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
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // Neue Marker hinzufügen
    markers.forEach(markerData => {
      const marker = new Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map: mapInstanceRef.current,
        title: markerData.title,
      });
      markersRef.current.push(marker);
    });
  };

  // Aktualisiere die Karte bei Änderungen der Props
  useEffect(() => {
    if (mapInstanceRef.current && window.google?.maps) {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);

      // Bestehende Marker entfernen
      markersRef.current.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];

      // Neue Marker hinzufügen
      const { Marker } = window.google.maps;
      markers.forEach(markerData => {
        const marker = new Marker({
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