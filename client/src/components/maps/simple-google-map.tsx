import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, MapPin } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";

/**
 * Eine vereinfachte und robuste Google Maps-Komponente ohne TypeScript-Fehler
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
  
  // Einzigartige ID für den Map-Container generieren
  const mapContainerId = useRef(`map-container-${Math.random().toString(36).substr(2, 9)}`);
  
  // Speicher für Map-Objekte außerhalb des React-Lifecycle
  const mapObjects = useRef<{
    map: any;
    markers: any[];
    polyline: any;
  }>({
    map: null,
    markers: [],
    polyline: null
  });

  // Funktion zum Hinzufügen eines Markers
  const addMarker = (position: any) => {
    if (!mapObjects.current.map) return;
    
    // Google Maps Marker erstellen
    const marker = new google.maps.Marker({
      position,
      map: mapObjects.current.map,
      draggable: true
    });
    
    // Marker zur Liste hinzufügen
    mapObjects.current.markers.push(marker);
    
    // Marker-Anzahl aktualisieren
    setMarkersCount(mapObjects.current.markers.length);
    
    // Event-Listener für Drag-End
    marker.addListener('dragend', updatePolyline);
    
    // Polyline aktualisieren
    updatePolyline();
    
    // Hilfetext beim ersten Marker anzeigen
    if (mapObjects.current.markers.length === 1) {
      toast({
        title: "Hinweis",
        description: "Klicken Sie mindestens einen weiteren Punkt auf der Karte an, um eine Route zu erstellen.",
        duration: 5000,
      });
    }
  };
  
  // Funktion zum Aktualisieren der Polyline
  const updatePolyline = () => {
    if (!mapObjects.current.map || !mapObjects.current.polyline) return;
    
    // Routenpfad aus Markern erstellen
    const path = mapObjects.current.markers.map((marker: any) => {
      const position = marker.getPosition();
      return { lat: position.lat(), lng: position.lng() };
    });
    
    // Polyline aktualisieren
    mapObjects.current.polyline.setPath(path);
    
    // Callback aufrufen, wenn vorhanden
    if (onRouteChange && path.length >= 2) {
      onRouteChange(path);
    }
  };
  
  // Funktion zum Löschen aller Marker
  const clearMarkers = () => {
    // Alle Marker von der Karte entfernen
    mapObjects.current.markers.forEach((marker: any) => {
      marker.setMap(null);
    });
    
    // Marker-Array zurücksetzen
    mapObjects.current.markers = [];
    
    // Polyline zurücksetzen
    if (mapObjects.current.polyline) {
      mapObjects.current.polyline.setPath([]);
    }
    
    // Marker-Anzahl aktualisieren
    setMarkersCount(0);
    
    // Callback aufrufen, wenn vorhanden
    if (onMarkersClear) {
      onMarkersClear();
    }
  };

  // Map initialisieren
  useEffect(() => {
    // API-Key direkt festlegen (kann später durch Umgebungsvariable ersetzt werden)
    const googleMapsApiKey = 'AIzaSyCzmiIk0Xi0bKKPaqg0I53rULhQzmA5-cg';
    
    // Funktion zur Initialisierung der Karte
    const initializeMap = () => {
      if (!mapRef.current) return;
      
      try {
        // Google Maps-Karte erstellen
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });
        
        // Polyline für die Route erstellen
        const polylineInstance = new google.maps.Polyline({
          path: [],
          geodesic: true,
          strokeColor: '#3b82f6', // Blau
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map: mapInstance
        });
        
        // Speichern der Objekte im Ref
        mapObjects.current = {
          map: mapInstance,
          markers: [],
          polyline: polylineInstance
        };
        
        // Event-Listener für Klicks auf die Karte
        mapInstance.addListener('click', (event: any) => {
          if (!event.latLng) return;
          addMarker(event.latLng);
        });
        
        // Hilfetext hinzufügen
        setTimeout(() => {
          toast({
            title: "Hinweis",
            description: "Klicken Sie auf die Karte, um Marker zu setzen und eine Route zu erstellen.",
            duration: 8000,
          });
        }, 1500);
        
        // Loading beenden
        setIsLoading(false);
      } catch (err) {
        console.error('Fehler beim Initialisieren der Karte:', err);
        setError('Fehler beim Initialisieren der Karte. Bitte laden Sie die Seite neu.');
        setIsLoading(false);
      }
    };
    
    // Prüfen, ob die Google Maps API bereits geladen ist
    if (window.google && window.google.maps) {
      // API ist bereits geladen, Karte direkt initialisieren
      initializeMap();
    } else {
      // API muss geladen werden
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      
      // Timeout für Ladehinweis
      const timeoutId = setTimeout(() => {
        toast({
          title: "Hinweis",
          description: "Der Ladevorgang der Karte dauert länger als erwartet. Bitte haben Sie Geduld.",
        });
      }, 5000);
      
      // Event-Handler für erfolgreiche Ladung
      script.onload = () => {
        clearTimeout(timeoutId);
        initializeMap();
      };
      
      // Error-Handler
      script.onerror = () => {
        clearTimeout(timeoutId);
        setError('Fehler beim Laden der Google Maps API. Bitte prüfen Sie Ihre Internetverbindung.');
        setIsLoading(false);
      };
      
      // Script einfügen
      document.head.appendChild(script);
      
      // Cleanup-Funktion
      return () => {
        clearTimeout(timeoutId);
        document.head.removeChild(script);
      };
    }
  }, [initialCenter, initialZoom, onRouteChange, onMarkersClear, toast]);
  
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
          <p className="text-slate-500 mt-2">Dies kann bis zu 10 Sekunden dauern</p>
        </div>
      </div>
    );
  }
  
  // Normale Kartendarstellung
  return (
    <div className={`relative w-full ${className}`}>
      <div 
        ref={mapRef}
        id={mapContainerId.current}
        style={{ height }} 
        className="w-full rounded-md overflow-hidden"
      ></div>
      
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