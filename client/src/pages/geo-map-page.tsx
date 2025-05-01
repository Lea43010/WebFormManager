import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Map as MapIcon, ArrowLeft, MapPin, Camera,
  Layers, Calculator, Download, AlertCircle, Route,
  Search, Loader2, HelpCircle, Pencil, Trash2, X, Building
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";
import BayernMaps from "@/components/maps/bayern-maps";

// Direktes Mapbox-Token für zuverlässiges Laden
const MAPBOX_TOKEN = "pk.eyJ1IjoibGVhemltbWVyIiwiYSI6ImNtOWlqenRoOTAyd24yanF2dmh4MzVmYnEifQ.VCg8sM94uqeuolEObT6dbw";

// Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, LayersControl, useMapEvents, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  Bk3: "#f1c40f",   // Gelb
  Bk1: "#2ecc71",   // Grün
  Bk0_3: "#3498db", // Blau - niedrigste Belastung
  none: "#95a5a6"   // Grau - keine Belastungsklasse
};

// Konstanten für Straßentypen und deren Standardbreiten
const roadWidthPresets = {
  Autobahn: 12.5,
  Bundesstraße: 7.5,
  Landstraße: 6.5,
  Kreisstraße: 5.5,
  Gemeindestraße: 5.0,
  Benutzerdefiniert: 0, // Wird durch user-input überschrieben
};

// Belastungsklassen nach RStO 12
const belastungsklassen = [
  { 
    klasse: "Bk100", 
    beanspruchung: "sehr stark",
    beispiel: "Autobahnen, Bundesstraßen (hochbelastet)", 
    bauklasse: "SV",
    dickeAsphaltbauweise: "77 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "18 cm",
    dickeFrostschutzschicht1: "55 cm"
  },
  { 
    klasse: "Bk32", 
    beanspruchung: "stark",
    beispiel: "Bundesstraßen, Hauptverkehrsstraßen", 
    bauklasse: "I",
    dickeAsphaltbauweise: "74 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "14 cm",
    dickeFrostschutzschicht1: "56 cm"
  },
  { 
    klasse: "Bk10", 
    beanspruchung: "mittel",
    beispiel: "Landstraßen, Kreisstraßen", 
    bauklasse: "II",
    dickeAsphaltbauweise: "71 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "14 cm",
    dickeFrostschutzschicht1: "53 cm"
  },
  { 
    klasse: "Bk3", 
    beanspruchung: "gering",
    beispiel: "Gemeindestraßen, Anliegerstraßen", 
    bauklasse: "III",
    dickeAsphaltbauweise: "67 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "10 cm",
    dickeFrostschutzschicht1: "53 cm",
    dickeSchotterTragschicht: "20 cm", // Alternative mit Schottertragschicht
    dickeFrostschutzschicht2: "42 cm"
  },
  { 
    klasse: "Bk1", 
    beanspruchung: "sehr gering",
    beispiel: "Wohnstraßen, Parkplätze", 
    bauklasse: "IV",
    dickeAsphaltbauweise: "63 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "8 cm",
    dickeFrostschutzschicht1: "51 cm",
    dickeSchotterTragschicht: "15 cm", // Alternative mit Schottertragschicht
    dickeFrostschutzschicht2: "43 cm"
  },
  { 
    klasse: "Bk0_3", 
    beanspruchung: "minimal",
    beispiel: "Feldwege, Zufahrten", 
    bauklasse: "V",
    dickeAsphaltbauweise: "57 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "6 cm",
    dickeFrostschutzschicht1: "47 cm",
    dickeSchotterTragschicht: "15 cm", // Alternative mit Schottertragschicht
    dickeFrostschutzschicht2: "37 cm"
  },
];

// Typdefinitionen
interface Baumaschine {
  name: string;
  beschreibung: string;
  eignung: string[]; // Geeignet für diese Belastungsklassen
  bildUrl?: string;
  tagesmiete: number; // Euro pro Tag
  leistung: number; // m²/Tag
}

// Empfohlene Baumaschinen für verschiedene Belastungsklassen
const baumaschinen: Baumaschine[] = [
  {
    name: "Tandemwalze BW 154",
    beschreibung: "Ideale Verdichtung für alle Asphaltschichten",
    eignung: ["Bk100", "Bk32", "Bk10", "Bk3", "Bk1", "Bk0_3"],
    tagesmiete: 380,
    leistung: 4500
  },
  {
    name: "Fertiger Super 1800-3i",
    beschreibung: "Leistungsstarker Asphaltfertiger für hochbelastete Straßen",
    eignung: ["Bk100", "Bk32"],
    bildUrl: "/assets/fertiger.jpg",
    tagesmiete: 1200,
    leistung: 6000
  },
  {
    name: "Straßenfräse W 100 F",
    beschreibung: "Kompakte Kaltfräse für präzise Arbeiten",
    eignung: ["Bk10", "Bk3", "Bk1"],
    tagesmiete: 850,
    leistung: 3200
  },
  {
    name: "Radlader 950 GC",
    beschreibung: "Vielseitiger Radlader für Material-Handling",
    eignung: ["Bk100", "Bk32", "Bk10", "Bk3", "Bk1", "Bk0_3"],
    tagesmiete: 450,
    leistung: 5000
  },
  {
    name: "Kompaktfertiger BF 300",
    beschreibung: "Kleiner Fertiger für schmalere Projekte",
    eignung: ["Bk1", "Bk0_3"],
    tagesmiete: 650,
    leistung: 2500
  }
];

// Material-Basiskosten pro m²
const baseMaterialCosts = {
  asphaltdecke: 28.50,     // €/m² für Asphaltdeckschicht
  asphalttragschicht: 22.00,  // €/m² für Asphalttragschicht
  frostschutzschicht: 12.50,  // €/m² für Frostschutzschicht
  schottertragschicht: 15.00  // €/m² für Schottertragschicht (falls verwendet)
};

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

interface MaterialCosts {
  asphaltdecke: number;     // Kosten pro m² für Asphaltdecke
  asphalttragschicht: number;  // Kosten pro m² für Asphalttragschicht
  frostschutzschicht: number;  // Kosten pro m² für Frostschutzschicht
  schottertragschicht?: number; // Kosten pro m² für Schottertragschicht (optional)
}

// Funktion zum Berechnen der Distanz zwischen zwei Punkten
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Erdradius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distanz in km
}

// Funktion zum Berechnen der Routen-Entfernungen
function calculateRouteDistances(markers: MarkerInfo[]): {total: number, segments: number[]} {
  if (markers.length < 2) {
    return { total: 0, segments: [] };
  }
  
  const segments: number[] = [];
  let totalDistance = 0;
  
  for (let i = 0; i < markers.length - 1; i++) {
    const distance = calculateDistance(
      markers[i].position[0], 
      markers[i].position[1],
      markers[i+1].position[0],
      markers[i+1].position[1]
    );
    segments.push(distance);
    totalDistance += distance;
  }
  
  return { total: totalDistance, segments };
}

