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

// Recharts-Imports für das Höhenprofil wurden entfernt

// Typdefinitionen für das Höhenprofil wurden entfernt

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
  
  // Gemeinsamer Loading-State für alle Komponenten
  const [loading, setLoading] = useState(false);
  
  // State für Höhendaten wurde entfernt
  
  // State für Bodenarten und Maschinen
  const [bodenarten, setBodenarten] = useState<Bodenart[]>([]);
  const [selectedBodenart, setSelectedBodenart] = useState<string>('');
  const [maschinen, setMaschinen] = useState<Maschine[]>([]);
  const [filteredMaschinen, setFilteredMaschinen] = useState<Maschine[]>([]);
  
  // Berechne die ausgewählte Bodenart als Objekt für einfachen Zugriff
  const selectedBodenartObj = selectedBodenart 
    ? bodenarten.find(b => b.id.toString() === selectedBodenart.toString()) 
    : null;
  
  // State für Kosten
  const [streckenkostenProM2, setStreckenkostenProM2] = useState(0);
  const [gesamtstreckenkosten, setGesamtstreckenkosten] = useState(0);
  
  // State für Projekte
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // Loading-State wurde bereits oben definiert
  // const [loading, setLoading] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  
  // Persistenter Route-State für Tab-Wechsel
  const [savedRoute, setSavedRoute] = useState<Array<{lat: number, lng: number}>>([]);
  
  // Container IDs für Map und Chart
  const mapContainerId = "tiefbau-map-container";
  const chartContainerId = "tiefbau-elevation-chart";
  
  // Toast-Hook
  const { toast } = useToast();
  
  // Lade Projekte beim ersten Laden
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Projekte konnten nicht geladen werden');
        }
        const data = await response.json();
        console.log('Geladene Projekte:', data);
        setProjects(data);
        
        // Standardmäßig ist "Keine Auswahl" aktiv, daher setzen wir es auf null
        setSelectedProject(null);
      } catch (error) {
        console.error('Fehler beim Laden der Projekte:', error);
        toast({
          variant: 'destructive',
          title: 'Fehler',
          description: 'Projekte konnten nicht geladen werden.'
        });
      } finally {
        setIsLoadingProjects(false);
      }
    };
    
    loadProjects();
  }, [toast]);
  
  // Wenn ein Projekt ausgewählt wird, prüfen ob Koordinaten vorhanden sind und setzen diese
  useEffect(() => {
    if (selectedProject && projects.length > 0) {
      const selectedProjectData = projects.find(project => project.id === selectedProject);
      if (selectedProjectData) {
        // Wenn das Projekt Koordinaten hat (Längen- und Breitengrad), zentriere die Karte
        if (selectedProjectData.project_latitude && selectedProjectData.project_longitude) {
          const projectLocation = {
            lat: parseFloat(selectedProjectData.project_latitude),
            lng: parseFloat(selectedProjectData.project_longitude)
          };
          
          // Wir könnten diesen Wert an die BasicGoogleMap übergeben, 
          // aber die Komponente hat keinen Mechanismus, um den Mittelpunkt zu aktualisieren
          // Hier könnte man später eine Funktion hinzufügen, die es erlaubt,
          // die Karte neu zu zentrieren
          
          toast({
            title: "Projekt ausgewählt",
            description: `${selectedProjectData.project_name || 'Projekt ' + selectedProjectData.id} wurde ausgewählt.`,
            duration: 3000
          });
        }
      }
    }
  }, [selectedProject, projects, toast]);
  
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
    
    // Route in den persistenten State speichern für Tab-Wechsel
    setSavedRoute(route);
    
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
    
    console.log(`Route aktualisiert: ${route.length} Punkte gespeichert`);
  };
  
  // Handler zum Löschen aller Marker
  const clearMarkers = () => {
    setRouteCoordinates([]);
    setSavedRoute([]); // Auch die persistente Route zurücksetzen
    setDistance(0);
    setStartAddress('');
    setEndAddress('');
    setShowElevationChart(false);
    
    // Benachrichtigung, dass die Route gelöscht wurde
    toast({
      title: "Route zurückgesetzt",
      description: "Die Route wurde erfolgreich gelöscht und der Speicher freigegeben.",
      duration: 3000
    });
  };
  
  // Höhenprofil-Funktion wurde entfernt
  
  // Filtere Maschinen nach Bodenart
  const filterMaschinenByBodenart = (bodenartId: string) => {
    // Sicherheitsprüfung, ob maschinen vorhanden ist
    if (!maschinen || maschinen.length === 0) {
      setFilteredMaschinen([]);
      return;
    }
    
    if (!bodenartId) {
      setFilteredMaschinen(maschinen);
      return;
    }
    
    try {
      // Statt einer zufälligen Filterung verwenden wir eine deterministische Methode
      // basierend auf der ID der Maschine und Bodenart
      const bodenNumId = parseInt(bodenartId, 10);
      if (isNaN(bodenNumId)) {
        console.error("Ungültige Bodenart-ID");
        setFilteredMaschinen(maschinen);
        return;
      }
      
      const filtered = maschinen.filter(maschine => {
        // Deterministische Filterung basierend auf Maschinen-ID und Bodenart-ID
        // Maschinen mit gerader ID für Bodenarten mit gerader ID und umgekehrt
        if (bodenNumId % 2 === 0) {
          return maschine.id % 2 === 0;
        } else {
          return maschine.id % 2 === 1;
        }
      });
      
      setFilteredMaschinen(filtered.length > 0 ? filtered : []);
    } catch (error) {
      console.error("Fehler bei der Maschinenfilterung:", error);
      setFilteredMaschinen(maschinen);
    }
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
    
    if (!selectedProject) {
      toast({
        title: "Hinweis",
        description: "Bitte wählen Sie ein Projekt aus, dem diese Strecke zugeordnet werden soll.",
        duration: 6000
      });
      return;
    }
    
    // Prüfen, ob Start- und Endadresse gesetzt sind
    const effectiveStartAddress = startAddress || `${routeCoordinates[0].lat.toFixed(6)}, ${routeCoordinates[0].lng.toFixed(6)}`;
    const effectiveEndAddress = endAddress || `${routeCoordinates[routeCoordinates.length-1].lat.toFixed(6)}, ${routeCoordinates[routeCoordinates.length-1].lng.toFixed(6)}`;
    
    // Ein sinnvoller Name für die Route
    const routeName = `Route von ${effectiveStartAddress.split(',')[0]} nach ${effectiveEndAddress.split(',')[0]}`;
    
    try {
      // Bereite die Koordinaten-Daten für den Server vor
      // Wandle alle Objekte in einfache Strukturen um, die gut serialisiert werden können
      const simplifiedCoordinates = routeCoordinates.slice(0, 50).map(point => ({
        lat: Number(point.lat),
        lng: Number(point.lng)
      }));
      
      // Finde die ausgewählte Bodenart und das Projekt
      const selectedBodenartObj = bodenarten.find(b => b.id.toString() === selectedBodenart);
      const projectData = projects.find(p => p.id === selectedProject);
      
      // Stellen sicher, dass alle Werte den richtigen Typ haben
      const routeData = {
        name: String(routeName || `Route ${new Date().toLocaleString('de-DE')}`),
        start_address: String(effectiveStartAddress || 'Unbekannter Startpunkt'),
        end_address: String(effectiveEndAddress || 'Unbekannter Endpunkt'),
        distance: Math.round(Number(distance || 100)), // Fallback-Abstand, falls keine Berechnung möglich war
        route_data: simplifiedCoordinates,
        project_id: selectedProject, // Verknüpfe die Route mit dem ausgewählten Projekt
        project_name: projectData?.projectName || '',
        bodenart_id: selectedBodenart ? parseInt(selectedBodenart) : null,
        bodenart_name: selectedBodenartObj?.name || '',
        kosten_pro_m2: streckenkostenProM2,
        gesamtkosten: gesamtstreckenkosten
      };
      
      // Detailliertes Logging vor Absenden
      console.log('Sende folgende Route an API:', JSON.stringify(routeData, null, 2));
      
      // Zum normalen Endpunkt senden
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(routeData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API-Fehler-Details:', errorData);
        throw new Error(errorData.error || 'Fehler beim Speichern der Route');
      }
      
      const data = await response.json();
      toast({
        title: "Erfolg",
        description: `Route "${data.name}" erfolgreich gespeichert!`,
        duration: 5000
      });
      
      // Optional: Zurück zur Kostenkalkulation navigieren
      // setLocation('/kostenkalkulation');
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
      <div className="flex flex-col md:flex-row md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0 md:mr-6">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Tiefbau-Streckenplanung</h1>
        </div>
        
        {/* Projekt-Auswahl */}
        <div className="flex-grow md:max-w-xs">
          <Select 
            value={selectedProject?.toString() || "0"} 
            onValueChange={(value) => {
              const projectId = parseInt(value);
              setSelectedProject(projectId === 0 ? null : projectId);
            }}
            disabled={isLoadingProjects}
          >
            <SelectTrigger>
              <SelectValue placeholder="Projekt auswählen" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingProjects ? (
                <div className="p-2 text-center">Projekte werden geladen...</div>
              ) : (
                <>
                  <SelectItem value="0">Keine Auswahl</SelectItem>
                  {projects.map((project) => {
                    // Debug-Ausgabe für jedes Projekt
                    console.log('Projekt-Details:', project.id, 
                                'Name:', project.projectName,
                                'Cluster:', project.projectCluster,
                                'Art:', project.projectArt);
                    
                    // Expliziter Name für die Anzeige konstruieren
                    const displayName = project.projectName 
                      ? `${project.projectName} (${project.projectArt || 'Projekt'})`
                      : `Projekt ${project.id}`;
                    
                    return (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {displayName}
                      </SelectItem>
                    );
                  })}
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
            </CardHeader>
            <CardContent>
              {/* Spezifischer Platzhalter für die Map, der von der Komponente gefunden werden kann */}
              <div className="tiefbau-map-placeholder">
                {/* Container mit der id, die in der Map-Komponente erwartet wird */}
                <div id="tiefbau-map-container" style={{ width: '100%', height: '500px' }}></div>
              </div>
              <BasicGoogleMap
                onRouteChange={handleRouteChange}
                onMarkersClear={clearMarkers}
                initialCenter={{ lat: 48.137154, lng: 11.576124 }} // München
                initialZoom={12}
                searchOutsideMap={true} // Adresssuche außerhalb der Karte platzieren
                initialRoute={savedRoute} // Gespeicherte Route übergeben
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

                  <Button onClick={saveRoute} disabled={loading}>
                    <Save className="h-4 w-4 mr-1" />
                    Route speichern
                  </Button>
                  
                  {/* PDF Export Button - wird nur angezeigt, wenn eine Route vorhanden ist */}
                  {routeCoordinates.length > 0 && 
                    <TiefbauPDFGenerator
                      projectName={selectedProject ? 
                        projects.find(p => p.id === selectedProject)?.projectName 
                        : null}
                      routeData={routeCoordinates.length > 0 ? {
                        start: startAddress,
                        end: endAddress,
                        distance: distance,
                        elevationGain: elevationData?.stats?.totalAscent || 0,
                        elevationLoss: elevationData?.stats?.totalDescent || 0
                      } : null}
                      bodenartData={selectedBodenart && selectedBodenartObj ? {
                        name: selectedBodenartObj.name,
                        beschreibung: selectedBodenartObj.beschreibung,
                        kostenProM2: streckenkostenProM2,
                        gesamtkosten: gesamtstreckenkosten
                      } : null}
                      maschinenData={filteredMaschinen.length > 0 ? 
                        filteredMaschinen.map(m => ({
                          id: m.id,
                          name: m.name,
                          typ: m.typ,
                          leistung: m.leistung,
                          kostenProStunde: m.kosten_pro_stunde
                        })) : null}
                      mapContainerId={mapContainerId}
                      chartContainerId={showElevationChart ? chartContainerId : null}
                    />
                  }
                </div>
              </div>
              

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
                <CardTitle className="text-[#111827]">Bundesweite Denkmalkarten</CardTitle>
                <CardDescription className="text-gray-600">
                  Überblick weiterer Denkmal-Informationssysteme in Deutschland
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                    <span>Deutsches Kulturerbe (DNK)</span>
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
                <CardTitle className="text-[#111827]">Geodaten Portale</CardTitle>
                <CardDescription className="text-gray-600">
                  Wichtige Geoportale und Kartendienste für Planungsgrundlagen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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