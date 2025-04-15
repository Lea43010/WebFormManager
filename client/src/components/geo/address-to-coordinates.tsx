import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, ArrowRight, Copy } from "lucide-react";
import { MAPBOX_TOKEN } from "@/config/mapbox";

interface AddressToCoordinatesProps {
  onCoordinatesFound?: (lat: number, lng: number) => void;
}

export function AddressToCoordinates({ onCoordinatesFound }: AddressToCoordinatesProps) {
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-md">Adresse in Koordinaten umrechnen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Adresse eingeben (z.B. Hauptstraße 1, Berlin)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddressConversion();
                }
              }}
              className="flex-1"
            />
            <Button 
              onClick={handleAddressConversion} 
              disabled={isLoading || !address.trim()}
              className="bg-[#6a961f] hover:bg-[#5a8418] text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
              {isLoading ? "Suche..." : "Suchen"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {coordinates && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-[#6a961f]" />
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