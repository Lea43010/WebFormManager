import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SpeechToText } from "@/components/ui/speech-to-text";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Map as MapIcon, FileText, ExternalLink, Info, ArrowLeft, MapPin, Ruler, 
         Layers, Search, ChevronDown, Camera, Upload, Image, Calculator, Asterisk } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MAPBOX_TOKEN } from "@/config/mapbox";


// Leaflet imports mit dynamic import um SSR-Probleme zu vermeiden
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, LayersControl, useMapEvents, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Hack um Leaflet-Marker-Icons in Vite zu fixen
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix the L.Icon.Default issue with Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Farbschema für Belastungsklassen
const belastungsklassenColors = {
  Bk100: "#e74c3c", // Rot - höchste Belastung
  Bk32: "#e67e22",  // Orange
  Bk10: "#f39c12",  // Helleres Orange
  "Bk3,2": "#2ecc71", // Grün
  "Bk1,8": "#3498db", // Blau  
  "Bk1,0": "#9b59b6", // Lila
  "Bk0,3": "#1abc9c", // Türkis - geringste Belastung
  default: "#95a5a6"  // Grau für unklassifizierte
};

// Straßentyp-Presets mit Breiten
const roadWidthPresets = {
  "Autobahn": 12.5,
  "Bundesstraße": 7.5,
  "Landstraße": 6.5,
  "Kreisstraße": 5.5,
  "Gemeindestraße": 5.0,
  "Benutzerdefiniert": 0 // Wird dynamisch gesetzt
};

// RStO 12 Belastungsklassen
const belastungsklassen = [
  {
    klasse: "Bk100",
    beanspruchung: "Außerordentliche Beanspruchung",
    beispiel: "Autobahnen, Industriestraßen",
    bauklasse: "SV",
    dickeAsphaltbauweise: "65-85",
    dickeAsphaltdecke: "4",
    dickeAsphaltTragschicht: "22",
    dickeFrostschutzschicht1: "59" // Variante 1 ohne Schottertragschicht
  },
  {
    klasse: "Bk32",
    beanspruchung: "Sehr starke Beanspruchung",
    beispiel: "Hauptverkehrsstraßen, Industriestraßen",
    bauklasse: "I",
    dickeAsphaltbauweise: "65-79",
    dickeAsphaltdecke: "4",
    dickeAsphaltTragschicht: "18",
    dickeFrostschutzschicht1: "57" // Variante 1 ohne Schottertragschicht
  },
  {
    klasse: "Bk10", 
    beanspruchung: "Starke Beanspruchung",
    beispiel: "Hauptverkehrsstraßen, Gewerbestraßen",
    bauklasse: "II",
    dickeAsphaltbauweise: "63-77",
    dickeAsphaltdecke: "4",
    dickeAsphaltTragschicht: "14",
    dickeFrostschutzschicht1: "59" // Variante 1 ohne Schottertragschicht
  },
  {
    klasse: "Bk3,2",
    beanspruchung: "Mittlere Beanspruchung",
    beispiel: "Sammlerstraßen, Gewerbestraßen",
    bauklasse: "III",
    dickeAsphaltbauweise: "59-74",
    dickeAsphaltdecke: "4",
    dickeAsphaltTragschicht: "14",
    dickeFrostschutzschicht1: "56" // Variante 1 ohne Schottertragschicht
  },
  {
    klasse: "Bk1,8",
    beanspruchung: "Geringe Beanspruchung",
    beispiel: "Wohnsammelstraßen",
    bauklasse: "IV",
    dickeAsphaltbauweise: "57-73",
    dickeAsphaltdecke: "4",
    dickeAsphaltTragschicht: "10",
    dickeFrostschutzschicht1: "59" // Variante 1 ohne Schottertragschicht
  },
  {
    klasse: "Bk1,0",
    beanspruchung: "Sehr geringe Beanspruchung",
    beispiel: "Wohnstraßen, landwirtschaftliche Wege",
    bauklasse: "V",
    dickeAsphaltbauweise: "53-66",
    dickeAsphaltdecke: "4",
    dickeAsphaltTragschicht: "8",
    dickeFrostschutzschicht1: "54" // Variante 1 ohne Schottertragschicht
  },
  {
    klasse: "Bk0,3",
    beanspruchung: "Minimale Beanspruchung",
    beispiel: "Wohnwege, Parkplätze",
    bauklasse: "VI",
    dickeAsphaltbauweise: "52-63",
    dickeAsphaltdecke: "4",
    dickeAsphaltTragschicht: "6",
    dickeFrostschutzschicht1: "53" // Variante 1 ohne Schottertragschicht
  }
];

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

