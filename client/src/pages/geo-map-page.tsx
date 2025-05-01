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
import { AddressToCoordinates } from "@/components/geo/address-to-coordinates";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap, 
  Polyline, 
  Tooltip as LeafletTooltip,
  LayersControl
} from 'react-leaflet';
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

// Berechnet die Entfernung zwischen zwei geografischen Punkten in Kilometern (Haversine-Formel)
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Erdradius in Kilometern
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Entfernung in Kilometern
  
  return Math.round(distance * 100) / 100; // Auf 2 Nachkommastellen gerundet
}

// Berechnet Entfernungen zwischen mehreren Markern
function calculateRouteDistances(markers: MarkerInfo[]): {total: number, segments: number[]} {
  if (markers.length < 2) {
    return { total: 0, segments: [] };
  }
  
  let totalDistance = 0;
  const segmentDistances: number[] = [];
  
  for (let i = 0; i < markers.length - 1; i++) {
    const current = markers[i];
    const next = markers[i + 1];
    const distance = calculateDistance(
      current.position[0], 
      current.position[1], 
      next.position[0], 
      next.position[1]
    );
    
    segmentDistances.push(distance);
    totalDistance += distance;
  }
  
  return {
    total: Math.round(totalDistance * 100) / 100,
    segments: segmentDistances
  };
}

// Berechnet die optimale Route zwischen allen Markern (kürzeste Gesamtstrecke)
// Nutzt einen einfachen Greedy-Algorithmus
function optimizeRouteOrder(markers: MarkerInfo[]): MarkerInfo[] {
  if (markers.length <= 2) {
    return [...markers]; // Ein oder zwei Marker brauchen keine Optimierung
  }
  
  const optimizedMarkers: MarkerInfo[] = [markers[0]]; // Start mit dem ersten Marker
  const remainingMarkers = [...markers.slice(1)]; // Alle außer dem ersten Marker
  
  while (remainingMarkers.length > 0) {
    const lastMarker = optimizedMarkers[optimizedMarkers.length - 1];
    let nearestIndex = 0;
    let shortestDistance = Infinity;
    
    // Finde den nächsten Marker
    for (let i = 0; i < remainingMarkers.length; i++) {
      const currentMarker = remainingMarkers[i];
      const distance = calculateDistance(
        lastMarker.position[0],
        lastMarker.position[1],
        currentMarker.position[0],
        currentMarker.position[1]
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestIndex = i;
      }
    }
    
    // Füge nächsten Marker zur optimierten Route hinzu
    optimizedMarkers.push(remainingMarkers[nearestIndex]);
    remainingMarkers.splice(nearestIndex, 1);
  }
  
  return optimizedMarkers;
}

// Materialkosten-Modell für verschiedene Belastungsklassen (pro m²)
interface MaterialCosts {
  asphaltdecke: number;     // Kosten pro m² für Asphaltdecke
  asphalttragschicht: number;  // Kosten pro m² für Asphalttragschicht
  frostschutzschicht: number;  // Kosten pro m² für Frostschutzschicht
  schottertragschicht?: number; // Kosten pro m² für Schottertragschicht (optional)
}

// Kostenschätzungen pro m² für verschiedene Materialien in EUR
const baseMaterialCosts: MaterialCosts = {
  asphaltdecke: 35,          // Hohe Qualität
  asphalttragschicht: 25,    // Mittlere Qualität
  frostschutzschicht: 15,    // Basisschicht
  schottertragschicht: 18    // Schottertragschicht
};

// Liste deutscher Bodenklassen basierend auf BGR-Klassifikation
const bodenklassen = [
  "Sand",
  "Lehm",
  "Ton",
  "Tonschluff",
  "Sandlehm",
  "Lehmiger Sand",
  "Toniger Lehm",
  "Löss",
  "Kies",
  "Schluff",
  "Feinsand",
  "Mittelsand",
  "Grobsand",
  "Moorböden",
  "Torf",
  "Lösslehm",
  "Auenlehm",
  "Geschiebemergel",
  "Geschiebelehm",
  "Kalkstein",
  "Basalt",
  "Granit",
  "Sandstein",
  "Tonstein",
  "Gips",
  "Fels"
];