// Funktion zum Finden der optimalen Reihenfolge der Marker (einfache Nearest-Neighbor-Heuristik)
function optimizeRouteOrder(markers: MarkerInfo[]): MarkerInfo[] {
  if (markers.length <= 2) return markers;
  
  const optimizedRoute: MarkerInfo[] = [markers[0]]; // Starte mit dem ersten Marker
  const unvisited = markers.slice(1);
  
  while (unvisited.length > 0) {
    const currentMarker = optimizedRoute[optimizedRoute.length - 1];
    let nearestIdx = 0;
    let minDistance = Number.MAX_VALUE;
    
    // Finde den nächsten unbesuchten Marker
    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateDistance(
        currentMarker.position[0],
        currentMarker.position[1],
        unvisited[i].position[0],
        unvisited[i].position[1]
      );
      
      if (distance < minDistance) {
        nearestIdx = i;
        minDistance = distance;
      }
    }
    
    // Füge den nächsten Marker zur optimierten Route hinzu
    optimizedRoute.push(unvisited[nearestIdx]);
    // Entferne den besuchten Marker aus der unbesuchten Liste
    unvisited.splice(nearestIdx, 1);
  }
  
  return optimizedRoute;
}

// Funktion zum Ermitteln der Belastungsklasseninformationen
function getKlasseInfo(klasseId: string): BelastungsklasseInfo | undefined {
  return belastungsklassen.find(k => k.klasse === klasseId);
}

// Materialkosten berechnen basierend auf Strecke, Breite und Belastungsklasse
function calculateMaterialCosts(
  distance: number, // Streckenlänge in km
  width: number,    // Straßenbreite in m
  belastungsklasseId: string
): { materials: any[], total: number } {
  // Fläche in m²
  const area = distance * 1000 * width;
  
  // Klasseninformationen abrufen
  const klasseInfo = getKlasseInfo(belastungsklasseId);
  if (!klasseInfo || belastungsklasseId === "none") {
    return { materials: [], total: 0 };
  }
  
  // Materialdicken extrahieren und in Meter umrechnen (von cm)
  const deckschichtDicke = parseFloat(klasseInfo.dickeAsphaltdecke) / 100;
  const tragschichtDicke = parseFloat(klasseInfo.dickeAsphaltTragschicht) / 100;
  
  // Entscheiden, ob wir die Variante mit oder ohne Schottertragschicht verwenden
  const useSGT = !!klasseInfo.dickeSchotterTragschicht;
  
  // Welche Frostschutzschicht verwenden wir?
  const frostschutzDicke = useSGT ? 
    parseFloat(klasseInfo.dickeFrostschutzschicht2 || "0") / 100 : 
    parseFloat(klasseInfo.dickeFrostschutzschicht1) / 100;
  
  // Optional: Dicke der Schottertragschicht
  const schotterDicke = useSGT ? parseFloat(klasseInfo.dickeSchotterTragschicht || "0") / 100 : 0;
  
  // Materialkosten berechnen
  const materialCosts = [];
  let totalCost = 0;
  
  // Asphaltdeckschicht
  const deckschichtCost = area * deckschichtDicke * 100 * baseMaterialCosts.asphaltdecke;
  materialCosts.push({
    name: "Asphaltdeckschicht",
    thickness: klasseInfo.dickeAsphaltdecke,
    area: area * deckschichtDicke * 100, // Volumen in m³, konvertiert zu Fläche mit 1cm Dicke
    costPerSqm: baseMaterialCosts.asphaltdecke,
    totalCost: deckschichtCost
  });
  totalCost += deckschichtCost;
  
  // Asphalttragschicht
  const tragschichtCost = area * tragschichtDicke * 100 * baseMaterialCosts.asphalttragschicht;
  materialCosts.push({
    name: "Asphalttragschicht",
    thickness: klasseInfo.dickeAsphaltTragschicht,
    area: area * tragschichtDicke * 100,
    costPerSqm: baseMaterialCosts.asphalttragschicht,
    totalCost: tragschichtCost
  });
  totalCost += tragschichtCost;
  
  // Frostschutzschicht
  const frostschutzCost = area * frostschutzDicke * 100 * baseMaterialCosts.frostschutzschicht;
  materialCosts.push({
    name: "Frostschutzschicht",
    thickness: useSGT ? klasseInfo.dickeFrostschutzschicht2 : klasseInfo.dickeFrostschutzschicht1,
    area: area * frostschutzDicke * 100,
    costPerSqm: baseMaterialCosts.frostschutzschicht,
    totalCost: frostschutzCost
  });
  totalCost += frostschutzCost;
  
  // Optional: Schottertragschicht
  if (useSGT && baseMaterialCosts.schottertragschicht) {
    const schotterCost = area * schotterDicke * 100 * baseMaterialCosts.schottertragschicht;
    materialCosts.push({
      name: "Schottertragschicht",
      thickness: klasseInfo.dickeSchotterTragschicht,
      area: area * schotterDicke * 100,
      costPerSqm: baseMaterialCosts.schottertragschicht,
      totalCost: schotterCost
    });
    totalCost += schotterCost;
  }
  
  return {
    materials: materialCosts,
    total: totalCost
  };
}

// Funktion zum Erstellen eines benutzerdefinierten Icons basierend auf der Belastungsklasse
function createCustomIcon(belastungsklasse?: string): L.DivIcon {
  const color = belastungsklasse ? belastungsklassenColors[belastungsklasse as keyof typeof belastungsklassenColors] : belastungsklassenColors.none;
  
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.5);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// Component für Click-Events auf der Karte
interface MapClickerProps {
  onMarkerAdd: (lat: number, lng: number) => void;
  selectedBelastungsklasse: string;
}

