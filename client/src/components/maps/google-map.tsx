import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    google: any;
    googleMap: any;
    mapMarkers: any[];
    polyline: any;
    initMap: () => void;
    addMapMarker: (position: any) => void;
    clearMapMarkers: () => void;
    updateMarkersCount: (count: number) => void;
    externalOnRouteChange: ((route: Array<{lat: number, lng: number}>) => void) | null;
    externalOnMarkersClear: (() => void) | null;
    mapInitialCenter: {lat: number, lng: number};
    mapInitialZoom: number;
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

// Die Google Map Komponente mit minimaler Komplexität - vereinfachte, nicht-reactive Version
// um DOM-Rendering-Probleme zu vermeiden
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
  
  // Statische ID für das Kartenelement um es sicher zu finden
  const mapContainerID = "google-map-container-" + Math.random().toString(36).substring(2, 9);
  
  // Alle Callbacks über das window-Objekt einrichten, um React-Komplexität zu vermeiden
  useEffect(() => {
    // Globale Variablen setzen
    window.mapMarkers = [];
    window.externalOnRouteChange = onRouteChange || null;
    window.externalOnMarkersClear = onMarkersClear || null;
    window.mapInitialCenter = initialCenter;
    window.mapInitialZoom = initialZoom;
    
    // Update-Funktion für die Marker-Anzahl
    window.updateMarkersCount = (count) => {
      setMarkersCount(count);
    };
    
    // Marker-Funktion definieren
    window.addMapMarker = (position) => {
      if (!window.googleMap) return;
      
      const marker = new google.maps.Marker({
        position,
        map: window.googleMap,
        title: `Punkt ${window.mapMarkers.length + 1}`,
        animation: google.maps.Animation.DROP,
        draggable: true,
      });
      
      // Drag-Event hinzufügen
      marker.addListener('dragend', updatePolylineAndRoute);
      
      // Marker speichern
      window.mapMarkers.push(marker);
      window.updateMarkersCount(window.mapMarkers.length);
      
      // Polyline aktualisieren
      updatePolylineAndRoute();
    };
    
    // Funktion zum Aktualisieren der Polyline und Route
    function updatePolylineAndRoute() {
      if (!window.polyline) return;
      
      const path = window.mapMarkers.map(marker => marker.getPosition());
      window.polyline.setPath(path);
      
      // Route-Daten an den Parent-Component übergeben
      if (window.externalOnRouteChange && path.length >= 2) {
        const routeCoordinates = path.map(point => ({
          lat: point.lat(),
          lng: point.lng(),
        }));
        window.externalOnRouteChange(routeCoordinates);
      }
    }
    
    // Marker-Lösch-Funktion definieren
    window.clearMapMarkers = () => {
      // Marker von der Karte entfernen
      window.mapMarkers.forEach(marker => {
        marker.setMap(null);
      });
      
      // Marker-Array zurücksetzen
      window.mapMarkers = [];
      window.updateMarkersCount(0);
      
      // Polyline zurücksetzen
      if (window.polyline) {
        window.polyline.setPath([]);
      }
      
      // Callback aufrufen
      if (window.externalOnMarkersClear) {
        window.externalOnMarkersClear();
      }
    };
    
    // Init-Funktion für die Karte nach API-Ladung
    window.initMap = () => {
      console.log("Google Maps API initialisiert");
      
      // Wir tun hier nichts, der eigentliche Initialisierungscode wird in useEffect mit getElementById ausgeführt
      // Das verhindert Probleme mit der DOM-Verfügbarkeit
    };
    
    // Google Maps API laden, wenn noch nicht vorhanden
    if (!window.google?.maps) {
      console.log("Google Maps API wird geladen...");
      
      // Hardcoded API-Schlüssel
      const googleMapsApiKey = 'AIzaSyCzmiIk0Xi0bKKPaqg0I53rULhQzmA5-cg';
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Timeout-Handle speichern
      const timeoutId = setTimeout(() => {
        toast({
          title: "Hinweis",
          description: "Der Ladevorgang der Karte dauert länger als erwartet. Bitte haben Sie Geduld.",
        });
      }, 5000);
      
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
      };
    } else {
      // API bereits geladen, initMap direkt aufrufen
      console.log("Google Maps API bereits geladen, starte initMap...");
      window.initMap();
    }
    
    // Beim Unmount aufräumen
    return () => {
      window.mapMarkers = [];
      window.externalOnRouteChange = null;
      window.externalOnMarkersClear = null;
    };
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
  
  // Normale Kartendarstellung mit useEffect statt ref
  const element = (
    <div className={`relative w-full ${className}`}>
      <div 
        id={mapContainerID}
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
          onClick={() => window.clearMapMarkers()}
          disabled={markersCount === 0}
          className="h-8 px-2 py-1"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Löschen
        </Button>
      </div>
    </div>
  );
  
  // Statt ref-Callback verwenden wir useEffect mit einem festen DOM-Element-Selektor
  useEffect(() => {
    // Ein kurzes Timeout, um sicherzustellen, dass das DOM vollständig gerendert ist
    const renderTimeout = setTimeout(() => {
      const mapElement = document.getElementById(mapContainerID);
      if (mapElement && window.google?.maps && !window.googleMap) {
        console.log("DOM-Element gefunden, initialisiere Karte");
        try {
          // Google Maps-Karte erstellen
          window.googleMap = new google.maps.Map(mapElement, {
            center: window.mapInitialCenter,
            zoom: window.mapInitialZoom,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
          });
          
          // Polyline für die Route erstellen
          window.polyline = new google.maps.Polyline({
            path: [],
            geodesic: true,
            strokeColor: '#3b82f6', // Blue
            strokeOpacity: 1.0,
            strokeWeight: 3,
            map: window.googleMap
          });
          
          // Event-Listener für Klicks auf die Karte
          window.googleMap.addListener('click', (event: any) => {
            if (!event.latLng) return;
            window.addMapMarker(event.latLng);
          });
          
          // Loading beenden
          setIsLoading(false);
          
          toast({
            title: "Erfolg",
            description: "Karte erfolgreich geladen. Setzen Sie Marker durch Klicks auf die Karte.",
          });
        } catch (err) {
          console.error('Fehler beim Initialisieren der Karte:', err);
          setError('Fehler beim Initialisieren der Karte. Bitte laden Sie die Seite neu.');
          setIsLoading(false);
        }
      }
    }, 500); // 500ms Verzögerung zur Sicherstellung des DOM-Renderings
    
    return () => clearTimeout(renderTimeout);
  }, [isLoading, toast]);
  
  return element;
};

export default GoogleMap;