// Verschiedene Maschinenfaktoren je nach Bodenklasse
const maschinenKosten: Record<string, { 
  maschinen: string[],
  kostenProTag: number,
  effizienzFaktor: number // m² pro Tag
}[]> = {
  "Sand": [
    { 
      maschinen: ["Straßenfertiger", "Tandemwalze"], 
      kostenProTag: 800, 
      effizienzFaktor: 1000
    },
    { 
      maschinen: ["Bodenfräse", "Grader", "Verdichter"], 
      kostenProTag: 1200, 
      effizienzFaktor: 800
    }
  ],
  "Lehm": [
    { 
      maschinen: ["Straßenfertiger", "Tandemwalze", "Gummiradwalze"], 
      kostenProTag: 1200, 
      effizienzFaktor: 800
    },
    { 
      maschinen: ["Bodenfräse", "Grader", "Schwerer Verdichter"], 
      kostenProTag: 1500, 
      effizienzFaktor: 600
    }
  ],
  "Ton": [
    { 
      maschinen: ["Straßenfertiger", "Tandemwalze", "Gummiradwalze", "Vorauflockerer"], 
      kostenProTag: 1500, 
      effizienzFaktor: 600
    },
    { 
      maschinen: ["Bodenfräse", "Grader", "Schwerer Verdichter", "Kalkdosiergerät"], 
      kostenProTag: 1800, 
      effizienzFaktor: 500
    }
  ],
  "Tonschluff": [
    { 
      maschinen: ["Straßenfertiger", "Tandemwalze", "Gummiradwalze", "Vorauflockerer"], 
      kostenProTag: 1400, 
      effizienzFaktor: 650
    },
    { 
      maschinen: ["Bodenfräse", "Grader", "Schwerer Verdichter", "Kalkdosiergerät"], 
      kostenProTag: 1700, 
      effizienzFaktor: 550
    }
  ],
  "Kies": [
    { 
      maschinen: ["Straßenfertiger", "Tandemwalze"], 
      kostenProTag: 700, 
      effizienzFaktor: 1200
    },
    { 
      maschinen: ["Grader", "Verdichter"], 
      kostenProTag: 900, 
      effizienzFaktor: 1000
    }
  ],
  "Fels": [
    { 
      maschinen: ["Straßenfertiger", "Tandemwalze", "Schweißwalze"], 
      kostenProTag: 1000, 
      effizienzFaktor: 800
    },
    { 
      maschinen: ["Hydraulikhammer", "Brecher", "Steinschredder"], 
      kostenProTag: 2200, 
      effizienzFaktor: 400
    }
  ],
  "default": [
    { 
      maschinen: ["Straßenfertiger", "Tandemwalze"], 
      kostenProTag: 900, 
      effizienzFaktor: 900
    }
  ]
};

// Koeffizient für Kostenmultiplikatoren basierend auf Belastungsklasse
const belastungsklassenCostFactors: Record<string, number> = {
  "Bk100": 1.5,   // Höchste Beanspruchung = teurere Materialien
  "Bk32": 1.3,
  "Bk10": 1.2,
  "Bk3,2": 1.1,
  "Bk1,8": 1.0,
  "Bk1,0": 0.9,
  "Bk0,3": 0.8,   // Niedrigste Beanspruchung = günstigere Materialien
  "default": 1.0  // Standardfaktor
};

// Straßenbreite-Presets in Metern
const roadWidthPresets: Record<string, number> = {
  "Autobahn": 12.5,       // Mehrspurige Autobahn
  "Bundesstraße": 7.5,    // Breite Hauptstraße
  "Landstraße": 6.5,      // Standard Landstraße  
  "Kreisstraße": 5.5,     // Typische Kreisstraße
  "Gemeindestraße": 5.0,  // Kleinere Ortsstraße
  "Wirtschaftsweg": 3.5,  // Einfacher Wirtschaftsweg
  "Fußweg": 2.0           // Fuß-/Radweg
};

