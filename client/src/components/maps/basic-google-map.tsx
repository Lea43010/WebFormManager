import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Loader2, Map } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { loadGoogleMapsApi, isGoogleMapsLoaded } from '@/utils/google-maps-loader';

/**
 * Eine optimierte Google Maps Komponente mit verbessertem Laden der API
 */
interface BasicGoogleMapProps {
  onRouteChange?: (route: Array<{lat: number, lng: number}>, startAddress?: string, endAddress?: string) => void;
  onMarkersClear?: () => void;
  initialCenter?: {lat: number, lng: number};
  initialZoom?: number;
  height?: string;
  className?: string;
  showSearch?: boolean;
  searchOutsideMap?: boolean; // Option, um die Suche außerhalb der Karte anzuzeigen
  initialRoute?: Array<{lat: number, lng: number}>; // Initiale Route, die angezeigt werden soll
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
  initialRoute = []
}) => {
  // Unique ID für den Map Container mit statischer ID für konsistentes Markup
  const mapId = useRef('tiefbau-map-container');
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const placeAutocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  const [markersCount, setMarkersCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Map initialisieren sobald die Komponente gemountet wird
  useEffect(() => {
    // API-Key aus Umgebungsvariable oder Fallback
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCzmiIk0Xi0bKKPaqg0I53rULhQzmA5-cg';
    
    // Google Maps API laden
    if (isGoogleMapsLoaded()) {
      initMap();
      return;
    }
    
    loadGoogleMapsApi({
      apiKey,
      libraries: ['places', 'geometry'],
      callback: initMap
    }).catch(err => {
      console.error('Fehler beim Laden von Google Maps:', err);
      setError('Google Maps konnte nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung.');
      setIsLoading(false);
    });
    
    // Hier kein Cleanup, da der zentrale Loader die API-Instanz verwaltet
  }, []);
  
  // Map initialisieren mit verbessertem Handling für DOM-Verfügbarkeit
  function initMap() {
    // Sicherstellen, dass wir mit einem kleinen Verzögerung nach dem Container suchen, 
    // um sicherzustellen, dass das DOM vollständig geladen ist
    setTimeout(() => {
      // Element finden
      const mapElement = document.getElementById(mapId.current);
      if (!mapElement) {
        console.error('Google Maps Container nicht gefunden: ', mapId.current);
        
        // Elemente für den Google Maps Container erstellen, falls sie fehlen
        const container = document.createElement('div');
        container.id = mapId.current;
        container.style.width = '100%';
        container.style.height = height;
        
        // Finden eines geeigneten Elternelements für den Container
        const placeholder = document.querySelector('.tiefbau-map-placeholder');
        if (placeholder) {
          placeholder.appendChild(container);
          console.log('Map-Container dynamisch hinzugefügt');
          initMapWithElement(container);
        } else {
          setError('Map-Container konnte nicht gefunden werden und kein geeigneter Platzhalter gefunden.');
          setIsLoading(false);
        }
        return;
      }
      
      initMapWithElement(mapElement);
    }, 100); // 100ms Verzögerung
  }
  
  // Map mit dem bereitgestellten Element initialisieren
  function initMapWithElement(mapElement: HTMLElement) {
    
    try {
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
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          addMarker(event.latLng);
        }
      });
      
      // Geocoder für Adresssuche initialisieren
      geocoderRef.current = new google.maps.Geocoder();
      
      // Referenzen speichern
      mapRef.current = map;
      polylineRef.current = polyline;
      
      // Initial-Route anzeigen, wenn vorhanden
      if (initialRoute && initialRoute.length > 0) {
        console.log('Initiale Route wird angezeigt:', initialRoute);
        
        // Bestehende Marker löschen, damit wir neu anfangen können
        clearMarkers();
        
        // Marker für jeden Punkt der Route hinzufügen
        for (const point of initialRoute) {
          const latLng = new google.maps.LatLng(point.lat, point.lng);
          addMarker(latLng, false); // false = kein Callback aufrufen, um Endlosschleife zu vermeiden
        }
        
        // Polyline aktualisieren
        updatePolyline();
        
        // Karte auf die Route zentrieren
        if (initialRoute.length > 0) {
          fitMapToMarkers();
        }
      }
      
      // Wenn alle Initialisierungen abgeschlossen sind, Loading-Status aktualisieren
      setIsLoading(false);
      
      // Nach dem Initialisieren das PlaceAutocompleteElement erstellen
      if (searchInputRef.current && 'places' in google.maps) {
        initPlaceAutocomplete();
      }
    } catch (error) {
      console.error('Fehler beim Initialisieren der Karte:', error);
      setError('Fehler beim Initialisieren der Karte: ' + (error instanceof Error ? error.message : String(error)));
      setIsLoading(false);
    }
  }
  
  // Initialisiere das moderne PlaceAutocompleteElement
  function initPlaceAutocomplete() {
    if (!searchInputRef.current || !mapRef.current) return;
    
    try {
      // Prüfe, ob die neuere PlaceAutocompleteElement API verfügbar ist
      if ('PlaceAutocompleteElement' in google.maps.places) {
        // Neuen Container für PlaceAutocompleteElement erstellen
        const containerDiv = document.createElement('div');
        containerDiv.style.display = 'none';
        document.body.appendChild(containerDiv);
        
        // PlaceAutocompleteElement erstellen
        const placeAutocompleteElement = new google.maps.places.PlaceAutocompleteElement({
          inputElement: searchInputRef.current,
          types: ['geocode', 'establishment'],
        });
        
        // Event-Listener für PlacesChanged
        placeAutocompleteElement.addListener('place_changed', () => {
          const place = placeAutocompleteElement.getPlace();
          if (place && place.geometry && place.geometry.location) {
            handleSearchResult(place.geometry.location);
          }
        });
        
        placeAutocompleteRef.current = placeAutocompleteElement;
      } else {
        // Fallback zur alten Autocomplete API
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          types: ['geocode', 'establishment']
        });
        
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place && place.geometry && place.geometry.location) {
            handleSearchResult(place.geometry.location);
          }
        });
      }
    } catch (error) {
      console.warn('PlaceAutocomplete konnte nicht initialisiert werden:', error);
      // Kein fataler Fehler, wir können trotzdem die manuelle Suche nutzen
    }
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
  function addMarker(position: google.maps.LatLng, callRouteChangeCallback = true) {
    if (!mapRef.current) return;
    
    // Marker erstellen
    const marker = new google.maps.Marker({
      position,
      map: mapRef.current,
      draggable: true,
      animation: google.maps.Animation.DROP
    });
    
    // Marker zur Liste hinzufügen
    markersRef.current.push(marker);
    setMarkersCount(markersRef.current.length);
    
    // Event-Listener für Drag-End
    marker.addListener('dragend', updatePolyline);
    
    // Polyline aktualisieren
    updatePolyline(callRouteChangeCallback);
  }
  
  // Adresse für eine Position abrufen
  async function getAddressForLocation(location: {lat: number, lng: number}): Promise<string> {
    if (!geocoderRef.current) {
      return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    }
    
    try {
      const result = await geocoderRef.current.geocode({ 
        location: new google.maps.LatLng(location.lat, location.lng) 
      });
      
      if (result.results && result.results.length > 0) {
        return result.results[0].formatted_address;
      }
    } catch (error) {
      console.error("Geocoding Fehler:", error);
      // Bei Google Places API Fehler alternative Adresse verwenden
    }
    
    // Fallback: Verwende Koordinaten als "Adresse"
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
  }
  
  // Karte an die Marker anpassen
  function fitMapToMarkers() {
    if (!mapRef.current || markersRef.current.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    
    // Alle Marker-Positionen zum Bounds hinzufügen
    markersRef.current.forEach(marker => {
      const position = marker.getPosition();
      if (position) {
        bounds.extend(position);
      }
    });
    
    // Karte auf die Bounds anpassen
    mapRef.current.fitBounds(bounds);
    
    // Wenn nur ein Marker vorhanden ist, Zoom anpassen
    if (markersRef.current.length === 1) {
      mapRef.current.setZoom(13);
    }
  }

  // Polyline aktualisieren
  async function updatePolyline(callRouteChangeCallback = true) {
    if (!mapRef.current || !polylineRef.current) return;
    
    // Positionen extrahieren
    const path = markersRef.current.map(marker => {
      const position = marker.getPosition();
      if (!position) return { lat: 0, lng: 0 }; // Sollte nie passieren
      return { lat: position.lat(), lng: position.lng() };
    });
    
    // Polyline aktualisieren
    polylineRef.current.setPath(path);
    
    // Callback aufrufen, falls gewünscht
    if (callRouteChangeCallback && onRouteChange && path.length >= 2) {
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
  
  // Wenn die Karte noch lädt oder ein Fehler aufgetreten ist
  if (isLoading) {
    return (
      <div 
        className={`w-full ${className} flex items-center justify-center bg-gray-100 rounded-md`}
        style={{ height }}
      >
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
          <span className="text-sm text-muted-foreground">Google Maps wird geladen...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        className={`w-full ${className} flex items-center justify-center bg-gray-100 rounded-md`}
        style={{ height }}
      >
        <div className="flex flex-col items-center text-center p-4">
          <Map className="h-8 w-8 text-destructive mb-2" />
          <h3 className="text-lg font-medium">Kartenfehler</h3>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            Seite neu laden
          </Button>
        </div>
      </div>
    );
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