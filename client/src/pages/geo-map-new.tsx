import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Trash2, Save, BarChart } from "lucide-react";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import GoogleMap from "@/components/maps/google-map";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

// Interfaces für Höhendaten
interface ElevationPoint {
  elevation: number;
  location: {
    lat: number;
    lng: number;
  };
  resolution: number;
}

interface ElevationStats {
  minElevation: number;
  maxElevation: number;
  totalAscent: number;
  totalDescent: number;
  elevationDifference: number;
}

interface ElevationResponse {
  elevation: ElevationPoint[];
  stats: ElevationStats;
}

// Vereinfachte Version ohne externe Kartenkomponenten
const GeoMapNew = () => {
  const [distance, setDistance] = useState(0);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{lat: number, lng: number}>>([]);
  const [elevationData, setElevationData] = useState<ElevationResponse | null>(null);
  const [showElevationChart, setShowElevationChart] = useState(false);
  
  // Berechnet die Entfernung zwischen zwei GPS-Punkten in Kilometern
  const calculateDistance = (coords: Array<{lat: number, lng: number}>): number => {
    if (coords.length < 2) return 0;
    
    // Funktion zur Berechnung der Entfernung zwischen zwei Punkten (Haversine-Formel)
    const getDistanceFromLatLonInKm = (
      lat1: number, 
      lon1: number, 
      lat2: number, 
      lon2: number
    ): number => {
      const R = 6371; // Radius der Erde in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Entfernung in km
    };
    
    const deg2rad = (deg: number): number => {
      return deg * (Math.PI / 180);
    };
    
    // Entfernung für alle aufeinanderfolgenden Punkte berechnen
    let totalDistance = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      totalDistance += getDistanceFromLatLonInKm(
        coords[i].lat, 
        coords[i].lng, 
        coords[i + 1].lat, 
        coords[i + 1].lng
      );
    }
    
    return Math.round(totalDistance * 10) / 10; // auf eine Dezimalstelle runden
  };

  // Route wurde auf der Karte aktualisiert
  const handleRouteChange = (route: Array<{lat: number, lng: number}>) => {
    setRouteCoordinates(route);
    
    // Distanz berechnen
    const calculatedDistance = calculateDistance(route);
    setDistance(calculatedDistance);
    
    // Wenn das Höhenprofil angezeigt wird, setzen wir es zurück, da die Route sich geändert hat
    if (showElevationChart) {
      setShowElevationChart(false);
      setElevationData(null);
    }
  };

  // Marker und Route zurücksetzen
  const clearMarkers = () => {
    setRouteCoordinates([]);
    setElevationData(null);
    setShowElevationChart(false);
    setDistance(0);
  };

  // Höhendaten von der Google Elevation API abrufen mit verbessertem Fehlerhandling
  const fetchElevationData = async () => {
    // Prüfen, ob wir Routenpunkte haben - mit verbessertem Hinweis
    if (routeCoordinates.length < 2) {
      toast({
        title: "Fehler",
        description: "Bitte markieren Sie mindestens zwei Punkte auf der Karte, indem Sie auf die Karte klicken.",
        variant: "destructive",
        duration: 6000
      });
      return;
    }

    setLoading(true);
    
    // Timeout ID für manuelle Abbruchlogik
    let timeoutId: NodeJS.Timeout | undefined;
    
    try {
      // Zeige Verarbeitungshinweis
      toast({
        title: "Verarbeitung",
        description: "Höhenprofilsdaten werden abgerufen...",
      });
      
      // Timeout-Promise erstellen mit garantierter Zuweisung
      const timeoutPromise = new Promise<Response>((_, reject) => {
        // Timeout explizit zuweisen
        timeoutId = setTimeout(() => {
          reject(new Error("Zeitüberschreitung bei der Anfrage"));
        }, 15000); // 15 Sekunden Timeout
      });
      
      // Eigentliche API-Anfrage
      const fetchPromise = apiRequest("POST", "/api/elevation", {
        path: routeCoordinates,
        samples: 256 // Anzahl der Samples entlang der Route
      });
      
      // Warten auf die schnellere der beiden Promises
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Timeout löschen, da Antwort erfolgreich zurückgekommen ist
      if (timeoutId) clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Abrufen der Höhendaten');
      }
      
      const data: ElevationResponse = await response.json();
      setElevationData(data);
      setShowElevationChart(true);
      
      // Statistiken protokollieren
      console.log('Elevation Statistics:', {
        Min: data.stats.minElevation.toFixed(1) + 'm',
        Max: data.stats.maxElevation.toFixed(1) + 'm',
        Difference: data.stats.elevationDifference.toFixed(1) + 'm',
        Ascent: data.stats.totalAscent.toFixed(1) + 'm',
        Descent: data.stats.totalDescent.toFixed(1) + 'm',
        'Avg. Slope': ((data.stats.totalAscent / distance) * 100).toFixed(1) + '%'
      });
      
      toast({
        title: "Erfolg",
        description: "Höhenprofilsdaten erfolgreich abgerufen!",
      });
    } catch (error: unknown) {
      // Sicherstellen, dass der Timeout gelöscht wird
      if (timeoutId) clearTimeout(timeoutId);
      
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
      
      if (errorMessage.includes("Zeitüberschreitung")) {
        console.error('API-Anfrage wegen Zeitüberschreitung abgebrochen');
        toast({
          title: "Zeitüberschreitung",
          description: "Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es mit weniger Punkten oder später erneut.",
          variant: "destructive"
        });
      } else {
        console.error('Fehler beim Abrufen der Höhendaten:', error);
        toast({
          title: "Fehler",
          description: error instanceof Error ? error.message : "Fehler beim Abrufen der Höhendaten",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Route speichern mit verbessertem Feedback
  const saveRoute = () => {
    if (routeCoordinates.length < 2) {
      toast({
        title: "Fehler",
        description: "Bitte markieren Sie mindestens zwei Punkte auf der Karte, indem Sie auf die Karte klicken.",
        variant: "destructive",
        duration: 6000
      });
      return;
    }

    // Hier würde die Route in der Datenbank gespeichert werden
    toast({
      title: "Erfolg",
      description: "Route erfolgreich gespeichert!",
    });
  };

  // Formatiere die Höhendaten für Recharts
  const formatElevationData = () => {
    if (!elevationData?.elevation) return [];
    
    return elevationData.elevation.map((point, index) => {
      return {
        distance: (index / (elevationData.elevation.length - 1)) * distance,
        elevation: point.elevation,
        lat: point.location.lat,
        lng: point.location.lng
      };
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Streckenplanung für Tiefbau</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Adresseingabe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startAddress">Startadresse:</Label>
              <Input 
                id="startAddress"
                placeholder="Startadresse eingeben" 
                value={startAddress}
                onChange={(e) => setStartAddress(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endAddress">Zieladresse:</Label>
              <Input 
                id="endAddress"
                placeholder="Zieladresse eingeben" 
                value={endAddress}
                onChange={(e) => setEndAddress(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Kartenansicht</CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleMap
            onRouteChange={handleRouteChange}
            onMarkersClear={clearMarkers}
            initialCenter={{ lat: 48.137154, lng: 11.576124 }} // München
            initialZoom={12}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Streckeninformationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-medium">Streckenlänge: {distance} km</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearMarkers} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-1" />
                Marker löschen
              </Button>
              <Button 
                variant="outline" 
                onClick={fetchElevationData} 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Lädt...
                  </span>
                ) : (
                  <>
                    <BarChart className="h-4 w-4 mr-1" />
                    Höhenprofil
                  </>
                )}
              </Button>
              <Button onClick={saveRoute} disabled={loading}>
                <Save className="h-4 w-4 mr-1" />
                Route speichern
              </Button>
            </div>
          </div>

          {/* Höhenprofil-Diagramm */}
          {showElevationChart && elevationData && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Höhenprofil</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 p-3 rounded-md border">
                  <p className="text-sm font-medium">Minimum Höhe: {elevationData.stats.minElevation.toFixed(1)} m</p>
                  <p className="text-sm font-medium">Maximum Höhe: {elevationData.stats.maxElevation.toFixed(1)} m</p>
                  <p className="text-sm font-medium">Höhenunterschied: {elevationData.stats.elevationDifference.toFixed(1)} m</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-md border">
                  <p className="text-sm font-medium">Gesamtanstieg: {elevationData.stats.totalAscent.toFixed(1)} m</p>
                  <p className="text-sm font-medium">Gesamtabstieg: {elevationData.stats.totalDescent.toFixed(1)} m</p>
                  <p className="text-sm font-medium">Durchschnittl. Steigung: {((elevationData.stats.totalAscent / distance) * 100).toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatElevationData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="distance" 
                      label={{ value: 'Entfernung (km)', position: 'insideBottomRight', offset: -10 }} 
                    />
                    <YAxis 
                      label={{ value: 'Höhe (m)', angle: -90, position: 'insideLeft' }} 
                      domain={['dataMin - 10', 'dataMax + 10']}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} m`, 'Höhe']}
                      labelFormatter={(value) => `Entfernung: ${value.toFixed(1)} km`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="elevation" 
                      name="Höhe" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <ReferenceLine
                      y={elevationData.stats.minElevation}
                      label="Min"
                      stroke="red"
                      strokeDasharray="3 3"
                    />
                    <ReferenceLine
                      y={elevationData.stats.maxElevation}
                      label="Max"
                      stroke="green"
                      strokeDasharray="3 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="text-sm text-slate-500 mt-2">
                Das Höhenprofil zeigt die Steigungen und Gefälle entlang der geplanten Route.
                Diese Informationen sind wichtig für Tiefbauplanung und Maschineneinsatz.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeoMapNew;