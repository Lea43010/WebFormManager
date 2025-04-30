import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Map as MapIcon, ArrowLeft, MapPin, Camera,
  Layers, Calculator, Download, AlertCircle 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
const baseMaterialCosts: MaterialCosts = {
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

// Component für Events auf der Karte
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

// Component für Karten-Steuerung (z.B. Auto-Panning zu neuen Markern)
interface MapControlProps {
  position: [number, number];
}

function MapControl({ position }: MapControlProps) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [map, position]);
  
  return null;
}

export default function GeoMapPage() {
  const [selectedBelastungsklasse, setSelectedBelastungsklasse] = useState<string>("Bk100");
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [editMarker, setEditMarker] = useState<MarkerInfo | null>(null);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const [roadType, setRoadType] = useState("Bundesstraße"); // Default-Straßentyp
  const [roadWidth, setRoadWidth] = useState<number>(roadWidthPresets.Bundesstraße); // Default-Straßenbreite
  const [customRoadWidth, setCustomRoadWidth] = useState<number>(0);
  const [optimizeRoute, setOptimizeRoute] = useState<boolean>(false);
  const [bayernTabValue, setBayernTabValue] = useState<string>("strassenplanung"); // Default-Tab
  
  // PDF Export Status
  const [exportingPDF, setExportingPDF] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
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
    if (editMarker && currentEditIndex !== null) {
      setMarkers(prev => {
        const newMarkers = [...prev];
        newMarkers[currentEditIndex] = editMarker;
        return newMarkers;
      });
      setEditMarker(null);
      setCurrentEditIndex(null);
    }
  }, [editMarker, currentEditIndex]);
  
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
        
        // Einfache Felder
        if (field === 'name' || field === 'strasse' || field === 'hausnummer' || 
            field === 'plz' || field === 'ort' || field === 'notes' || field === 'belastungsklasse') {
          return { ...prev, [field]: value };
        }
        
        return prev;
      });
    }
  }, [editMarker]);
  
  // Funktion zum Optimieren der Route (TSP-Heuristik)
  const handleOptimizeRoute = useCallback(() => {
    if (markers.length <= 2) return; // Keine Optimierung nötig für 0, 1 oder 2 Marker
    
    // Optimierte Route berechnen und Marker aktualisieren
    const optimizedMarkers = optimizeRouteOrder([...markers]);
    setMarkers(optimizedMarkers);
  }, [markers]);
  
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
        const uniqueKlassen = [...new Set(markers.filter(m => m.belastungsklasse).map(m => m.belastungsklasse))];
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
  
  // Polyline für die Streckenvisualisierung erstellen
  const polyline = useMemo(() => {
    const positions = markers.map(marker => marker.position);
    return positions.length > 1 ? positions : [];
  }, [markers]);
  
  // Streckeninformationen berechnen
  const { total, segments } = useMemo(() => {
    return calculateRouteDistances(markers);
  }, [markers]);
  
  // Materialkosten berechnen
  const { materials, total: totalCost } = useMemo(() => {
    return calculateMaterialCosts(total, roadWidth, selectedBelastungsklasse);
  }, [total, roadWidth, selectedBelastungsklasse]);
  
  // Markerposition für Auto-Zentrierung der Map
  const mapCenterPosition = useMemo(() => {
    if (editMarker) {
      return editMarker.position;
    }
    if (markers.length > 0) {
      return markers[markers.length - 1].position;
    }
    return [49.44, 11.07] as [number, number]; // Default: Nürnberg
  }, [markers, editMarker]);
  
  // Empfohlene Baumaschinen basierend auf der gewählten Belastungsklasse
  const empfohleneBaumaschinen = useMemo(() => {
    if (selectedBelastungsklasse === "none") return [];
    return baumaschinen.filter(m => m.eignung.includes(selectedBelastungsklasse));
  }, [selectedBelastungsklasse]);
  
  // JSX für die Hauptkomponente
  return (
    <div className="container mx-auto mt-4">
      <Card className="shadow-md border-border/40">
        <CardHeader className="pb-2">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <MapIcon className="w-6 h-6 mr-2" /> Geo-Karten
              </CardTitle>
              <CardDescription className="mt-1.5">
                Straßenplanung, Belastungsanalyse und Kartendarstellung
              </CardDescription>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                asChild
              >
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" /> Zurück
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
            {/* Linke Spalte - Optionen */}
            <Card className="lg:col-span-1 bg-background shadow border-border/40">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Tabs
                    value={bayernTabValue}
                    onValueChange={setBayernTabValue}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-3 mb-2">
                      <TabsTrigger value="strassenplanung">Straßenplanung</TabsTrigger>
                      <TabsTrigger value="bayernatlas">BayernAtlas</TabsTrigger>
                      <TabsTrigger value="denkmalatlas">DenkmalAtlas</TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-4">
                      {/* Diese Steuerelemente nur anzeigen, wenn der Tab "Straßenplanung" aktiv ist */}
                      {bayernTabValue === "strassenplanung" && (
                        <div>
                          <div className="space-y-4 pb-4">
                            <div>
                              <Label htmlFor="strassentyp">Straßentyp</Label>
                              <Select defaultValue={roadType} onValueChange={value => setRoadType(value)}>
                                <SelectTrigger id="strassentyp">
                                  <SelectValue placeholder="Straßentyp wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Autobahn">Autobahn</SelectItem>
                                  <SelectItem value="Bundesstraße">Bundesstraße</SelectItem>
                                  <SelectItem value="Landstraße">Landstraße</SelectItem>
                                  <SelectItem value="Kreisstraße">Kreisstraße</SelectItem>
                                  <SelectItem value="Gemeindestraße">Gemeindestraße</SelectItem>
                                  <SelectItem value="Benutzerdefiniert">Benutzerdefiniert</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {roadType === "Benutzerdefiniert" && (
                              <div>
                                <Label htmlFor="custom-width">Straßenbreite (m)</Label>
                                <Input 
                                  id="custom-width"
                                  type="number"
                                  min="2"
                                  max="30"
                                  step="0.1"
                                  value={customRoadWidth || ""}
                                  onChange={(e) => setCustomRoadWidth(parseFloat(e.target.value))}
                                  placeholder="Breite in Metern"
                                />
                              </div>
                            )}
                            
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
                          </div>
                          
                          {/* Belastungsklasse-Informationen */}
                          {selectedBelastungsklasse !== "none" && (
                            <div className="space-y-4 border p-4 rounded-md bg-muted/50">
                              <h3 className="text-sm font-semibold">Belastungsklasse: {selectedBelastungsklasse}</h3>
                              
                              {/* RStO-Aufbau-Visualisierung */}
                              <div className="relative h-24 border rounded-md bg-background overflow-hidden">
                                {getKlasseInfo(selectedBelastungsklasse) && (
                                  <>
                                    {/* Asphaltdeckschicht */}
                                    <div className="absolute top-0 left-0 right-0 h-[15%] bg-gray-800">
                                      <span className="absolute left-2 text-[10px] text-white">
                                        Asphaltdecke ({getKlasseInfo(selectedBelastungsklasse)?.dickeAsphaltdecke})
                                      </span>
                                    </div>
                                    
                                    {/* Asphalttragschicht */}
                                    <div className="absolute top-[15%] left-0 right-0 h-[25%] bg-gray-600">
                                      <span className="absolute left-2 text-[10px] text-white">
                                        Asphalttragschicht ({getKlasseInfo(selectedBelastungsklasse)?.dickeAsphaltTragschicht})
                                      </span>
                                    </div>
                                    
                                    {/* Optional: Schottertragschicht, falls vorhanden */}
                                    {getKlasseInfo(selectedBelastungsklasse)?.dickeSchotterTragschicht && (
                                      <div className="absolute top-[40%] left-0 right-0 h-[20%] bg-amber-700">
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
                              
                              {/* Weitere Informationen zur Belastungsklasse */}
                              {getKlasseInfo(selectedBelastungsklasse) && (
                                <div className="text-xs space-y-2">
                                  <div className="flex justify-between">
                                    <span>Bauklasse:</span>
                                    <span className="font-medium">{getKlasseInfo(selectedBelastungsklasse)?.bauklasse}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Beanspruchung:</span>
                                    <span className="font-medium">{getKlasseInfo(selectedBelastungsklasse)?.beanspruchung}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Beispielanwendung:</span>
                                    <span className="font-medium">{getKlasseInfo(selectedBelastungsklasse)?.beispiel}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Gesamtstärke:</span>
                                    <span className="font-medium">{getKlasseInfo(selectedBelastungsklasse)?.dickeAsphaltbauweise}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Streckeninformationen anzeigen, wenn mindestens 2 Marker vorhanden sind */}
                          {markers.length >= 2 && (
                            <div className="mt-4 border p-4 rounded-md bg-muted/50 space-y-2">
                              <h3 className="text-sm font-semibold">Streckeninformationen</h3>
                              
                              {/* Streckenlänge */}
                              {(() => {
                                const { total, segments } = calculateRouteDistances(markers);
                                return (
                                  <>
                                    <div className="flex justify-between text-sm">
                                      <span>Gesamtstrecke:</span>
                                      <span className="font-medium">{total.toFixed(2)} km</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Einzelabschnitte: {segments.map(s => s.toFixed(2)).join(' km, ')} km
                                    </div>
                                  </>
                                );
                              })()}
                              
                              {/* Straßenbreite */}
                              <div className="flex justify-between text-sm">
                                <span>Straßenbreite:</span>
                                <span className="font-medium">{roadWidth.toFixed(1)} m</span>
                              </div>
                              
                              {/* Gesamtfläche */}
                              <div className="flex justify-between text-sm">
                                <span>Gesamtfläche:</span>
                                <span className="font-medium">{(total * 1000 * roadWidth).toFixed(0)} m²</span>
                              </div>
                              
                              {/* Kostenübersicht */}
                              {selectedBelastungsklasse !== "none" && (
                                <div className="mt-2 pt-2 border-t border-border">
                                  <h4 className="text-sm font-semibold mb-2">Materialkosten (geschätzt)</h4>
                                  
                                  {materials.map((material: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-xs mb-1">
                                      <span>{material.name}:</span>
                                      <span>{material.totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                                    </div>
                                  ))}
                                  
                                  <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border font-medium">
                                    <span>Gesamtkosten:</span>
                                    <span>{totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Buttons für Streckenoptimierung und Export */}
                              <div className="flex flex-col gap-2 mt-4">
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={handleOptimizeRoute}
                                  disabled={markers.length < 3}
                                >
                                  <Layers className="w-4 h-4 mr-1" /> Route optimieren
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleExportPDF}
                                  disabled={exportingPDF || markers.length === 0}
                                >
                                  <Download className="w-4 h-4 mr-1" /> Als PDF exportieren
                                </Button>
                                
                                {exportingPDF && (
                                  <div className="mt-2">
                                    <Progress value={exportProgress} className="h-2" />
                                    <p className="text-xs text-center mt-1">PDF wird erstellt...</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Tabs>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-grow p-0 relative">
                {/* Die Karte nur anzeigen, wenn der "Strassenplanung"-Tab aktiv ist */}
                {bayernTabValue === "bayernatlas" && (
                  <BayernMaps defaultTab="bayernatlas" />
                )}
                
                {bayernTabValue === "denkmalatlas" && (
                  <BayernMaps defaultTab="denkmalatlas" />
                )}
                
                {/* Belastungsklassen-Legende am unteren Rand */}
                {bayernTabValue === "strassenplanung" && (
                  <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 shadow-md rounded-md p-2 z-[1000] text-xs">
                    <div className="font-medium mb-1">Belastungsklassen:</div>
                    <div className="grid grid-cols-3 gap-x-1 gap-y-1">
                      {Object.entries(belastungsklassenColors).map(([klasse, color]) => {
                        if (klasse === "none") return null;
                        return (
                          <div key={klasse} className="flex items-center gap-1">
                            <div style={{ backgroundColor: color }} className="w-3 h-3 rounded-full"></div>
                            <span>{klasse}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Mittlere Spalte - Karte */}
            <Card className="lg:col-span-2 bg-background shadow border-border/40 flex flex-col">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg flex items-center">
                  <MapIcon className="w-5 h-5 mr-2" /> 
                  Kartenansicht
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-grow p-0 relative">
                {/* Nur die Karte anzeigen, wenn der "Strassenplanung"-Tab aktiv ist */}
                {bayernTabValue === "strassenplanung" && (
                  <div className="h-full relative" style={{ minHeight: '500px' }} ref={mapContainerRef}>
                    <MapContainer
                      center={mapCenterPosition}
                      zoom={13}
                      style={{ height: '100%', width: '100%', minHeight: '500px' }}
                      attributionControl={false}
                    >
                      <TileLayer
                        url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                        tileSize={512}
                        zoomOffset={-1}
                        detectRetina={true}
                        maxZoom={22}
                      />
                      <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="Straßenkarte">
                          <TileLayer
                            url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                            tileSize={512}
                            zoomOffset={-1}
                            detectRetina={true}
                            maxZoom={22}
                          />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Satellit">
                          <TileLayer
                            url={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                            tileSize={512}
                            zoomOffset={-1}
                            detectRetina={true}
                            maxZoom={22}
                          />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Topographie">
                          <TileLayer
                            url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                            tileSize={512}
                            zoomOffset={-1}
                            detectRetina={true}
                            maxZoom={22}
                          />
                        </LayersControl.BaseLayer>
                      </LayersControl>
                      
                      {/* Event-Listener für Klicks auf die Karte */}
                      <MapClicker
                        onMarkerAdd={handleAddMarker}
                        selectedBelastungsklasse={selectedBelastungsklasse}
                      />
                      
                      {/* Auto-Panning zu neuen Markern */}
                      <MapControl position={mapCenterPosition} />
                      
                      {/* Marker anzeigen */}
                      {markers.map((marker, index) => (
                        <Marker
                          key={`marker-${index}`}
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
                            <div className="p-1">
                              <h3 className="font-medium">
                                {marker.name || `Punkt ${index + 1}`}
                                {marker.belastungsklasse && marker.belastungsklasse !== "none" && (
                                  <Badge className="ml-2" variant="outline">{marker.belastungsklasse}</Badge>
                                )}
                              </h3>
                              
                              {(marker.strasse || marker.hausnummer || marker.plz || marker.ort) && (
                                <p className="text-sm mt-1">
                                  {marker.strasse} {marker.hausnummer}<br />
                                  {marker.plz} {marker.ort}
                                </p>
                              )}
                              
                              {marker.notes && (
                                <p className="text-xs mt-1 italic">{marker.notes}</p>
                              )}
                              
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs py-0 h-7 px-2"
                                  onClick={() => {
                                    setEditMarker({...marker});
                                    setCurrentEditIndex(index);
                                  }}
                                >
                                  Bearbeiten
                                </Button>
                                
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="text-xs py-0 h-7 px-2"
                                  onClick={() => handleDeleteMarker(index)}
                                >
                                  Löschen
                                </Button>
                              </div>
                            </div>
                          </Popup>
                          <LeafletTooltip direction="top" offset={[0, -10]} permanent={false}>
                            {marker.name || `Punkt ${index + 1}`}
                          </LeafletTooltip>
                        </Marker>
                      ))}
                      
                      {/* Polyline für die Streckenvisualisierung */}
                      {polyline.length > 1 && (
                        <Polyline
                          positions={polyline}
                          color={
                            selectedBelastungsklasse === "none"
                              ? belastungsklassenColors.none
                              : belastungsklassenColors[selectedBelastungsklasse as keyof typeof belastungsklassenColors]
                          }
                          weight={5}
                          opacity={0.7}
                        />
                      )}
                    </MapContainer>
                    
                    {/* Infos zur Karte am unteren Rand */}
                    <div className="absolute bottom-4 left-4 right-4 text-xs flex justify-between text-gray-600">
                      <span>Klick auf die Karte zum Markieren | Drag & Drop zum Verschieben</span>
                      <span>Belastungsklasse: {selectedBelastungsklasse}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Detaillierte Informationen für Standorte und empfohlene Baumaschinen */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Standorte und Streckendaten */}
            <Card className="bg-background shadow border-border/40">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Standorte und Streckendaten
                </CardTitle>
                <CardDescription>
                  Verwalten Sie Ihre markierten Standorte und berechnen Sie Materialkosten.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              {markers.length > 0 ? (
                <div>
                  <div className="text-sm mb-4">
                    <div className="font-medium">Gesamtzahl der Standorte: {markers.length}</div>
                    {markers.length > 1 && (
                      <div className="mt-1">Streckenlänge: {total.toFixed(2)} km</div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Markierte Standorte:</h3>
                    
                    <div className="border rounded-md">
                      {markers.map((marker, index) => (
                        <div key={index} className={`p-3 ${index !== markers.length - 1 ? 'border-b' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium flex items-center">
                                <span
                                  className="w-3 h-3 rounded-full mr-2 inline-block"
                                  style={{ 
                                    backgroundColor: marker.belastungsklasse 
                                      ? belastungsklassenColors[marker.belastungsklasse as keyof typeof belastungsklassenColors] 
                                      : belastungsklassenColors.none 
                                  }}
                                ></span>
                                {marker.name || `Punkt ${index + 1}`}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Position: {marker.position[0].toFixed(5)}, {marker.position[1].toFixed(5)}
                              </div>
                              {(marker.strasse || marker.hausnummer || marker.plz || marker.ort) && (
                                <div className="text-xs mt-1">
                                  {marker.strasse} {marker.hausnummer}, {marker.plz} {marker.ort}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setEditMarker({...marker});
                                  setCurrentEditIndex(index);
                                }}
                              >
                                <span className="sr-only">Bearbeiten</span>
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/>
                                </svg>
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteMarker(index)}
                              >
                                <span className="sr-only">Löschen</span>
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 6h18"/>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                  <line x1="10" x2="10" y1="11" y2="17"/>
                                  <line x1="14" x2="14" y1="11" y2="17"/>
                                </svg>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Keine Standorte markiert</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Klicken Sie auf die Karte, um Standorte zu markieren und eine Strecke zu planen.
                  </p>
                </div>
              )}
              </CardContent>
            </Card>
            
            {/* Empfohlene Baumaschinen für die gewählte Belastungsklasse */}
            <Card className="bg-background shadow border-border/40">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Layers className="w-5 h-5 mr-2" />
                  Empfohlene Baumaschinen
                </CardTitle>
                <CardDescription>
                  Basierend auf der gewählten Belastungsklasse {selectedBelastungsklasse}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedBelastungsklasse === "none" ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Keine Belastungsklasse ausgewählt</AlertTitle>
                    <AlertDescription>
                      Bitte wählen Sie eine Belastungsklasse, um passende Baumaschinen angezeigt zu bekommen.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {empfohleneBaumaschinen.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {empfohleneBaumaschinen.map((maschine, idx) => (
                          <div key={idx} className="border rounded-md p-3 flex flex-col h-full">
                            <div className="font-medium">{maschine.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {maschine.beschreibung}
                            </div>
                            <div className="mt-2 text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Tagesmiete:</span>
                                <span className="font-medium">{maschine.tagesmiete} €</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Leistung:</span>
                                <span className="font-medium">{maschine.leistung} m²/Tag</span>
                              </div>
                            </div>
                            
                            {markers.length > 1 && (
                              <div className="mt-4 text-sm">
                                <Separator className="my-2" />
                                <div className="flex justify-between">
                                  <span>Projektfläche:</span>
                                  <span className="font-medium">{(total * 1000 * roadWidth).toFixed(0)} m²</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Geschätzte Dauer:</span>
                                  <span className="font-medium">
                                    {Math.ceil((total * 1000 * roadWidth) / maschine.leistung)} Tage
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Mietkosten Projekt:</span>
                                  <span className="font-medium">
                                    {Math.ceil((total * 1000 * roadWidth) / maschine.leistung) * maschine.tagesmiete} €
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Keine passenden Baumaschinen</AlertTitle>
                        <AlertDescription>
                          Für die gewählte Belastungsklasse konnten keine passenden Baumaschinen gefunden werden.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Marker-Bearbeitungsdialog */}
          {editMarker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>
                    {currentEditIndex !== null && currentEditIndex < markers.length ? 'Marker bearbeiten' : 'Neuer Marker'}
                  </CardTitle>
                  <CardDescription>
                    Position: {editMarker.position[0].toFixed(5)}, {editMarker.position[1].toFixed(5)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="marker-name">Name</Label>
                    <Input
                      id="marker-name"
                      value={editMarker.name || ''}
                      onChange={(e) => handleEditMarkerChange('name', e.target.value)}
                      placeholder="z.B. Start, Ziel, Checkpoint"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marker-strasse">Straße</Label>
                      <Input
                        id="marker-strasse"
                        value={editMarker.strasse || ''}
                        onChange={(e) => handleEditMarkerChange('strasse', e.target.value)}
                        placeholder="Straßenname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marker-hausnummer">Hausnummer</Label>
                      <Input
                        id="marker-hausnummer"
                        value={editMarker.hausnummer || ''}
                        onChange={(e) => handleEditMarkerChange('hausnummer', e.target.value)}
                        placeholder="Nr."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marker-plz">PLZ</Label>
                      <Input
                        id="marker-plz"
                        value={editMarker.plz || ''}
                        onChange={(e) => handleEditMarkerChange('plz', e.target.value)}
                        placeholder="Postleitzahl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marker-ort">Ort</Label>
                      <Input
                        id="marker-ort"
                        value={editMarker.ort || ''}
                        onChange={(e) => handleEditMarkerChange('ort', e.target.value)}
                        placeholder="Ortsname"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marker-belastungsklasse">Belastungsklasse</Label>
                    <Select 
                      defaultValue={editMarker.belastungsklasse || "none"}
                      onValueChange={(value) => handleEditMarkerChange('belastungsklasse', value)}
                    >
                      <SelectTrigger id="marker-belastungsklasse">
                        <SelectValue placeholder="Belastungsklasse wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bk100">Bk100 - Sehr stark</SelectItem>
                        <SelectItem value="Bk32">Bk32 - Stark</SelectItem>
                        <SelectItem value="Bk10">Bk10 - Mittel</SelectItem>
                        <SelectItem value="Bk3">Bk3 - Gering</SelectItem>
                        <SelectItem value="Bk1">Bk1 - Sehr gering</SelectItem>
                        <SelectItem value="Bk0_3">Bk0.3 - Minimal</SelectItem>
                        <SelectItem value="none">Keine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marker-notes">Notizen</Label>
                    <Textarea
                      id="marker-notes"
                      value={editMarker.notes || ''}
                      onChange={(e) => handleEditMarkerChange('notes', e.target.value)}
                      placeholder="Optionale Notizen zum Standort"
                      rows={3}
                    />
                  </div>
                </CardContent>
                <div className="flex justify-end gap-2 p-4 pt-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMarker(null);
                      setCurrentEditIndex(null);
                    }}
                  >
                    Abbrechen
                  </Button>
                  <Button onClick={handleUpdateMarker}>
                    Speichern
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}