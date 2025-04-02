import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SpeechToText } from "@/components/ui/speech-to-text";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Map as MapIcon, FileText, ExternalLink, Info, ArrowLeft, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Marker-Icons-Problem in react-leaflet beheben
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Belastungsklassen nach RStO 12
type BelastungsklasseInfo = {
  klasse: string;
  beanspruchung: string;
  beispiel: string;
  bauklasse: string;
  dickeAsphaltbauweise: string; // Dicke des frostsicheren Aufbaus (in cm)
  dickeAsphaltdecke: string; // Asphaltdecke Dicke (in cm)
  dickeAsphaltTragschicht: string; // Asphalttragschicht Dicke (in cm)
  dickeFrostschutzschicht1: string; // Frostschutzschicht Variante 1 (in cm)
  dickeSchotterTragschicht?: string; // Schottertragschicht (wenn vorhanden)
  dickeFrostschutzschicht2?: string; // Frostschutzschicht bei Variante mit Schottertragschicht
}

const belastungsklassen: BelastungsklasseInfo[] = [
  {
    klasse: "Bk100",
    beanspruchung: "> 32",
    beispiel: "Autobahnen, Schnellstraßen",
    bauklasse: "SV",
    dickeAsphaltbauweise: "55 65 75 85",
    dickeAsphaltdecke: "12",
    dickeAsphaltTragschicht: "22",
    dickeFrostschutzschicht1: "31-51",
    dickeSchotterTragschicht: "18",
    dickeFrostschutzschicht2: "30-40"
  },
  {
    klasse: "Bk32",
    beanspruchung: "> 10 und ≤ 32",
    beispiel: "Industriestraßen",
    bauklasse: "I",
    dickeAsphaltbauweise: "55 65 75 85",
    dickeAsphaltdecke: "12",
    dickeAsphaltTragschicht: "18",
    dickeFrostschutzschicht1: "25-55",
    dickeSchotterTragschicht: "15", 
    dickeFrostschutzschicht2: "34-44"
  },
  {
    klasse: "Bk10",
    beanspruchung: "> 3,2 und ≤ 10",
    beispiel: "Hauptgeschäftsstraßen",
    bauklasse: "II",
    dickeAsphaltbauweise: "55 65 75 85",
    dickeAsphaltdecke: "12",
    dickeAsphaltTragschicht: "14",
    dickeFrostschutzschicht1: "29-59",
    dickeSchotterTragschicht: "15", 
    dickeFrostschutzschicht2: "28-48"
  },
  {
    klasse: "Bk3,2",
    beanspruchung: "> 1,8 und ≤ 3,2",
    beispiel: "Verbindungsstraßen",
    bauklasse: "III",
    dickeAsphaltbauweise: "45 55 65 75",
    dickeAsphaltdecke: "10",
    dickeAsphaltTragschicht: "12",
    dickeFrostschutzschicht1: "33-53",
    dickeSchotterTragschicht: "15", 
    dickeFrostschutzschicht2: "30-40"
  },
  {
    klasse: "Bk1,8",
    beanspruchung: "> 1,0 und ≤ 1,8",
    beispiel: "Sammelstraßen, wenig befahrene Hauptgeschäftsstraßen",
    bauklasse: "IV",
    dickeAsphaltbauweise: "45 55 65 75",
    dickeAsphaltdecke: "4",
    dickeAsphaltTragschicht: "20",
    dickeFrostschutzschicht1: "25-57",
    dickeSchotterTragschicht: "15", 
    dickeFrostschutzschicht2: "24-44"
  },
  {
    klasse: "Bk1,0",
    beanspruchung: "> 0,3 und ≤ 1,0",
    beispiel: "Wohnstraßen",
    bauklasse: "V",
    dickeAsphaltbauweise: "45 55 65 75",
    dickeAsphaltdecke: "4",
    dickeAsphaltTragschicht: "18",
    dickeFrostschutzschicht1: "27-57",
    dickeSchotterTragschicht: "15", 
    dickeFrostschutzschicht2: "26-46"
  },
  {
    klasse: "Bk0,3",
    beanspruchung: "≤ 0,3",
    beispiel: "Wohnwege",
    bauklasse: "V und VI",
    dickeAsphaltbauweise: "35 45 55 65",
    dickeAsphaltdecke: "4",
    dickeAsphaltTragschicht: "14",
    dickeFrostschutzschicht1: "31-51",
    dickeSchotterTragschicht: "29", 
    dickeFrostschutzschicht2: "18-38"
  }
];

