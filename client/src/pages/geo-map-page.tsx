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

interface Baumaschine {
  name: string;
  beschreibung: string;
  eignung: string[]; // Geeignet für diese Belastungsklassen
  bildUrl?: string;
  tagesmiete: number; // Euro pro Tag
  leistung: number; // m²/Tag
}

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
  position: [number, number] | null;
  zoomLevel?: number;
}

function MapControl({ position, zoomLevel = 15 }: MapControlProps) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, zoomLevel);
    }
  }, [map, position, zoomLevel]);
  
  return null;
}

// Haupt-Component
export default function GeoMapPage() {
  // State für Karten-Tabs und Marker
  const [bayernTabValue, setBayernTabValue] = useState<"strassenplanung" | "bayernatlas" | "denkmalatlas">("strassenplanung");
  const [activeTab, setActiveTab] = useState("map");
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [selectedBelastungsklasse, setSelectedBelastungsklasse] = useState("none");
  const [lastAddedMarkerPosition, setLastAddedMarkerPosition] = useState<[number, number] | null>(null);
  const [searchLat, setSearchLat] = useState<number | null>(null);
  const [searchLng, setSearchLng] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.137154, 11.576124]); // München
  
  // State für Materialkosten
  const [roadWidth, setRoadWidth] = useState<number>(7.5); // Standard: 7.5m
  const [selectedRoadPreset, setSelectedRoadPreset] = useState<string>("Bundesstraße");
  
  // State für Datei-Uploads
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  // Refs für die Karte und Exportfunktionen
  const mapRef = useRef<HTMLDivElement>(null);
  const routeDataRef = useRef<HTMLDivElement>(null);
  const materialCostsRef = useRef<HTMLDivElement>(null);
  
  // Funktion zum Hinzufügen eines neuen Markers
  const addMarker = useCallback(async (lat: number, lng: number) => {
    console.log(`Füge Marker bei ${lat}, ${lng} hinzu`);
    
    try {
      // Reverse Geocoding mit Mapbox API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=de&language=de`
      );
      
      if (!response.ok) {
        throw new Error("Fehler bei der Adressauflösung");
      }
      
      const data = await response.json();
      
      // Default-Werte
      let strasse = "";
      let hausnummer = "";
      let plz = "";
      let ort = "";
      let markerName = `Standort ${markers.length + 1}`;
      
      // Adressen aus der Mapbox-Antwort extrahieren
      if (data.features && data.features.length > 0) {
        // Straße aus dem ersten Feature (meist die genaueste Position)
        const streetFeature = data.features.find((f: any) => f.place_type.includes("address"));
        if (streetFeature) {
          strasse = streetFeature.text;
          
          // Hausnummer extrahieren (falls vorhanden)
          const addressMatch = streetFeature.address?.match(/^(\d+.*)/);
          if (addressMatch) {
            hausnummer = addressMatch[1];
          }
        }
        
        // PLZ und Ort aus den Context-Elementen
        for (const feature of data.features) {
          if (feature.place_type.includes("postcode") && !plz) {
            plz = feature.text;
          }
          if ((feature.place_type.includes("place") || feature.place_type.includes("locality")) && !ort) {
            ort = feature.text;
          }
        }
        
        // Marker-Namen aus den verfügbaren Informationen erstellen
        if (strasse && hausnummer && ort) {
          markerName = `${strasse} ${hausnummer}, ${ort}`;
        } else if (strasse && ort) {
          markerName = `${strasse}, ${ort}`;
        } else if (ort) {
          markerName = ort;
        }
      }
      
      const newMarker: MarkerInfo = {
        position: [lat, lng],
        name: markerName,
        belastungsklasse: selectedBelastungsklasse !== "none" ? selectedBelastungsklasse : undefined,
        strasse,
        hausnummer,
        plz,
        ort,
        notes: ""
      };
      
      setMarkers([...markers, newMarker]);
      setSelectedMarkerIndex(markers.length);
      setLastAddedMarkerPosition([lat, lng]);
      
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Markers:", error);
      alert("Es konnte keine Adresse für diesen Standort ermittelt werden. Der Marker wird ohne Adressinformationen hinzugefügt.");
      
      const newMarker: MarkerInfo = {
        position: [lat, lng],
        name: `Standort ${markers.length + 1}`,
        belastungsklasse: selectedBelastungsklasse !== "none" ? selectedBelastungsklasse : undefined,
      };
      
      setMarkers([...markers, newMarker]);
      setSelectedMarkerIndex(markers.length);
      setLastAddedMarkerPosition([lat, lng]);
    }
  }, [markers, selectedBelastungsklasse]);
  
  // Funktion zum Exportieren der Streckendaten als PDF
  const exportToPdf = useCallback(async () => {
    if (isExporting || !routeDataRef.current || !materialCostsRef.current) return;
    
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Titel und Datum hinzufügen
      pdf.setFontSize(18);
      pdf.text('Bau-Structura Streckenbericht', 105, 20, { align: 'center' });
      pdf.setFontSize(12);
      const today = new Date().toLocaleDateString('de-DE');
      pdf.text(`Erstellt am: ${today}`, 105, 30, { align: 'center' });
      
      // Standorte auflisten
      pdf.setFontSize(14);
      pdf.text('Markierte Standorte', 15, 45);
      pdf.setFontSize(10);
      
      let y = 55;
      markers.forEach((marker, idx) => {
        pdf.text(`${idx + 1}. ${marker.name || 'Unbenannter Standort'}`, 20, y);
        pdf.text(`Position: ${marker.position[0].toFixed(5)}, ${marker.position[1].toFixed(5)}`, 30, y + 5);
        if (marker.belastungsklasse) {
          pdf.text(`Belastungsklasse: ${marker.belastungsklasse}`, 30, y + 10);
        }
        y += 15;
        
        // Seitenumbruch bei Bedarf
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
      });
      
      // Streckeninformationen hinzufügen
      const routeDataCanvas = await html2canvas(routeDataRef.current);
      const routeDataImgData = routeDataCanvas.toDataURL('image/png');
      pdf.addImage(routeDataImgData, 'PNG', 15, y, 180, 20);
      y += 25;
      
      // Materialkosten hinzufügen
      if (selectedBelastungsklasse !== 'none') {
        pdf.setFontSize(14);
        pdf.text('Materialkosten', 15, y);
        y += 10;
        
        const materialCostsCanvas = await html2canvas(materialCostsRef.current);
        const materialCostsImgData = materialCostsCanvas.toDataURL('image/png');
        pdf.addImage(materialCostsImgData, 'PNG', 15, y, 180, 80);
      }
      
      // PDF speichern
      pdf.save('strassenbau-planung.pdf');
    } catch (error) {
      console.error('Fehler beim Exportieren als PDF:', error);
      alert('Beim Exportieren ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, markers, selectedBelastungsklasse]);
  
  // Funktion zur Oberflächenanalyse
  const analyzeSurface = useCallback(async (index: number, file: File) => {
    const marker = markers[index];
    if (!marker) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // URL für das Bild generieren
      const imageUrl = URL.createObjectURL(file);
      setUploadProgress(30);
      
      // Hier käme die eigentliche Analyse über eine API
      // Stattdessen verwenden wir simulierte Ergebnisse
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUploadProgress(70);
      
      // Simuliere verschiedene Ergebnisse basierend auf dem aktuellen Index
      const belastungsklasseOptions = ["Bk3", "Bk10", "Bk32"];
      const asphalttypOptions = [
        "Asphaltbeton AC 11 DS", 
        "Splittmastixasphalt SMA 11 S",
        "Gussasphalt MA 11 S"
      ];
      
      const randomIndex = Math.floor(Math.random() * belastungsklasseOptions.length);
      
      // Simulierter Analyse-Bericht
      const surfaceAnalysis = {
        imageUrl,
        belastungsklasse: belastungsklasseOptions[randomIndex],
        asphalttyp: asphalttypOptions[randomIndex],
        confidence: 75 + Math.floor(Math.random() * 20),
        analyseDetails: "Bildanalyse ergab Anzeichen von typischen Verschleißmustern für mittelstark frequentierte Straßen. Die Oberflächenstruktur zeigt Merkmale von Standardmischgut mit üblicher Körnung.",
        timestamp: Date.now()
      };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress(100);
      
      // Marker-Array aktualisieren
      const updatedMarkers = [...markers];
      updatedMarkers[index] = {
        ...marker,
        surfaceAnalysis
      };
      setMarkers(updatedMarkers);
      
    } catch (error) {
      console.error("Fehler bei der Oberflächenanalyse:", error);
      alert("Bei der Bildanalyse ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsUploading(false);
    }
  }, [markers]);
  
  // Funktion zur Bodenanalyse
  const analyzeGround = useCallback(async (index: number, file: File) => {
    const marker = markers[index];
    if (!marker) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // URL für das Bild generieren
      const imageUrl = URL.createObjectURL(file);
      setUploadProgress(30);
      
      // Hier käme die eigentliche Analyse über eine API
      // Stattdessen verwenden wir simulierte Ergebnisse
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUploadProgress(70);
      
      // Simuliere verschiedene Ergebnisse basierend auf dem aktuellen Index
      const bodenklasseOptions = ["Sand", "Kies-Sand-Gemisch", "Lehmiger Kies"];
      const tragfaehigkeitsOptions = ["F1", "F2", "F3"];
      const belastungsklasseOptions = ["Bk1", "Bk3", "Bk10"];
      
      const randomIndex = Math.floor(Math.random() * bodenklasseOptions.length);
      
      // Simulierter Analyse-Bericht
      const groundAnalysis = {
        imageUrl,
        bodenklasse: bodenklasseOptions[randomIndex],
        bodentragfaehigkeitsklasse: tragfaehigkeitsOptions[randomIndex],
        belastungsklasse: belastungsklasseOptions[randomIndex],
        confidence: 70 + Math.floor(Math.random() * 20),
        analyseDetails: "Analyse zeigt einen gut verdichteten Untergrund mit mittlerer Tragfähigkeit. Basierend auf visuellen Merkmalen wird eine passende Frost-Tauwechsel-Beständigkeit angenommen.",
        timestamp: Date.now()
      };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress(100);
      
      // Marker-Array aktualisieren
      const updatedMarkers = [...markers];
      updatedMarkers[index] = {
        ...marker,
        groundAnalysis
      };
      setMarkers(updatedMarkers);
      
    } catch (error) {
      console.error("Fehler bei der Bodenanalyse:", error);
      alert("Bei der Bildanalyse ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsUploading(false);
    }
  }, [markers]);
  
  // Rendering-Funktion für Marker-Popups
  const renderMarkerPopup = (marker: MarkerInfo, index: number) => {
    return (
      <div className="text-sm">
        <div className="font-medium mb-2 text-base">
          {marker.name || `Standort ${index + 1}`}
          {marker.belastungsklasse && (
            <Badge className="ml-2" variant="outline">
              {marker.belastungsklasse}
            </Badge>
          )}
        </div>
        
        {(marker.strasse || marker.plz || marker.ort) && (
          <div className="mb-2 text-muted-foreground">
            {marker.strasse} {marker.hausnummer}<br />
            {marker.plz} {marker.ort}
          </div>
        )}
        
        <div>
          <Label htmlFor={`notes-${index}`} className="text-xs mb-1">Notizen</Label>
          <Textarea 
            id={`notes-${index}`}
            className="min-h-[80px] text-xs"
            placeholder="Notizen zu diesem Standort eingeben..."
            value={marker.notes || ""}
            onChange={(e) => {
              const newMarkers = [...markers];
              newMarkers[index] = {
                ...marker,
                notes: e.target.value
              };
              setMarkers(newMarkers);
            }}
          />
        </div>
        
        <div className="mt-2 flex gap-1">
          <input
            type="file"
            id={`surface-analysis-${index}`}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                analyzeSurface(index, e.target.files[0]);
              }
            }}
          />
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs h-8 gap-1"
            onClick={() => document.getElementById(`surface-analysis-${index}`)?.click()}
          >
            <Camera className="h-3 w-3" /> Oberflächenanalyse
          </Button>
          
          <input
            type="file"
            id={`ground-analysis-${index}`}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                analyzeGround(index, e.target.files[0]);
              }
            }}
          />
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs h-8 gap-1"
            onClick={() => document.getElementById(`ground-analysis-${index}`)?.click()}
          >
            <MapPin className="h-3 w-3" /> Bodenanalyse
          </Button>
        </div>
        
        {marker.surfaceAnalysis?.imageUrl && (
          <div className="text-xs space-y-1 mt-3">
            <div className="font-medium">Oberflächenanalyse:</div>
            <img 
              src={marker.surfaceAnalysis.imageUrl} 
              alt="Oberflächenanalyse" 
              className="w-full h-24 object-cover rounded-md"
            />
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <span className="text-muted-foreground">Asphalttyp:</span>
              <span className="font-medium">{marker.surfaceAnalysis.asphalttyp}</span>
              
              <span className="text-muted-foreground">Belastungsklasse:</span>
              <span className="font-medium">{marker.surfaceAnalysis.belastungsklasse}</span>
              
              <span className="text-muted-foreground">Konfidenz:</span>
              <span className="font-medium">{marker.surfaceAnalysis.confidence}%</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {marker.surfaceAnalysis.analyseDetails}
            </div>
          </div>
        )}
        
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
        <div className="ml-2 text-xl font-semibold">Geo-Karten</div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-120px)] flex flex-col">
            <CardHeader className="p-4">
              {/* Bayern-Karten Tabs */}
              <Tabs defaultValue="strassenplanung" value={bayernTabValue} onValueChange={(value) => setBayernTabValue(value as "strassenplanung" | "bayernatlas" | "denkmalatlas")} className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="strassenplanung">Straßenplanung</TabsTrigger>
                  <TabsTrigger value="bayernatlas">BayernAtlas</TabsTrigger>
                  <TabsTrigger value="denkmalatlas">DenkmalAtlas</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Belastungsklasse-Auswahl - nur für Straßenplanung Tab anzeigen */}
              {bayernTabValue === "strassenplanung" && (
                <div className="p-2 mt-4 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
                  <div className="font-medium flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" /> 
                    <span>Belastungsklasse (optional):</span>
                  </div>
                  <Select 
                    value={selectedBelastungsklasse}
                    onValueChange={setSelectedBelastungsklasse}
                  >
                    <SelectTrigger className="h-9 border-gray-300 bg-white w-72">
                      <SelectValue placeholder="Optional: Belastungsklasse wählen..." />
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
              )}

              {/* Kartenmodus-Tabs - nur für Straßenplanung anzeigen */}
              {bayernTabValue === "strassenplanung" && (
                <div className="mt-4">
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
                                      
                                      // Automatisch einen Marker an dieser Position hinzufügen mit Adressinformationen
                                      const newMarkerPosition: [number, number] = [lat, lng];
                                      
                                      // Adressinformationen aus der Mapbox-Antwort extrahieren
                                      let strasse = "";
                                      let hausnummer = "";
                                      let plz = "";
                                      let ort = "";
                                      let markerName = `Standort ${markers.length + 1}`;
                                      
                                      // Feature-Objekt enthält die Adressinformationen
                                      if (data.features && data.features[0]) {
                                        const feature = data.features[0];
                                        
                                        // Straße und Hausnummer aus dem text-Feld extrahieren
                                        if (feature.text) {
                                          const addressParts = feature.text.split(' ');
                                          const lastPart = addressParts[addressParts.length - 1];
                                          if (/^\d+[a-zA-Z]?$/.test(lastPart)) {
                                            hausnummer = lastPart;
                                            strasse = addressParts.slice(0, -1).join(' ');
                                          } else {
                                            strasse = feature.text;
                                          }
                                        }
                                        
                                        // PLZ und Ort aus dem context-Array extrahieren
                                        if (feature.context) {
                                          for (const context of feature.context) {
                                            if (context.id.startsWith('postcode')) {
                                              plz = context.text;
                                            } else if (context.id.startsWith('place')) {
                                              ort = context.text;
                                            }
                                          }
                                        }
                                        
                                        // Marker-Namen aus den Adresskomponenten generieren
                                        if (strasse && hausnummer && ort) {
                                          markerName = `${strasse} ${hausnummer}, ${ort}`;
                                        } else if (strasse && ort) {
                                          markerName = `${strasse}, ${ort}`;
                                        } else if (ort) {
                                          markerName = ort;
                                        }
                                      }
                                      
                                      const newMarker: MarkerInfo = {
                                        position: newMarkerPosition,
                                        name: markerName,
                                        belastungsklasse: selectedBelastungsklasse !== "none" ? selectedBelastungsklasse : undefined,
                                        strasse: strasse,
                                        hausnummer: hausnummer,
                                        plz: plz,
                                        ort: ort,
                                        notes: ""
                                      };
                                      setMarkers([...markers, newMarker]);
                                      setSelectedMarkerIndex(markers.length);
                                      
                                      // Setze den letzten hinzugefügten Marker für das Auto-Panning
                                      setLastAddedMarkerPosition(newMarkerPosition);
                                      
                                      // Erfolgsmeldung anzeigen
                                      alert(`Marker wurde gesetzt: ${markerName}`);
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
                              
                              console.log("Gehe zu Button geklickt, Koordinaten:", searchLat, searchLng);
                              
                              // Breiten- und Längengrad direkt verwenden
                              setMapCenter([searchLat, searchLng]);
                              
                              // Den addMarker-Callback verwenden, der bereits Reverse-Geocoding implementiert
                              addMarker(searchLat, searchLng);
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
                </div>
              )}
            </CardHeader>
            
            {/* CardContent für den Karteninhalt */}
            <CardContent className="flex-grow p-0 relative">
              {/* BayernAtlas Tab */}
              {bayernTabValue === "bayernatlas" && (
                <div className="h-full w-full p-4">
                  <BayernMaps defaultTab="bayernatlas" />
                </div>
              )}
              
              {/* DenkmalAtlas Tab */}
              {bayernTabValue === "denkmalatlas" && (
                <div className="h-full w-full p-4">
                  <BayernMaps defaultTab="denkmalatlas" />
                </div>
              )}
              
              {/* Strassenplanung Tab mit Leaflet-Karte */}
              {bayernTabValue === "strassenplanung" && (
                <>
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
                    <div ref={mapRef} style={{ height: '100%', width: '100%' }}>
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
                        
                        {/* Auto-Panning zu neuen Markern */}
                        <MapControl position={lastAddedMarkerPosition} zoomLevel={15} />
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
                        {markers.map((marker, idx) => {
                          console.log(`Rendering marker ${idx} at position:`, marker.position);
                          return (
                            <Marker 
                              key={`marker-${idx}-${marker.position[0]}-${marker.position[1]}`}
                              position={marker.position}
                              icon={createCustomIcon(marker.belastungsklasse)}
                              eventHandlers={{
                                click: () => {
                                  console.log(`Marker ${idx} clicked`);
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
                          );
                        })}
                        
                        {/* Route anzeigen - verbesserte Darstellung */}
                        {markers.length >= 2 && (
                          <>
                            {/* Hauptlinie (dicker, auffälliger) */}
                            <Polyline 
                              positions={markers.map(m => m.position)}
                              color="#3388ff"
                              weight={5}
                              opacity={0.8}
                            />
                            {/* Dekorative Linie (gestrichelt) für besseren visuellen Effekt */}
                            <Polyline 
                              positions={markers.map(m => m.position)}
                              color="#ffffff"
                              weight={2}
                              opacity={0.6}
                              dashArray="5, 10"
                            />
                          </>
                        )}
                        
                        {/* Marker-Klick-Handler */}
                        <MapClicker
                          onMarkerAdd={addMarker}
                          selectedBelastungsklasse={selectedBelastungsklasse}
                        />
                      </MapContainer>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Rechte Seitenleiste nur anzeigen, wenn der Straßenplanung-Tab aktiv ist */}
        {bayernTabValue === "strassenplanung" && (
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
              <CardContent className="space-y-4">
              {markers.length > 0 ? (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Markierte Standorte ({markers.length})</h3>
                    <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                      {markers.map((marker, idx) => (
                        <div 
                          key={`sidebar-marker-${idx}`} 
                          className={`p-2 rounded-md border ${selectedMarkerIndex === idx ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50 border-border'}`}
                          onClick={() => setSelectedMarkerIndex(idx)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{marker.name || `Standort ${idx + 1}`}</span>
                            <Badge variant={marker.belastungsklasse ? "default" : "outline"}>
                              {marker.belastungsklasse || "Keine Klasse"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Position: {marker.position[0].toFixed(5)}, {marker.position[1].toFixed(5)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {markers.length >= 2 && (
                    <div className="border-t pt-3">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Calculator className="h-4 w-4 mr-1 text-primary" /> 
                        Strecken- und Materialberechnung
                      </h3>
                      
                      {/* Streckenberechnung */}
                      <div className="space-y-1 mb-3" ref={routeDataRef}>
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
                      </div>
                      
                      {/* Materialkosten */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="roadWidth" className="text-xs">Straßenbreite (m)</Label>
                            <Input 
                              id="roadWidth"
                              type="number"
                              min={1}
                              max={25}
                              step={0.1}
                              value={roadWidth}
                              onChange={(e) => setRoadWidth(parseFloat(e.target.value))}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label htmlFor="roadType" className="text-xs">Straßentyp</Label>
                            <Select 
                              value={selectedRoadPreset}
                              onValueChange={(value) => {
                                setSelectedRoadPreset(value);
                                if (value !== "Benutzerdefiniert") {
                                  setRoadWidth(roadWidthPresets[value as keyof typeof roadWidthPresets]);
                                }
                              }}
                            >
                              <SelectTrigger id="roadType" className="h-8 text-xs">
                                <SelectValue placeholder="Typ wählen" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Autobahn">Autobahn (12.5m)</SelectItem>
                                <SelectItem value="Bundesstraße">Bundesstraße (7.5m)</SelectItem>
                                <SelectItem value="Landstraße">Landstraße (6.5m)</SelectItem>
                                <SelectItem value="Kreisstraße">Kreisstraße (5.5m)</SelectItem>
                                <SelectItem value="Gemeindestraße">Gemeindestraße (5.0m)</SelectItem>
                                <SelectItem value="Benutzerdefiniert">Benutzerdefiniert</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Kostenanzeige */}
                        {(() => {
                          const { total: distance } = calculateRouteDistances(markers);
                          if (selectedBelastungsklasse === "none") {
                            return (
                              <Alert variant="destructive" className="mt-2 py-2">
                                <AlertTitle className="text-xs font-medium">Bitte Belastungsklasse wählen</AlertTitle>
                                <AlertDescription className="text-xs">
                                  Um Materialkosten zu berechnen, wählen Sie eine Belastungsklasse aus dem Dropdown-Menü über der Karte.
                                </AlertDescription>
                              </Alert>
                            );
                          }
                          
                          const costInfo = calculateMaterialCosts(distance, roadWidth, selectedBelastungsklasse);
                          
                          return (
                            <div className="bg-muted/30 rounded-md p-2 text-xs" ref={materialCostsRef}>
                              <div className="flex justify-between items-center mb-1">
                                <h4 className="font-medium">Materialkosten (Schätzung)</h4>
                                <Button
                                  size="sm"
                                  className="h-7 px-2 gap-1"
                                  onClick={exportToPdf}
                                  disabled={isExporting || markers.length < 1}
                                >
                                  <Download className="h-3 w-3 mr-1" /> 
                                  Als PDF
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                                  <div className="col-span-5">Material</div>
                                  <div className="col-span-1">Dicke</div>
                                  <div className="col-span-2">Fläche</div>
                                  <div className="col-span-2">€/m²</div>
                                  <div className="col-span-2">Gesamt</div>
                                </div>
                                
                                {costInfo.materials.map((material, i) => (
                                  <div key={`material-${i}`} className="grid grid-cols-12 gap-2 text-xs">
                                    <div className="col-span-5 truncate">{material.name}</div>
                                    <div className="col-span-1 text-center">{material.thickness}</div>
                                    <div className="col-span-2">{Math.round(material.area).toLocaleString()} m²</div>
                                    <div className="col-span-2">{material.costPerSqm.toFixed(2)} €</div>
                                    <div className="col-span-2 font-medium">{Math.round(material.totalCost).toLocaleString()} €</div>
                                  </div>
                                ))}
                                
                                <Separator />
                                
                                <div className="grid grid-cols-12 gap-2 text-xs font-bold">
                                  <div className="col-span-10 text-right">Gesamtkosten:</div>
                                  <div className="col-span-2">{Math.round(costInfo.total).toLocaleString()} €</div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Empfohlene Baumaschinen */}
                        {selectedBelastungsklasse !== "none" && (
                          <div className="mt-4">
                            <h4 className="text-xs font-medium mb-1">Empfohlene Baumaschinen</h4>
                            <div className="space-y-2">
                              {baumaschinen
                                .filter(maschine => maschine.eignung.includes(selectedBelastungsklasse))
                                .map((maschine, i) => (
                                  <div key={`maschine-${i}`} className="bg-card p-2 rounded-md text-xs">
                                    <div className="font-medium">{maschine.name}</div>
                                    <div className="text-muted-foreground text-xs mt-0.5">{maschine.beschreibung}</div>
                                    <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                                      <div>Tagesmiete: <span className="font-medium">{maschine.tagesmiete} €</span></div>
                                      <div>Leistung: <span className="font-medium">{maschine.leistung} m²/Tag</span></div>
                                    </div>
                                  </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">Keine Standorte markiert</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Klicken Sie auf die Karte, um Standorte zu markieren und Materialberechnungen durchzuführen.
                  </p>
                </div>
              )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
    </>
  );
}