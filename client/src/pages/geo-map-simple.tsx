import React, { useState, useRef } from 'react';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  BarChart, 
  Save, 
  Trash2 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Chart-Komponenten
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Neue Google Maps-Komponente mit Suchfunktion
import SearchableGoogleMap from '@/components/maps/searchable-google-map';

// Typdefinitionen
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

const GeoMapSimple: React.FC = () => {
  // State für Adressen
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  
  // State für die Route und Distanz
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{lat: number, lng: number}>>([]);
  const [distance, setDistance] = useState(0);
  
  // State für Höhendaten
  const [elevationData, setElevationData] = useState<ElevationResponse | null>(null);
  const [showElevationChart, setShowElevationChart] = useState(false);
  
  // Loading-State
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Referenz auf die Kartenkomponente
  const mapRef = useRef<{ searchAddress: (address: string) => Promise<void> }>(null);
  
  // Toast-Hook
  const { toast } = useToast();
  
  // Handler für Routenänderungen
  const handleRouteChange = (route: Array<{lat: number, lng: number}>) => {
    setRouteCoordinates(route);
    
    // Distanz berechnen
    if (route.length >= 2) {
      let totalDistance = 0;
      
      for (let i = 1; i < route.length; i++) {
        const p1 = new google.maps.LatLng(route[i-1].lat, route[i-1].lng);
        const p2 = new google.maps.LatLng(route[i].lat, route[i].lng);
        
        // Distanz in Metern
        const segmentDistance = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
        totalDistance += segmentDistance;
      }
      
      // Umrechnung in Kilometer mit 2 Nachkommastellen
      setDistance(parseFloat((totalDistance / 1000).toFixed(2)));
    } else {
      setDistance(0);
    }
  };
  
  // Handler zum Löschen aller Marker
  const clearMarkers = () => {
    setRouteCoordinates([]);
    setDistance(0);
    setShowElevationChart(false);
  };
  
  // Höhendaten von der Google Elevation API abrufen
  const fetchElevationData = async () => {
    // Prüfen, ob wir Routenpunkte haben
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
    
    try {
      // Zeige Verarbeitungshinweis
      toast({
        title: "Verarbeitung",
        description: "Höhenprofilsdaten werden abgerufen...",
      });
      
      // API-Anfrage senden
      const response = await apiRequest(
        "POST", 
        "/api/elevation", 
        {
          path: routeCoordinates,
          samples: 256 // Anzahl der Samples entlang der Route
        }
      );
      
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
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
      
      if (errorMessage.includes("aborted") || errorMessage.includes("abort")) {
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
  
  // Route speichern
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
        <h1 className="text-2xl font-bold">Streckenplanung für Tiefbau (Vereinfacht)</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Adresseingabe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startAddress">Startadresse:</Label>
              <div className="flex space-x-2">
                <Input 
                  id="startAddress"
                  placeholder="Startadresse eingeben" 
                  value={startAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartAddress(e.target.value)}
                />
                <Button 
                  size="sm" 
                  disabled={searchLoading}
                  onClick={async () => {
                    if (!startAddress.trim()) {
                      toast({
                        title: "Fehler",
                        description: "Bitte geben Sie eine Startadresse ein.",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    setSearchLoading(true);
                    try {
                      if (mapRef.current) {
                        await mapRef.current.searchAddress(startAddress);
                      }
                    } catch (error) {
                      console.error('Fehler bei der Adresssuche:', error);
                    } finally {
                      setSearchLoading(false);
                    }
                  }}
                >
                  {searchLoading ? 'Suche...' : 'Suchen'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endAddress">Zieladresse:</Label>
              <div className="flex space-x-2">
                <Input 
                  id="endAddress"
                  placeholder="Zieladresse eingeben" 
                  value={endAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndAddress(e.target.value)}
                />
                <Button 
                  size="sm"
                  disabled={searchLoading}
                  onClick={async () => {
                    if (!endAddress.trim()) {
                      toast({
                        title: "Fehler",
                        description: "Bitte geben Sie eine Zieladresse ein.",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    setSearchLoading(true);
                    try {
                      if (mapRef.current) {
                        await mapRef.current.searchAddress(endAddress);
                      }
                    } catch (error) {
                      console.error('Fehler bei der Adresssuche:', error);
                    } finally {
                      setSearchLoading(false);
                    }
                  }}
                >
                  {searchLoading ? 'Suche...' : 'Suchen'}
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">
              <strong>Hinweis:</strong> Alternativ können Sie auch direkt in der Karte nach Adressen suchen, indem Sie das Suchfeld oben links in der Karte verwenden.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Kartenansicht</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchableGoogleMap
            onRouteChange={handleRouteChange}
            onMarkersCleared={clearMarkers}
            defaultCenter={{ lat: 48.137154, lng: 11.576124 }} // München
            defaultZoom={12}
            mapRef={mapRef}
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

export default GeoMapSimple;