// Farbkodierung für Belastungsklassen
const belastungsklassenColors: Record<string, string> = {
  "Bk100": "#ff0000", // Rot für höchste Belastung
  "Bk32": "#ff6600",  // Orange
  "Bk10": "#ffcc00",  // Gelb
  "Bk3,2": "#99cc00", // Gelbgrün
  "Bk1,8": "#33cc33", // Grün
  "Bk1,0": "#0099ff", // Hellblau
  "Bk0,3": "#3366ff", // Blau (Standard)
  "default": "#3366ff" // Standardfarbe für Marker ohne Klasse
};

// Marker-Interface für erweiterte Informationen
interface MarkerInfo {
  position: [number, number]; // Position als [latitude, longitude]
  belastungsklasse?: string;  // Z.B. "Bk100", "Bk32", etc.
  name?: string;              // Optionaler Name für den Marker
  notes?: string;             // Optionale Notizen zum Standort
}

// Benutzerdefinierten Icon-Ersteller basierend auf Belastungsklasse
function createCustomIcon(belastungsklasse?: string): L.Icon {
  // Konvertiere die Farbe zu einem einfachen Namen für die Marker-Icons
  let colorName = "blue"; // Standard-Farbe als Fallback
  
  if (belastungsklasse) {
    const hex = belastungsklassenColors[belastungsklasse] || belastungsklassenColors.default;
    
    // Konvertiere Hex-Farben zu den Standard-Farbnamen, die von der Marker-Bibliothek unterstützt werden
    // https://github.com/pointhi/leaflet-color-markers
    if (hex === "#ff0000") colorName = "red";
    else if (hex === "#ff6600") colorName = "orange";
    else if (hex === "#ffcc00") colorName = "yellow";
    else if (hex === "#99cc00" || hex === "#33cc33") colorName = "green";
    else if (hex === "#0099ff") colorName = "blue";
    else if (hex === "#3366ff") colorName = "blue";
  }
  
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${colorName}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

// Hilfskomponente zum Klicken auf die Karte für Markererstellung
interface MapClickerProps {
  onMarkerAdd: (lat: number, lng: number) => void;
  selectedBelastungsklasse: string;
}

function MapClicker({ onMarkerAdd, selectedBelastungsklasse }: MapClickerProps) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onMarkerAdd(lat, lng);
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onMarkerAdd]);
  
  return null;
}

