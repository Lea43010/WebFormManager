import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin, Trash2 } from "lucide-react";

// Wir deklarieren die initMap Funktion als eine Eigenschaft auf dem globalen Window-Objekt
declare global {
  interface Window {
    initMap: () => void;
    google: any;
  }
}

interface GoogleMapProps {
  onRouteChange?: (route: Array<{lat: number, lng: number}>) => void;
  onMarkersClear?: () => void;
  initialCenter?: {lat: number, lng: number};
  initialZoom?: number;
  height?: string;
  className?: string;
}

const defaultCenter = { lat: 48.137154, lng: 11.576124 }; // München

const GoogleMap: React.FC<GoogleMapProps> = ({
  onRouteChange,
  onMarkersClear,
  initialCenter = defaultCenter,
  initialZoom = 12,
  height = '500px',
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markersCount, setMarkersCount] = useState(0);
  
  // Google Maps API laden
  const loadGoogleMapsAPI = useCallback(() => {
    // VITE_GOOGLE_MAPS_API_KEY scheint in Replit nicht zuverlässig zu funktionieren
    // Daher verwenden wir den API-Schlüssel direkt
    const googleMapsApiKey = 'AIzaSyCzmiIk0Xi0bKKPaqg0I53rULhQzmA5-cg';
    
    if (!googleMapsApiKey) {
      setError('Google Maps API-Schlüssel nicht gefunden');
      setIsLoading(false);
      return;
    }
    
    // Prüfen, ob Google Maps API bereits geladen ist
    if (window.google && window.google.maps) {
      initMap();
      return;
    }
    
    // Wir fügen die Karte-Initialisierungsfunktion zum globalen Scope hinzu
    window.initMap = initMap;
    
    // Script-Tag erstellen und API laden
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initMap&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onerror = (err) => {
      console.error('Google Maps API Ladefehler:', err);
      setError('Fehler beim Laden der Google Maps API');
      setIsLoading(false);
    };
    document.head.appendChild(script);
    
    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
        // TypeScript-sicheres Löschen der optionalen Eigenschaft
        if (window.initMap) {
          // @ts-ignore - Notwendig, da TypeScript hier zu streng typisiert
          window.initMap = null;
        }
      }
    };
  }, []);
  
  // Karte initialisieren
  const initMap = useCallback(() => {
    if (!mapRef.current) return;
    
    try {
      // Google Maps-Karte erstellen
      const mapOptions: google.maps.MapOptions = {
        center: initialCenter,
        zoom: initialZoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      };
      
      const map = new google.maps.Map(mapRef.current, mapOptions);
      googleMapRef.current = map;
      
      // Polyline für die Route erstellen
      const polyline = new google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#3b82f6', // Blue
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map
      });
      polylineRef.current = polyline;
      
      // Event-Listener für Klicks auf die Karte
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        
        addMarker(event.latLng);
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Fehler beim Initialisieren der Karte:', error);
      setError('Fehler beim Initialisieren der Karte');
      setIsLoading(false);
    }
  }, [initialCenter, initialZoom]);
  
  // Marker hinzufügen
  const addMarker = (latLng: google.maps.LatLng) => {
    if (!googleMapRef.current) return;
    
    const marker = new google.maps.Marker({
      position: latLng,
      map: googleMapRef.current,
      title: `Punkt ${markersRef.current.length + 1}`,
      animation: google.maps.Animation.DROP,
      draggable: true,
    });
    
    // Drag-Event-Listener
    marker.addListener('dragend', updatePolyline);
    
    // Marker speichern
    markersRef.current.push(marker);
    setMarkersCount(markersRef.current.length);
    
    // Polyline aktualisieren
    updatePolyline();
  };
  
  // Polyline und Route-Callback aktualisieren
  const updatePolyline = useCallback(() => {
    if (!polylineRef.current) return;
    
    const path = markersRef.current.map((marker) => marker.getPosition()!);
    polylineRef.current.setPath(path);
    
    // Route-Daten an den Parent-Component übergeben
    if (onRouteChange && path.length >= 2) {
      const routeCoordinates = path.map((point) => ({
        lat: point.lat(),
        lng: point.lng(),
      }));
      onRouteChange(routeCoordinates);
    }
  }, [onRouteChange]);
  
  // Alle Marker löschen
  const clearMarkers = useCallback(() => {
    // Marker von der Karte entfernen
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    
    // Marker-Array zurücksetzen
    markersRef.current = [];
    setMarkersCount(0);
    
    // Polyline zurücksetzen
    if (polylineRef.current) {
      polylineRef.current.setPath([]);
    }
    
    // Callback aufrufen
    if (onMarkersClear) {
      onMarkersClear();
    }
  }, [onMarkersClear]);
  
  // Google Maps API beim Mounten laden
  useEffect(() => {
    loadGoogleMapsAPI();
  }, [loadGoogleMapsAPI]);
  
  // Fallback-Ansicht, wenn die API nicht geladen werden kann
  if (error) {
    return (
      <div className={`w-full ${className}`} style={{ height }}>
        <div className="w-full h-full bg-slate-100 rounded-md border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
          <MapPin className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-xl font-medium text-slate-700 mb-2">Fehler</h3>
          <p className="text-slate-500 text-center max-w-md mb-4">{error}</p>
          <Button variant="outline" onClick={loadGoogleMapsAPI}>
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }
  
  // Ladeansicht
  if (isLoading) {
    return (
      <div className={`w-full ${className}`} style={{ height }}>
        <div className="w-full h-full bg-slate-100 rounded-md border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <h3 className="text-xl font-medium text-slate-700">Karte wird geladen...</h3>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative w-full ${className}`}>
      <div ref={mapRef} style={{ height }} className="w-full rounded-md overflow-hidden"></div>
      
      {/* Overlay mit Marker-Anzahl und Löschen-Button */}
      <div className="absolute top-3 right-3 z-10 bg-white bg-opacity-90 rounded-md shadow p-2 flex items-center">
        <span className="text-sm font-medium mr-3">
          {markersCount} {markersCount === 1 ? 'Marker' : 'Marker'}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearMarkers}
          disabled={markersCount === 0}
          className="h-8 px-2 py-1"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Löschen
        </Button>
      </div>
    </div>
  );
};

export default GoogleMap;