// Mapping von Belastungsklassen zu empfohlenen Straßentypen
const belastungsklasseToRoadType: Record<string, string> = {
  "Bk100": "Autobahn",
  "Bk32": "Bundesstraße",
  "Bk10": "Bundesstraße",
  "Bk3,2": "Landstraße",
  "Bk1,8": "Landstraße",
  "Bk1,0": "Kreisstraße",
  "Bk0,3": "Gemeindestraße"
};

// Hilfsfunktion zum Abrufen von Belastungsklasse-Informationen
function getKlasseInfo(klasseId: string): BelastungsklasseInfo | undefined {
  return belastungsklassen.find(k => k.klasse === klasseId);
}

// Berechnet Materialkosten für eine Straße basierend auf:
// - Belastungsklasse (bestimmt Materialstärke und Qualität)
// - Streckenlänge in km
// - Straßenbreite in Metern
// - Bodenklasse (optional)
function calculateMaterialCosts(
  belastungsklasse: string,
  distanceKm: number,
  roadWidthMeters: number,
  bodenklasse?: string
): {
  totalCost: number;
  costBreakdown: {
    asphaltdecke: number;
    asphalttragschicht: number;
    frostschutzschicht: number;
    schottertragschicht?: number;
  };
  areaSquareMeters: number;
  maschinenEmpfehlung?: {
    maschinen: string[];
    kostenProTag: number;
    bauzeit: number; // In Tagen
    maschinenGesamtkosten: number;
  }[];
} {
  const klasseInfo = getKlasseInfo(belastungsklasse);
  if (!klasseInfo) {
    return {
      totalCost: 0,
      costBreakdown: {
        asphaltdecke: 0,
        asphalttragschicht: 0,
        frostschutzschicht: 0
      },
      areaSquareMeters: 0
    };
  }

  // Umrechnung cm zu m und String zu Zahl
  const asphaltdeckeDicke = parseFloat(klasseInfo.dickeAsphaltdecke) / 100;
  const asphalttragschichtDicke = parseFloat(klasseInfo.dickeAsphaltTragschicht) / 100;
  
  // Bei Frostschutzschicht nehmen wir den Mittelwert der Spanne
  const frostschutzRangeText = klasseInfo.dickeFrostschutzschicht1;
  const frostschutzRange = frostschutzRangeText.split('-').map((x: string) => parseFloat(x));
  const frostschutzDicke = (frostschutzRange[0] + frostschutzRange[1]) / 2 / 100; // Durchschnitt in Meter
  
  // Optional: Schottertragschicht, falls vorhanden
  let schottertragschichtDicke = 0;
  if (klasseInfo.dickeSchotterTragschicht) {
    schottertragschichtDicke = parseFloat(klasseInfo.dickeSchotterTragschicht) / 100;
  }
  
  // Kostenfaktor basierend auf Belastungsklasse
  const costFactor = belastungsklassenCostFactors[belastungsklasse] || belastungsklassenCostFactors.default;
  
  // Berechnung der Fläche in Quadratmetern
  const areaSquareMeters = Math.round(distanceKm * 1000 * roadWidthMeters);
  
  // Berechnung der Materialkosten pro Schicht
  const asphaltdeckeKosten = areaSquareMeters * baseMaterialCosts.asphaltdecke * costFactor * asphaltdeckeDicke * 100;
  const asphalttragschichtKosten = areaSquareMeters * baseMaterialCosts.asphalttragschicht * costFactor * asphalttragschichtDicke * 100;
  const frostschutzschichtKosten = areaSquareMeters * baseMaterialCosts.frostschutzschicht * frostschutzDicke * 100;
  
  // Optional: Schottertragschicht-Kosten
  let schottertragschichtKosten = 0;
  if (schottertragschichtDicke > 0 && baseMaterialCosts.schottertragschicht) {
    schottertragschichtKosten = areaSquareMeters * baseMaterialCosts.schottertragschicht * schottertragschichtDicke * 100;
  }
  
  // Gesamtkosten
  const totalCost = asphaltdeckeKosten + asphalttragschichtKosten + frostschutzschichtKosten + schottertragschichtKosten;
  
  // Maschinenschätzungen basierend auf der Bodenklasse
  let maschinenEmpfehlung;
  
  if (bodenklasse && maschinenKosten[bodenklasse]) {
    maschinenEmpfehlung = maschinenKosten[bodenklasse].map(option => {
      const bauzeit = Math.ceil(areaSquareMeters / option.effizienzFaktor);
      const maschinenGesamtkosten = bauzeit * option.kostenProTag;
      
      return {
        maschinen: option.maschinen,
        kostenProTag: option.kostenProTag,
        bauzeit,
        maschinenGesamtkosten
      };
    });
  } else if (maschinenKosten.default) {
    // Fallback auf Standard-Maschinenkonfiguration
    maschinenEmpfehlung = maschinenKosten.default.map(option => {
      const bauzeit = Math.ceil(areaSquareMeters / option.effizienzFaktor);
      const maschinenGesamtkosten = bauzeit * option.kostenProTag;
      
      return {
        maschinen: option.maschinen,
        kostenProTag: option.kostenProTag,
        bauzeit,
        maschinenGesamtkosten
      };
    });
  }
  
  return {
    totalCost,
    costBreakdown: {
      asphaltdecke: asphaltdeckeKosten,
      asphalttragschicht: asphalttragschichtKosten,
      frostschutzschicht: frostschutzschichtKosten,
      ...(schottertragschichtKosten > 0 ? { schottertragschicht: schottertragschichtKosten } : {})
    },
    areaSquareMeters,
    maschinenEmpfehlung
  };
}