interface MarkerInfo {
  position: [number, number]; // Position als [latitude, longitude]
  belastungsklasse?: string;  // Z.B. "Bk100", "Bk32", etc.
  name?: string;              // Optionaler Name für den Marker
  strasse?: string;           // Straßenname
  hausnummer?: string;        // Hausnummer
  plz?: string;               // Postleitzahl
  ort?: string;               // Ort
  notes?: string;             // Optionale Notizen zum Standort
  
  // Oberflächenanalyse-Daten
  surfaceAnalysis?: {
    imageUrl?: string;         // URL des aufgenommenen/hochgeladenen Bildes
    belastungsklasse?: string; // Analysierte Belastungsklasse
    asphalttyp?: string;       // Analysierter Asphalttyp
    confidence?: number;       // Konfidenz der Analyse (0-100)
    analyseDetails?: string;   // Detaillierte Analyseergebnisse
    visualizationUrl?: string; // URL der generierten RStO-Visualisierung
    timestamp?: number;        // Zeitstempel der Analyse
  };
  
  // Bodenanalyse-Daten
  groundAnalysis?: {
    imageUrl?: string;                  // URL des aufgenommenen/hochgeladenen Bildes
    belastungsklasse?: string;          // Empfohlene Belastungsklasse
    bodenklasse?: string;               // Analysierte Bodenklasse (z.B. Sand, Lehm, Ton)
    bodentragfaehigkeitsklasse?: string; // Bodentragfähigkeitsklasse (F1, F2, F3)
    confidence?: number;                // Konfidenz der Analyse (0-100)
    analyseDetails?: string;            // Detaillierte Analyseergebnisse
    visualizationUrl?: string;          // URL der generierten RStO-Visualisierung
    timestamp?: number;                 // Zeitstempel der Analyse
  };
}

