import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  BarChart, 
  Save, 
  Trash2,
  Map,
  Shovel,
  FileDown,
  ExternalLink
} from 'lucide-react';
import TiefbauPDFGenerator from '@/components/pdf/tiefbau-pdf-generator';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

const TiefbauMap = () => {
  const { toast } = useToast();
  const pdfRef = useRef<HTMLDivElement>(null);
  
  // State für Elevationsdaten
  const [elevationData, setElevationData] = useState<ElevationPoint[]>([]);
  const [elevationStats, setElevationStats] = useState<ElevationStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State für Routendaten (Name, Start, Ziel, ...)
  const [routeName, setRouteName] = useState('');
  
  // State für Bodenarten
  const [bodenarten, setBodenarten] = useState<Bodenart[]>([]);
  const [selectedBodenart, setSelectedBodenart] = useState<number | null>(null);
  
  // Funktion zum Öffnen eines externen Links in einem neuen Tab
  const handleExternalLink = (url: string, label: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    console.log(`Externer Link geöffnet: ${label}`);
  };

  // State für die Route und Distanz
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{lat: number, lng: number}>>([]);
  const [distance, setDistance] = useState(0);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  
  // State für Projekte
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // Loading-State wurde bereits oben definiert
  // const [loading, setLoading] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  
  // Dummy-Daten für die Entwicklung
  useEffect(() => {
    // Bodenarten laden (API-Anfrage hier einfügen)
    const loadBodenarten = async () => {
      try {
        // API-Anfrage hier einfügen
        // setBodenarten(await response.json());
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
            bearbeitungshinweise: 'Bei Nässe rutschig, Drainage erforderlich'
          },
          {
            id: 4,
            name: 'Fels/Gestein',
            beschreibung: 'Felsiger Untergrund',
            dichte: 2600,
            belastungsklasse: 'SLW 60',
            material_kosten_pro_m2: 42.80,
            bearbeitungshinweise: 'Spezialwerkzeug für Abtragung notwendig'
          },
          {
            id: 5,
            name: 'Kiesboden',
            beschreibung: 'Kies und Schotter',
            dichte: 1900,
            belastungsklasse: 'SLW 50',
            material_kosten_pro_m2: 12.50,
            bearbeitungshinweise: 'Gute Drainageeigenschaften, einfache Verarbeitung'
          }
        ];
        
        setBodenarten(dummyBodenarten);
      } catch (error) {
        console.error('Fehler beim Laden der Bodenarten:', error);
        toast({
          title: "Fehler",
          description: "Bodenarten konnten nicht geladen werden.",
          variant: "destructive",
        });
      }
    };

    // Dummy-Projekte laden
    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        // In einer echten Anwendung würde hier eine API-Anfrage stehen
        setTimeout(() => {
          const dummyProjects = [
            { id: 1, name: 'B299 Ausbau Abschnitt Nord' },
            { id: 2, name: 'Ortsumgehung Ebersberg' },
            { id: 3, name: 'Brückensanierung A9' },
            { id: 4, name: 'Kanalbau Münchner Straße' }
          ];
          setProjects(dummyProjects);
          setIsLoadingProjects(false);
        }, 800);
      } catch (error) {
        console.error('Fehler beim Laden der Projekte:', error);
        setIsLoadingProjects(false);
      }
    };

    loadBodenarten();
    loadProjects();
  }, [toast]);

  // Funktion zum Laden der Elevationsdaten
  const handleLoadElevation = async () => {
    // Diese Funktion würde in einer realen Anwendung 
    // die Elevationsdaten von der Google Maps API laden
    setLoading(true);
    
    try {
      // Simulate API call
      setTimeout(() => {
        // Dummy Routen-Koordinaten (würden von Google Maps API kommen)
        const dummyRouteCoordinates = [
          {lat: 48.135125, lng: 11.581981}, // München Zentrum
          {lat: 48.140000, lng: 11.590000},
          {lat: 48.145000, lng: 11.595000},
          {lat: 48.150000, lng: 11.600000},
          {lat: 48.155000, lng: 11.605000},
          {lat: 48.160000, lng: 11.610000},
          {lat: 48.165000, lng: 11.620000},
          {lat: 48.170000, lng: 11.630000},
          {lat: 48.175000, lng: 11.640000},
          {lat: 48.179932, lng: 11.649252}  // München Bogenhausen
        ];
        
        setRouteCoordinates(dummyRouteCoordinates);
        setDistance(8.7); // km
        setStartAddress('München Zentrum');
        setEndAddress('München Bogenhausen');
        
        // Dummy Elevationsdaten
        const dummyElevationPoints: ElevationPoint[] = dummyRouteCoordinates.map((coord, index) => {
          // Generiere ein hügeliges Höhenprofil mit Sinus-Funktion
          const elevationBase = 520; // Basishöhe in Metern
          const elevationVariation = 15; // Höhenschwankung in Metern
          const frequency = 0.7; // Frequenz der Schwankungen
          
          return {
            elevation: elevationBase + elevationVariation * Math.sin(index * frequency),
            location: coord,
            resolution: 5
          };
        });
        
        // Statistiken berechnen
        const elevations = dummyElevationPoints.map(p => p.elevation);
        const minElevation = Math.min(...elevations);
        const maxElevation = Math.max(...elevations);
        
        // Berechne Gesamtanstiege und -abstiege
        let totalAscent = 0;
        let totalDescent = 0;
        
        for (let i = 1; i < dummyElevationPoints.length; i++) {
          const diff = dummyElevationPoints[i].elevation - dummyElevationPoints[i-1].elevation;
          if (diff > 0) {
            totalAscent += diff;
          } else {
            totalDescent += Math.abs(diff);
          }
        }
        
        const dummyStats: ElevationStats = {
          minElevation,
          maxElevation,
          totalAscent,
          totalDescent,
          elevationDifference: dummyElevationPoints[dummyElevationPoints.length - 1].elevation - dummyElevationPoints[0].elevation
        };
        
        setElevationData(dummyElevationPoints);
        setElevationStats(dummyStats);
        setLoading(false);
        
        toast({
          title: "Daten geladen",
          description: "Höhenprofil erfolgreich erstellt.",
        });
      }, 1500);
      
    } catch (error) {
      console.error('Fehler beim Laden des Höhenprofils:', error);
      setLoading(false);
      toast({
        title: "Fehler",
        description: "Höhenprofil konnte nicht geladen werden.",
        variant: "destructive",
      });
    }
  };

  // Chartdaten für Recharts vorbereiten
  const chartData = elevationData.map((point, index) => ({
    distance: (index / (elevationData.length - 1) * distance).toFixed(1),
    elevation: point.elevation.toFixed(1)
  }));

  const chartDataWithIndex = elevationData.map((point, index) => ({
    index,
    distance: (index / (elevationData.length - 1) * distance).toFixed(1),
    elevation: point.elevation.toFixed(1)
  }));

  // Funktion zum Generieren des PDF-Berichts
  const generatePDF = async () => {
    if (!pdfRef.current) return;
    
    setIsPdfGenerating(true);
    
    try {
      await TiefbauPDFGenerator.generatePDF({
        routeName: routeName || 'Unbenannte Strecke',
        startAddress,
        endAddress,
        distance,
        elevationStats,
        chartData: chartDataWithIndex,
        routeCoordinates,
        selectedBodenart: selectedBodenart ? bodenarten.find(b => b.id === selectedBodenart) : null
      });
      
      toast({
        title: "PDF erstellt",
        description: "Streckenbericht wurde als PDF erstellt und heruntergeladen.",
      });
    } catch (error) {
      console.error('Fehler beim Generieren des PDFs:', error);
      toast({
        title: "Fehler",
        description: "PDF konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="icon" className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Tiefbau Streckenplanung</h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <Label htmlFor="route-name">Streckenname</Label>
          <Input 
            id="route-name"
            placeholder="Name der Strecke eingeben" 
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div className="w-full md:w-1/2">
          <Label htmlFor="project-select">Zum Projekt zuordnen</Label>
          <Select 
            value={selectedProject?.toString() || ""}
            onValueChange={(value) => setSelectedProject(parseInt(value))}
          >
            <SelectTrigger id="project-select" className="mt-1">
              <SelectValue placeholder="Projekt auswählen" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingProjects ? (
                <div className="p-2 text-center text-sm text-gray-500">
                  Projekte werden geladen...
                </div>
              ) : (
                <>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="karte" className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="karte">
            <Map className="h-4 w-4 mr-2" />
            Kartenansicht
          </TabsTrigger>
          <Button 
            className="text-sm rounded-none bg-transparent hover:bg-gray-100 p-2 border-none text-gray-700 hover:text-black flex items-center gap-2 h-9"
            onClick={() => window.open("https://geoportal.bayern.de/denkmalatlas/", "_blank")}
          >
            <Map className="h-4 w-4" />
            DenkmalAtlas
          </Button>
          <Button 
            className="text-sm rounded-none bg-transparent hover:bg-gray-100 p-2 border-none text-gray-700 hover:text-black flex items-center gap-2 h-9"
            onClick={() => window.open("https://geoportal.bayern.de/bayernatlas/", "_blank")}
          >
            <Map className="h-4 w-4" />
            BayernAtlas
          </Button>
          <TabsTrigger value="bund">
            <Map className="h-4 w-4 mr-2" />
            Denkmal-Dienste
          </TabsTrigger>
        </TabsList>
        
        {/* Kartenansicht Tab */}
        <TabsContent value="karte" className="pt-4">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Kartenansicht</CardTitle>
              <CardDescription>Strecke planen und Höhenprofil abrufen</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="border rounded-md overflow-hidden mb-4" style={{height: '400px'}}>
                <BasicGoogleMap />
              </div>
              
              <div className="flex justify-center mb-4">
                <Button 
                  onClick={handleLoadElevation} 
                  disabled={loading}
                  className="mr-2"
                >
                  {loading ? 'Wird geladen...' : 'Höhenprofil laden'}
                </Button>
                
                <Button
                  onClick={() => {
                    toast({
                      title: "Info",
                      description: "Strecke wurde gespeichert.",
                    });
                  }}
                  variant="outline"
                  className="mr-2"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Strecke speichern
                </Button>
                
                <Button
                  variant="outline"
                  className="text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    // Zurücksetzen der Strecke
                    setRouteCoordinates([]);
                    setElevationData([]);
                    setElevationStats(null);
                    setDistance(0);
                    setStartAddress('');
                    setEndAddress('');
                    
                    toast({
                      title: "Info",
                      description: "Strecke wurde zurückgesetzt.",
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Zurücksetzen
                </Button>
              </div>
              
              {elevationData.length > 0 && (
                <div className="border rounded-lg p-4 bg-white mb-4">
                  <h3 className="text-lg font-semibold mb-4">Höhenprofil der Strecke</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Gesamtstrecke</div>
                      <div className="text-xl font-semibold">{distance.toFixed(1)} km</div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Höhendifferenz</div>
                      <div className="text-xl font-semibold">
                        {elevationStats?.elevationDifference.toFixed(1)} m
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Gesamtanstieg</div>
                      <div className="text-xl font-semibold text-green-600">
                        {elevationStats?.totalAscent.toFixed(1)} m
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Gesamtabstieg</div>
                      <div className="text-xl font-semibold text-red-600">
                        {elevationStats?.totalDescent.toFixed(1)} m
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-2 flex justify-between text-sm">
                    <div>{startAddress}</div>
                    <div>{endAddress}</div>
                  </div>
                  
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="distance"
                          label={{ 
                            value: 'Entfernung (km)', 
                            position: 'insideBottomRight', 
                            offset: -5 
                          }}
                        />
                        <YAxis
                          label={{ 
                            value: 'Höhe (m)', 
                            angle: -90, 
                            position: 'insideLeft',
                            offset: -5
                          }}
                          domain={[
                            (dataMin) => Math.floor(dataMin - 5),
                            (dataMax) => Math.ceil(dataMax + 5)
                          ]}
                        />
                        <Tooltip 
                          formatter={(value, name) => [`${value} m`, 'Höhe']}
                          labelFormatter={(label) => `Entfernung: ${label} km`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="elevation" 
                          stroke="#76a730" 
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 5 }}
                        />
                        {elevationStats && (
                          <>
                            <ReferenceLine 
                              y={elevationStats.minElevation} 
                              stroke="red" 
                              strokeDasharray="3 3"
                              label={{ 
                                value: `Min: ${elevationStats.minElevation.toFixed(1)}m`, 
                                position: 'insideBottomRight' 
                              }}
                            />
                            <ReferenceLine 
                              y={elevationStats.maxElevation} 
                              stroke="green" 
                              strokeDasharray="3 3"
                              label={{ 
                                value: `Max: ${elevationStats.maxElevation.toFixed(1)}m`, 
                                position: 'insideTopRight' 
                              }}
                            />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Bodenart-Auswahl für die Strecke */}
                  <div className="mt-6">
                    <div className="flex items-center mb-3">
                      <Shovel className="h-5 w-5 mr-2 text-gray-600" />
                      <h3 className="text-lg font-semibold">Bodenart der Strecke festlegen</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Select 
                          value={selectedBodenart?.toString() || ""}
                          onValueChange={(value) => setSelectedBodenart(parseInt(value))}
                        >
                          <SelectTrigger className="mb-3">
                            <SelectValue placeholder="Bodenart auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {bodenarten.map((bodenart) => (
                              <SelectItem key={bodenart.id} value={bodenart.id.toString()}>
                                {bodenart.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {selectedBodenart && (
                          <Button
                            onClick={generatePDF}
                            disabled={isPdfGenerating}
                            className="w-full mt-2"
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            {isPdfGenerating ? 'Wird erstellt...' : 'PDF-Bericht erstellen'}
                          </Button>
                        )}
                      </div>
                      
                      <div>
                        {selectedBodenartObj && (
                          <div className="bg-white border rounded-md p-3">
                            <div className="text-sm font-semibold mb-1">{selectedBodenartObj.name}</div>
                            <div className="text-xs text-gray-600 mb-2">{selectedBodenartObj.beschreibung}</div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              <div>Belastungsklasse:</div>
                              <div className="font-medium">{selectedBodenartObj.belastungsklasse}</div>
                              <div>Dichte:</div>
                              <div className="font-medium">{selectedBodenartObj.dichte} kg/m³</div>
                              <div>Materialkosten:</div>
                              <div className="font-medium">{selectedBodenartObj.material_kosten_pro_m2.toFixed(2)} €/m²</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* DenkmalAtlas Bayern Tab - Ersetzt durch direkten Weiterleitungs-Button */}

        {/* BayernAtlas Geoportal Tab - Ersetzt durch direkten Weiterleitungs-Button */}

        {/* Bundesweite Dienste Tab */}
        <TabsContent value="bund" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm rounded-lg">
              <CardHeader>
                <CardTitle>Kulturerbe-Datenbanken</CardTitle>
                <CardDescription>Zugriff auf bundesweite Denkmalinformationen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExternalLink("https://www.deutsche-digitale-bibliothek.de/newspaper", "Deutsche Digitale Bibliothek")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Deutsche Digitale Bibliothek</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => handleExternalLink("https://www.dnk.de/im-fokus/deutsches-kulturerbe/", "Deutsches Kulturerbe")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Deutsches Kulturerbe Portal</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => handleExternalLink("https://www.archaeologie-online.de/", "Archäologie Online")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Archäologie Online</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm rounded-lg">
              <CardHeader>
                <CardTitle>Geodatendienste</CardTitle>
                <CardDescription>Geodaten und Infrastrukturplanung</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExternalLink("https://www.geoportal.de/", "Geoportal Deutschland")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Geoportal Deutschland</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => handleExternalLink("https://gdz.bkg.bund.de/", "Geodatenzentrum")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Geodatenzentrum (BKG)</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => handleExternalLink("https://www.umweltkarten.mv-regierung.de/atlas/", "Umweltkarten")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Umweltkarten Deutschland</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TiefbauMap;