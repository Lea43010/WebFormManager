import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

declare global {
  interface Window {
    google: any;
  }
}

// Eigenschaften für die SimpleGoogleMap-Komponente
interface SimpleGoogleMapProps {
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  height?: string;
  className?: string;
  onRouteChange?: (route: Array<{ lat: number; lng: number }>) => void;
  onMapClick?: (position: { lat: number; lng: number }) => void;
  onMarkerDrag?: (position: { lat: number; lng: number }, index: number) => void;
  onMarkersCleared?: () => void;
  enableControls?: boolean;
}

// Google Maps Komponente mit vereinfachtem DOM-basierten Ansatz
const SimpleGoogleMap: React.FC<SimpleGoogleMapProps> = ({
  defaultCenter = { lat: 48.137154, lng: 11.576124 },
  defaultZoom = 12,
  height = '500px',
  className = '',
  onRouteChange,
  onMapClick,
  onMarkerDrag,
  onMarkersCleared,
  enableControls = true,
}) => {
  // State für die Karte
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markersCount, setMarkersCount] = useState(0);
  
  // Referenzen
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Unique ID für den Karten-Container
  const mapId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);
  
  // Toast-Hook
  const { toast } = useToast();
  
  // API-Key
  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCzmiIk0Xi0bKKPaqg0I53rULhQzmA5-cg';
  
  // Marker hinzufügen
  const addMarker = useCallback((position: any) => {
    if (!mapRef.current) return;
    
    try {
      // Marker erstellen
      const marker = new window.google.maps.Marker({
        position,
        map: mapRef.current,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });
      
      // Marker zur Liste hinzufügen
      markersRef.current.push(marker);
      setMarkersCount(markersRef.current.length);
      
      // Event-Listener für Drag-Ereignisse
      marker.addListener('dragend', () => {
        updatePolyline();
        
        if (onMarkerDrag) {
          const pos = marker.getPosition();
          const index = markersRef.current.indexOf(marker);
          onMarkerDrag({ lat: pos.lat(), lng: pos.lng() }, index);
        }
      });
      
      // Polyline aktualisieren
      updatePolyline();
      
      // Callback für Map-Click
      if (onMapClick) {
        const pos = marker.getPosition();
        onMapClick({ lat: pos.lat(), lng: pos.lng() });
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Markers:', error);
    }
  }, [onMapClick, onMarkerDrag]);
  
  // Polyline aktualisieren
  const updatePolyline = useCallback(() => {
    if (!mapRef.current || !polylineRef.current || !window.google) return;
    
    try {
      // Positionen extrahieren
      const path = markersRef.current.map(marker => {
        const position = marker.getPosition();
        return { lat: position.lat(), lng: position.lng() };
      });
      
      // Polyline aktualisieren
      polylineRef.current.setPath(path);
      
      // Callback aufrufen
      if (onRouteChange && path.length >= 2) {
        onRouteChange(path);
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Polyline:', error);
    }
  }, [onRouteChange]);
  
  // Alle Marker löschen
  const clearMarkers = useCallback(() => {
    if (!markersRef.current.length) return;
    
    try {
      // Alle Marker von der Map entfernen
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      
      // Marker-Array zurücksetzen
      markersRef.current = [];
      
      // Polyline zurücksetzen
      if (polylineRef.current) {
        polylineRef.current.setPath([]);
      }
      
      // Marker-Anzahl aktualisieren
      setMarkersCount(0);
      
      // Callback aufrufen
      if (onMarkersCleared) {
        onMarkersCleared();
      }
      
      toast({
        title: "Hinweis",
        description: "Alle Marker wurden gelöscht.",
        duration: 3000
      });
    } catch (error) {
      console.error('Fehler beim Löschen der Marker:', error);
    }
  }, [onMarkersCleared, toast]);
  
  // Karte initialisieren
  const initMap = useCallback(() => {
    try {
      if (!mapContainerRef.current || !window.google || !window.google.maps) {
        console.error('Google Maps nicht verfügbar oder Container nicht gefunden');
        return;
      }
      
      // Map erstellen
      const map = new window.google.maps.Map(document.getElementById(mapId.current), {
        center: defaultCenter,
        zoom: defaultZoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: enableControls,
        streetViewControl: enableControls,
        fullscreenControl: enableControls,
        zoomControl: enableControls,
      });
      
      // Polyline erstellen
      const polyline = new window.google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map: map
      });
      
      // Event-Listener für Klicks auf die Karte
      map.addListener('click', (event: any) => {
        addMarker(event.latLng);
      });
      
      // Referenzen speichern
      mapRef.current = map;
      polylineRef.current = polyline;
      
      // Loading beenden
      setIsLoading(false);
      
      // Hinweis anzeigen
      toast({
        title: "Karte geladen",
        description: "Klicken Sie auf die Karte, um Marker zu setzen.",
        duration: 5000
      });
    } catch (error) {
      console.error('Fehler beim Initialisieren der Karte:', error);
      setError('Fehler beim Initialisieren der Karte. Bitte laden Sie die Seite neu.');
      setIsLoading(false);
    }
  }, [addMarker, defaultCenter, defaultZoom, enableControls, toast]);
  
  // Google Maps API laden
  useEffect(() => {
    // Prüfen, ob die API bereits geladen ist
    if (window.google && window.google.maps) {
      console.log('Google Maps bereits geladen');
      initMap();
      return;
    }
    
    console.log('Lade Google Maps API');
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    
    const timeoutId = setTimeout(() => {
      toast({
        title: "Hinweis",
        description: "Google Maps lädt...",
        duration: 5000
      });
    }, 3000);
    
    script.onload = () => {
      clearTimeout(timeoutId);
      console.log('Google Maps API geladen');
      setTimeout(initMap, 500);
    };
    
    script.onerror = () => {
      clearTimeout(timeoutId);
      setError('Fehler beim Laden der Google Maps API');
      setIsLoading(false);
    };
    
    document.head.appendChild(script);
    
    return () => {
      clearTimeout(timeoutId);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [initMap, toast, apiKey]);
  
  // Fehler-Ansicht
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex flex-col items-center justify-center" style={{ height }}>
          <div className="text-destructive mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-center">Kartenfehler</h3>
          <p className="text-muted-foreground text-center mt-2">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Seite neu laden
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Loading-Ansicht
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex flex-col items-center justify-center" style={{ height }}>
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Google Maps wird geladen...</p>
        </CardContent>
      </Card>
    );
  }
  
  // Karten-Ansicht
  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div
        id={mapId.current}
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="w-full rounded-md overflow-hidden"
      />
      
      {/* Overlay mit Kontrollbereich */}
      <div className="absolute top-3 right-3 z-10 bg-white bg-opacity-90 rounded-md shadow-md p-2 flex items-center space-x-2">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-primary mr-1" />
          <span className="text-sm font-medium">
            {markersCount} {markersCount === 1 ? 'Marker' : 'Marker'}
          </span>
        </div>
        
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

export default SimpleGoogleMap;