export default function GeoMapPage() {
  const [notes, setNotes] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBelastungsklasse, setSelectedBelastungsklasse] = useState<string>("");
  const [mapSource, setMapSource] = useState<string>("bgr");
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const handleSave = () => {
    setIsSaving(true);
    // Hier würde normalerweise die Speicherlogik implementiert werden
    setTimeout(() => {
      setIsSaving(false);
      alert("Notizen gespeichert!");
    }, 1000);
  };
  
  const getKlasseInfo = (klasseId: string): BelastungsklasseInfo | undefined => {
    return belastungsklassen.find(k => k.klasse === klasseId);
  };
  
  // Neuer Marker mit aktuell ausgewählter Belastungsklasse
  const addMarker = (lat: number, lng: number) => {
    const newMarker: MarkerInfo = {
      position: [lat, lng],
      belastungsklasse: selectedBelastungsklasse || undefined,
      name: selectedLocation || `Standort #${markers.length + 1}`,
      notes: notes || undefined
    };
    
    setMarkers(prev => [...prev, newMarker]);
    
    // Setze den neuen Marker als ausgewählt
    setSelectedMarkerIndex(markers.length);
  };
  
  // Marker-Daten aktualisieren
  const updateMarker = (index: number, data: Partial<MarkerInfo>) => {
    setMarkers(prev => prev.map((marker, i) => 
      i === index ? { ...marker, ...data } : marker
    ));
  };
  
  // Marker löschen
  const deleteMarker = (index: number) => {
    setMarkers(prev => prev.filter((_, i) => i !== index));
    if (selectedMarkerIndex === index) {
      setSelectedMarkerIndex(null);
    } else if (selectedMarkerIndex !== null && selectedMarkerIndex > index) {
      setSelectedMarkerIndex(selectedMarkerIndex - 1);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => navigate("/projects")}
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Projektformular
        </Button>
      </div>
    
      <h1 className="text-3xl font-bold mb-2">Straßen-Belastungsklassen & Geoportal</h1>
      <p className="text-gray-500 mb-6">
        Erfassen Sie Belastungsklassen für Projekte nach RStO 12 und nutzen Sie externe Kartendienste.
      </p>

      <div className="mb-6">
        <Tabs defaultValue="belastungsklassen">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="belastungsklassen">Belastungsklassen</TabsTrigger>
            <TabsTrigger value="bauweisen">Bauweisen RStO 12</TabsTrigger>
            <TabsTrigger value="kartenportale">Kartenportale</TabsTrigger>
          </TabsList>
          
          <TabsContent value="belastungsklassen">
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Straßenbau-Belastungsklassen</AlertTitle>
              <AlertDescription>
                Nach RStO 12 werden Straßen in sieben Belastungsklassen (Bk) eingeteilt, basierend auf der dimensionierungsrelevanten Beanspruchung B.
              </AlertDescription>
            </Alert>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary/10 border-b">
                    <th className="text-left p-2">Belastungsklasse</th>
                    <th className="text-left p-2">Beanspruchung<br/>(in Mio. äq. 10-t-Achsüberg.)</th>
                    <th className="text-left p-2">Typisches Beispiel</th>
                    <th className="text-left p-2">Bauklasse<br/>nach RStO</th>
                  </tr>
                </thead>
                <tbody>
                  {belastungsklassen.map((klasse) => (
                    <tr key={klasse.klasse} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{klasse.klasse}</td>
                      <td className="p-2">{klasse.beanspruchung}</td>
                      <td className="p-2">{klasse.beispiel}</td>
                      <td className="p-2">{klasse.bauklasse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Belastungsklasse für Projekt wählen</CardTitle>
                  <CardDescription>
                    Wählen Sie die passende Belastungsklasse für Ihr Straßenbauprojekt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="belastungsklasse">Belastungsklasse</Label>
                      <Select
                        value={selectedBelastungsklasse}
                        onValueChange={setSelectedBelastungsklasse}
                      >
                        <SelectTrigger id="belastungsklasse">
                          <SelectValue placeholder="Belastungsklasse wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {belastungsklassen.map((klasse) => (
                            <SelectItem key={klasse.klasse} value={klasse.klasse}>
                              {klasse.klasse} - {klasse.beispiel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedBelastungsklasse && (
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <div className="mb-2">
                          <span className="text-sm font-semibold">Gewählte Klasse:</span>
                          <span className="ml-1 font-medium">{selectedBelastungsklasse}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium">Beanspruchung:</span> 
                            <span className="ml-1">{getKlasseInfo(selectedBelastungsklasse)?.beanspruchung}</span>
                          </div>
                          <div>
                            <span className="font-medium">Bauklasse:</span>
                            <span className="ml-1">{getKlasseInfo(selectedBelastungsklasse)?.bauklasse}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Hilfreiche Links</CardTitle>
                  <CardDescription>
                    Externe Ressourcen für Straßenplanung
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => window.open("https://www.fgsv-verlag.de/rsto-12-richtlinien-fuer-die-standardisierung-des-oberbaues-von-verkehrsflaechen", "_blank")}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>RStO 12 Richtlinien (FGSV)</span>
                      <ExternalLink className="ml-auto h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => window.open("https://www.bast.de/BASt_2017/DE/Verkehrstechnik/Publikationen/Regelwerke/Entwurf/RDO-Asphalt-09.html", "_blank")}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>RDO Asphalt 09</span>
                      <ExternalLink className="ml-auto h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => window.open("https://www.bast.de", "_blank")}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>BASt - Bundesanstalt für Straßenwesen</span>
                      <ExternalLink className="ml-auto h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="bauweisen">
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Bewährte Bauweisen nach RStO 12</AlertTitle>
              <AlertDescription>
                Aufbaudicken nach Tafel 1, Zeilen 1 und 3 der RStO 12. Alle Dickenangaben in cm.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Asphaltbauweise (Tafel 1, Zeile 1)</CardTitle>
                  <CardDescription>
                    Asphalttragschicht auf Frostschutzschicht
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-primary/10 border-b">
                        <th className="text-left p-2 font-medium">Belastungsklasse</th>
                        <th className="text-left p-2 font-medium">Beanspruchung</th>
                        <th className="text-left p-2 font-medium">Dicke des Aufbaus</th>
                        <th className="text-left p-2 font-medium">Asphaltdecke</th>
                        <th className="text-left p-2 font-medium">Asphalttragschicht</th>
                        <th className="text-left p-2 font-medium">Frostschutzschicht</th>
                      </tr>
                    </thead>
                    <tbody>
                      {belastungsklassen.map((klasse) => (
                        <tr key={klasse.klasse + "-asphalt"} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{klasse.klasse}</td>
                          <td className="p-2">{klasse.beanspruchung}</td>
                          <td className="p-2">{klasse.dickeAsphaltbauweise}</td>
                          <td className="p-2">{klasse.dickeAsphaltdecke}</td>
                          <td className="p-2">{klasse.dickeAsphaltTragschicht}</td>
                          <td className="p-2">{klasse.dickeFrostschutzschicht1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Asphalttragschicht und Schottertragschicht (Tafel 1, Zeile 3)</CardTitle>
                  <CardDescription>
                    Asphalttragschicht und Schottertragschicht auf Frostschutzschicht
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-primary/10 border-b">
                        <th className="text-left p-2 font-medium">Belastungsklasse</th>
                        <th className="text-left p-2 font-medium">Beanspruchung</th>
                        <th className="text-left p-2 font-medium">Asphaltdecke</th>
                        <th className="text-left p-2 font-medium">Asphalttragschicht</th>
                        <th className="text-left p-2 font-medium">Schottertragschicht</th>
                        <th className="text-left p-2 font-medium">Frostschutzschicht</th>
                      </tr>
                    </thead>
                    <tbody>
                      {belastungsklassen.map((klasse) => (
                        <tr key={klasse.klasse + "-schotter"} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{klasse.klasse}</td>
                          <td className="p-2">{klasse.beanspruchung}</td>
                          <td className="p-2">{klasse.dickeAsphaltdecke}</td>
                          <td className="p-2">{klasse.dickeAsphaltTragschicht}</td>
                          <td className="p-2">{klasse.dickeSchotterTragschicht || "-"}</td>
                          <td className="p-2">{klasse.dickeFrostschutzschicht2 || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
            
            {selectedBelastungsklasse && (
              <div className="mb-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Schichtdetails für {selectedBelastungsklasse}</CardTitle>
                    <CardDescription>
                      Detaillierte Schichtangaben für die gewählte Belastungsklasse
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-base font-semibold mb-2">Asphaltbauweise</h3>
                        <div className="border p-4 rounded-md">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="font-medium">Asphaltdecke:</div>
                            <div>{getKlasseInfo(selectedBelastungsklasse)?.dickeAsphaltdecke} cm</div>
                            
                            <div className="font-medium">Asphalttragschicht:</div>
                            <div>{getKlasseInfo(selectedBelastungsklasse)?.dickeAsphaltTragschicht} cm</div>
                            
                            <div className="font-medium">Frostschutzschicht:</div>
                            <div>{getKlasseInfo(selectedBelastungsklasse)?.dickeFrostschutzschicht1} cm</div>
                            
                            <div className="font-medium mt-2 text-primary">Gesamtdicke Aufbau:</div>
                            <div className="mt-2 font-semibold">{getKlasseInfo(selectedBelastungsklasse)?.dickeAsphaltbauweise} cm</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-semibold mb-2">Asphalt- und Schottertragschicht</h3>
                        <div className="border p-4 rounded-md">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="font-medium">Asphaltdecke:</div>
                            <div>{getKlasseInfo(selectedBelastungsklasse)?.dickeAsphaltdecke} cm</div>
                            
                            <div className="font-medium">Asphalttragschicht:</div>
                            <div>{getKlasseInfo(selectedBelastungsklasse)?.dickeAsphaltTragschicht} cm</div>
                            
                            <div className="font-medium">Schottertragschicht:</div>
                            <div>{getKlasseInfo(selectedBelastungsklasse)?.dickeSchotterTragschicht || "-"} cm</div>
                            
                            <div className="font-medium">Frostschutzschicht:</div>
                            <div>{getKlasseInfo(selectedBelastungsklasse)?.dickeFrostschutzschicht2 || "-"} cm</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="text-sm text-gray-500 italic">
              Quelle: RStO 12 Richtlinien für die Standardisierung des Oberbaus von Verkehrsflächen, Tafel 1
            </div>
          </TabsContent>
          
          <TabsContent value="kartenportale">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader>
                  <CardTitle>BGR Geoportal</CardTitle>
                  <CardDescription>
                    Geoportal der Bundesanstalt für Geowissenschaften und Rohstoffe
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center p-6 text-center rounded-md border">
                    <MapIcon className="h-12 w-12 text-primary mb-2" />
                    <p className="text-sm text-gray-500 mb-4">
                      Geologische Karten und Bodenkarten für Deutschland
                    </p>
                    <Button 
                      variant="default" 
                      onClick={() => window.open("https://geoportal.bgr.de/mapapps/resources/apps/geoportal/index.html?lang=de#/geoviewer", "_blank")}
                    >
                      BGR Geoportal öffnen 
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>BASt GIS-Viewer</CardTitle>
                  <CardDescription>
                    GIS-System der Bundesanstalt für Straßenwesen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center p-6 text-center rounded-md border">
                    <MapIcon className="h-12 w-12 text-primary mb-2" />
                    <p className="text-sm text-gray-500 mb-4">
                      Straßeninformationen, Bauprojekte und Verkehrsdaten
                    </p>
                    <Button 
                      variant="default" 
                      onClick={() => window.open("https://www.bast.de", "_blank")}
                    >
                      BASt Website öffnen
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Interaktive Kartenansicht</CardTitle>
                <CardDescription>
                  Karte zur Visualisierung von Projektstandorten
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full h-[400px] overflow-hidden border">
                  <MapContainer 
                    center={[51.1657, 10.4515]} 
                    zoom={6} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Ursprünglicher Marker für Deutschland */}
                    <Marker position={[51.1657, 10.4515]}>
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-medium">Deutschland</h3>
                          <p className="text-sm text-gray-600">Klicken Sie auf die Karte, um Standorte zu markieren</p>
                          <p className="text-xs text-primary mt-2">
                            Wählen Sie eine Belastungsklasse vor dem Markieren, um farbige Marker zu setzen
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* Dynamisch hinzugefügte Marker mit Belastungsklassen-Farbcodierung */}
                    {markers.map((marker, index) => (
                      <Marker 
                        key={`marker-${index}`} 
                        position={marker.position}
                        icon={createCustomIcon(marker.belastungsklasse)}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-medium">{marker.name || `Standort #${index + 1}`}</h3>
                            {marker.belastungsklasse && (
                              <div className="mt-1 text-sm text-primary font-medium">
                                Belastungsklasse: {marker.belastungsklasse}
                              </div>
                            )}
                            <p className="text-sm text-gray-600 mt-1">
                              Position: {marker.position[0].toFixed(5)}, {marker.position[1].toFixed(5)}
                            </p>
                            {marker.notes && (
                              <div className="mt-2 text-sm">
                                <div className="font-medium">Notizen:</div>
                                <p className="text-gray-600">{marker.notes}</p>
                              </div>
                            )}
                            <div className="mt-3 flex justify-between">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedMarkerIndex(index)}
                              >
                                Bearbeiten
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive"
                                onClick={() => deleteMarker(index)}
                              >
                                Entfernen
                              </Button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    
                    {/* Komponente zum Erfassen von Klicks auf der Karte */}
                    <MapClicker onMarkerAdd={addMarker} selectedBelastungsklasse={selectedBelastungsklasse} />
                  </MapContainer>
                </div>
                <div className="p-4 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium">
                      {markers.length} Standort(e) markiert
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setMarkers([])}
                      disabled={markers.length === 0}
                      className="text-destructive hover:text-destructive/90"
                    >
                      Alle Marker zurücksetzen
                    </Button>
                  </div>
                  
                  {markers.length > 0 && (
                    <div className="mb-3 rounded-md border overflow-hidden">
                      <div className="bg-muted/50 px-3 py-1.5 text-xs font-medium">
                        Markierte Standorte
                      </div>
                      <div className="divide-y max-h-24 overflow-y-auto">
                        {markers.map((marker, idx) => (
                          <div key={idx} className="px-3 py-1.5 text-sm flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ 
                                  backgroundColor: marker.belastungsklasse ? 
                                    belastungsklassenColors[marker.belastungsklasse] || belastungsklassenColors.default
                                    : belastungsklassenColors.default 
                                }}
                              />
                              <div>
                                {marker.name || `Standort #${idx + 1}`}: {parseFloat(marker.position[0].toString()).toFixed(5)}, {parseFloat(marker.position[1].toString()).toFixed(5)}
                                {marker.belastungsklasse && (
                                  <span className="text-xs ml-1 text-primary">({marker.belastungsklasse})</span>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-destructive/70"
                              onClick={() => deleteMarker(idx)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Karte basierend auf OpenStreetMap-Daten
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open("https://www.openstreetmap.org/", "_blank")}
                      >
                        OpenStreetMap
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open("https://geoportal.bgr.de/mapapps/resources/apps/geoportal/index.html?lang=de#/geoviewer", "_blank")}
                      >
                        BGR Geoportal
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Standortinformationen</CardTitle>
              <CardDescription>
                Notizen und Informationen zum gewählten Standort erfassen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location-name">Standortname</Label>
                  <Input 
                    id="location-name" 
                    placeholder="z.B. Kreuzung K123/L456" 
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="belastungsklasse-select">Belastungsklasse</Label>
                  <Select
                    value={selectedBelastungsklasse}
                    onValueChange={setSelectedBelastungsklasse}
                  >
                    <SelectTrigger id="belastungsklasse-select">
                      <SelectValue placeholder="Belastungsklasse wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {belastungsklassen.map((klasse) => (
                        <SelectItem key={klasse.klasse} value={klasse.klasse}>
                          {klasse.klasse} - {klasse.beispiel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes-input">Standort-Notizen</Label>
                <div className="grid grid-cols-1 gap-3">
                  <SpeechToText
                    onTextChange={setNotes}
                    placeholder="Sprechen Sie Ihre Notizen zu diesem Standort..."
                    initialText={notes}
                  />
                  
                  <Textarea
                    id="notes-input"
                    placeholder="Oder schreiben Sie Ihre Notizen hier..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Zurücksetzen</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Wird gespeichert..." : "Speichern"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Projektverknüpfung</CardTitle>
              <CardDescription>
                Verknüpfen Sie diese Standortinformationen mit einem bestehenden Projekt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="project-name">Projektname</Label>
                <Input 
                  id="project-name" 
                  placeholder="Name des Projekts" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              
              {selectedBelastungsklasse && (
                <div className="p-3 bg-gray-50 rounded-md border">
                  <div className="text-sm font-medium mb-1">Gewählte Belastungsklasse:</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="font-medium">Klasse:</div>
                    <div>{selectedBelastungsklasse}</div>
                    
                    <div className="font-medium">Beanspruchung:</div>
                    <div>{getKlasseInfo(selectedBelastungsklasse)?.beanspruchung}</div>
                    
                    <div className="font-medium">Beispiel:</div>
                    <div>{getKlasseInfo(selectedBelastungsklasse)?.beispiel}</div>
                    
                    <div className="font-medium">Bauklasse:</div>
                    <div>{getKlasseInfo(selectedBelastungsklasse)?.bauklasse}</div>
                  </div>
                </div>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button className="w-full" disabled>
                        Mit Projekt verknüpfen
                        <MapIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Diese Funktion wird in einer zukünftigen Version verfügbar sein.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}