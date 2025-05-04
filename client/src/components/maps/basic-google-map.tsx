import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

/**
 * Eine sehr einfache DOM-basierte Google Maps Komponente ohne komplexe React-Patterns
 */
interface BasicGoogleMapProps {
  onRouteChange?: (route: Array<{lat: number, lng: number}>, startAddress?: string, endAddress?: string) => void;
  onMarkersClear?: () => void;
  initialCenter?: {lat: number, lng: number};
  initialZoom?: number;
  height?: string;
  className?: string;
  showSearch?: boolean;
  searchOutsideMap?: boolean; // Neue Option, um die Suche außerhalb der Karte anzuzeigen
}

const BasicGoogleMap: React.FC<BasicGoogleMapProps> = ({
  onRouteChange,
  onMarkersClear,
  initialCenter = { lat: 48.137154, lng: 11.576124 }, // München als Standard
  initialZoom = 12,
  height = "500px",
  className = "",
  showSearch = true, // Standardmäßig Suche anzeigen
  searchOutsideMap = false, // Standardmäßig Suche innerhalb der Karte
}) => {
  // Unique ID für den Map Container
  const mapId = useRef(`map-${Math.random().toString(36).substring(2, 9)}`);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null); 
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  const [markersCount, setMarkersCount] = React.useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  
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
    console.log('Lade Google Maps API');
    // Element finden
    const mapElement = document.getElementById(mapId.current);
    if (!mapElement) {
      console.error('Google Maps nicht verfügbar oder Container nicht gefunden');
      return;
    }
    
    console.log('Google Maps API geladen');
    
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
    
    // Geocoder für Adresssuche initialisieren
    geocoderRef.current = new google.maps.Geocoder();
    
    // Autocomplete für Suchfeld initialisieren (wird später verwendet)
    if (searchInputRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['geocode', 'establishment']
      });
      
      // Event-Listener für Auswahl eines Autocomplete-Eintrags
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.geometry && place.geometry.location) {
          handleSearchResult(place.geometry.location);
        }
      });
    }
    
    // Referenzen speichern
    mapRef.current = map;
    polylineRef.current = polyline;
  }
  
  // Adresssuche durchführen
  async function searchAddress() {
    if (!geocoderRef.current || !searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const result = await geocoderRef.current.geocode({ address: searchQuery });
      
      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        handleSearchResult(location);
        
        toast({
          title: "Adresse gefunden",
          description: result.results[0].formatted_address,
        });
      } else {
        toast({
          title: "Keine Ergebnisse",
          description: "Keine Adresse für diese Suchanfrage gefunden",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Geocoding Fehler:", error);
      toast({
        title: "Fehler bei der Suche",
        description: "Es gab ein Problem bei der Adresssuche",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }
  
  // Suchergebnis verarbeiten
  function handleSearchResult(location: google.maps.LatLng) {
    if (!mapRef.current) return;
    
    // Karte auf das Ergebnis zentrieren
    mapRef.current.setCenter(location);
    mapRef.current.setZoom(15);
    
    // Optional: Marker an der Position hinzufügen
    addMarker(location);
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
  
  // Adresse für eine Position abrufen
  async function getAddressForLocation(location: {lat: number, lng: number}): Promise<string> {
    if (!geocoderRef.current) return '';
    
    try {
      const result = await geocoderRef.current.geocode({ 
        location: new google.maps.LatLng(location.lat, location.lng) 
      });
      
      if (result.results && result.results.length > 0) {
        return result.results[0].formatted_address;
      }
    } catch (error) {
      console.error("Geocoding Fehler:", error);
    }
    
    return '';
  }
  
  // Polyline aktualisieren
  async function updatePolyline() {
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
      // Adressen für Start- und Endpunkt abrufen
      const startAddress = await getAddressForLocation(path[0]);
      const endAddress = await getAddressForLocation(path[path.length - 1]);
      
      // Callback mit Koordinaten und Adressen aufrufen
      onRouteChange(path, startAddress, endAddress);
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
  
  // Suchkomponente, die sowohl innerhalb als auch außerhalb der Karte verwendet werden kann
  const SearchComponent = (
    <div className="flex items-center">
      <Input
        ref={searchInputRef}
        type="text"
        placeholder="Adresse suchen..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
        className="flex-1 mr-2 h-8"
      />
      <Button 
        variant="default" 
        size="sm" 
        onClick={searchAddress}
        disabled={isSearching || !searchQuery.trim()}
        className="h-8 px-3 py-1 whitespace-nowrap"
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Search className="h-4 w-4 mr-1" />
        )}
        Suchen
      </Button>
    </div>
  );

  // Wenn die Suche außerhalb der Karte angezeigt werden soll
  if (searchOutsideMap && showSearch) {
    return (
      <div className={`w-full ${className}`}>
        {/* Suchfeld außerhalb der Karte */}
        <div className="w-full mb-3 p-2 bg-white rounded-md shadow">
          {SearchComponent}
        </div>
        
        {/* Karte mit Container */}
        <div className="relative w-full">
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
      </div>
    );
  }
  
  // Standard-Rendering mit Suchfeld innerhalb der Karte
  return (
    <div className={`relative w-full ${className}`}>
      {/* Map Container */}
      <div 
        id={mapId.current}
        style={{ height, width: '100%' }} 
        className="w-full rounded-md overflow-hidden"
      />
      
      {/* Adresssuche innerhalb der Karte */}
      {showSearch && (
        <div className="absolute top-3 left-3 right-16 z-10 bg-white bg-opacity-90 rounded-md shadow p-2">
          {SearchComponent}
        </div>
      )}
      
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