// Custom-Icon für Marker basierend auf Belastungsklasse
function createCustomIcon(belastungsklasse?: string): L.Icon {
  const color = belastungsklasse 
    ? belastungsklassenColors[belastungsklasse] || belastungsklassenColors.default
    : belastungsklassenColors.default;
    
  return new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: `marker-with-color-${belastungsklasse || 'default'}`
  });
}

// Komponente für Klicks auf die Karte
interface MapClickerProps {
  onMarkerAdd: (lat: number, lng: number) => void;
  selectedBelastungsklasse: string;
}

function MapClicker({ onMarkerAdd, selectedBelastungsklasse }: MapClickerProps) {
  const map = useMap();
  
  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onMarkerAdd(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onMarkerAdd, selectedBelastungsklasse]);
  
  return null;
}

// Hilfskomponente für Map-Events und useMap-Hook
// Map Events Handler Komponente
interface MapEventsProps {
  onMoveEnd: (map: L.Map) => void;
}

function MapEvents({ onMoveEnd }: MapEventsProps) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handleMoveEnd = () => {
      onMoveEnd(map);
    };
    
    map.on('moveend', handleMoveEnd);
    
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onMoveEnd]);
  
  return null;
}

// Hauptkomponente: Geo-Map Page
export default function GeoMapPage() {
  const [location, setLocation] = useLocation();
  const [selectedBelastungsklasse, setSelectedBelastungsklasse] = useState<string>("none");
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.1351, 11.5820]); // München
  // States für die Koordinateneingabe statt Adresssuche
  const [searchLat, setSearchLat] = useState<number | null>(48.13); // München Standardwert
  const [searchLng, setSearchLng] = useState<number | null>(11.57); // München Standardwert
  const [newLocationName, setNewLocationName] = useState<string>("");
  const [newLocationDialogOpen, setNewLocationDialogOpen] = useState<boolean>(false);
  const [addressToCoordinatesDialogOpen, setAddressToCoordinatesDialogOpen] = useState<boolean>(false);
  const [tempLocation, setTempLocation] = useState<[number, number] | null>(null);
  const [showCostEstimation, setShowCostEstimation] = useState<boolean>(true);
  const [roadWidth, setRoadWidth] = useState<number>(7.5); // Standard: Breite einer Bundesstraße
  const [selectedRoadPreset, setSelectedRoadPreset] = useState<string>("Bundesstraße");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<string>("map");
  const [selectedBodenklasse, setSelectedBodenklasse] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [locationInfo, setLocationInfo] = useState<any | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("Baustelle Oberbrunn");
  
  // Füge einen neuen Marker hinzu
  const addMarker = useCallback((lat: number, lng: number, name?: string) => {
    const newMarker: MarkerInfo = {
      position: [lat, lng],
      belastungsklasse: selectedBelastungsklasse !== "none" ? selectedBelastungsklasse : undefined,
      name: name || `Standort ${markers.length + 1}`
    };
    
    setMarkers(prev => [...prev, newMarker]);
    setSelectedMarkerIndex(markers.length); // Wähle den neu hinzugefügten Marker aus
    
    // Wenn Belastungsklasse ausgewählt ist, setze Straßentyp-Preset automatisch
    if (selectedBelastungsklasse !== "none" && belastungsklasseToRoadType[selectedBelastungsklasse]) {
      const recommendedRoadType = belastungsklasseToRoadType[selectedBelastungsklasse];
      setSelectedRoadPreset(recommendedRoadType);
      setRoadWidth(roadWidthPresets[recommendedRoadType]);
    }
    
    // Hole Adress-Informationen (Reverse Geocoding)
    fetchLocationInfo(lat, lng, markers.length);
  }, [markers, selectedBelastungsklasse]);
  
  // Hole Standort-Informationen über MapBox-API
  const fetchLocationInfo = useCallback(async (lat: number, lng: number, markerIndex: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=de`
      );
      
      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der Standortinformationen");
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const addressInfo = {
          plz: "",
          ort: "",
          strasse: "",
          hausnummer: ""
        };
        
        // Extrahiere Informationen aus den MapBox-Features
        data.features.forEach((feature: any) => {
          if (feature.place_type.includes('postcode')) {
            addressInfo.plz = feature.text || "";
          }
          if (feature.place_type.includes('place')) {
            addressInfo.ort = feature.text || "";
          }
          if (feature.place_type.includes('address')) {
            const fullAddress = feature.place_name || "";
            const addressMatch = fullAddress.match(/([^,]+),\s*([^,]+)/);
            if (addressMatch) {
              const streetAddress = addressMatch[1];
              const streetMatch = streetAddress.match(/(.+)\s+(\d+\w*)/);
              if (streetMatch) {
                addressInfo.strasse = streetMatch[1];
                addressInfo.hausnummer = streetMatch[2];
              } else {
                addressInfo.strasse = streetAddress;
              }
            }
          }
        });
        
        // Aktualisiere den Marker mit den gefundenen Informationen
        setMarkers(prevMarkers => {
          const newMarkers = [...prevMarkers];
          newMarkers[markerIndex] = {
            ...newMarkers[markerIndex],
            strasse: addressInfo.strasse,
            hausnummer: addressInfo.hausnummer,
            plz: addressInfo.plz,
            ort: addressInfo.ort
          };
          return newMarkers;
        });
      }
    } catch (error) {
      console.error("Fehler bei der Adressauflösung:", error);
    }
  }, []);
  
  // Keine separate Handlerfunktion mehr, alles direkt im Button-Click-Handler
  // Die inline Version ist im Formularelement implementiert
  
  const updateMarkerInfo = useCallback((index: number, key: string, value: any) => {
    setMarkers(prev => {
      const newMarkers = [...prev];
      if (newMarkers[index]) {
        newMarkers[index] = {
          ...newMarkers[index],
          [key]: value
        };
      }
      return newMarkers;
    });
  }, []);
  
  const handleRemoveMarker = useCallback((index: number) => {
    setMarkers(prev => prev.filter((_, i) => i !== index));
    if (selectedMarkerIndex === index) {
      setSelectedMarkerIndex(null);
    } else if (selectedMarkerIndex !== null && selectedMarkerIndex > index) {
      setSelectedMarkerIndex(selectedMarkerIndex - 1);
    }
  }, [selectedMarkerIndex]);
  
  const analyzeSurface = useCallback(async (index: number, file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simuliere Upload-Fortschritt
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 300);
      
      // Erstelle einen FileReader zum Lesen des Bildes
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        // Hier würde die eigentliche API-Anfrage an den Bildanalyse-Service erfolgen
        // Für Demo: Simuliere eine Analyse mit zufälligen Ergebnissen
        const base64Image = reader.result as string;
        
        // Simulierte Analysezeit (2 Sekunden)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simuliertes Ergebnis
        const randomIndex = Math.floor(Math.random() * belastungsklassen.length);
        const selectedClass = belastungsklassen[randomIndex].klasse;
        
        // Aktualisiere Marker mit Analyseergebnis
        setMarkers(prev => {
          const newMarkers = [...prev];
          if (newMarkers[index]) {
            newMarkers[index] = {
              ...newMarkers[index],
              surfaceAnalysis: {
                imageUrl: base64Image, // Bild als Base64
                belastungsklasse: selectedClass, // Zufällige Belastungsklasse
                asphalttyp: ["Asphaltbeton", "Gussasphalt", "Splittmastixasphalt"][Math.floor(Math.random() * 3)],
                confidence: 70 + Math.floor(Math.random() * 25), // Zufällige Konfidenz (70-95%)
                analyseDetails: "Oberflächenanalyse basierend auf Textur und Farbe",
                timestamp: Date.now()
              }
            };
          }
          return newMarkers;
        });
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        // Verzögerung für die Anzeige des 100% Fortschritts
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      };
      
      reader.onerror = () => {
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(0);
        alert("Fehler beim Lesen der Datei");
      };
    } catch (error) {
      console.error("Fehler bei der Bildanalyse:", error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);
  
  const analyzeGround = useCallback(async (index: number, file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simuliere Upload-Fortschritt
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 250);
      
      // Erstelle einen FileReader zum Lesen des Bildes
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        // Hier würde die eigentliche API-Anfrage an den Bildanalyse-Service erfolgen
        // Für Demo: Simuliere eine Analyse mit zufälligen Ergebnissen
        const base64Image = reader.result as string;
        
        // Simulierte Analysezeit (2.5 Sekunden)
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Simuliertes Ergebnis - Bodenklasse
        const randomBodenklasseIndex = Math.floor(Math.random() * bodenklassen.length);
        const selectedBodenklasse = bodenklassen[randomBodenklasseIndex];
        
        // Basierend auf der Bodenklasse eine passende Belastungsklasse bestimmen
        // Für schwerere Böden wie Ton empfehlen wir niedrigere Belastungsklassen, 
        // für festere Böden wie Kies oder Sand höhere Belastungsklassen
        let recommendedClass = "Bk3,2"; // Standard: mittlere Belastungsklasse
        
        if (["Sand", "Kies", "Sandstein", "Granit", "Basalt", "Fels"].includes(selectedBodenklasse)) {
          // Festere Böden können mehr Last tragen
          recommendedClass = ["Bk100", "Bk32", "Bk10"][Math.floor(Math.random() * 3)];
        } else if (["Ton", "Lehm", "Tonschluff", "Schluff"].includes(selectedBodenklasse)) {
          // Weichere Böden benötigen niedrigere Belastungsklassen
          recommendedClass = ["Bk3,2", "Bk1,8", "Bk1,0"][Math.floor(Math.random() * 3)];
        } else if (["Torf", "Moorböden"].includes(selectedBodenklasse)) {
          // Sehr weiche Böden benötigen niedrigste Belastungsklasse
          recommendedClass = "Bk0,3";
        }
        
        // Bodentragfähigkeitsklasse basierend auf der Bodenklasse bestimmen
        let bodentragfaehigkeitsklasse = "F2"; // Standard: mittlere Tragfähigkeit
        
        if (["Sand", "Kies", "Sandstein", "Granit", "Basalt", "Fels"].includes(selectedBodenklasse)) {
          bodentragfaehigkeitsklasse = "F3"; // Hohe Tragfähigkeit
        } else if (["Ton", "Lehm", "Tonschluff", "Schluff"].includes(selectedBodenklasse)) {
          bodentragfaehigkeitsklasse = "F2"; // Mittlere Tragfähigkeit
        } else if (["Torf", "Moorböden"].includes(selectedBodenklasse)) {
          bodentragfaehigkeitsklasse = "F1"; // Niedrige Tragfähigkeit
        }
        
        // Aktualisiere Marker mit Analyseergebnis
        setMarkers(prev => {
          const newMarkers = [...prev];
          if (newMarkers[index]) {
            newMarkers[index] = {
              ...newMarkers[index],
              groundAnalysis: {
                imageUrl: base64Image, // Bild als Base64
                belastungsklasse: recommendedClass, // Empfohlene Belastungsklasse
                bodenklasse: selectedBodenklasse, // Analysierte Bodenklasse
                bodentragfaehigkeitsklasse: bodentragfaehigkeitsklasse, // Bodentragfähigkeitsklasse
                confidence: 65 + Math.floor(Math.random() * 30), // Zufällige Konfidenz (65-95%)
                analyseDetails: `Bodenanalyse basierend auf Textur, Farbe und Struktur. Bodentragfähigkeitsklasse ${bodentragfaehigkeitsklasse} ermittelt.`,
                timestamp: Date.now()
              }
            };
          }
          return newMarkers;
        });
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        // Verzögerung für die Anzeige des 100% Fortschritts
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      };
      
      reader.onerror = () => {
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(0);
        alert("Fehler beim Lesen der Datei");
      };
    } catch (error) {
      console.error("Fehler bei der Bodenanalyse:", error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);
  
  // Marker-Popup-Komponente für bessere Lesbarkeit auslagern
  const renderMarkerPopup = (marker: MarkerInfo, index: number) => {
    return (
      <div className="marker-popup w-64 max-h-80 overflow-y-auto">
        <h3 className="text-md font-medium mb-2 flex items-center justify-between">
          <span>{marker.name || `Standort ${index + 1}`}</span>
          <button 
            onClick={() => handleRemoveMarker(index)}
            className="ml-2 text-xs text-red-500 hover:text-red-700"
          >
            Entfernen
          </button>
        </h3>
        
        <div className="grid grid-cols-2 gap-1 text-xs">
          {marker.strasse && (
            <>
              <span className="font-medium">Straße:</span>
              <span>
                {marker.strasse} {marker.hausnummer || ''}
              </span>
            </>
          )}
          
          {(marker.plz || marker.ort) && (
            <>
              <span className="font-medium">Ort:</span>
              <span>
                {marker.plz} {marker.ort}
              </span>
            </>
          )}
          
          <span className="font-medium">Koordinaten:</span>
          <span>
            {marker.position[0].toFixed(6)}, {marker.position[1].toFixed(6)}
          </span>
          
          {marker.belastungsklasse && (
            <>
              <span className="font-medium">Belastungsklasse:</span>
              <span>
                {marker.belastungsklasse}
              </span>
            </>
          )}
        </div>
        
        {marker.notes && (
          <div className="my-2">
            <span className="text-xs font-medium">Notizen:</span>
            <p className="text-xs mt-1 p-1 border rounded bg-muted/30">{marker.notes}</p>
          </div>
        )}
        
        <div className="border-t my-2 pt-2">
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-7 flex-1"
              onClick={() => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = (e: any) => {
                  if (e.target.files && e.target.files[0]) {
                    analyzeSurface(index, e.target.files[0]);
                  }
                };
                fileInput.click();
              }}
            >
              <Camera className="h-3 w-3 mr-1" /> Asphaltanalyse
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-7 flex-1"
              onClick={() => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = (e: any) => {
                  if (e.target.files && e.target.files[0]) {
                    analyzeGround(index, e.target.files[0]);
                  }
                };
                fileInput.click();
              }}
            >
              <Image className="h-3 w-3 mr-1" /> Bodenanalyse
            </Button>
          </div>
          
          {/* Analyse-Ergebnisse */}
          <div className="mt-2">
            {marker.surfaceAnalysis && (
              <div className="mt-2 p-2 border rounded-md bg-muted/20">
                <div className="text-xs font-medium flex items-center justify-between mb-1">
                  <span>Asphaltanalyse</span>
                  <span className="text-primary">{marker.surfaceAnalysis.confidence}% Konfidenz</span>
                </div>
                
                {marker.surfaceAnalysis.imageUrl && (
                  <div className="mb-1">
                    <img 
                      src={marker.surfaceAnalysis.imageUrl} 
                      alt="Asphalt" 
                      className="w-full h-24 object-cover rounded-md mb-1" 
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="font-medium">Klasse:</span>
                  <span>{marker.surfaceAnalysis.belastungsklasse}</span>
                  
                  <span className="font-medium">Asphalttyp:</span>
                  <span>{marker.surfaceAnalysis.asphalttyp}</span>
                </div>
              </div>
            )}
            
            {marker.groundAnalysis && (
              <div className="mt-2 p-2 border rounded-md bg-muted/20">
                <div className="text-xs font-medium flex items-center justify-between mb-1">
                  <span>Bodenanalyse</span>
                  <span className="text-primary">{marker.groundAnalysis.confidence}% Konfidenz</span>
                </div>
                
                {marker.groundAnalysis.imageUrl && (
                  <div className="mb-1">
                    <img 
                      src={marker.groundAnalysis.imageUrl} 
                      alt="Boden" 
                      className="w-full h-24 object-cover rounded-md mb-1" 
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="font-medium">Bodenklasse:</span>
                  <span>{marker.groundAnalysis.bodenklasse}</span>
                  
                  <span className="font-medium">Tragfähigkeit:</span>
                  <span>{marker.groundAnalysis.bodentragfaehigkeitsklasse}</span>
                  
                  <span className="font-medium">Empfohlene Belastung:</span>
                  <span>{marker.groundAnalysis.belastungsklasse}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t mt-2 pt-2">
          <Textarea 
            placeholder="Notizen zu diesem Standort..."
            value={marker.notes || ""}
            onChange={(e) => updateMarkerInfo(index, "notes", e.target.value)}
            className="text-xs min-h-[60px]"
          />
        </div>
      </div>
    );
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
                        onClick={() => setAddressToCoordinatesDialogOpen(true)}
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
                          setTempLocation([searchLat, searchLng]);
                          setNewLocationDialogOpen(true);
                          
                          // Leere Adressinfo setzen (wird später manuell eingetragen)
                          const emptyAddressInfo = {
                            strasse: "",
                            hausnummer: "",
                            plz: "",
                            ort: ""
                          };
                          setLocationInfo(emptyAddressInfo);
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
                      <LeafletTooltip permanent={idx === selectedMarkerIndex}>
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
    
    {/* Adresse zu Koordinaten Dialog */}
    <Dialog open={addressToCoordinatesDialogOpen} onOpenChange={setAddressToCoordinatesDialogOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adresse zu Koordinaten umrechnen</DialogTitle>
          <DialogDescription>
            Geben Sie eine Adresse ein, um die geografischen Koordinaten zu erhalten.
          </DialogDescription>
        </DialogHeader>
        
        <AddressToCoordinates 
          onCoordinatesFound={(lat, lng) => {
            setSearchLat(lat);
            setSearchLng(lng);
            setAddressToCoordinatesDialogOpen(false);
          }} 
        />
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setAddressToCoordinatesDialogOpen(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}