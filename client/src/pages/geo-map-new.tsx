import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Trash2, Save, BarChart } from "lucide-react";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  
  // Vereinfachte Funktionen für die Karteninteraktion
  const handleMapClick = () => {
    toast({
      title: "Info", 
      description: "Kartenklick-Funktion wurde aufgerufen."
    });
  };

  // Marker und Route zurücksetzen
  const clearMarkers = () => {
    setRouteCoordinates([]);
    setElevationData(null);
    setShowElevationChart(false);
    setDistance(0);
    
    toast({
      title: "Info", 
      description: "Marker und Routendaten wurden gelöscht."
    });
  };

  // Für die Demo-Implementierung verwenden wir simulierte Koordinaten
  // Im echten Einsatz würden diese durch die Geocoding-API ermittelt
  const getRouteCoordinates = (): Array<{lat: number, lng: number}> => {
    // Simulierte Route zwischen zwei Punkten mit mehreren Wegpunkten dazwischen
    return [
      { lat: 48.137154, lng: 11.576124 }, // München
      { lat: 48.155004, lng: 11.541371 },
      { lat: 48.173854, lng: 11.506618 },
      { lat: 48.192704, lng: 11.471865 },
      { lat: 48.211554, lng: 11.437112 },
      { lat: 48.230404, lng: 11.402359 }, // Außerhalb von München
    ];
  };

  // Höhendaten von der Google Elevation API abrufen
  const fetchElevationData = async () => {
    if (!startAddress || !endAddress) {
      toast({
        title: "Fehler",
        description: "Bitte Start- und Zieladresse eingeben.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simulierte Routenkoordinaten abrufen (später durch echte Geocoding ersetzen)
      const coordinates = getRouteCoordinates();
      setRouteCoordinates(coordinates);
      
      // Elevation API aufrufen
      const response = await apiRequest("POST", "/api/elevation", {
        path: coordinates,
        samples: 256 // Anzahl der Samples entlang der Route
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Abrufen der Höhendaten');
      }
      
      const data: ElevationResponse = await response.json();
      setElevationData(data);
      setShowElevationChart(true);
      
      toast({
        title: "Erfolg",
        description: "Höhenprofilsdaten erfolgreich abgerufen!",
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Höhendaten:', error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Fehler beim Abrufen der Höhendaten",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Route speichern
  const saveRoute = () => {
    if (!startAddress || !endAddress) {
      toast({
        title: "Fehler",
        description: "Bitte Start- und Zieladresse eingeben.",
        variant: "destructive"
      });
      return;
    }

    // Hier würde die Route in der Datenbank gespeichert werden
    toast({
      title: "Erfolg",
      description: "Route erfolgreich gespeichert!",
    });
    
    // Strecke berechnen (später durch echte Distanzberechnung ersetzen)
    const newDistance = Math.floor(Math.random() * 50) + 5; // 5-55 km
    setDistance(newDistance);
  };

  // Einfache Karten-Platzhalter-Komponente
  const SimpleMapPlaceholder = () => (
    <div 
      className="w-full h-[500px] bg-slate-100 rounded-md border-2 border-dashed border-slate-200 flex flex-col items-center justify-center"
      onClick={handleMapClick}
    >
      <MapPin className="h-16 w-16 text-slate-300 mb-4" />
      <h3 className="text-xl font-medium text-slate-700 mb-2">Karte wird geladen</h3>
      <p className="text-slate-500 text-center max-w-md">
        Die Google Maps Komponente wird hier integriert. 
        Klicken Sie auf die Karte, um Wegpunkte zu markieren.
      </p>
    </div>
  );

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
          <SimpleMapPlaceholder />
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