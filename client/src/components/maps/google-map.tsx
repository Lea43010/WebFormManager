import React, { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Wir deklarieren die initMap Funktion als eine Eigenschaft auf dem globalen Window-Objekt
declare global {
  interface Window {
    initMap?: () => void;  // Optional, damit TypeScript nicht meckert
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markersCount, setMarkersCount] = useState(0);
  
  // Refs mit useState statt useRef, um Re-Rendering auszulösen
  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null);
  const [googleMap, setGoogleMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [polyline, setPolyline] = useState<any>(null);
  
  // Callback-Ref für das DOM-Element der Karte
  const mapRef = useCallback((node: HTMLDivElement | null) => {
    console.log("Map Element Ref-Callback aufgerufen:", !!node);
    if (node !== null) {
      setMapElement(node);
    }
  }, []);
  
  // Marker hinzufügen
  const addMarker = useCallback((latLng: google.maps.LatLng) => {
    if (!googleMap) return;
    
    const marker = new google.maps.Marker({
      position: latLng,
      map: googleMap,
      title: `Punkt ${markers.length + 1}`,
      animation: google.maps.Animation.DROP,
      draggable: true,
    });
    
    const newMarkers = [...markers, marker];
    setMarkers(newMarkers);
    setMarkersCount(newMarkers.length);
    
    // Polyline aktualisieren
    updatePolyline(newMarkers);
    
    // Drag-Event hinzufügen
    marker.addListener('dragend', () => {
      updatePolyline(newMarkers);
    });
  }, [googleMap, markers]);
  
  // Polyline und Route-Callback aktualisieren
  const updatePolyline = useCallback((currentMarkers: any[] = markers) => {
    if (!polyline) return;
    
    const path = currentMarkers.map((marker) => marker.getPosition()!);
    polyline.setPath(path);
    
    // Route-Daten an den Parent-Component übergeben
    if (onRouteChange && path.length >= 2) {
      const routeCoordinates = path.map((point) => ({
        lat: point.lat(),
        lng: point.lng(),
      }));
      onRouteChange(routeCoordinates);
    }
  }, [markers, polyline, onRouteChange]);
  
  // Alle Marker löschen
  const clearMarkers = useCallback(() => {
    // Marker von der Karte entfernen
    markers.forEach((marker) => {
      marker.setMap(null);
    });
    
    // Marker-Array zurücksetzen
    setMarkers([]);
    setMarkersCount(0);
    
    // Polyline zurücksetzen
    if (polyline) {
      polyline.setPath([]);
    }
    
    // Callback aufrufen
    if (onMarkersClear) {
      onMarkersClear();
    }
  }, [markers, polyline, onMarkersClear]);
  
  // Karte initialisieren, wenn das DOM-Element verfügbar ist und Google Maps API geladen
  useEffect(() => {
    if (!mapElement || !window.google?.maps || googleMap) return;
    
    try {
      console.log("Initialisiere Google Map mit DOM-Element:", mapElement);
      
      // Google Maps-Karte erstellen
      const map = new window.google.maps.Map(mapElement, {
        center: initialCenter,
        zoom: initialZoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });
      
      setGoogleMap(map);
      
      // Polyline für die Route erstellen
      const newPolyline = new window.google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#3b82f6', // Blue
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map
      });
      
      setPolyline(newPolyline);
      
      // Event-Listener für Klicks auf die Karte
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        addMarker(event.latLng);
      });
      
      setIsLoading(false);
      
      toast({
        title: "Hinweis",
        description: "Karte wurde erfolgreich geladen. Sie können jetzt Marker durch Klicken hinzufügen.",
      });
    } catch (error) {
      console.error('Fehler beim Initialisieren der Karte:', error);
      setError('Fehler beim Initialisieren der Karte');
      setIsLoading(false);
    }
  }, [mapElement, initialCenter, initialZoom, googleMap, addMarker, toast]);
  
  // Google Maps API laden
  useEffect(() => {
    // Wenn Google Maps bereits geladen ist, nichts tun
    if (window.google?.maps) {
      console.log("Google Maps API bereits geladen");
      return;
    }
    
    console.log("Lade Google Maps API...");
    
    // VITE_GOOGLE_MAPS_API_KEY scheint in Replit nicht zuverlässig zu funktionieren
    // Daher verwenden wir den API-Schlüssel direkt
    const googleMapsApiKey = 'AIzaSyCzmiIk0Xi0bKKPaqg0I53rULhQzmA5-cg';
    
    if (!googleMapsApiKey) {
      setError('Google Maps API-Schlüssel nicht gefunden');
      setIsLoading(false);
      return;
    }
    
    // Script-Tag erstellen und API laden
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    
    // Timeout festlegen, falls die API zu lange lädt
    const timeoutId = setTimeout(() => {
      console.warn('Google Maps API-Ladevorgang dauert länger als erwartet.');
      toast({
        title: "Hinweis",
        description: "Der Ladevorgang dauert länger als erwartet. Bitte haben Sie etwas Geduld.",
      });
    }, 5000);
    
    script.onerror = (err) => {
      clearTimeout(timeoutId);
      console.error('Google Maps API Ladefehler:', err);
      setError('Fehler beim Laden der Google Maps API');
      setIsLoading(false);
    };
    
    script.onload = () => {
      clearTimeout(timeoutId);
      console.log('Google Maps API erfolgreich geladen');
      // Force re-render durch State-Änderung
      setIsLoading((prevLoading) => prevLoading);
    };
    
    document.head.appendChild(script);
    
    return () => {
      clearTimeout(timeoutId);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [toast]);
  
  // Fallback-Ansicht, wenn die API nicht geladen werden kann
  if (error) {
    return (
      <div className={`w-full ${className}`} style={{ height }}>
        <div className="w-full h-full bg-slate-100 rounded-md border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
          <MapPin className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-xl font-medium text-slate-700 mb-2">Fehler</h3>
          <p className="text-slate-500 text-center max-w-md mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
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
          <p className="text-slate-500 mt-2">Dies kann einen Moment dauern</p>
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