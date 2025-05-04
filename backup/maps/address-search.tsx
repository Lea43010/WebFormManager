import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddressSearchProps {
  onAddressSelected: (lat: number, lng: number, address: string) => void;
  mapboxToken: string;
}

export function AddressSearch({ onAddressSelected, mapboxToken }: AddressSearchProps) {
  const [address, setAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!address.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      // Mapbox Geocoding API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${mapboxToken}&country=de&limit=5`
      );
      
      if (!response.ok) {
        throw new Error("Geocoding-Anfrage fehlgeschlagen");
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setResults(data.features);
      } else {
        setError("Keine Ergebnisse für diese Adresse gefunden");
        setResults([]);
      }
    } catch (err) {
      setError("Fehler bei der Adresssuche: " + (err instanceof Error ? err.message : String(err)));
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (feature: any) => {
    const [lng, lat] = feature.center;
    onAddressSelected(lat, lng, feature.place_name);
    setResults([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Adresse eingeben..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1"
        />
        <Button 
          onClick={handleSearch} 
          disabled={isSearching || !address.trim()}
          variant="secondary"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {results.length > 0 && (
        <div className="bg-white border rounded-md shadow-sm overflow-hidden max-h-60 overflow-y-auto">
          <ul className="divide-y">
            {results.map((feature) => (
              <li 
                key={feature.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleResultClick(feature)}
              >
                <p className="text-sm">{feature.place_name}</p>
                <p className="text-xs text-muted-foreground">
                  {feature.place_type.join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}