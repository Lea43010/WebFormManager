import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, MapPin } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";

/**
 * Eine vereinfachte Google Maps-Komponente mit minimaler TypeScript-Konfiguration
 */
interface SimpleGoogleMapProps {
  onRouteChange?: (route: Array<{lat: number, lng: number}>) => void;
  onMarkersClear?: () => void;
  initialCenter?: {lat: number, lng: number};
  initialZoom?: number;
  height?: string;
  className?: string;
}

const SimpleGoogleMap: React.FC<SimpleGoogleMapProps> = ({
  onRouteChange,
  onMarkersClear,
  initialCenter = { lat: 48.137154, lng: 11.576124 }, // München als Standard
  initialZoom = 12,
  height = "500px",
  className = "",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markersCount, setMarkersCount] = useState(0);
  const { toast } = useToast();
  
  // Speicher für Google Maps Objekte
  const mapObjects = useRef<{
    map: any | null;
    markers: any[];
    polyline: any | null;
  }>({
    map: null,
    markers: [],
    polyline: null
  });

  // Funktion zum Aktualisieren der Polyline
  const updatePolyline = () => {
    if (!mapObjects.current.map || !mapObjects.current.polyline) return;
    
    const path = mapObjects.current.markers.map((marker: any) => {
      const position = marker.getPosition();
      return { lat: position.lat(), lng: position.lng() };
    });
    
    mapObjects.current.polyline.setPath(path);
    
    if (onRouteChange && path.length >= 2) {
      onRouteChange(path);
    }
  };

  // Funktion zum Hinzufügen eines Markers
  const addMarker = (position: any) => {
    if (!mapObjects.current.map) return;
    
    const marker = new google.maps.Marker({
      position,
      map: mapObjects.current.map,
      draggable: true
    });
    
    mapObjects.current.markers.push(marker);
    setMarkersCount(mapObjects.current.markers.length);
    
    marker.addListener('dragend', updatePolyline);
    updatePolyline();
    
    if (mapObjects.current.markers.length === 1) {
      toast({
        title: "Hinweis",
        description: "Klicken Sie auf einen weiteren Punkt, um eine Route zu erstellen.",
        duration: 5000,
      });
    }
  };
  
  // Funktion zum Löschen aller Marker
  const clearMarkers = () => {
    mapObjects.current.markers.forEach((marker: any) => {
      marker.setMap(null);
    });
    
    mapObjects.current.markers = [];
    
    if (mapObjects.current.polyline) {
      mapObjects.current.polyline.setPath([]);
    }
    
    setMarkersCount(0);
    
    if (onMarkersClear) {
      onMarkersClear();
    }
  };

  // Map initialisieren
  useEffect(() => {
    const apiKey = 'AIzaSyCzmiIk0Xi0bKKPaqg0I53rULhQzmA5-cg';
    
    // DOM-Element prüfen
    if (!mapRef.current) {
      console.error('Map Container nicht gefunden');
      return;
    }
    
    // Initialisierung der Map
    function initMap() {
      if (!mapRef.current) return;
      
      try {
        console.log('Initialisiere Google Maps');
        
        // Erstelle Map-Instanz
        const map = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          zoomControl: true,
          fullscreenControl: true
        });
        
        // Erstelle Polyline
        const polyline = new google.maps.Polyline({
          path: [],
          geodesic: true,
          strokeColor: '#3b82f6',
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map: map
        });
        
        // Speichere Objekte
        mapObjects.current = {
          map: map,
          markers: [],
          polyline: polyline
        };
        
        // Klick-Handler für Marker
        map.addListener('click', (event: any) => {
          addMarker(event.latLng);
        });
        
        // Loading beenden
        setIsLoading(false);
        
        // Hinweis anzeigen
        toast({
          title: "Karte geladen",
          description: "Klicken Sie auf die Karte, um Marker zu setzen.",
          duration: 5000
        });
      } catch (err) {
        console.error('Fehler beim Initialisieren der Karte:', err);
        setError('Fehler beim Initialisieren der Karte. Bitte laden Sie die Seite neu.');
        setIsLoading(false);
      }
    }
    
    // Google Maps API laden
    function loadGoogleMapsApi() {
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
    }
    
    // API laden
    return loadGoogleMapsApi();
    
  }, [initialCenter, initialZoom, toast]);
  
  // Fehler-Ansicht
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
  
  // Lade-Ansicht
  if (isLoading) {
    return (
      <div className={`w-full ${className}`} style={{ height }}>
        <div className="w-full h-full bg-slate-100 rounded-md border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <h3 className="text-xl font-medium text-slate-700">Karte wird geladen...</h3>
          <p className="text-slate-500 mt-2">Dies kann einige Sekunden dauern</p>
        </div>
      </div>
    );
  }
  
  // Normale Kartendarstellung
  return (
    <div className={`relative w-full ${className}`}>
      <div 
        ref={mapRef}
        style={{ height }} 
        className="w-full rounded-md overflow-hidden"
      />
      
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

export default SimpleGoogleMap;