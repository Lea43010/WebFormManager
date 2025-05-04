import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react"; 

/**
 * Eine sehr einfache DOM-basierte Google Maps Komponente ohne komplexe React-Patterns
 */
interface BasicGoogleMapProps {
  onRouteChange?: (route: Array<{lat: number, lng: number}>) => void;
  onMarkersClear?: () => void;
  initialCenter?: {lat: number, lng: number};
  initialZoom?: number;
  height?: string;
  className?: string;
}

const BasicGoogleMap: React.FC<BasicGoogleMapProps> = ({
  onRouteChange,
  onMarkersClear,
  initialCenter = { lat: 48.137154, lng: 11.576124 }, // München als Standard
  initialZoom = 12,
  height = "500px",
  className = "",
}) => {
  // Unique ID für den Map Container
  const mapId = useRef(`map-${Math.random().toString(36).substring(2, 9)}`);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const [markersCount, setMarkersCount] = React.useState(0);
  
  // Map initialisieren sobald die Komponente gemountet wird
  useEffect(() => {
    // Script Tag erstellen und zur Seite hinzufügen
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCzmiIk0Xi0bKKPaqg0I53rULhQzmA5-cg&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    
    // Falls Google Maps bereits geladen ist, direkt initialisieren
    if (window.google) {
      initMap();
    } else {
      document.head.appendChild(script);
    }
    
    // Aufräumen beim Unmount
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);
  
  // Map initialisieren
  function initMap() {
    // Element finden
    const mapElement = document.getElementById(mapId.current);
    if (!mapElement) return;
    
    // Map erstellen
    const map = new google.maps.Map(mapElement, {
      center: initialCenter,
      zoom: initialZoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });
    
    // Polyline erstellen
    const polyline = new google.maps.Polyline({
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
  }
  
  // Marker hinzufügen
  function addMarker(position: any) {
    if (!mapRef.current) return;
    
    // Marker erstellen
    const marker = new google.maps.Marker({
      position,
      map: mapRef.current,
      draggable: true
    });
    
    // Marker zur Liste hinzufügen
    markersRef.current.push(marker);
    setMarkersCount(markersRef.current.length);
    
    // Event-Listener für Drag-End
    marker.addListener('dragend', updatePolyline);
    
    // Polyline aktualisieren
    updatePolyline();
  }
  
  // Polyline aktualisieren
  function updatePolyline() {
    if (!mapRef.current || !polylineRef.current) return;
    
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
  }
  
  // Alle Marker löschen
  function clearMarkers() {
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
    if (onMarkersClear) {
      onMarkersClear();
    }
  }
  
  return (
    <div className={`relative w-full ${className}`}>
      {/* Map Container */}
      <div 
        id={mapId.current}
        style={{ height, width: '100%' }} 
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

export default BasicGoogleMap;