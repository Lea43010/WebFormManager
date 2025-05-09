import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Trash2, Search, Map } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { loadGoogleMapsApi, isGoogleMapsLoaded } from '@/utils/google-maps-loader';

// Eigenschaften für die SearchableGoogleMap-Komponente
interface SearchableGoogleMapProps {
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

// Google Maps Komponente mit Suchfunktion - optimierte Version
const SearchableGoogleMap: React.FC<SearchableGoogleMapProps> = ({
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
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Referenzen
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const placeAutocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | any>(null);
  
  // Unique ID für den Karten-Container
  const mapId = useRef(`map-${Math.random().toString(36).substring(2, 9)}`);
  
  // Toast-Hook
  const { toast } = useToast();
  
  // API-Key
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCzmiIk0Xi0bKKPaqg0I53rULhQzmA5-cg';
  
  // Marker hinzufügen
  const addMarker = useCallback((position: google.maps.LatLng) => {
    if (!mapRef.current) return;
    
    try {
      // Marker erstellen
      const marker = new google.maps.Marker({
        position,
        map: mapRef.current,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });
      
      // Marker zur Liste hinzufügen
      markersRef.current.push(marker);
      setMarkersCount(markersRef.current.length);
      
      // Event-Listener für Drag-Ereignisse
      marker.addListener('dragend', () => {
        updatePolyline();
        
        if (onMarkerDrag) {
          const pos = marker.getPosition();
          if (pos) {
            const index = markersRef.current.indexOf(marker);
            onMarkerDrag({ lat: pos.lat(), lng: pos.lng() }, index);
          }
        }
      });
      
      // Polyline aktualisieren
      updatePolyline();
      
      // Callback für Map-Click
      if (onMapClick) {
        const pos = marker.getPosition();
        if (pos) {
          onMapClick({ lat: pos.lat(), lng: pos.lng() });
        }
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Markers:', error);
    }
  }, [onMapClick, onMarkerDrag]);
  
  // Polyline aktualisieren
  const updatePolyline = useCallback(() => {
    if (!mapRef.current || !polylineRef.current) return;
    
    try {
      // Positionen extrahieren
      const path = markersRef.current.map(marker => {
        const position = marker.getPosition();
        if (!position) return { lat: 0, lng: 0 }; // Sollte nie passieren
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
  
  // Manuelle Adresssuche durchführen
  const searchAddress = useCallback(() => {
    if (!searchInput.trim() || !mapRef.current) return;
    
    setIsSearching(true);
    
    try {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address: searchInput }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          
          // Karte zentrieren
          if (mapRef.current) {
            mapRef.current.setCenter(location);
            mapRef.current.setZoom(15);
          }
          
          // Marker setzen
          addMarker(location);
          
          toast({
            title: "Adresse gefunden",
            description: results[0].formatted_address,
            duration: 3000
          });
        } else {
          toast({
            title: "Fehler",
            description: "Die Adresse konnte nicht gefunden werden.",
            variant: "destructive",
            duration: 3000
          });
        }
        
        setIsSearching(false);
      });
    } catch (error) {
      console.error('Fehler bei der Adresssuche:', error);
      toast({
        title: "Fehler",
        description: "Bei der Adresssuche ist ein Fehler aufgetreten.",
        variant: "destructive",
        duration: 3000
      });
      setIsSearching(false);
    }
  }, [searchInput, addMarker, toast]);
  
  // Initialisiere das moderne PlaceAutocompleteElement
  const initPlaceAutocomplete = useCallback(() => {
    if (!searchInputRef.current || !mapRef.current) return;
    
    try {
      // Prüfe, ob die neuere PlaceAutocompleteElement API verfügbar ist
      if ('places' in google.maps && 'PlaceAutocompleteElement' in google.maps.places) {
        // Neuen Container für PlaceAutocompleteElement erstellen
        const containerDiv = document.createElement('div');
        containerDiv.style.display = 'none';
        document.body.appendChild(containerDiv);
        
        try {
          // Verwende das neue PlaceAutocompleteElement
          const placeAutocompleteElement = new google.maps.places.PlaceAutocompleteElement({
            types: ['geocode', 'establishment'],
          });
          
          // Das Element an das Eingabefeld koppeln
          if (searchInputRef.current) {
            placeAutocompleteElement.input = searchInputRef.current;
          }
          
          // Event-Listener für PlacesChanged
          placeAutocompleteElement.addEventListener('place_changed', () => {
            try {
              const place = placeAutocompleteElement.getPlace();
              if (place && place.geometry && place.geometry.location) {
                // Karte zentrieren
                if (mapRef.current) {
                  mapRef.current.setCenter(place.geometry.location);
                  mapRef.current.setZoom(15);
                }
                
                // Marker setzen
                addMarker(place.geometry.location);
                
                toast({
                  title: "Adresse gefunden",
                  description: place.formatted_address || place.name || "",
                  duration: 3000
                });
              }
            } catch (error) {
              console.error('Fehler bei der Place-Auswahl:', error);
            }
          });
          
          placeAutocompleteRef.current = placeAutocompleteElement;
        } catch (error) {
          console.warn('Fehler beim Erstellen von PlaceAutocompleteElement:', error);
          // Fallback zur alten API
          initLegacyAutocomplete();
        }
      } else {
        // Fallback zur alten Autocomplete API
        initLegacyAutocomplete();
      }
    } catch (error) {
      console.warn('PlaceAutocomplete konnte nicht initialisiert werden:', error);
      // Kein fataler Fehler, wir können trotzdem die manuelle Suche nutzen
    }
  }, [addMarker, toast]);
  
  // Fallback zur alten Autocomplete API
  const initLegacyAutocomplete = useCallback(() => {
    if (!searchInputRef.current || !mapRef.current) return;
    
    try {
      // Autocomplete erstellen
      const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['geocode', 'establishment'],
        fields: ['geometry', 'name', 'formatted_address']
      });
      
      // Event-Listener für Ortsauswahl
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          // Wenn keine Details vorhanden sind, manuell suchen
          if (searchInputRef.current) {
            setSearchInput(searchInputRef.current.value);
          }
          return;
        }
        
        // Karte zentrieren
        if (mapRef.current) {
          mapRef.current.setCenter(place.geometry.location);
          mapRef.current.setZoom(15);
        }
        
        // Marker setzen
        addMarker(place.geometry.location);
        
        toast({
          title: "Adresse gefunden",
          description: place.formatted_address || place.name || "",
          duration: 3000
        });
      });
      
      // Referenz speichern
      placeAutocompleteRef.current = autocomplete;
      
    } catch (error) {
      console.error('Fehler beim Initialisieren von Autocomplete:', error);
    }
  }, [addMarker, toast]);

  // Karte initialisieren
  const initMap = useCallback(() => {
    try {
      // Element finden
      const mapElement = document.getElementById(mapId.current);
      if (!mapElement) {
        console.error('Google Maps Container nicht gefunden: ', mapId.current);
        setError('Map-Container konnte nicht gefunden werden.');
        setIsLoading(false);
        return;
      }
      
      // Map erstellen
      const map = new google.maps.Map(mapElement, {
        center: defaultCenter,
        zoom: defaultZoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: enableControls,
        streetViewControl: enableControls,
        fullscreenControl: enableControls,
        zoomControl: enableControls,
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
      
      // Referenzen speichern
      mapRef.current = map;
      polylineRef.current = polyline;
      
      // Loading beenden
      setIsLoading(false);
      
      // Autocomplete initialisieren
      initPlaceAutocomplete();
      
      // Hinweis anzeigen
      toast({
        title: "Karte geladen",
        description: "Klicken Sie auf die Karte, um Marker zu setzen oder nutzen Sie die Adresssuche.",
        duration: 5000
      });
    } catch (error) {
      console.error('Fehler beim Initialisieren der Karte:', error);
      setError('Fehler beim Initialisieren der Karte: ' + (error instanceof Error ? error.message : String(error)));
      setIsLoading(false);
    }
  }, [addMarker, defaultCenter, defaultZoom, enableControls, initPlaceAutocomplete, toast]);
  
  // Google Maps API laden
  useEffect(() => {
    // Google Maps API laden mit dem zentralen Loader
    if (isGoogleMapsLoaded()) {
      initMap();
      return;
    }
    
    // Ladehinweis anzeigen wenn es länger dauert
    const timeoutId = setTimeout(() => {
      toast({
        title: "Hinweis",
        description: "Google Maps lädt...",
        duration: 5000
      });
    }, 3000);
    
    loadGoogleMapsApi({
      apiKey,
      libraries: ['places', 'geometry'],
      callback: initMap
    }).catch(err => {
      console.error('Fehler beim Laden von Google Maps:', err);
      setError('Google Maps konnte nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung.');
      setIsLoading(false);
    }).finally(() => {
      clearTimeout(timeoutId);
    });
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [initMap, toast, apiKey]);
  
  // Fehler-Ansicht
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex flex-col items-center justify-center" style={{ height }}>
          <Map className="h-10 w-10 text-destructive mb-2" />
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
      {/* Suchleiste */}
      <div className="absolute top-3 left-3 right-3 z-10 bg-white bg-opacity-95 rounded-md shadow-md p-2 flex items-center space-x-2 max-w-md">
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Adresse suchen..."
          className="h-8 text-sm flex-grow"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
        />
        <Button
          variant="default"
          size="sm"
          onClick={searchAddress}
          disabled={isSearching || !searchInput.trim()}
          className="h-8 px-2 py-1"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      
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

export default SearchableGoogleMap;