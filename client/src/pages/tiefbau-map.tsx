import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  BarChart, 
  Save, 
  Trash2,
  Map,
  Shovel,
  Truck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Vereinfachter DOM-basierter Google Maps-Komponente
import BasicGoogleMap from '@/components/maps/basic-google-map';

// Elevation Chart
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

interface Bodenart {
  id: number;
  name: string;
  beschreibung: string;
  dichte: number;
  belastungsklasse: string;
  material_kosten_pro_m2: number;
  bearbeitungshinweise: string;
}

interface Maschine {
  id: number;
  name: string;
  typ: string;
  beschreibung: string;
  leistung: string;
  kosten_pro_stunde: number;
  kosten_pro_tag: number;
  kosten_pro_woche: number;
  kraftstoffverbrauch: number;
  gewicht: number;
  bild_url?: string;
}

const TiefbauMap: React.FC = () => {
  // State für die Route und Distanz
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{lat: number, lng: number}>>([]);
  const [distance, setDistance] = useState(0);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  
  // State für Höhendaten
  const [elevationData, setElevationData] = useState<ElevationResponse | null>(null);
  const [showElevationChart, setShowElevationChart] = useState(false);
  
  // State für Bodenarten und Maschinen
  const [bodenarten, setBodenarten] = useState<Bodenart[]>([]);
  const [selectedBodenart, setSelectedBodenart] = useState<string>('');
  const [maschinen, setMaschinen] = useState<Maschine[]>([]);
  const [filteredMaschinen, setFilteredMaschinen] = useState<Maschine[]>([]);
  
  // State für Kosten
  const [streckenkostenProM2, setStreckenkostenProM2] = useState(0);
  const [gesamtstreckenkosten, setGesamtstreckenkosten] = useState(0);
  
  // Loading-State
  const [loading, setLoading] = useState(false);
  
  // Toast-Hook
  const { toast } = useToast();
  
  // Lade Bodenarten beim ersten Laden
  useEffect(() => {
    // Dummy-Daten für Bodenarten
    const dummyBodenarten: Bodenart[] = [
      {
        id: 1,
        name: 'Asphaltbeton',
        beschreibung: 'Standard-Asphaltbelag für Straßen',
        dichte: 2400,
        belastungsklasse: 'SLW 60',
        material_kosten_pro_m2: 25.50,
        bearbeitungshinweise: 'Verdichtung mit Walzen erforderlich'
      },
      {
        id: 2,
        name: 'Sandboden',
        beschreibung: 'Lockerer Sandboden',
        dichte: 1600,
        belastungsklasse: 'SLW 30',
        material_kosten_pro_m2: 6.80,
        bearbeitungshinweise: 'Leicht zu bearbeiten, benötigt Stabilisierung'
      },
      {
        id: 3,
        name: 'Lehmboden',
        beschreibung: 'Bindiger Lehmboden',
        dichte: 1800,
        belastungsklasse: 'SLW 40',
        material_kosten_pro_m2: 8.20,
        bearbeitungshinweise: 'Bei Nässe schwer zu bearbeiten'
      },
      {
        id: 4,
        name: 'Kiesboden',
        beschreibung: 'Kies mit verschiedenen Korngrößen',
        dichte: 1900,
        belastungsklasse: 'SLW 50',
        material_kosten_pro_m2: 12.40,
        bearbeitungshinweise: 'Gute Drainage, einfach zu verdichten'
      },
      {
        id: 5,
        name: 'Fels',
        beschreibung: 'Harter Felsuntergrund',
        dichte: 2700,
        belastungsklasse: 'SLW 60',
        material_kosten_pro_m2: 42.00,
        bearbeitungshinweise: 'Sprengung oder schwere Maschinen erforderlich'
      }
    ];

    setBodenarten(dummyBodenarten);

    // Dummy-Daten für Maschinen
    const dummyMaschinen: Maschine[] = [
      {
        id: 1,
        name: 'CAT 320',
        typ: 'Bagger',
        beschreibung: '20-Tonnen Hydraulikbagger',
        leistung: '120 kW',
        kosten_pro_stunde: 120.50,
        kosten_pro_tag: 950.00,
        kosten_pro_woche: 4500.00,
        kraftstoffverbrauch: 18.5,
        gewicht: 20000
      },
      {
        id: 2,
        name: 'Bomag BW 213',
        typ: 'Walze',
        beschreibung: 'Vibrationswalze für Erdarbeiten',
        leistung: '98 kW',
        kosten_pro_stunde: 85.00,
        kosten_pro_tag: 680.00,
        kosten_pro_woche: 3200.00,
        kraftstoffverbrauch: 12.0,
        gewicht: 12500
      },
      {
        id: 3,
        name: 'Wirtgen W 100',
        typ: 'Fräse',
        beschreibung: 'Kompakte Kaltfräse',
        leistung: '170 kW',
        kosten_pro_stunde: 210.00,
        kosten_pro_tag: 1680.00,
        kosten_pro_woche: 8000.00,
        kraftstoffverbrauch: 35.0,
        gewicht: 18000
      },
      {
        id: 4,
        name: 'Vögele Super 1800-3',
        typ: 'Asphaltfertiger',
        beschreibung: 'Straßenfertiger mit hoher Einbaubreite',
        leistung: '129 kW',
        kosten_pro_stunde: 230.00,
        kosten_pro_tag: 1840.00,
        kosten_pro_woche: 8800.00,
        kraftstoffverbrauch: 30.0,
        gewicht: 19000
      },
      {
        id: 5,
        name: 'Liebherr PR 736',
        typ: 'Planierraupe',
        beschreibung: 'Hydrostatische Planierraupe',
        leistung: '150 kW',
        kosten_pro_stunde: 140.00,
        kosten_pro_tag: 1120.00,
        kosten_pro_woche: 5300.00,
        kraftstoffverbrauch: 22.0,
        gewicht: 20170
      }
    ];

    setMaschinen(dummyMaschinen);
    setFilteredMaschinen(dummyMaschinen);
    
    // Später API-Anfrage
    // In einer echten Implementierung würden wir hier die API-Endpunkte abfragen
    // const fetchData = async () => {
    //   try {
    //     const bodenResponse = await apiRequest("GET", "/api/bodenarten");
    //     if (bodenResponse.ok) {
    //       const bodenData = await bodenResponse.json();
    //       setBodenarten(bodenData);
    //     }
    //     
    //     const maschinenResponse = await apiRequest("GET", "/api/maschinen");
    //     if (maschinenResponse.ok) {
    //       const maschinenData = await maschinenResponse.json();
    //       setMaschinen(maschinenData);
    //       setFilteredMaschinen(maschinenData);
    //     }
    //   } catch (error) {
    //     console.error("Fehler beim Laden der Daten:", error);
    //     toast({
    //       title: "Fehler",
    //       description: "Die Daten konnten nicht geladen werden.",
    //       variant: "destructive"
    //     });
    //   }
    // };
    // fetchData();
  }, []);
  
  // Berechne die Kosten, wenn sich Bodenart oder Strecke ändert
  useEffect(() => {
    if (selectedBodenart && distance > 0) {
      const bodenart = bodenarten.find(b => b.id.toString() === selectedBodenart);
      if (bodenart) {
        // Annahme: 3m Breite für die Straße
        const strassenBreite = 3;
        const flaeche = distance * 1000 * strassenBreite; // in m²
        const kostenProM2 = bodenart.material_kosten_pro_m2;
        const gesamtkosten = flaeche * kostenProM2;
        
        setStreckenkostenProM2(kostenProM2);
        setGesamtstreckenkosten(gesamtkosten);
      }
    }
  }, [selectedBodenart, distance, bodenarten]);
  
  // Handler für Routenänderungen
  const handleRouteChange = (
    route: Array<{lat: number, lng: number}>, 
    startAddr?: string, 
    endAddr?: string
  ) => {
    setRouteCoordinates(route);
    
    // Start- und Endadressen setzen, wenn vorhanden
    if (startAddr) {
      setStartAddress(startAddr);
    }
    
    if (endAddr) {
      setEndAddress(endAddr);
    }
    
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
    setStartAddress('');
    setEndAddress('');
    setShowElevationChart(false);
  };
  
  // Höhendaten von der Google Elevation API abrufen
  const fetchElevationData = async () => {
    // Prüfen, ob wir Routenpunkte haben
    if (routeCoordinates.length < 2) {
      toast({
        title: "Fehler",
        description: "Bitte markieren Sie mindestens zwei Punkte auf der Karte.",
        variant: "destructive",
        duration: 6000
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // API-Anfrage senden
      const response = await apiRequest(
        "POST", 
        "/api/elevation", 
        {
          path: routeCoordinates,
          samples: 100 // Anzahl der Samples entlang der Route
        }
      );
      
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
    } catch (error: any) {
      console.error('Fehler beim Abrufen der Höhendaten:', error);
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Abrufen der Höhendaten",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Filtere Maschinen nach Bodenart
  const filterMaschinenByBodenart = (bodenartId: string) => {
    if (!bodenartId) {
      setFilteredMaschinen(maschinen);
      return;
    }
    
    // In einer echten Implementierung würden wir hier die API abfragen
    // für Maschinen, die für eine bestimmte Bodenart geeignet sind
    // Für diese Dummy-Implementierung filtern wir zufällig
    const filtered = maschinen.filter(maschine => {
      // Zufällige Auswahl für Demo-Zwecke
      return Math.random() > 0.3;
    });
    
    setFilteredMaschinen(filtered);
  };
  
  // Route speichern
  const saveRoute = async () => {
    if (routeCoordinates.length < 2) {
      toast({
        title: "Fehler",
        description: "Bitte markieren Sie mindestens zwei Punkte auf der Karte.",
        variant: "destructive",
        duration: 6000
      });
      return;
    }
    
    // Prüfen, ob Start- und Endadresse gesetzt sind
    if (!startAddress || !endAddress) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Start- und Zieladresse ein.",
        variant: "destructive",
        duration: 6000
      });
      return;
    }
    
    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Route von ${startAddress.split(',')[0]} nach ${endAddress.split(',')[0]}`,
          start_address: startAddress,
          end_address: endAddress,
          distance: Math.round(distance),
          route_data: routeCoordinates
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Speichern der Route');
      }
      
      const data = await response.json();
      toast({
        title: "Erfolg",
        description: `Route "${data.name}" erfolgreich gespeichert!`,
        duration: 5000
      });
    } catch (error: any) {
      console.error('Fehler beim Speichern der Route:', error);
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Speichern der Route",
        variant: "destructive",
        duration: 6000
      });
    }
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
        <h1 className="text-2xl font-bold">Tiefbau-Streckenplanung</h1>
      </div>
      
      <Tabs defaultValue="karte" className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="karte">
            <Map className="h-4 w-4 mr-2" />
            Kartenansicht
          </TabsTrigger>
          <TabsTrigger value="bodenanalyse">
            <Shovel className="h-4 w-4 mr-2" />
            Bodenanalyse
          </TabsTrigger>
          <TabsTrigger value="maschinen">
            <Truck className="h-4 w-4 mr-2" />
            Maschinenplanung
          </TabsTrigger>
        </TabsList>
        
        {/* Kartenansicht Tab */}
        <TabsContent value="karte" className="pt-4">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Kartenansicht</CardTitle>
            </CardHeader>
            <CardContent>
              <BasicGoogleMap
                onRouteChange={handleRouteChange}
                onMarkersClear={clearMarkers}
                initialCenter={{ lat: 48.137154, lng: 11.576124 }} // München
                initialZoom={12}
                searchOutsideMap={true} // Adresssuche außerhalb der Karte platzieren
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
                    Strecke löschen
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Bodenanalyse Tab */}
        <TabsContent value="bodenanalyse" className="pt-4">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Bodenarten Analyse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium mb-4">Verfügbare Bodenarten</h3>
                  <div className="space-y-2">
                    <Label htmlFor="bodenartSelect">Bodenart auswählen:</Label>
                    <Select 
                      value={selectedBodenart}
                      onValueChange={(value) => {
                        setSelectedBodenart(value);
                        filterMaschinenByBodenart(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Bodenart auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {bodenarten.map((bodenart) => (
                          <SelectItem key={bodenart.id} value={bodenart.id.toString()}>
                            {bodenart.name} - {bodenart.belastungsklasse}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Belastungsklassen</h3>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 text-left border">Klasse</th>
                          <th className="p-2 text-left border">Anwendung</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border">SLW 30</td>
                          <td className="p-2 border">Gehwege, Fahrradwege</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">SLW 40</td>
                          <td className="p-2 border">Wohnstraßen, Parkplätze</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">SLW 50</td>
                          <td className="p-2 border">Sammelstraßen, Gewerbegebiete</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">SLW 60</td>
                          <td className="p-2 border">Hauptverkehrsstraßen, Industrie</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  {selectedBodenart ? (
                    <div>
                      {bodenarten.filter(b => b.id.toString() === selectedBodenart).map(bodenart => (
                        <div key={bodenart.id}>
                          <h3 className="text-lg font-medium mb-4">{bodenart.name} Details</h3>
                          
                          <div className="bg-slate-50 p-4 rounded-md border mb-4">
                            <p className="mb-2">{bodenart.beschreibung}</p>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div>
                                <p className="text-sm text-slate-500">Dichte:</p>
                                <p className="font-medium">{bodenart.dichte} kg/m³</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500">Belastungsklasse:</p>
                                <p className="font-medium">{bodenart.belastungsklasse}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500">Materialkosten:</p>
                                <p className="font-medium">{bodenart.material_kosten_pro_m2.toFixed(2)} €/m²</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 p-4 rounded-md border">
                            <h4 className="font-medium mb-2">Bearbeitungshinweise:</h4>
                            <p>{bodenart.bearbeitungshinweise}</p>
                          </div>
                          
                          {distance > 0 && (
                            <div className="mt-6 bg-blue-50 p-4 rounded-md border border-blue-200">
                              <h4 className="font-medium mb-2">Kostenberechnung für aktuelle Strecke:</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-slate-500">Streckenlänge:</p>
                                  <p className="font-medium">{distance} km</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">Materialkosten:</p>
                                  <p className="font-medium">{streckenkostenProM2.toFixed(2)} €/m²</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">Straßenbreite (angenommen):</p>
                                  <p className="font-medium">3 m</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">Gesamtfläche:</p>
                                  <p className="font-medium">{(distance * 1000 * 3).toFixed(0)} m²</p>
                                </div>
                              </div>
                              <div className="mt-4 pt-2 border-t border-blue-200">
                                <p className="text-lg font-bold">Gesamtkosten für Material: {gesamtstreckenkosten.toFixed(2)} €</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8 bg-slate-50 rounded-md border">
                        <Shovel className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Keine Bodenart ausgewählt</h3>
                        <p className="text-slate-500">Bitte wählen Sie eine Bodenart aus der Liste, um Details anzuzeigen.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Maschinenplanung Tab */}
        <TabsContent value="maschinen" className="pt-4">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Maschinenplanung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Verfügbare Maschinen</h3>
                {selectedBodenart ? (
                  <p className="mb-4">
                    Geeignete Maschinen für {bodenarten.find(b => b.id.toString() === selectedBodenart)?.name || ''}
                  </p>
                ) : (
                  <p className="mb-4 text-orange-500">
                    Bitte wählen Sie im Tab "Bodenanalyse" eine Bodenart aus, um passende Maschinen zu sehen.
                  </p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMaschinen.map((maschine) => (
                    <div key={maschine.id} className="bg-white border rounded-md shadow-sm overflow-hidden">
                      <div className="bg-slate-100 p-3 border-b">
                        <h4 className="font-medium text-lg">{maschine.name}</h4>
                        <p className="text-sm text-slate-500">{maschine.typ}</p>
                      </div>
                      <div className="p-4">
                        <p className="mb-3">{maschine.beschreibung}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-slate-500">Leistung:</p>
                            <p>{maschine.leistung}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Gewicht:</p>
                            <p>{maschine.gewicht} kg</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Verbrauch:</p>
                            <p>{maschine.kraftstoffverbrauch} l/h</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Kosten pro Stunde:</p>
                            <p>{maschine.kosten_pro_stunde.toFixed(2)} €</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-sm text-slate-500">Tagespreis:</p>
                              <p className="font-medium">{maschine.kosten_pro_tag.toFixed(2)} €</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Wochenpreis:</p>
                              <p className="font-medium">{maschine.kosten_pro_woche.toFixed(2)} €</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TiefbauMap;