function calculateDistance(
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number {
  const R = 6371; // Radius der Erde in Kilometern
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Entfernung in km
  return distance;
}

function calculateRouteDistances(markers: MarkerInfo[]): {total: number, segments: number[]} {
  let total = 0;
  const segments: number[] = [];
  
  for (let i = 0; i < markers.length - 1; i++) {
    const distance = calculateDistance(
      markers[i].position[0], markers[i].position[1],
      markers[i+1].position[0], markers[i+1].position[1]
    );
    
    total += distance;
    segments.push(distance);
  }
  
  return { total, segments };
}

function optimizeRouteOrder(markers: MarkerInfo[]): MarkerInfo[] {
  if (markers.length <= 2) return [...markers];
  
  // Startpunkt beibehalten
  const start = markers[0];
  let remainingPoints = markers.slice(1);
  const optimizedRoute = [start];
  
  let currentPoint = start;
  
  // Greedy-Algorithmus: Immer zum nächsten Punkt gehen
  while (remainingPoints.length > 0) {
    let minDistance = Infinity;
    let closestIndex = -1;
    
    for (let i = 0; i < remainingPoints.length; i++) {
      const distance = calculateDistance(
        currentPoint.position[0], currentPoint.position[1],
        remainingPoints[i].position[0], remainingPoints[i].position[1]
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    
    if (closestIndex !== -1) {
      const nextPoint = remainingPoints[closestIndex];
      optimizedRoute.push(nextPoint);
      currentPoint = nextPoint;
      remainingPoints.splice(closestIndex, 1);
    }
  }
  
  return optimizedRoute;
}

interface MaterialCosts {
  asphaltdecke: number;     // Kosten pro m² für Asphaltdecke
  asphalttragschicht: number;  // Kosten pro m² für Asphalttragschicht
  frostschutzschicht: number;  // Kosten pro m² für Frostschutzschicht
  schottertragschicht?: number; // Kosten pro m² für Schottertragschicht (optional)
}

// Basismaterialkosten pro m² in Euro (beispielhafte Werte)
const baseMaterialCosts: MaterialCosts = {
  asphaltdecke: 42.50,      // Kosten pro m² für 4cm Asphaltdecke
  asphalttragschicht: 26.75, // Kosten pro m² pro 1cm Dicke
  frostschutzschicht: 18.50, // Kosten pro m² pro 1cm Dicke
  schottertragschicht: 22.30 // Kosten pro m² pro 1cm Dicke
};

function getKlasseInfo(klasseId: string): BelastungsklasseInfo | undefined {
  return belastungsklassen.find(klasse => klasse.klasse === klasseId);
}

function calculateMaterialCosts(
  distanceKm: number, 
  width: number, 
  belastungsklasse: string
): { 
  total: number, 
  materials: {
    name: string,
    thickness: number, // Dicke in cm
    area: number, // Fläche in m²
    costPerSqm: number, // Kosten pro m²
    totalCost: number // Gesamtkosten für diese Schicht
  }[]
} {
  // Default-Werte für den Fall, dass keine Belastungsklasse angegeben wurde
  let asphaltdeckeDicke = 4; // cm
  let asphalttragschichtDicke = 12; // cm
  let frostschutzschichtDicke = 40; // cm
  
  // Wenn eine Belastungsklasse angegeben wurde, verwende die entsprechenden Werte
  const klasseInfo = getKlasseInfo(belastungsklasse);
  if (klasseInfo) {
    asphaltdeckeDicke = parseInt(klasseInfo.dickeAsphaltdecke);
    asphalttragschichtDicke = parseInt(klasseInfo.dickeAsphaltTragschicht);
    frostschutzschichtDicke = parseInt(klasseInfo.dickeFrostschutzschicht1);
  }
  
  // Berechne die Gesamtfläche in m²
  const areaInSqm = distanceKm * 1000 * width; // Fläche in m²
  
  // Berechne die Kosten für die einzelnen Schichten
  const asphaltdeckeKosten = areaInSqm * baseMaterialCosts.asphaltdecke;
  const asphalttragschichtKosten = areaInSqm * (baseMaterialCosts.asphalttragschicht * asphalttragschichtDicke / 10);
  const frostschutzschichtKosten = areaInSqm * (baseMaterialCosts.frostschutzschicht * frostschutzschichtDicke / 10);
  
  const materials = [
    {
      name: "Asphaltdecke",
      thickness: asphaltdeckeDicke,
      area: areaInSqm,
      costPerSqm: baseMaterialCosts.asphaltdecke,
      totalCost: asphaltdeckeKosten
    },
    {
      name: "Asphalttragschicht",
      thickness: asphalttragschichtDicke,
      area: areaInSqm,
      costPerSqm: baseMaterialCosts.asphalttragschicht * asphalttragschichtDicke / 10,
      totalCost: asphalttragschichtKosten
    },
    {
      name: "Frostschutzschicht",
      thickness: frostschutzschichtDicke,
      area: areaInSqm,
      costPerSqm: baseMaterialCosts.frostschutzschicht * frostschutzschichtDicke / 10,
      totalCost: frostschutzschichtKosten
    }
  ];
  
  // Berechne die Gesamtkosten
  const totalCost = materials.reduce((sum, material) => sum + material.totalCost, 0);
  
  return {
    total: totalCost,
    materials
  };
}

function createCustomIcon(belastungsklasse?: string): L.Icon {
  // Standard-Farbe für unklassifizierte Marker
  let color = belastungsklassenColors.default;
  
  // Wenn eine Belastungsklasse angegeben wurde, verwende die entsprechende Farbe
  if (belastungsklasse && belastungsklassenColors[belastungsklasse as keyof typeof belastungsklassenColors]) {
    color = belastungsklassenColors[belastungsklasse as keyof typeof belastungsklassenColors];
  }

  return new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    // Iconfarbe überschreiben mit der entsprechenden Belastungsklassenfarbe
    className: 'custom-marker-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`
  });
}

interface MapClickerProps {
  onMarkerAdd: (lat: number, lng: number) => void;
  selectedBelastungsklasse: string;
}

function MapClicker({ onMarkerAdd, selectedBelastungsklasse }: MapClickerProps) {
  const map = useMapEvents({
    click: (e) => {
      // Nur einen Marker hinzufügen, wenn der Benutzer auf die Karte klickt
      // (nicht auf einen bestehenden Marker oder ein Popup)
      if (e.originalEvent.target instanceof HTMLElement && 
          (e.originalEvent.target.className === 'leaflet-container' || 
           e.originalEvent.target.closest('.leaflet-container'))) {
        onMarkerAdd(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  
  return null;
}

interface MapEventsProps {
  onMoveEnd: (map: L.Map) => void;
}

function MapEvents({ onMoveEnd }: MapEventsProps) {
  const map = useMap();
  
  useEffect(() => {
    map.on('moveend', () => {
      onMoveEnd(map);
    });
    
    return () => {
      map.off('moveend');
    };
  }, [map, onMoveEnd]);
  
  return null;
}

export default function GeoMapPage() {
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.1657, 10.4515]); // Deutschland
  const [tempLocation, setTempLocation] = useState<[number, number] | null>(null);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<string>("map");
  const [selectedBelastungsklasse, setSelectedBelastungsklasse] = useState<string>("none");
  
  // Koordinateneingabe
  const [searchLat, setSearchLat] = useState<number | null>(null);
  const [searchLng, setSearchLng] = useState<number | null>(null);
  
  // Diese Konstante wurde entfernt, um die Adress-zu-Koordinaten-Funktionalität zu vereinfachen
  
  // Standort-Dialog
  const [newLocationDialogOpen, setNewLocationDialogOpen] = useState<boolean>(false);
  const [locationName, setLocationName] = useState<string>("");
  const [locationInfo, setLocationInfo] = useState<{ 
    strasse: string; 
    hausnummer: string; 
    plz: string; 
    ort: string;
  }>({ strasse: "", hausnummer: "", plz: "", ort: "" });
  const [locationNotes, setLocationNotes] = useState<string>("");
  
  // Bildupload und Analyse
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Materialkostenberechnung
  const [selectedRoadPreset, setSelectedRoadPreset] = useState<string>("Bundesstraße");
  const [roadWidth, setRoadWidth] = useState<number>(roadWidthPresets[selectedRoadPreset as keyof typeof roadWidthPresets]);
  const [showCostEstimation, setShowCostEstimation] = useState<boolean>(false);
  
  useEffect(() => {
    // Wenn die Belastungsklasse geändert wird, setze den Straßentyp automatisch
    if (selectedBelastungsklasse === "Bk100") {
      setSelectedRoadPreset("Autobahn");
      setRoadWidth(roadWidthPresets["Autobahn" as keyof typeof roadWidthPresets]);
    } else if (selectedBelastungsklasse === "Bk32" || selectedBelastungsklasse === "Bk10") {
      setSelectedRoadPreset("Bundesstraße");
      setRoadWidth(roadWidthPresets["Bundesstraße" as keyof typeof roadWidthPresets]);
    } else if (selectedBelastungsklasse === "Bk3,2" || selectedBelastungsklasse === "Bk1,8") {
      setSelectedRoadPreset("Landstraße");
      setRoadWidth(roadWidthPresets["Landstraße" as keyof typeof roadWidthPresets]);
    } else if (selectedBelastungsklasse === "Bk1,0") {
      setSelectedRoadPreset("Kreisstraße");
      setRoadWidth(roadWidthPresets["Kreisstraße" as keyof typeof roadWidthPresets]);
    } else if (selectedBelastungsklasse === "Bk0,3") {
      setSelectedRoadPreset("Gemeindestraße");
      setRoadWidth(roadWidthPresets["Gemeindestraße" as keyof typeof roadWidthPresets]);
    }
  }, [selectedBelastungsklasse]);
  
  const addMarker = useCallback((lat: number, lng: number) => {
    setTempLocation([lat, lng]);
    setNewLocationDialogOpen(true);
    
    // Leere Adressinfo setzen (wird später manuell eingetragen)
    setLocationInfo({
      strasse: "",
      hausnummer: "",
      plz: "",
      ort: ""
    });
  }, []);
  
  const saveLocation = () => {
    if (!tempLocation) return;
    
    const newMarker: MarkerInfo = {
      position: tempLocation,
      name: locationName || `Standort ${markers.length + 1}`,
      belastungsklasse: selectedBelastungsklasse !== "none" ? selectedBelastungsklasse : undefined,
      strasse: locationInfo.strasse,
      hausnummer: locationInfo.hausnummer,
      plz: locationInfo.plz,
      ort: locationInfo.ort,
      notes: locationNotes
    };
    
    setMarkers([...markers, newMarker]);
    setSelectedMarkerIndex(markers.length);
    setNewLocationDialogOpen(false);
    
    // Reset the form
    setLocationName("");
    setLocationNotes("");
  };
  
  const deleteMarker = (index: number) => {
    const newMarkers = [...markers];
    newMarkers.splice(index, 1);
    setMarkers(newMarkers);
    
    if (selectedMarkerIndex === index) {
      setSelectedMarkerIndex(-1);
    } else if (selectedMarkerIndex > index) {
      setSelectedMarkerIndex(selectedMarkerIndex - 1);
    }
  };
  
  const analyzeSurface = useCallback(async (index: number, file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simuliere Fortschritt
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 100);
      
      // HIER EIGENTLICH: Bild hochladen und analysieren lassen
      // Simuliere Verzögerung für die Demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Beispiel-Analyseergebnis (würde eigentlich vom Backend kommen)
      const newMarkers = [...markers];
      const analysisResult = {
        imageUrl: URL.createObjectURL(file),
        belastungsklasse: selectedBelastungsklasse === "none" ? "Bk3,2" : selectedBelastungsklasse, // Beispiel
        asphalttyp: "Asphaltbeton (AB)",
        confidence: 87,
        analyseDetails: "Asphalt zeigt typische Merkmale für mittlere Belastung. Empfehlung: Bauklasse III nach RStO 12.",
        visualizationUrl: "/rsto-viz-example.png", // Beispielbild
        timestamp: Date.now()
      };
      
      newMarkers[index] = {
        ...newMarkers[index],
        surfaceAnalysis: analysisResult
      };
      
      setMarkers(newMarkers);
      
    } catch (err) {
      console.error("Fehler bei der Analyse:", err);
      alert("Bei der Bildanalyse ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsUploading(false);
    }
  }, [markers, selectedBelastungsklasse]);
  
  const analyzeGround = useCallback(async (index: number, file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simuliere Fortschritt
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 100);
      
      // HIER EIGENTLICH: Bild hochladen und analysieren lassen
      // Simuliere Verzögerung für die Demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Beispiel-Analyseergebnis (würde eigentlich vom Backend kommen)
      const newMarkers = [...markers];
      const analysisResult = {
        imageUrl: URL.createObjectURL(file),
        belastungsklasse: "Bk3,2", // Empfohlene Belastungsklasse basierend auf Bodentyp
        bodenklasse: "Sand",
        bodentragfaehigkeitsklasse: "F1",
        confidence: 84,
        analyseDetails: "Sandiger Boden mit guter Tragfähigkeit. Empfehlung: Belastungsklasse 3,2 und Bauklasse III.",
        visualizationUrl: "/rsto-viz-example.png", // Beispielbild
        timestamp: Date.now()
      };
      
      newMarkers[index] = {
        ...newMarkers[index],
        groundAnalysis: analysisResult
      };
      
      setMarkers(newMarkers);
      
    } catch (err) {
      console.error("Fehler bei der Analyse:", err);
      alert("Bei der Bildanalyse ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsUploading(false);
    }
  }, [markers]);
  
  const renderMarkerPopup = (marker: MarkerInfo, index: number) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{marker.name || `Standort ${index + 1}`}</h3>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                setSelectedMarkerIndex(index);
              }}
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 w-6 p-0 text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Möchten Sie den Standort "${marker.name || `Standort ${index + 1}`}" wirklich löschen?`)) {
                  deleteMarker(index);
                }
              }}
            >
              <div className="h-4 w-4 text-red-500">❌</div>
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <div>
            Position: {marker.position[0].toFixed(5)}, {marker.position[1].toFixed(5)}
          </div>
          
          {marker.strasse && (
            <div>
              Adresse: {marker.strasse} {marker.hausnummer}, {marker.plz} {marker.ort}
            </div>
          )}
          
          {marker.belastungsklasse && (
            <div className="mt-1">
              <span className="font-semibold">Belastungsklasse:</span> {marker.belastungsklasse}
            </div>
          )}
          
          {marker.notes && (
            <div className="mt-1 text-xs">
              <span className="font-semibold">Notizen:</span> {marker.notes}
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-1 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span>Oberflächenanalyse:</span>
            <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-md px-2 py-1 text-[10px]">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    analyzeSurface(index, e.target.files[0]);
                  }
                }}
              />
              <Camera className="h-3 w-3 inline mr-1" /> Bild aufnehmen
            </label>
          </div>
          
          {marker.surfaceAnalysis?.imageUrl && (
            <div className="text-xs space-y-1">
              <img 
                src={marker.surfaceAnalysis.imageUrl} 
                alt="Oberflächenanalyse" 
                className="w-full h-24 object-cover rounded-md"
              />
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <span className="text-muted-foreground">Belastungsklasse:</span>
                <span className="font-medium">{marker.surfaceAnalysis.belastungsklasse}</span>
                
                <span className="text-muted-foreground">Asphalttyp:</span>
                <span className="font-medium">{marker.surfaceAnalysis.asphalttyp}</span>
                
                <span className="text-muted-foreground">Konfidenz:</span>
                <span className="font-medium">{marker.surfaceAnalysis.confidence}%</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {marker.surfaceAnalysis.analyseDetails}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-1 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span>Bodenanalyse:</span>
            <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-md px-2 py-1 text-[10px]">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    analyzeGround(index, e.target.files[0]);
                  }
                }}
              />
              <Camera className="h-3 w-3 inline mr-1" /> Bild aufnehmen
            </label>
          </div>
          
          {marker.groundAnalysis?.imageUrl && (
            <div className="text-xs space-y-1">
              <img 
                src={marker.groundAnalysis.imageUrl} 
                alt="Bodenanalyse" 
                className="w-full h-24 object-cover rounded-md"
              />
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <span className="text-muted-foreground">Bodenklasse:</span>
                <span className="font-medium">{marker.groundAnalysis.bodenklasse}</span>
                
                <span className="text-muted-foreground">Tragfähigkeitsklasse:</span>
                <span className="font-medium">{marker.groundAnalysis.bodentragfaehigkeitsklasse}</span>
                
                <span className="text-muted-foreground">Empf. Belastungsklasse:</span>
                <span className="font-medium">{marker.groundAnalysis.belastungsklasse}</span>
                
                <span className="text-muted-foreground">Konfidenz:</span>
                <span className="font-medium">{marker.groundAnalysis.confidence}%</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {marker.groundAnalysis.analyseDetails}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="container mx-auto">
      <div className="flex items-center mb-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-2">Geo-Informationen</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-120px)] flex flex-col">
            {/* Belastungsklasse-Auswahl als separater großer Button über der Karte */}
            <div className="p-2 mx-4 mt-4 bg-primary/10 rounded-md border border-primary/30 flex items-center justify-between">
              <div className="font-medium flex items-center gap-2">
                <Asterisk className="h-5 w-5 text-primary" /> 
                <span>WICHTIG: Belastungsklasse auswählen:</span>
              </div>
              <Select 
                value={selectedBelastungsklasse}
                onValueChange={setSelectedBelastungsklasse}
              >
                <SelectTrigger className="h-9 border-primary/50 bg-white w-72 font-medium">
                  <SelectValue placeholder="Bitte Belastungsklasse wählen..." />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="none">Keine Klassifizierung</SelectItem>
                  {belastungsklassen.map((klasse) => (
                    <SelectItem key={klasse.klasse} value={klasse.klasse}>
                      {klasse.klasse} - {klasse.beispiel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <CardHeader className="pb-0">
              <Tabs defaultValue="map" value={activeTab} onValueChange={setActiveTab}>
                <div className="flex justify-between items-center">
                  <TabsList>
                    <TabsTrigger value="map" className="text-xs">
                      <MapIcon className="h-4 w-4 mr-1" /> Karte
                    </TabsTrigger>
                    <TabsTrigger value="hybrid" className="text-xs">
                      <Layers className="h-4 w-4 mr-1" /> Satellit
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center space-x-2">
                    
                    {/* Direkte Koordinateneingabe und Adressumrechner-Dialog */}
                    <div className="flex space-x-1">
                      <Input 
                        type="number"
                        placeholder="Breite (z.B. 48.13)"
                        className="h-8 text-xs w-24"
                        value={searchLat || ""}
                        onChange={(e) => setSearchLat(parseFloat(e.target.value) || null)}
                        min="-90"
                        max="90"
                        step="0.00001"
                      />
                      <Input 
                        type="number"
                        placeholder="Länge (z.B. 11.57)"
                        className="h-8 text-xs w-24"
                        value={searchLng || ""}
                        onChange={(e) => setSearchLng(parseFloat(e.target.value) || null)}
                        min="-180"
                        max="180"
                        step="0.00001"
                      />
                      <Button
                        variant="outline"
                        className="h-8 text-xs px-2"
                        onClick={() => {
                          const address = prompt("Geben Sie eine Adresse ein (z.B. Berlin):");
                          if (address && address.trim()) {
                            // Direkte Geocoding-Anfrage mit MapBox API
                            fetch(
                              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                                address
                              )}.json?access_token=${MAPBOX_TOKEN}&country=de&limit=1`
                            )
                              .then(response => {
                                if (!response.ok) {
                                  throw new Error("Fehler bei der Adresssuche");
                                }
                                return response.json();
                              })
                              .then(data => {
                                if (data.features && data.features.length > 0) {
                                  // Mapbox gibt [lng, lat] zurück, wir brauchen [lat, lng]
                                  const [lng, lat] = data.features[0].center;
                                  setSearchLat(lat);
                                  setSearchLng(lng);
                                  setMapCenter([lat, lng]);
                                  
                                  // Automatisch einen Marker an dieser Position hinzufügen
                                  const newMarker: MarkerInfo = {
                                    position: [lat, lng],
                                    name: `Standort ${markers.length + 1}`,
                                    belastungsklasse: selectedBelastungsklasse !== "none" ? selectedBelastungsklasse : undefined,
                                    strasse: "",
                                    hausnummer: "",
                                    plz: "",
                                    ort: "",
                                    notes: ""
                                  };
                                  setMarkers([...markers, newMarker]);
                                  setSelectedMarkerIndex(markers.length);
                                  
                                  // Erfolgsmeldung anzeigen
                                  alert(`Marker wurde an den Koordinaten ${lat.toFixed(5)}, ${lng.toFixed(5)} gesetzt.`);
                                } else {
                                  alert("Keine Ergebnisse für diese Adresse gefunden.");
                                }
                              })
                              .catch(err => {
                                console.error("Fehler bei der Adresssuche:", err);
                                alert("Bei der Adresssuche ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
                              });
                          }
                        }}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Adresse suchen
                      </Button>
                      <Button
                        className="h-8 text-xs px-2"
                        onClick={() => {
                          if (searchLat === null || searchLng === null) {
                            alert("Bitte geben Sie gültige Koordinaten ein");
                            return;
                          }
                          
                          // Breiten- und Längengrad direkt verwenden
                          setMapCenter([searchLat, searchLng]);
                          
                          // Automatisch einen Marker an dieser Position hinzufügen
                          const newMarker: MarkerInfo = {
                            position: [searchLat, searchLng],
                            name: `Standort ${markers.length + 1}`,
                            belastungsklasse: selectedBelastungsklasse !== "none" ? selectedBelastungsklasse : undefined,
                            strasse: "",
                            hausnummer: "",
                            plz: "",
                            ort: "",
                            notes: ""
                          };
                          setMarkers([...markers, newMarker]);
                          setSelectedMarkerIndex(markers.length);
                          
                          // Erfolgsmeldung anzeigen
                          alert(`Marker wurde an den Koordinaten ${searchLat.toFixed(5)}, ${searchLng.toFixed(5)} gesetzt.`);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Gehe zu
                      </Button>
                    </div>
                  </div>
                </div>
              </Tabs>
            </CardHeader>
            
            <CardContent className="flex-grow p-0 relative">
              {isUploading && (
                <div className="absolute top-2 right-2 z-20 bg-white dark:bg-gray-900 p-2 rounded-md shadow-md w-64">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">Analysiere Bild...</span>
                    <span className="text-xs">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            
              <div className="h-full w-full">
                <MapContainer 
                  center={mapCenter} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                >
                  {/* Map Event Handler Component */}
                  <MapEvents onMoveEnd={(map) => {
                    const center = map.getCenter();
                    setMapCenter([center.lat, center.lng]);
                  }} />
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer checked={activeTab === "map"} name="OpenStreetMap">
                      <TileLayer
                        url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                      />
                    </LayersControl.BaseLayer>
                    
                    <LayersControl.BaseLayer checked={activeTab === "hybrid"} name="Satellite">
                      <TileLayer
                        url={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                      />
                    </LayersControl.BaseLayer>
                  </LayersControl>
                  
                  {/* Marker anzeigen */}
                  {markers.map((marker, idx) => (
                    <Marker 
                      key={`marker-${idx}`}
                      position={marker.position}
                      icon={createCustomIcon(marker.belastungsklasse)}
                      eventHandlers={{
                        click: () => {
                          setSelectedMarkerIndex(idx);
                        }
                      }}
                    >
                      <LeafletTooltip direction="top" offset={[0, -20]}>
                        {marker.name || `Standort ${idx + 1}`}
                      </LeafletTooltip>
                      <Popup maxWidth={300}>
                        {renderMarkerPopup(marker, idx)}
                      </Popup>
                    </Marker>
                  ))}
                  
                  {/* Route anzeigen */}
                  {markers.length >= 2 && (
                    <Polyline 
                      positions={markers.map(m => m.position)}
                      color="#3388ff"
                      weight={3}
                      opacity={0.8}
                      dashArray="5, 10"
                    />
                  )}
                  
                  {/* Marker-Klick-Handler */}
                  <MapClicker
                    onMarkerAdd={addMarker}
                    selectedBelastungsklasse={selectedBelastungsklasse}
                  />
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-[calc(100vh-120px)] overflow-y-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" /> 
                Standorte und Streckendaten
              </CardTitle>
              <CardDescription>
                Verwalten Sie Ihre markierten Standorte und berechnen Sie Materialkosten.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
    

    </>
  );
}