function MapClicker({ onMarkerAdd, selectedBelastungsklasse }: MapClickerProps) {
  const map = useMapEvents({
    click: (e) => {
      console.log("Karte wurde angeklickt bei:", e.latlng);
      onMarkerAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  
  return null;
}

// Component für Map Events
interface MapEventsProps {
  onMoveEnd: (map: L.Map) => void;
}

function MapEvents({ onMoveEnd }: MapEventsProps) {
  const map = useMap();
  
  useEffect(() => {
    map.on('moveend', () => onMoveEnd(map));
    return () => {
      map.off('moveend');
    };
  }, [map, onMoveEnd]);
  
  return null;
}

// Component zum Speichern der Map-Instanz im Ref
interface MapRefProps {
  setMapRef: (map: L.Map) => void;
}

function MapRefHandler({ setMapRef }: MapRefProps) {
  const map = useMap();
  
  useEffect(() => {
    setMapRef(map);
  }, [map, setMapRef]);
  
  return null;
}

// Component für benutzerdefinierte Steuerelemente auf der Karte
interface MapControlProps {
  position: [number, number];
}

function MapControl({ position }: MapControlProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [map, position]);
  
  return null;
}

// Hauptkomponente
export default function GeoMapPage() {
  // Allgemeine Zustände
  const [selectedBelastungsklasse, setSelectedBelastungsklasse] = useState<string>("Bk10");
  const [roadType, setRoadType] = useState<string>("Landstraße");
  const [customRoadWidth, setCustomRoadWidth] = useState<number>(5.0);
  const [roadWidth, setRoadWidth] = useState<number>(roadWidthPresets.Landstraße);
  const [editMarker, setEditMarker] = useState<MarkerInfo | null>(null);
  const [currentEditIndex, setCurrentEditIndex] = useState<number>(-1);
  const [showExampleImages, setShowExampleImages] = useState<boolean>(false);
  const [bayernTabValue, setBayernTabValue] = useState<string>("strassenplanung");
  const [printLoading, setPrintLoading] = useState<boolean>(false);
  const [openCostModal, setOpenCostModal] = useState<boolean>(false);
  
  // Adresssuche Zustände
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  
  // Berechnen der Strecke und Materialkosten
  const { total, segments } = calculateRouteDistances(markers);
  const { materials, total: totalCost } = calculateMaterialCosts(total, roadWidth, selectedBelastungsklasse);
  
  // PDF Export Status
  const [exportingPDF, setExportingPDF] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Init-Hooks, die ausgeführt werden, wenn die Komponente geladen wird
  useEffect(() => {
    // Bei Bedarf Daten aus localStorage laden
    const savedMarkers = localStorage.getItem('geoMapMarkers');
    if (savedMarkers) {
      try {
        setMarkers(JSON.parse(savedMarkers));
      } catch (e) {
        console.error("Fehler beim Laden der gespeicherten Marker:", e);
      }
    }
  }, []);
  
  // Wenn sich roadType ändert, roadWidth entsprechend anpassen
  useEffect(() => {
    if (roadType !== "Benutzerdefiniert") {
      setRoadWidth(roadWidthPresets[roadType as keyof typeof roadWidthPresets]);
    } else {
      setRoadWidth(customRoadWidth);
    }
  }, [roadType, customRoadWidth]);
  
  // Marker in localStorage speichern, wenn sie sich ändern
  useEffect(() => {
    localStorage.setItem('geoMapMarkers', JSON.stringify(markers));
  }, [markers]);
  
  // Callback für das Hinzufügen eines neuen Markers
  const handleAddMarker = useCallback((lat: number, lng: number) => {
    const newMarker: MarkerInfo = {
      position: [lat, lng],
      belastungsklasse: selectedBelastungsklasse,
    };
    
    setMarkers(prev => [...prev, newMarker]);
    
    // Bearbeitung des neuen Markers starten
    setCurrentEditIndex(markers.length);
    setEditMarker(newMarker);
  }, [markers.length, selectedBelastungsklasse]);
  
  // Callback für das Aktualisieren eines Markers
  const handleUpdateMarker = useCallback(() => {
    if (editMarker && currentEditIndex !== -1) {
      setMarkers(prev => {
        const newMarkers = [...prev];
        newMarkers[currentEditIndex] = editMarker;
        return newMarkers;
      });
      setEditMarker(null);
      setCurrentEditIndex(null);
    }
  }, [editMarker, currentEditIndex]);
  
  // Callback für Adresssuche
  const handleAddressSearch = useCallback(async () => {
    if (!searchAddress?.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      // Mapbox Geocoding API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchAddress
        )}.json?access_token=${MAPBOX_TOKEN}&country=de&limit=5`
      );
      
      if (!response.ok) {
        throw new Error("Geocoding-Anfrage fehlgeschlagen");
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
      } else {
        setSearchError("Keine Ergebnisse für diese Adresse gefunden");
        setSearchResults([]);
      }
    } catch (err) {
      setSearchError("Fehler bei der Adresssuche: " + (err instanceof Error ? err.message : String(err)));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchAddress]);
  
  // Handler für die Auswahl eines Suchergebnisses
  const handleSelectSearchResult = useCallback((feature: any) => {
    const [lng, lat] = feature.center;
    
    // Marker hinzufügen
    handleAddMarker(lat, lng);
    
    // Wenn ein Marker gerade bearbeitet wird, Adressinformationen hinzufügen
    if (currentEditIndex !== null) {
      // Extrahiere Adressteile
      const addressParts = feature.place_name.split(", ");
      // In Deutschland: Straße, PLZ Stadt, Deutschland
      let strasse = "", plz = "", ort = "";
      
      if (addressParts.length >= 2) {
        // Erste Komponente ist oft die Straße mit Hausnummer
        strasse = addressParts[0];
        
        // Zweite Komponente enthält oft PLZ und Stadt
        const plzStadt = addressParts[1].split(" ");
        if (plzStadt.length >= 2) {
          plz = plzStadt[0];
          ort = plzStadt.slice(1).join(" ");
        }
      }
      
      // Marker mit Adressinformationen aktualisieren
      setEditMarker(prev => {
        if (!prev) return null;
        return {
          ...prev,
          name: `Standort ${(markers.length + 1)}`,
          strasse,
          plz,
          ort,
        };
      });
    }
    
    // Karte zum gefundenen Standort zentrieren
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15); // Zoom-Level 15 ist gut für Straßen/Gebäude
      console.log("Karte auf gefundenen Standort zentriert:", lat, lng);
    }
    
    // Suchergebnisse zurücksetzen
    setSearchResults([]);
    setSearchAddress("");
  }, [currentEditIndex, handleAddMarker, markers.length]);
  
  // Callback für das Löschen eines Markers
  const handleDeleteMarker = useCallback((index: number) => {
    setMarkers(prev => prev.filter((_, i) => i !== index));
    
    // Wenn der zu löschende Marker gerade bearbeitet wird, Bearbeitung abbrechen
    if (currentEditIndex === index) {
      setEditMarker(null);
      setCurrentEditIndex(null);
    }
    // Indizes für nachfolgende Marker anpassen
    else if (currentEditIndex !== null && currentEditIndex > index) {
      setCurrentEditIndex(currentEditIndex - 1);
    }
  }, [currentEditIndex]);
  
  // Callback für Änderung der Marker-Details
  const handleEditMarkerChange = useCallback((field: string, value: string) => {
    if (editMarker) {
      setEditMarker(prev => {
        if (!prev) return null;
        
        // Spezialfall für verschachtelte Objekte
        if (field.includes('.')) {
          const [parentField, childField] = field.split('.');
          
          if (parentField === 'surfaceAnalysis') {
            return {
              ...prev,
              surfaceAnalysis: {
                ...prev.surfaceAnalysis,
                [childField]: value
              }
            };
          } else if (parentField === 'groundAnalysis') {
            return {
              ...prev,
              groundAnalysis: {
                ...prev.groundAnalysis,
                [childField]: value
              }
            };
          }
        }
        
        // Einfaches Feld
        return {
          ...prev,
          [field]: value
        };
      });
    }
  }, [editMarker]);
  
  // Funktion zum Exportieren als PDF
  const handleExportPDF = useCallback(async () => {
    if (!mapContainerRef.current) return;
    
    setExportingPDF(true);
    setExportProgress(10);
    
    try {
      // Zuerst die Karte als Canvas rendern
      const canvas = await html2canvas(mapContainerRef.current, {
        scale: 2, // Höhere Qualität
        useCORS: true, // Für Tile-Layer von externen Quellen
        allowTaint: true,
        backgroundColor: null,
      });
      
      setExportProgress(50);
      
      // Ein neues PDF-Dokument erstellen
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
      });
      
      // Seitengröße anpassen
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Canvas-Seitenverhältnis beibehalten
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;
      
      // Bild zur Mitte der Seite ausrichten
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;
      
      // Bild aus dem Canvas in das PDF einfügen
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      setExportProgress(80);
      
      // Materialliste hinzufügen, wenn Marker vorhanden sind
      if (markers.length > 1) {
        pdf.addPage();
        
        // Titel für die Materialliste
        pdf.setFontSize(16);
        pdf.text('Streckendaten und Materialliste', 14, 20);
        
        // Informationen zur Strecke
        pdf.setFontSize(12);
        const { total, segments } = calculateRouteDistances(markers);
        pdf.text(`Gesamte Streckenlänge: ${total.toFixed(2)} km`, 14, 30);
        pdf.text(`Straßenbreite: ${roadWidth} m`, 14, 36);
        pdf.text(`Gewählte Belastungsklasse: ${selectedBelastungsklasse}`, 14, 42);
        
        // Wenn Marker mit unterschiedlichen Belastungsklassen vorhanden sind
        const uniqueKlassen = Array.from(new Set(markers.filter(m => m.belastungsklasse).map(m => m.belastungsklasse)));
        if (uniqueKlassen.length > 1) {
          pdf.text('Hinweis: Die Strecke enthält Abschnitte mit unterschiedlichen Belastungsklassen.', 14, 48);
          pdf.text('Die Materialberechnung basiert auf der global gewählten Belastungsklasse.', 14, 54);
        }
        
        // Materialliste
        const { materials, total: totalCost } = calculateMaterialCosts(total, roadWidth, selectedBelastungsklasse);
        
        pdf.text('Benötigte Materialien:', 14, 64);
        
        let yPos = 70;
        materials.forEach((material: any) => {
          pdf.text(`${material.name} (${material.thickness}):`, 14, yPos);
          pdf.text(`Fläche: ${material.area.toFixed(2)} m²`, 28, yPos + 6);
          pdf.text(`Kosten pro m²: ${material.costPerSqm.toFixed(2)} €`, 28, yPos + 12);
          pdf.text(`Gesamtkosten: ${material.totalCost.toFixed(2)} €`, 28, yPos + 18);
          yPos += 24;
        });
        
        pdf.text(`Gesamte Materialkosten: ${totalCost.toFixed(2)} €`, 14, yPos + 6);
      }
      
      setExportProgress(95);
      
      // PDF speichern
      pdf.save('strassenplanung.pdf');
      
    } catch (error) {
      console.error("Fehler beim Exportieren als PDF:", error);
    } finally {
      setExportingPDF(false);
      setExportProgress(0);
    }
  }, [markers, roadWidth, selectedBelastungsklasse]);
  
  // Marker-Position aktualisieren per Drag-and-Drop
  const handleUpdateMarkerPosition = useCallback((index: number, lat: number, lng: number) => {
    setMarkers(prev => {
      const newMarkers = [...prev];
      newMarkers[index] = {
        ...newMarkers[index],
        position: [lat, lng]
      };
      return newMarkers;
    });
  }, []);
  
  // Route optimieren (Traveling Salesman Problem näherungsweise lösen)
  const handleOptimizeRoute = useCallback(() => {
    if (markers.length < 3) return; // Optimierung macht nur Sinn bei mindestens 3 Markern
    
    setMarkers(optimizeRouteOrder([...markers]));
  }, [markers]);
  
  // Kamera auf alle Marker zentrieren
  const handleFitBounds = useCallback((map: L.Map) => {
    if (markers.length > 0) {
      const bounds = new L.LatLngBounds(markers.map(m => m.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers]);
  
  return (
    <div className="container py-6 lg:py-10">
      {/* Header mit Zurück-Button */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Link>
      </div>
      
      {/* Hauptinhalt */}
      <div className="space-y-6">
        {/* Titel und Beschreibung */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Geo-Karten</h1>
          <p className="text-muted-foreground mt-2">
            Erstellen und verwalten Sie Straßenbauprojekte mit detaillierter Routenplanung, Materialberechnung und Asphaltanalyse.
          </p>
        </div>
        
        {/* Navigations-Tabs für die verschiedenen Bayern-Karten und Straßenplanung */}
        <Tabs value={bayernTabValue} onValueChange={setBayernTabValue}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="strassenplanung">
              <MapIcon className="h-4 w-4 mr-2" />
              Straßenplanung
            </TabsTrigger>
            <TabsTrigger value="bayernatlas">
              <Layers className="h-4 w-4 mr-2" />
              BayernAtlas
            </TabsTrigger>
            <TabsTrigger value="denkmalatlas">
              <AlertCircle className="h-4 w-4 mr-2" />
              DenkmalAtlas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="strassenplanung" className="space-y-6">
            {/* Layout vertikal: Steuerung oben, Karte in der Mitte, Ergebnisse unten */}
            <div className="flex flex-col gap-6">
              {/* Obere Steuerung - Suche und Auswahl */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Straßenplanung</CardTitle>
                      <CardDescription>
                        Straßenbau mit RStO-konformen Belastungsklassen
                      </CardDescription>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-full bg-muted p-1 cursor-help">
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p className="text-sm">Klicken Sie auf die Karte, um Standorte zu markieren. Verbundene Punkte ergeben eine Route für die Kalkulation.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Zusammenfassung der wichtigsten Daten (wird nur angezeigt, wenn Marker vorhanden sind) */}
                  {markers.length >= 2 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                      <h3 className="text-sm font-medium text-primary mb-2">Zusammenfassung</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs">Strecke</div>
                          <div className="font-medium">{total.toFixed(2)} km</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Fläche</div>
                          <div className="font-medium">{(total * 1000 * roadWidth).toFixed(0)} m²</div>
                        </div>
                        {selectedBelastungsklasse !== "none" && (
                          <>
                            <div>
                              <div className="text-muted-foreground text-xs">Klasse</div>
                              <div className="font-medium">{selectedBelastungsklasse}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs">Kosten</div>
                              <div className="font-medium">{totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Aktionsbuttons */}
                  {markers.length >= 2 && (
                    <div className="flex gap-2 mb-4">
                      <Button 
                        className="flex-1"
                        onClick={handleOptimizeRoute}
                        disabled={markers.length < 3}
                      >
                        <Route className="mr-2 h-4 w-4" />
                        Route optimieren
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleExportPDF}
                        disabled={exportingPDF}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF exportieren
                      </Button>
                    </div>
                  )}

                  {/* Eingabebereiche / Steuerelemente */}
                  <div className="space-y-4 divide-y divide-border">
                      {/* Adresssuche */}
                      <div className="mb-4">
                        <Label htmlFor="adresssuche" className="mb-2 block">Standort suchen</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              id="adresssuche"
                              placeholder="Adresse eingeben..."
                              value={searchAddress}
                              onChange={(e) => setSearchAddress(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && handleAddressSearch()}
                              className="flex-1"
                            />
                            <Button 
                              onClick={handleAddressSearch} 
                              disabled={isSearching || !searchAddress?.trim()}
                              variant="secondary"
                            >
                              {isSearching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          {searchError && (
                            <Alert variant="destructive" className="py-2">
                              <AlertDescription>{searchError}</AlertDescription>
                            </Alert>
                          )}
                          
                          {searchResults.length > 0 && (
                            <div className="bg-white border rounded-md shadow-sm overflow-hidden max-h-60 overflow-y-auto">
                              <ul className="divide-y">
                                {searchResults.map((feature) => (
                                  <li 
                                    key={feature.id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleSelectSearchResult(feature)}
                                  >
                                    <p className="text-sm">{feature.place_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {feature.place_type.join(", ")}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="belastungsklasse">Belastungsklasse</Label>
                        <Select defaultValue={selectedBelastungsklasse} onValueChange={value => setSelectedBelastungsklasse(value)}>
                          <SelectTrigger id="belastungsklasse">
                            <SelectValue placeholder="Belastungsklasse wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bk100">
                              <span className="font-medium">Bk100</span> - Sehr starke Beanspruchung
                            </SelectItem>
                            <SelectItem value="Bk32">
                              <span className="font-medium">Bk32</span> - Starke Beanspruchung
                            </SelectItem>
                            <SelectItem value="Bk10">
                              <span className="font-medium">Bk10</span> - Mittlere Beanspruchung
                            </SelectItem>
                            <SelectItem value="Bk3">
                              <span className="font-medium">Bk3</span> - Geringe Beanspruchung
                            </SelectItem>
                            <SelectItem value="Bk1">
                              <span className="font-medium">Bk1</span> - Sehr geringe Beanspruchung
                            </SelectItem>
                            <SelectItem value="Bk0_3">
                              <span className="font-medium">Bk0.3</span> - Minimale Beanspruchung
                            </SelectItem>
                            <SelectItem value="none">
                              <span className="font-medium">Keine</span> - Nur Standort markieren
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    
                      {/* Belastungsklasse-Informationen */}
                      {selectedBelastungsklasse !== "none" && (
                        <div className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium">RStO-Aufbau: <span className="font-semibold">{selectedBelastungsklasse}</span></h3>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="rounded-full bg-muted p-1 cursor-help">
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">Visualisierung eines RStO-konformen Straßenaufbaus für die gewählte Belastungsklasse</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          {/* RStO-Aufbau-Visualisierung */}
                          <div className="relative h-24 border rounded-md bg-background overflow-hidden mb-3">
                            {getKlasseInfo(selectedBelastungsklasse) && (
                              <>
                                {/* Asphaltdeckschicht */}
                                <div className="absolute top-0 left-0 right-0 h-[15%] bg-primary/90">
                                  <span className="absolute left-2 text-[10px] text-white">
                                    Asphaltdecke ({getKlasseInfo(selectedBelastungsklasse)?.dickeAsphaltdecke})
                                  </span>
                                </div>
                                
                                {/* Asphalttragschicht */}
                                <div className="absolute top-[15%] left-0 right-0 h-[25%] bg-primary/70">
                                  <span className="absolute left-2 text-[10px] text-white">
                                    Asphalttragschicht ({getKlasseInfo(selectedBelastungsklasse)?.dickeAsphaltTragschicht})
                                  </span>
                                </div>
                                
                                {/* Optional: Schottertragschicht, falls vorhanden */}
                                {getKlasseInfo(selectedBelastungsklasse)?.dickeSchotterTragschicht && (
                                  <div className="absolute top-[40%] left-0 right-0 h-[20%] bg-amber-600">
                                    <span className="absolute left-2 text-[10px] text-white">
                                      Schottertragschicht ({getKlasseInfo(selectedBelastungsklasse)?.dickeSchotterTragschicht})
                                    </span>
                                  </div>
                                )}
                                
                                {/* Frostschutzschicht */}
                                <div 
                                  className="absolute left-0 right-0 bg-blue-300" 
                                  style={{
                                    top: getKlasseInfo(selectedBelastungsklasse)?.dickeSchotterTragschicht ? "60%" : "40%",
                                    height: getKlasseInfo(selectedBelastungsklasse)?.dickeSchotterTragschicht ? "40%" : "60%"
                                  }}
                                >
                                  <span className="absolute left-2 text-[10px]">
                                    Frostschutzschicht ({
                                      getKlasseInfo(selectedBelastungsklasse)?.dickeSchotterTragschicht 
                                        ? getKlasseInfo(selectedBelastungsklasse)?.dickeFrostschutzschicht2 
                                        : getKlasseInfo(selectedBelastungsklasse)?.dickeFrostschutzschicht1
                                    })
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Weitere Informationen zur Belastungsklasse als Badges */}
                          {getKlasseInfo(selectedBelastungsklasse) && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="outline" className="bg-muted/30">
                                Bauklasse: {getKlasseInfo(selectedBelastungsklasse)?.bauklasse}
                              </Badge>
                              <Badge variant="outline" className="bg-muted/30">
                                {getKlasseInfo(selectedBelastungsklasse)?.beanspruchung}
                              </Badge>
                              <Badge variant="outline" className="bg-muted/30">
                                {getKlasseInfo(selectedBelastungsklasse)?.dickeAsphaltbauweise} gesamt
                              </Badge>
                            </div>
                          )}
                          
                          {/* Beispielanwendung */}
                          {getKlasseInfo(selectedBelastungsklasse) && (
                            <div className="text-xs text-muted-foreground italic">
                              Typische Anwendung: {getKlasseInfo(selectedBelastungsklasse)?.beispiel}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Streckeninformationen anzeigen, wenn mindestens 2 Marker vorhanden sind */}
                      {markers.length >= 2 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium">Streckeninformationen</h3>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="rounded-full bg-muted p-1 cursor-help">
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">Zusammenfassung der Route mit Länge, Fläche und geschätzten Kosten für den Straßenbau</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            {/* Linke Spalte: Streckendetails */}
                            <div className="space-y-3">
                              {/* Streckenlänge */}
                              <div className="p-3 rounded-md border bg-muted/10">
                                <div className="text-xs text-muted-foreground mb-1">Gesamtstrecke</div>
                                <div className="text-lg font-medium">{total.toFixed(2)} km</div>
                                {segments.length > 0 && (
                                  <div className="text-[10px] text-muted-foreground mt-1 max-h-16 overflow-y-auto">
                                    <div className="font-medium mb-1">Abschnitte:</div>
                                    {segments.map((s, i) => (
                                      <div key={i} className="flex justify-between">
                                        <span>Abschnitt {i+1}:</span>
                                        <span>{s.toFixed(2)} km</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Rechte Spalte: Fläche */}
                            <div className="space-y-3">
                              <div className="p-3 rounded-md border bg-muted/10">
                                <div className="text-xs text-muted-foreground mb-1">Gesamtfläche</div>
                                <div className="text-lg font-medium">{(total * 1000 * roadWidth).toFixed(0)} m²</div>
                                <div className="text-[10px] text-muted-foreground mt-1">
                                  Bei {roadWidth.toFixed(1)} m Straßenbreite 
                                  ({roadType !== "Benutzerdefiniert" ? roadType : "Benutzerdefiniert"})
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Kostenübersicht */}
                          {selectedBelastungsklasse !== "none" && (
                            <div className="p-3 rounded-md border bg-primary/5 border-primary/20 mb-4">
                              <h4 className="text-xs font-medium text-primary mb-2">Materialkosten ({selectedBelastungsklasse})</h4>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {materials.map((material: any, idx: number) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{material.name}:</span>
                                    <span className="font-medium">{material.totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-primary/20">
                                <span className="text-sm">Gesamtkosten:</span>
                                <span className="text-lg font-medium">{totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Buttons für Streckenoptimierung und Export */}
                          <div className="flex gap-2">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              className="flex-1"
                              onClick={handleOptimizeRoute}
                              disabled={markers.length < 3}
                            >
                              <Route className="mr-2 h-4 w-4" />
                              Route optimieren
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={handleExportPDF}
                              disabled={exportingPDF}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              PDF exportieren
                            </Button>
                          </div>
                          
                          {exportingPDF && (
                            <div className="mt-3">
                              <Progress value={exportProgress} className="h-2" />
                              <p className="text-xs text-center mt-1">PDF wird erstellt ({exportProgress}%)...</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Straßenbreite einstellen */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium">Straßentyp & Breite</h3>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="rounded-full bg-muted p-1 cursor-help">
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">Die Straßenbreite wird zur Berechnung der Fläche und Materialkosten verwendet</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <Label htmlFor="roadType" className="text-xs">Straßentyp</Label>
                              <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">
                                {roadWidth.toFixed(1)} m
                              </span>
                            </div>
                            <Select defaultValue={roadType} onValueChange={setRoadType}>
                              <SelectTrigger id="roadType" className="h-8 text-sm">
                                <SelectValue placeholder="Straßentyp wählen" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Autobahn">
                                  <div className="flex items-center justify-between w-full pr-4">
                                    <span>Autobahn</span>
                                    <span className="text-xs text-muted-foreground">12,5 m</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Bundesstraße">
                                  <div className="flex items-center justify-between w-full pr-4">
                                    <span>Bundesstraße</span>
                                    <span className="text-xs text-muted-foreground">7,5 m</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Landstraße">
                                  <div className="flex items-center justify-between w-full pr-4">
                                    <span>Landstraße</span>
                                    <span className="text-xs text-muted-foreground">6,5 m</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Kreisstraße">
                                  <div className="flex items-center justify-between w-full pr-4">
                                    <span>Kreisstraße</span>
                                    <span className="text-xs text-muted-foreground">5,5 m</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Gemeindestraße">
                                  <div className="flex items-center justify-between w-full pr-4">
                                    <span>Gemeindestraße</span>
                                    <span className="text-xs text-muted-foreground">5,0 m</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Benutzerdefiniert">Benutzerdefiniert</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {roadType === "Benutzerdefiniert" && (
                            <div>
                              <Label htmlFor="customWidth" className="text-xs mb-1 block">Eigene Breite</Label>
                              <div className="flex items-center">
                                <Input
                                  id="customWidth"
                                  type="number"
                                  value={customRoadWidth}
                                  onChange={(e) => setCustomRoadWidth(parseFloat(e.target.value) || 0)}
                                  min="0.1"
                                  max="30"
                                  step="0.1"
                                  className="h-8 text-sm"
                                />
                                <span className="ml-2">m</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    
                      {/* Liste der gesetzten Markierungen */}
                      <div className="space-y-2 mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">Markierte Standorte <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 ml-1">{markers.length}</span></h3>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="rounded-full bg-muted p-1 cursor-help">
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">Klicken Sie auf die Karte, um neue Standorte hinzuzufügen. Verbundene Punkte bilden eine Route.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        {markers.length === 0 ? (
                          <div className="border border-dashed rounded-md p-4 text-center bg-muted/20">
                            <MapPin className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Noch keine Standorte markiert</p>
                            <p className="text-xs text-muted-foreground mt-1">Klicken Sie auf die Karte, um Standorte hinzuzufügen</p>
                          </div>
                        ) : (
                          <div className="max-h-[300px] overflow-y-auto border rounded-md">
                            {markers.map((marker, index) => (
                              <div 
                                key={index} 
                                className={`p-2 text-sm border-b last:border-b-0 hover:bg-accent/50 transition-colors cursor-pointer ${currentEditIndex === index ? 'bg-accent/30' : ''}`}
                                onClick={() => {
                                  setEditMarker({ ...marker });
                                  setCurrentEditIndex(index);
                                  if (mapRef && mapRef.current) {
                                    mapRef.current.setView(marker.position, 15);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center min-w-0">
                                    <div
                                      className="flex-shrink-0 w-3 h-3 rounded-full mr-2"
                                      style={{
                                        backgroundColor: marker.belastungsklasse 
                                          ? belastungsklassenColors[marker.belastungsklasse as keyof typeof belastungsklassenColors]
                                          : belastungsklassenColors.none
                                      }}
                                    ></div>
                                    <span className="font-medium truncate">{marker.name || `Standort ${index + 1}`}</span>
                                  </div>
                                  
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditMarker({ ...marker });
                                        setCurrentEditIndex(index);
                                      }}
                                    >
                                      <span className="sr-only">Bearbeiten</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                    </Button>
                                    
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteMarker(index);
                                      }}
                                    >
                                      <span className="sr-only">Löschen</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                      </svg>
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="mt-1 text-xs text-muted-foreground truncate">
                                  {marker.strasse && <div className="truncate">{marker.strasse}{marker.hausnummer ? ` ${marker.hausnummer}` : ''}</div>}
                                  {(marker.plz || marker.ort) && <div className="truncate">{marker.plz} {marker.ort}</div>}
                                </div>
                                
                                <div className="mt-1">
                                  <Badge 
                                    variant="outline" 
                                    className="text-[10px] px-1 py-0"
                                    style={{
                                      borderColor: marker.belastungsklasse 
                                        ? belastungsklassenColors[marker.belastungsklasse as keyof typeof belastungsklassenColors]
                                        : belastungsklassenColors.none,
                                      backgroundColor: marker.belastungsklasse 
                                        ? `${belastungsklassenColors[marker.belastungsklasse as keyof typeof belastungsklassenColors]}10`
                                        : `${belastungsklassenColors.none}10`
                                    }}
                                  >
                                    {marker.belastungsklasse || "Keine Belastungsklasse"}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Button zum Zurücksetzen */}
                        {markers.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              if (window.confirm("Möchten Sie wirklich alle Markierungen löschen?")) {
                                setMarkers([]);
                                setEditMarker(null);
                                setCurrentEditIndex(null);
                              }
                            }}
                          >
                            Alle Markierungen löschen
                          </Button>
                        )}
                      </div>
                    
                      {/* Marker-Bearbeitungsbereich */}
                      {editMarker && currentEditIndex !== null && (
                        <div className="mt-4 pt-4 border-t border-border space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">Standort bearbeiten</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground"
                              onClick={() => {
                                setEditMarker(null);
                                setCurrentEditIndex(null);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                              </svg>
                            </Button>
                          </div>
                          
                          <div className="p-3 rounded-md border border-primary/20 bg-primary/5 text-xs flex items-center">
                            <MapPin className="h-4 w-4 text-primary mr-2" />
                            <span>Standort bei <strong>{editMarker.position[0].toFixed(5)}, {editMarker.position[1].toFixed(5)}</strong></span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <Label htmlFor="marker-name" className="text-xs mb-1 block">Name</Label>
                              <Input 
                                id="marker-name"
                                value={editMarker.name || ''}
                                onChange={(e) => handleEditMarkerChange('name', e.target.value)}
                                placeholder="z.B. Baustelle Nord"
                                className="h-8 text-sm"
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2">
                              <div className="col-span-3">
                                <Label htmlFor="marker-strasse" className="text-xs mb-1 block">Straße</Label>
                                <Input 
                                  id="marker-strasse"
                                  value={editMarker.strasse || ''}
                                  onChange={(e) => handleEditMarkerChange('strasse', e.target.value)}
                                  placeholder="Straßenname"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-1">
                                <Label htmlFor="marker-hausnummer" className="text-xs mb-1 block">Nr.</Label>
                                <Input 
                                  id="marker-hausnummer"
                                  value={editMarker.hausnummer || ''}
                                  onChange={(e) => handleEditMarkerChange('hausnummer', e.target.value)}
                                  placeholder="Nr."
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-1">
                                <Label htmlFor="marker-plz" className="text-xs mb-1 block">PLZ</Label>
                                <Input 
                                  id="marker-plz"
                                  value={editMarker.plz || ''}
                                  onChange={(e) => handleEditMarkerChange('plz', e.target.value)}
                                  placeholder="PLZ"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-2">
                                <Label htmlFor="marker-ort" className="text-xs mb-1 block">Ort</Label>
                                <Input 
                                  id="marker-ort"
                                  value={editMarker.ort || ''}
                                  onChange={(e) => handleEditMarkerChange('ort', e.target.value)}
                                  placeholder="Ortsname"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="marker-belastungsklasse" className="text-xs mb-1 block">
                                Belastungsklasse
                                <span className="text-muted-foreground ml-1">(für Straßenbauplanung)</span>
                              </Label>
                              <Select 
                                value={editMarker.belastungsklasse || 'none'}
                                onValueChange={(value) => handleEditMarkerChange('belastungsklasse', value)}
                              >
                                <SelectTrigger id="marker-belastungsklasse" className="h-8 text-sm">
                                  <SelectValue placeholder="Belastungsklasse wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Bk100">Bk100 - Sehr starke Beanspruchung</SelectItem>
                                  <SelectItem value="Bk32">Bk32 - Starke Beanspruchung</SelectItem>
                                  <SelectItem value="Bk10">Bk10 - Mittlere Beanspruchung</SelectItem>
                                  <SelectItem value="Bk3">Bk3 - Geringe Beanspruchung</SelectItem>
                                  <SelectItem value="Bk1">Bk1 - Sehr geringe Beanspruchung</SelectItem>
                                  <SelectItem value="Bk0_3">Bk0.3 - Minimale Beanspruchung</SelectItem>
                                  <SelectItem value="none">Keine Belastungsklasse</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="marker-notes" className="text-xs mb-1 block">Notizen</Label>
                              <Textarea 
                                id="marker-notes"
                                value={editMarker.notes || ''}
                                onChange={(e) => handleEditMarkerChange('notes', e.target.value)}
                                placeholder="Zusätzliche Informationen zum Standort"
                                rows={2}
                                className="text-sm resize-none"
                              />
                            </div>
                          </div>
                          
                          <Button
                            onClick={handleUpdateMarker}
                            className="w-full mt-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                              <polyline points="17 21 17 13 7 13 7 21"></polyline>
                              <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            Änderungen speichern
                          </Button>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Straßentyp</CardTitle>
                        <CardDescription>
                          Auswahl der Straßenbreite für die Berechnung
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Straßenbreite einstellen */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label htmlFor="roadType" className="text-xs">Straßentyp</Label>
                        <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">
                          {roadWidth.toFixed(1)} m
                        </span>
                      </div>
                      <Select defaultValue={roadType} onValueChange={setRoadType}>
                        <SelectTrigger id="roadType" className="h-8 text-sm">
                          <SelectValue placeholder="Straßentyp wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Autobahn">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span>Autobahn</span>
                              <span className="text-xs text-muted-foreground">12,5 m</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Bundesstraße">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span>Bundesstraße</span>
                              <span className="text-xs text-muted-foreground">7,5 m</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Landstraße">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span>Landstraße</span>
                              <span className="text-xs text-muted-foreground">6,5 m</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Kreisstraße">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span>Kreisstraße</span>
                              <span className="text-xs text-muted-foreground">5,5 m</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Gemeindestraße">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span>Gemeindestraße</span>
                              <span className="text-xs text-muted-foreground">5,0 m</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Benutzerdefiniert">Benutzerdefiniert</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {roadType === "Benutzerdefiniert" && (
                        <div className="mt-2">
                          <Label htmlFor="customWidth" className="text-xs mb-1 block">Eigene Breite</Label>
                          <div className="flex items-center">
                            <Input
                              id="customWidth"
                              type="number"
                              value={customRoadWidth}
                              onChange={(e) => setCustomRoadWidth(parseFloat(e.target.value) || 0)}
                              min="0.1"
                              max="30"
                              step="0.1"
                              className="h-8 text-sm"
                            />
                            <span className="ml-2">m</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Karte - volle Breite */}
              <Card>
                <CardContent className="p-0 overflow-hidden">
                  <div className="h-[500px]" ref={mapContainerRef}>
                    <MapContainer
                      center={[48.1351, 11.5820]} // München als Zentrum
                      zoom={11}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      {/* Map Click Handler */}
                      <MapClicker 
                        onMarkerAdd={handleAddMarker}
                        selectedBelastungsklasse={selectedBelastungsklasse}
                      />
                      
                      {/* Map Ref Handler um auf die Karten-Instanz zuzugreifen */}
                      <MapRefHandler setMapRef={(map) => { mapRef.current = map; }} />
                      
                      {/* Marker anzeigen */}
                      {markers.map((marker, index) => (
                        <Marker
                          key={index}
                          position={marker.position}
                          icon={createCustomIcon(marker.belastungsklasse)}
                          draggable={true}
                          eventHandlers={{
                            dragend: (e) => {
                              const { lat, lng } = e.target.getLatLng();
                              handleUpdateMarkerPosition(index, lat, lng);
                            },
                          }}
                        >
                          <Popup>
                            <div className="text-sm">
                              <h3 className="font-medium">{marker.name || `Standort ${index + 1}`}</h3>
                              {marker.strasse && <p>{marker.strasse}</p>}
                              {(marker.plz || marker.ort) && <p>{marker.plz} {marker.ort}</p>}
                              <p className="mt-1">
                                <Badge variant="outline">
                                  {marker.belastungsklasse || "Keine Belastungsklasse"}
                                </Badge>
                              </p>
                              {marker.notes && (
                                <p className="mt-2 text-muted-foreground text-xs">{marker.notes}</p>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setCurrentEditIndex(index);
                                    setEditMarker(marker);
                                  }}
                                >
                                  Bearbeiten
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleDeleteMarker(index)}
                                >
                                  Löschen
                                </Button>
                              </div>
                            </div>
                          </Popup>
                          <LeafletTooltip direction="top" offset={[0, -10]} opacity={0.9}>
                            {marker.name || `Standort ${index + 1}`}
                          </LeafletTooltip>
                        </Marker>
                      ))}
                      
                      {/* Linie zwischen den Markern zeichnen */}
                      {markers.length >= 2 && (
                        <Polyline
                          positions={markers.map(m => m.position)}
                          pathOptions={{ 
                            color: '#2563eb', 
                            weight: 4,
                            opacity: 0.7,
                            dashArray: '5, 10'
                          }}
                        />
                      )}
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Untere Steuerung - Marker-Liste und Bearbeitung */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Markierte Standorte</CardTitle>
                      <CardDescription>Übersicht und Bearbeitung der gesetzten Punkte</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {markers.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Keine Standorte markiert.</p>
                      <p className="text-sm mt-2">Klicken Sie auf die Karte, um Punkte zu setzen.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground mb-2">
                        {markers.length} {markers.length === 1 ? 'Standort' : 'Standorte'} markiert
                      </div>
                      
                      <div className="border rounded-md divide-y">
                        {markers.map((marker, index) => (
                          <div key={index} className="p-3 flex justify-between items-center">
                            <div className="flex gap-3 items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                ${marker.belastungsklasse && marker.belastungsklasse !== 'none' 
                                  ? 'bg-primary text-white' 
                                  : 'bg-muted'}`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium">{marker.name || `Standort ${index + 1}`}</div>
                                <div className="text-xs text-muted-foreground">
                                  {marker.strasse ? (
                                    <>
                                      {marker.strasse}
                                      {(marker.plz || marker.ort) && `, ${marker.plz || ''} ${marker.ort || ''}`}
                                    </>
                                  ) : (
                                    `Lat: ${marker.position[0].toFixed(4)}, Lng: ${marker.position[1].toFixed(4)}`
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setCurrentEditIndex(index);
                                        setEditMarker(marker);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Bearbeiten</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => handleDeleteMarker(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Löschen</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Wenn ein Marker bearbeitet wird */}
                      {currentEditIndex !== -1 && (
                        <div className="mt-4 border rounded-md p-3 bg-muted/50">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-medium">Standort bearbeiten</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setCurrentEditIndex(-1)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="marker-name" className="text-xs mb-1 block">Name</Label>
                              <Input 
                                id="marker-name"
                                value={editMarker.name || ''}
                                onChange={(e) => handleEditMarkerChange('name', e.target.value)}
                                placeholder="z.B. Baustelle Nord"
                                className="h-8 text-sm"
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2">
                              <div className="col-span-3">
                                <Label htmlFor="marker-strasse" className="text-xs mb-1 block">Straße</Label>
                                <Input 
                                  id="marker-strasse"
                                  value={editMarker.strasse || ''}
                                  onChange={(e) => handleEditMarkerChange('strasse', e.target.value)}
                                  placeholder="Straßenname"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label htmlFor="marker-hausnummer" className="text-xs mb-1 block">Nr.</Label>
                                <Input 
                                  id="marker-hausnummer"
                                  value={editMarker.hausnummer || ''}
                                  onChange={(e) => handleEditMarkerChange('hausnummer', e.target.value)}
                                  placeholder="123"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label htmlFor="marker-plz" className="text-xs mb-1 block">PLZ</Label>
                                <Input 
                                  id="marker-plz"
                                  value={editMarker.plz || ''}
                                  onChange={(e) => handleEditMarkerChange('plz', e.target.value)}
                                  placeholder="12345"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-2">
                                <Label htmlFor="marker-ort" className="text-xs mb-1 block">Ort</Label>
                                <Input 
                                  id="marker-ort"
                                  value={editMarker.ort || ''}
                                  onChange={(e) => handleEditMarkerChange('ort', e.target.value)}
                                  placeholder="Stadt"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="marker-notes" className="text-xs mb-1 block">Notizen</Label>
                              <Textarea 
                                id="marker-notes"
                                value={editMarker.notes || ''}
                                onChange={(e) => handleEditMarkerChange('notes', e.target.value)}
                                placeholder="Zusätzliche Informationen zum Standort"
                                className="h-20 text-sm"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="marker-belastungsklasse" className="text-xs mb-1 block">Belastungsklasse</Label>
                              <Select 
                                value={editMarker.belastungsklasse || 'none'} 
                                onValueChange={(value) => handleEditMarkerChange('belastungsklasse', value)}
                              >
                                <SelectTrigger id="marker-belastungsklasse" className="h-8 text-sm">
                                  <SelectValue placeholder="Belastungsklasse wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Bk100">Bk100 - Sehr starke Beanspruchung</SelectItem>
                                  <SelectItem value="Bk32">Bk32 - Starke Beanspruchung</SelectItem>
                                  <SelectItem value="Bk10">Bk10 - Mittlere Beanspruchung</SelectItem>
                                  <SelectItem value="Bk3">Bk3 - Geringe Beanspruchung</SelectItem>
                                  <SelectItem value="Bk1">Bk1 - Sehr geringe Beanspruchung</SelectItem>
                                  <SelectItem value="Bk0_3">Bk0.3 - Minimale Beanspruchung</SelectItem>
                                  <SelectItem value="none">Keine Belastungsklasse</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full mt-3" 
                            size="sm"
                            onClick={() => {
                              if (currentEditIndex !== -1) {
                                const updatedMarkers = [...markers];
                                updatedMarkers[currentEditIndex] = editMarker;
                                setMarkers(updatedMarkers);
                                setCurrentEditIndex(-1);
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Änderungen speichern
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="bayernatlas">
            <BayernMaps tabValue="bayernatlas" />
          </TabsContent>
          
          <TabsContent value="denkmalatlas">
            <BayernMaps tabValue="denkmalatlas" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}