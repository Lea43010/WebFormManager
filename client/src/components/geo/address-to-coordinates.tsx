import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, ArrowRight, Copy, MapIcon, CheckIcon } from "lucide-react";
import { MAPBOX_TOKEN } from "@/config/mapbox";

interface AddressToCoordinatesProps {
  onCoordinatesFound?: (lat: number, lng: number) => void;
}

interface AddressSuggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

export function AddressToCoordinates({ onCoordinatesFound }: AddressToCoordinatesProps) {
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Autovervollständigung von Adressen
    const fetchSuggestions = async () => {
      if (address.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
          )}.json?access_token=${MAPBOX_TOKEN}&country=de&limit=5&types=address,place,locality,neighborhood,postcode`
        );

        if (!response.ok) {
          console.error("Fehler bei der Adresssuche");
          return;
        }

        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          setSuggestions(data.features.map((feature: any) => ({
            id: feature.id,
            place_name: feature.place_name,
            center: feature.center
          })));
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Fehler bei der Adresssuche:", err);
        setSuggestions([]);
      }
    };

    // Verzögerung einbauen, um nicht bei jedem Tastendruck eine Anfrage zu senden
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [address]);

  // Klick außerhalb der Vorschläge schließt die Liste
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddressConversion = async () => {
    if (!address.trim()) {
      setError("Bitte geben Sie eine Adresse ein.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // MapBox Geocoding API verwenden
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${MAPBOX_TOKEN}&country=de&limit=1`
      );

      if (!response.ok) {
        throw new Error("Fehler bei der Adresssuche. Bitte versuchen Sie es später erneut.");
      }

      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        setError("Keine Ergebnisse für diese Adresse gefunden.");
        setCoordinates(null);
        return;
      }

      // MapBox gibt Koordinaten als [lng, lat] zurück, wir drehen sie um
      const [lng, lat] = data.features[0].center;
      
      setCoordinates({ lat, lng });
      
      // Callback für die übergeordnete Komponente, falls vorhanden
      if (onCoordinatesFound) {
        onCoordinatesFound(lat, lng);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.");
      setCoordinates(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.place_name);
    setShowSuggestions(false);
    
    // MapBox gibt Koordinaten als [lng, lat] zurück, wir drehen sie um
    const [lng, lat] = suggestion.center;
    setCoordinates({ lat, lng });
    
    // Callback für die übergeordnete Komponente, falls vorhanden
    if (onCoordinatesFound) {
      onCoordinatesFound(lat, lng);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-md flex items-center">
          <MapIcon className="h-5 w-5 mr-2 text-primary" />
          Adresse in Koordinaten umrechnen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Adresse eingeben (z.B. Hauptstraße 1, Berlin)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddressConversion();
                      setShowSuggestions(false);
                    } else if (e.key === "ArrowDown" && suggestions.length > 0) {
                      // Focus auf die erste Vorschlag setzen
                      const firstSuggestion = document.querySelector('[data-suggestion]') as HTMLElement;
                      if (firstSuggestion) firstSuggestion.focus();
                    } else if (e.key === "Escape") {
                      setShowSuggestions(false);
                    }
                  }}
                  className="flex-1"
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                />
                
                {/* Adressvorschläge */}
                {showSuggestions && suggestions.length > 0 && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute z-[9999] mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  >
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSuggestionClick(suggestion);
                          } else if (e.key === "ArrowDown") {
                            // Nächste Vorschlag fokussieren
                            const nextElement = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                            if (nextElement) nextElement.focus();
                          } else if (e.key === "ArrowUp") {
                            // Vorherige Vorschlag fokussieren
                            const prevElement = (e.target as HTMLElement).previousElementSibling as HTMLElement;
                            if (prevElement) prevElement.focus();
                            else {
                              // Zurück zum Eingabefeld
                              const inputElement = document.querySelector('input[placeholder*="Adresse"]') as HTMLElement;
                              if (inputElement) inputElement.focus();
                            }
                          } else if (e.key === "Escape") {
                            setShowSuggestions(false);
                          }
                        }}
                        className="cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-primary/10 focus:bg-primary/10 outline-none"
                        data-suggestion
                        tabIndex={0}
                      >
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-primary" />
                          <span className="truncate">{suggestion.place_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleAddressConversion} 
                disabled={isLoading || !address.trim()}
                className="bg-[#6a961f] hover:bg-[#5a8418] text-white"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                {isLoading ? "Suche..." : "Suchen"}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {coordinates && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center">
                <CheckIcon className="h-4 w-4 mr-2 text-[#6a961f]" />
                <h3 className="text-sm font-medium">Gefundene Koordinaten:</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs text-muted-foreground">Breitengrad (Latitude):</p>
                  <div className="flex items-center">
                    <Input 
                      value={coordinates.lat.toFixed(6)} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2" 
                      onClick={() => handleCopyToClipboard(coordinates.lat.toFixed(6))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <p className="text-xs text-muted-foreground">Längengrad (Longitude):</p>
                  <div className="flex items-center">
                    <Input 
                      value={coordinates.lng.toFixed(6)} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2" 
                      onClick={() => handleCopyToClipboard(coordinates.lng.toFixed(6))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {onCoordinatesFound && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => onCoordinatesFound(coordinates.lat, coordinates.lng)}
                    className="text-xs"
                    size="sm"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    In Formular übernehmen
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}