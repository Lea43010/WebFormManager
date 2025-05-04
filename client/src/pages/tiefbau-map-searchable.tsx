import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import SearchableGoogleMap from '@/components/maps/searchable-google-map';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface RoutePoint {
  lat: number;
  lng: number;
}

// Verwende eine einfache Funktionsdeklaration ohne expliziten FC-Typ
function TiefbauMapSearchable() {
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [elevationProfile, setElevationProfile] = useState<{height: number, distance: number}[]>([]);
  const [isLoadingElevation, setIsLoadingElevation] = useState(false);
  const [elevationError, setElevationError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Funktion zum Abrufen des Höhenprofils
  const fetchElevationProfile = async () => {
    if (route.length < 2) {
      toast({
        title: "Hinweis",
        description: "Bitte setzen Sie mindestens zwei Marker, um ein Höhenprofil zu erstellen.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
    setIsLoadingElevation(true);
    setElevationError(null);
    
    try {
      if (!window.google || !window.google.maps) {
        throw new Error("Google Maps API nicht verfügbar");
      }
      
      const elevator = new window.google.maps.ElevationService();
      const path = route.map(point => ({ lat: point.lat, lng: point.lng }));
      
      elevator.getElevationAlongPath(
        {
          path,
          samples: 20
        },
        (results: any, status: any) => {
          if (status === "OK" && results) {
            // Ergebnisse aufbereiten
            const profile = results.map((result: any, i: number) => {
              // Abstand berechnen (vereinfacht als Prozent der Gesamtstrecke)
              const distance = i / (results.length - 1) * 100;
              return {
                height: result.elevation,
                distance
              };
            });
            
            setElevationProfile(profile);
            toast({
              title: "Erfolg",
              description: "Höhenprofil wurde erfolgreich berechnet.",
              duration: 3000
            });
          } else {
            setElevationError("Fehler beim Abrufen des Höhenprofils. Bitte versuchen Sie es erneut.");
          }
          setIsLoadingElevation(false);
        }
      );
    } catch (error) {
      console.error('Fehler beim Abrufen des Höhenprofils:', error);
      setElevationError("Fehler beim Abrufen des Höhenprofils. Bitte versuchen Sie es erneut.");
      setIsLoadingElevation(false);
    }
  };
  
  // Handler für Routenänderungen
  const handleRouteChange = (newRoute: RoutePoint[]) => {
    setRoute(newRoute);
    setElevationProfile([]);
  };
  
  // Marker-Lösch-Handler
  const handleMarkersCleared = () => {
    setRoute([]);
    setElevationProfile([]);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tiefbau Kartenansicht</CardTitle>
          <CardDescription>
            Verwenden Sie die Karte, um Routen für Tiefbauprojekte zu planen. Sie können die Adresssuche nutzen oder direkt Marker auf der Karte setzen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchableGoogleMap 
            height="500px"
            defaultCenter={{ lat: 48.137154, lng: 11.576124 }}
            defaultZoom={12}
            onRouteChange={handleRouteChange}
            onMarkersCleared={handleMarkersCleared}
          />
          
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Routeninformationen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium mb-2">Streckenpunkte</h3>
                  {route.length > 0 ? (
                    <div className="text-sm">
                      <div className="mb-2">
                        <span className="font-medium">{route.length}</span> Punkte gesetzt
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {route.map((point, i) => (
                          <div key={i} className="flex items-center text-xs">
                            <MapPin className="h-3 w-3 mr-1 text-primary" />
                            <span>Punkt {i + 1}: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Keine Streckenpunkte gesetzt. Klicken Sie auf die Karte, um Punkte hinzuzufügen.
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Höhenprofil</h3>
                    <Button 
                      size="sm" 
                      onClick={fetchElevationProfile}
                      disabled={route.length < 2 || isLoadingElevation}
                    >
                      {isLoadingElevation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Lade...
                        </>
                      ) : (
                        'Höhenprofil berechnen'
                      )}
                    </Button>
                  </div>
                  
                  {elevationError && (
                    <div className="text-sm text-destructive mb-2">
                      {elevationError}
                    </div>
                  )}
                  
                  {elevationProfile.length > 0 ? (
                    <div className="text-sm">
                      <div className="h-32 flex items-end space-x-1">
                        {elevationProfile.map((point, i) => {
                          // Maximale und minimale Höhen für Normalisierung
                          const minElevation = Math.min(...elevationProfile.map(p => p.height));
                          const maxElevation = Math.max(...elevationProfile.map(p => p.height));
                          const range = maxElevation - minElevation;
                          
                          // Normalisierte Höhe (5% bis 100%)
                          const normalizedHeight = range === 0 
                            ? 20 
                            : 5 + ((point.height - minElevation) / range) * 95;
                          
                          return (
                            <div
                              key={i}
                              className="bg-primary/80 hover:bg-primary relative group flex-grow"
                              style={{ height: `${normalizedHeight}%` }}
                            >
                              <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-secondary text-secondary-foreground text-xs p-1 rounded">
                                {point.height.toFixed(1)}m
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Start</span>
                        <span>Strecke</span>
                        <span>Ende</span>
                      </div>
                      
                      <div className="mt-2">
                        <span className="text-xs font-medium">
                          Höhenunterschied: {' '}
                          {(Math.max(...elevationProfile.map(p => p.height)) - 
                           Math.min(...elevationProfile.map(p => p.height))).toFixed(1)}m
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Kein Höhenprofil verfügbar. Setzen Sie Marker und klicken Sie auf "Höhenprofil berechnen".
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default TiefbauMapSearchable;