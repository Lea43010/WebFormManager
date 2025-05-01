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
  Search, Loader2, HelpCircle, Pencil, Trash2, X, Building,
  Briefcase, Plus
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Link, useLocation, useParams } from "wouter";
import BayernMaps from "@/components/maps/bayern-maps";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

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

interface ProjectData {
  id: number;
  projectName: string;
  projectLatitude: number | null;
  projectLongitude: number | null;
  projectAddress: string | null;
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
    map.setView(position, 13);
  }, [map, position]);
  
  return null;
}

// Hauptkomponente
export default function GeoMapPage() {
  // URL-Parameter und Navigation
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const projectId = params.get("projectId");
  
  // Zustandsvariablen für die Karte
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [selectedBelastungsklasse, setSelectedBelastungsklasse] = useState<string>("Bk32");
  const [currentEditIndex, setCurrentEditIndex] = useState<number>(-1);
  const [editMarker, setEditMarker] = useState<MarkerInfo | null>(null);
  const [roadType, setRoadType] = useState("Bundesstraße"); // Default-Straßentyp
  const [roadWidth, setRoadWidth] = useState<number>(roadWidthPresets.Bundesstraße); // Default-Straßenbreite
  const [customRoadWidth, setCustomRoadWidth] = useState<number>(0);
  const [optimizeRoute, setOptimizeRoute] = useState<boolean>(false);
  const [bayernTabValue, setBayernTabValue] = useState<string>("strassenplanung"); // Default-Tab
  
  // Adresssuche Zustände
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Projektzustände
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  // PDF Export Status
  const [exportingPDF, setExportingPDF] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  
  // Anzeigeoptionen
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [showDistances, setShowDistances] = useState<boolean>(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Projekte mit Geo-Koordinaten laden
  const { data: geoProjects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/geo-projects'],
    queryFn: async () => {
      const res = await fetch('/api/geo-projects');
      if (!res.ok) throw new Error('Fehler beim Laden der Projekte mit Geo-Koordinaten');
      return res.json();
    },
    enabled: bayernTabValue === "strassenplanung", // Nur laden, wenn auf dem Straßenplanungs-Tab
  });
  
  // Spezifisches Projekt laden
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['/api/geo-projects', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await fetch(`/api/geo-projects/${projectId}`);
      if (!res.ok) throw new Error(`Fehler beim Laden des Projekts mit ID ${projectId}`);
      return res.json();
    },
    enabled: !!projectId, // Nur laden, wenn eine Projekt-ID vorhanden ist
  });
  
  // Mutation zum Aktualisieren der Projekt-Koordinaten
  const updateProjectMutation = useMutation({
    mutationFn: async (data: { 
      projectId: number, 
      projectLatitude: number, 
      projectLongitude: number,
      projectAddress: string
    }) => {
      const response = await apiRequest(
        'PUT', 
        `/api/geo-projects/${data.projectId}`, 
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      // Beim Erfolg den Cache invalidieren, um aktualisierte Daten zu laden
      queryClient.invalidateQueries({ queryKey: ['/api/geo-projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/geo-projects', projectId] });
      setHasUnsavedChanges(false);
    },
  });
  
  // Berechnen der Strecke und Materialkosten
  const { total, segments } = calculateRouteDistances(markers);
  const { materials, total: totalCost } = calculateMaterialCosts(total, roadWidth, selectedBelastungsklasse);
  
  // Empfohlene Baumaschinen für die aktuelle Belastungsklasse
  const recommendedMachines = useCallback(() => {
    return baumaschinen.filter(m => m.eignung.includes(selectedBelastungsklasse));
  }, [selectedBelastungsklasse]);
  
  // Init-Hooks, die ausgeführt werden, wenn die Komponente geladen wird
  useEffect(() => {
    // Bei Bedarf Daten aus localStorage laden, wenn kein Projekt geladen ist
    const savedMarkers = localStorage.getItem('geoMapMarkers');
    if (savedMarkers && !projectId) {
      try {
        setMarkers(JSON.parse(savedMarkers));
      } catch (e) {
        console.error("Fehler beim Laden der gespeicherten Marker:", e);
      }
    }
  }, [projectId]);
  
  // Wenn ein Projekt geladen wird und Koordinaten hat, diese als Marker setzen
  useEffect(() => {
    if (project && project.projectLatitude && project.projectLongitude) {
      // Marker aus dem Projekt erstellen
      const projectMarker: MarkerInfo = {
        position: [project.projectLatitude, project.projectLongitude],
        belastungsklasse: "Bk32", // Standardwert
        name: project.projectName || `Projekt #${project.id}`,
        notes: `Projekt: ${project.projectName || `#${project.id}`}`,
      };
      
      // Adressinformationen hinzufügen, wenn vorhanden
      if (project.projectAddress) {
        const addressParts = project.projectAddress.split(", ");
        if (addressParts.length >= 2) {
          projectMarker.strasse = addressParts[0];
          
          const plzStadt = addressParts[1].split(" ");
          if (plzStadt.length >= 2) {
            projectMarker.plz = plzStadt[0];
            projectMarker.ort = plzStadt.slice(1).join(" ");
          }
        }
      }
      
      // Marker setzen und Karte zur Position zentrieren
      setMarkers([projectMarker]);
      setSelectedProject(project);
      
      // Mit kleiner Verzögerung zur Position zentrieren (warten bis Map geladen ist)
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.setView([project.projectLatitude, project.projectLongitude], 15);
        }
      }, 500);
    }
  }, [project]);
  
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
      setCurrentEditIndex(-1);
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
    if (currentEditIndex !== -1) {
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
      setCurrentEditIndex(-1);
    }
    // Indizes für nachfolgende Marker anpassen
    else if (currentEditIndex !== -1 && currentEditIndex > index) {
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
      // Aktuellen Benutzer abrufen für den Bericht
      const userResponse = await fetch('/api/user');
      const userData = await userResponse.json();
      const username = userData?.username || 'Unbekannter Benutzer';
      
      // Aktuelles Datum formatieren
      const currentDate = new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Zuerst die Karte als Canvas rendern
      const canvas = await html2canvas(mapContainerRef.current, {
        scale: 2, // Höhere Qualität
        useCORS: true, // Für Tile-Layer von externen Quellen
        allowTaint: true,
        backgroundColor: null,
      });
      
      setExportProgress(40);
      
      // Ein neues PDF-Dokument erstellen
      const pdf = new jsPDF({
        orientation: 'portrait', // Von landscape zu portrait geändert für besseres Layout
        unit: 'mm',
      });
      
      // Seitengröße anpassen
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Header erstellen mit Projektinformationen
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bau-Structura Straßenplanung', pdfWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      // Erstellt von Informationen
      pdf.text(`Erstellt von: ${username}`, 14, 25);
      pdf.text(`Datum: ${currentDate}`, 14, 30);
      
      // Projektinformationen
      if (selectedProject) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Projektinformationen:', 14, 40);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Projektname: ${selectedProject.projectName || `Projekt #${selectedProject.id}`}`, 14, 45);
        
        // Adressinformationen
        if (selectedProject.projectAddress) {
          pdf.text(`Adresse: ${selectedProject.projectAddress}`, 14, 50);
        }
        
        // Kundeninformationen würden hier hinzugefügt werden, falls vorhanden
        // Dies ist für zukünftige Erweiterungen vorgesehen
      }
      
      // Kartenheader
      pdf.setFont('helvetica', 'bold');
      pdf.text('Kartenansicht:', 14, 65);
      pdf.setFont('helvetica', 'normal');
      
      // Canvas-Seitenverhältnis beibehalten, aber kompakter
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      // Kleineres Bildformat für die Karte verwenden, um mehr Platz für Text zu haben
      const maxImgWidth = pdfWidth - 28; // Rand beidseitig
      const maxImgHeight = 100; // Begrenzte Höhe
      const ratio = Math.min(maxImgWidth / canvasWidth, maxImgHeight / canvasHeight);
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;
      
      // Bild zur Mitte horizontal ausrichten
      const x = (pdfWidth - imgWidth) / 2;
      const y = 70; // Position nach dem Header
      
      // Bild aus dem Canvas in das PDF einfügen
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      setExportProgress(70);
      
      // Standortinformationen
      const startY = y + imgHeight + 10;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Standortinformationen:', 14, startY);
      pdf.setFont('helvetica', 'normal');
      
      // Liste der Standorte
      let locationY = startY + 5;
      
      if (markers.length > 0) {
        // Tabellenkopf
        pdf.setFillColor(240, 240, 240);
        pdf.rect(14, locationY, pdfWidth - 28, 7, 'F');
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Nr.', 15, locationY + 5);
        pdf.text('Adresse', 25, locationY + 5);
        pdf.text('Belastungskl.', pdfWidth - 50, locationY + 5);
        pdf.setFont('helvetica', 'normal');
        
        locationY += 10;
        
        // Marker-Daten in tabellarischer Form
        markers.forEach((marker, index) => {
          const addressText = marker.strasse ? 
            `${marker.strasse}${marker.hausnummer ? ' ' + marker.hausnummer : ''}, ${marker.plz || ''} ${marker.ort || ''}` : 
            `Lat: ${marker.position[0].toFixed(5)}, Lng: ${marker.position[1].toFixed(5)}`;
          
          pdf.text(`${index+1}.`, 15, locationY);
          
          // Adresstext - muss eventuell umgebrochen werden wenn zu lang
          if (addressText.length > 50) {
            const wrappedText = pdf.splitTextToSize(addressText, pdfWidth - 95);
            pdf.text(wrappedText, 25, locationY);
            // Wenn Text umgebrochen wird, mehr Platz einplanen
            locationY += (wrappedText.length - 1) * 5;
          } else {
            pdf.text(addressText, 25, locationY);
          }
          
          pdf.text(marker.belastungsklasse || 'N/A', pdfWidth - 50, locationY);
          locationY += 7;
          
          // Seitenumbruch einfügen, wenn wir ans Ende der Seite kommen
          if (locationY > pdfHeight - 20) {
            pdf.addPage();
            locationY = 20;
          }
        });
      } else {
        pdf.text('Keine Standorte markiert.', 14, locationY + 5);
        locationY += 10;
      }
      
      // Wenn die Seite schon voll ist, neue Seite für die Materialliste einfügen
      if (locationY > pdfHeight - 70) {
        pdf.addPage();
        locationY = 20;
      }
      
      // Streckendaten und Materialliste
      if (markers.length > 1) {
        // Informationen zur Strecke
        locationY += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Streckendaten:', 14, locationY);
        pdf.setFont('helvetica', 'normal');
        
        const { total, segments } = calculateRouteDistances(markers);
        locationY += 7;
        pdf.text(`Gesamte Streckenlänge: ${total.toFixed(2)} km`, 14, locationY);
        locationY += 7;
        pdf.text(`Straßenbreite: ${roadWidth} m`, 14, locationY);
        locationY += 7;
        pdf.text(`Gewählte Belastungsklasse: ${selectedBelastungsklasse}`, 14, locationY);
        
        // Wenn Marker mit unterschiedlichen Belastungsklassen vorhanden sind
        const uniqueKlassen = Array.from(new Set(markers.filter(m => m.belastungsklasse).map(m => m.belastungsklasse)));
        if (uniqueKlassen.length > 1) {
          locationY += 7;
          pdf.text('Hinweis: Die Strecke enthält Abschnitte mit unterschiedlichen Belastungsklassen.', 14, locationY);
          locationY += 7;
          pdf.text('Die Materialberechnung basiert auf der global gewählten Belastungsklasse.', 14, locationY);
        }
        
        // Materialliste
        locationY += 12;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Benötigte Materialien:', 14, locationY);
        pdf.setFont('helvetica', 'normal');
        
        const { materials, total: totalCost } = calculateMaterialCosts(total, roadWidth, selectedBelastungsklasse);
        
        // Tabellenkopf für Materialien
        locationY += 7;
        pdf.setFillColor(240, 240, 240);
        pdf.rect(14, locationY, pdfWidth - 28, 7, 'F');
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Material', 15, locationY + 5);
        pdf.text('Fläche (m²)', pdfWidth - 85, locationY + 5);
        pdf.text('Preis/m²', pdfWidth - 55, locationY + 5);
        pdf.text('Gesamt (€)', pdfWidth - 30, locationY + 5);
        pdf.setFont('helvetica', 'normal');
        
        locationY += 10;
        
        // Materialtabelle
        materials.forEach((material: any) => {
          const materialName = `${material.name} (${material.thickness})`;
          pdf.text(materialName, 15, locationY);
          pdf.text(material.area.toFixed(2), pdfWidth - 85, locationY, { align: 'left' });
          pdf.text(material.costPerSqm.toFixed(2) + ' €', pdfWidth - 55, locationY, { align: 'left' });
          pdf.text(material.totalCost.toFixed(2) + ' €', pdfWidth - 30, locationY, { align: 'left' });
          locationY += 7;
          
          // Seitenumbruch wenn nötig
          if (locationY > pdfHeight - 20) {
            pdf.addPage();
            locationY = 20;
          }
        });
        
        // Gesamtkosten mit Linie und fett
        locationY += 5;
        pdf.line(pdfWidth - 90, locationY - 2, pdfWidth - 14, locationY - 2);
        locationY += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Gesamte Materialkosten:', pdfWidth - 90, locationY);
        pdf.text(totalCost.toFixed(2) + ' €', pdfWidth - 30, locationY, { align: 'left' });
      }
      
      // Fußzeile
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      const pageCount = pdf.getNumberOfPages();
      
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.text(`Bau-Structura | Erstellt am ${currentDate} | Seite ${i} von ${pageCount}`, pdfWidth / 2, pdfHeight - 10, {
          align: 'center'
        });
      }
      
      setExportProgress(95);
      
      // PDF speichern mit Projektname (falls vorhanden)
      const fileName = selectedProject ? 
        `Straßenplanung_${selectedProject.projectName || 'Projekt_' + selectedProject.id}.pdf` : 
        'Straßenplanung.pdf';
      
      pdf.save(fileName);
      
    } catch (error) {
      console.error("Fehler beim Exportieren als PDF:", error);
    } finally {
      setExportingPDF(false);
      setExportProgress(0);
    }
  }, [markers, roadWidth, selectedBelastungsklasse, selectedProject]);
  
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
    <div className="container mx-auto py-6 lg:py-10">
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
              <div className="grid grid-cols-1 gap-6">
                <Card className="w-full">
                <CardHeader className="pb-3">
                  <div>
                    <CardTitle>Straßenplanung</CardTitle>
                    <CardDescription>
                      Straßenbau mit RStO-konformen Belastungsklassen
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pb-3">
                  {/* Erste Zeile: Projekt-Auswahl, Adresssuche und Marker-Button */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Projekt-Verbindung mit Dropdown */}
                    <div>
                      <Label htmlFor="projekt-auswahl" className="mb-2 block">Projekt</Label>
                      {isLoadingProjects ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Projekte werden geladen...</span>
                        </div>
                      ) : geoProjects && geoProjects.length > 0 ? (
                        <div className="flex gap-2 items-center">
                          <Select
                            value={selectedProject ? String(selectedProject.id) : ""}
                            onValueChange={(value) => {
                              if (value === "new-project") {
                                window.location.href = "/projects";
                                return;
                              }
                              
                              const selected = geoProjects.find((p: ProjectData) => p.id === parseInt(value));
                              if (selected) {
                                setSelectedProject(selected);
                                
                                // Marker für das Projekt erstellen
                                if (selected.projectLatitude && selected.projectLongitude) {
                                  const projectMarker: MarkerInfo = {
                                    position: [selected.projectLatitude, selected.projectLongitude],
                                    belastungsklasse: "Bk32", // Standardwert
                                    name: selected.projectName || `Projekt #${selected.id}`,
                                    notes: `Projekt: ${selected.projectName || `#${selected.id}`}`,
                                  };
                                  
                                  // Adressinformationen hinzufügen, wenn vorhanden
                                  if (selected.projectAddress) {
                                    const addressParts = selected.projectAddress.split(", ");
                                    if (addressParts.length >= 2) {
                                      projectMarker.strasse = addressParts[0];
                                      
                                      const plzStadt = addressParts[1].split(" ");
                                      if (plzStadt.length >= 2) {
                                        projectMarker.plz = plzStadt[0];
                                        projectMarker.ort = plzStadt.slice(1).join(" ");
                                      }
                                    }
                                  }
                                  
                                  // Marker setzen und Karte zur Position zentrieren
                                  setMarkers([projectMarker]);
                                  
                                  // Mit kleiner Verzögerung zur Position zentrieren (warten bis Map geladen ist)
                                  setTimeout(() => {
                                    if (mapRef.current) {
                                      mapRef.current.setView([selected.projectLatitude, selected.projectLongitude], 15);
                                    }
                                  }, 500);
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-full" id="projekt-auswahl">
                              <SelectValue placeholder="Projekt auswählen" />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={5} className="z-50">
                              {geoProjects.map((project: ProjectData) => (
                                <SelectItem key={project.id} value={String(project.id)}>
                                  <div className="flex items-center gap-1">
                                    <Briefcase className="h-3.5 w-3.5 mr-1" />
                                    {project.projectName || `Projekt #${project.id}`}
                                  </div>
                                </SelectItem>
                              ))}
                              <SelectItem value="new-project">
                                <div className="flex items-center gap-1 text-primary">
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Neues Projekt
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {selectedProject && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                // Speichern der aktuellen Marker-Position im Projekt
                                if (markers.length > 0 && selectedProject) {
                                  const firstMarker = markers[0];
                                  const address = 
                                    (firstMarker.strasse ? `${firstMarker.strasse}, ` : '') +
                                    (firstMarker.plz && firstMarker.ort ? `${firstMarker.plz} ${firstMarker.ort}` : '');
                                  
                                  updateProjectMutation.mutate({
                                    projectId: selectedProject.id,
                                    projectLatitude: firstMarker.position[0],
                                    projectLongitude: firstMarker.position[1],
                                    projectAddress: address
                                  });
                                }
                              }}
                              disabled={updateProjectMutation.isPending || markers.length === 0}
                            >
                              {updateProjectMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Speichern...
                                </>
                              ) : (
                                <>
                                  <svg className="mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                  Speichern
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Zurück zur Projektübersicht navigieren
                                  window.location.href = "/projects";
                                }}
                              >
                                <Briefcase className="mr-2 h-4 w-4" />
                                Projekt erstellen
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Sie benötigen ein Projekt zum Speichern der Geo-Informationen</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    
                    {/* Adresssuche */}
                    <div className="flex-1">
                      <Label htmlFor="adresssuche" className="mb-2 block">Adresssuche</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="adresssuche"
                          value={searchAddress} 
                          onChange={(e) => setSearchAddress(e.target.value)}
                          placeholder="Adresse eingeben..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddressSearch();
                            }
                          }}
                        />
                        <Button 
                          onClick={handleAddressSearch} 
                          disabled={isSearching || !searchAddress}
                          size="sm"
                        >
                          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          <span className="ml-2 hidden sm:inline">Suchen</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Marker-Steuerung */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => {
                          const map = mapRef.current;
                          if (map && markers.length > 0) {
                            const bounds = new L.LatLngBounds(markers.map(m => m.position));
                            map.fitBounds(bounds, { padding: [50, 50] });
                          }
                        }}
                      >
                        <MapPin className="w-4 h-4" />
                        <span className="hidden md:inline">Marker anzeigen</span>
                      </Button>
                      
                      {markers.length > 2 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => {
                            setMarkers(optimizeRouteOrder([...markers]));
                          }}
                        >
                          <Route className="w-4 h-4" />
                          <span className="hidden md:inline">Optimieren</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Zweite Zeile: Straßentyp, Belastungsklasse und Straßenbreite */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="strassentyp">Straßentyp</Label>
                      <Select defaultValue={roadType} onValueChange={value => setRoadType(value)}>
                        <SelectTrigger id="strassentyp">
                          <SelectValue placeholder="Straßentyp wählen" />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={5} className="z-50">
                          <SelectItem value="Autobahn">Autobahn</SelectItem>
                          <SelectItem value="Bundesstraße">Bundesstraße</SelectItem>
                          <SelectItem value="Landstraße">Landstraße</SelectItem>
                          <SelectItem value="Kreisstraße">Kreisstraße</SelectItem>
                          <SelectItem value="Gemeindestraße">Gemeindestraße</SelectItem>
                          <SelectItem value="Benutzerdefiniert">Benutzerdefiniert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="belastungsklasse">Belastungsklasse</Label>
                      <Select defaultValue={selectedBelastungsklasse} onValueChange={value => setSelectedBelastungsklasse(value)}>
                        <SelectTrigger id="belastungsklasse">
                          <SelectValue placeholder="Belastungsklasse wählen" />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={5} className="z-50">
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
                    
                    {roadType !== "Benutzerdefiniert" && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="roadWidthSlider">Straßenbreite: {roadWidth} m</Label>
                        </div>
                        <Slider 
                          id="roadWidthSlider"
                          min={3} 
                          max={15} 
                          step={0.5} 
                          defaultValue={[roadWidth]} 
                          onValueChange={([value]) => setRoadWidth(value)} 
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Hilfslinien und Distanzen als Inline-Optionen */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hilfslinien" className="cursor-pointer">Hilfslinien anzeigen</Label>
                      <Switch 
                        id="hilfslinien" 
                        checked={showGuides} 
                        onCheckedChange={setShowGuides} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="distanzen" className="cursor-pointer">Distanzen anzeigen</Label>
                      <Switch 
                        id="distanzen" 
                        checked={showDistances} 
                        onCheckedChange={setShowDistances} 
                      />
                    </div>
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
                </CardContent>
              </Card>
                
                {/* Suchergebnisse unterhalb des Hauptformulars */}
                {(searchError || searchResults.length > 0) && (
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Suchergebnisse</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {searchError && (
                        <Alert variant="destructive" className="py-2 mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Fehler</AlertTitle>
                          <AlertDescription>
                            {searchError}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {searchResults.length > 0 && (
                        <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                          <div className="p-2 text-xs font-medium text-muted-foreground bg-muted/50">
                            {searchResults.length} Ergebnisse gefunden
                          </div>
                          <div className="divide-y">
                            {searchResults.map((result, index) => (
                              <Button
                                key={index}
                                variant="ghost"
                                className="w-full justify-start p-2 text-sm h-auto"
                                onClick={() => handleSelectSearchResult(result)}
                              >
                                <Building className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-left truncate">{result.place_name}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Karte in der Mitte */}
              <Card className="max-w-4xl mx-auto">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Kartenansicht</CardTitle>
                      <CardDescription>
                        Klicken Sie in die Karte, um neue Standorte zu markieren
                      </CardDescription>
                    </div>
                    {markers.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={handleExportPDF}
                        disabled={exportingPDF}
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden md:inline">Als PDF exportieren</span>
                        <span className="md:hidden">PDF</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-0">
                  <div className="h-[50vh] border rounded-md overflow-hidden relative mx-auto" ref={mapContainerRef}>
                    {exportingPDF && (
                      <div className="absolute inset-0 z-40 flex flex-col justify-center items-center bg-background/80">
                        <h3 className="mb-2 font-semibold">PDF wird erstellt...</h3>
                        <Progress value={exportProgress} className="w-1/2 mb-2" />
                        <p className="text-sm text-muted-foreground">{exportProgress}% abgeschlossen</p>
                      </div>
                    )}
                    
                    <MapContainer 
                      center={[48.1351, 11.5820]} // München als Standard
                      zoom={13} 
                      style={{ height: '100%', width: '100%' }}
                      ref={mapRef}
                    >
                      <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="OpenStreetMap">
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Satellit">
                          <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution='&copy; <a href="https://www.esri.com">Esri</a>'
                          />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Topographisch">
                          <TileLayer
                            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
                          />
                        </LayersControl.BaseLayer>
                      </LayersControl>
                      

                      
                      {/* Marker auf der Karte */}
                      {markers.map((marker, index) => (
                        <Marker 
                          key={index} 
                          position={marker.position}
                          icon={createCustomIcon(marker.belastungsklasse)}
                          draggable={true}
                          eventHandlers={{
                            dragend: (e) => {
                              const marker = e.target;
                              const position = marker.getLatLng();
                              handleUpdateMarkerPosition(index, position.lat, position.lng);
                            },
                          }}
                        >
                          <Popup>
                            <div className="p-1">
                              <h3 className="font-medium text-sm">
                                {marker.strasse 
                                  ? `${marker.strasse} ${marker.hausnummer || ''}` 
                                  : marker.name || `Standort ${index + 1}`}
                              </h3>
                              
                              {marker.strasse && (
                                <p className="text-xs">{marker.plz} {marker.ort}</p>
                              )}
                              
                              {marker.belastungsklasse && marker.belastungsklasse !== "none" && (
                                <Badge 
                                  className="mt-2"
                                  style={{ backgroundColor: belastungsklassenColors[marker.belastungsklasse as keyof typeof belastungsklassenColors] }}
                                >
                                  {marker.belastungsklasse}
                                </Badge>
                              )}
                              
                              {marker.notes && (
                                <p className="text-xs mt-2 italic">{marker.notes}</p>
                              )}
                              
                              <div className="flex justify-end gap-1 mt-3">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => {
                                    setEditMarker({ ...marker });
                                    setCurrentEditIndex(index);
                                    if (mapRef && mapRef.current) {
                                      mapRef.current.closePopup();
                                    }
                                  }}
                                >
                                  Details
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleDeleteMarker(index)}
                                >
                                  Löschen
                                </Button>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                      
                      {/* Streckenlinien zeichnen, wenn mindestens 2 Marker vorhanden sind */}
                      {markers.length > 1 && (
                        <Polyline 
                          positions={markers.map(m => m.position)}
                          color="#0066ff"
                          weight={4}
                          opacity={0.7}
                          dashArray={showGuides ? "5, 10" : undefined}
                        >
                          <LeafletTooltip sticky>Gesamtlänge: {total.toFixed(2)} km</LeafletTooltip>
                        </Polyline>
                      )}
                      
                      {/* Karten-Events für die Interaktion */}
                      <MapClicker onMarkerAdd={handleAddMarker} selectedBelastungsklasse={selectedBelastungsklasse} />
                      <MapEvents onMoveEnd={(map) => {
                        console.log("Karte wurde bewegt: ", map.getCenter());
                      }} />
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Untere Karte - Ergebnisse/Auswertung */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Belastungsklasse-Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Belastungsklasse: {selectedBelastungsklasse}</CardTitle>
                    <CardDescription>
                      Details zur gewählten Belastungsklasse
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedBelastungsklasse !== "none" && getKlasseInfo(selectedBelastungsklasse) && (
                      <>
                        {/* RStO-Aufbau-Visualisierung */}
                        <div className="relative h-24 border rounded-md bg-background overflow-hidden mb-4">
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
                            <span className="absolute left-2 text-[10px] text-gray-800">
                              Frostschutzschicht ({
                                getKlasseInfo(selectedBelastungsklasse)?.dickeSchotterTragschicht 
                                  ? getKlasseInfo(selectedBelastungsklasse)?.dickeFrostschutzschicht2 
                                  : getKlasseInfo(selectedBelastungsklasse)?.dickeFrostschutzschicht1
                              })
                            </span>
                          </div>
                        </div>
                        
                        {/* Klasseninformationen */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">Bauklasse</div>
                            <div className="font-medium">{getKlasseInfo(selectedBelastungsklasse)?.bauklasse}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Beanspruchung</div>
                            <div className="font-medium">{getKlasseInfo(selectedBelastungsklasse)?.beanspruchung}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-muted-foreground">Beispielanwendung</div>
                            <div className="font-medium">{getKlasseInfo(selectedBelastungsklasse)?.beispiel}</div>
                          </div>
                          <div className="col-span-2 mt-2">
                            <div className="text-muted-foreground">Gesamtdicke frostsicherer Aufbau</div>
                            <div className="font-medium">{getKlasseInfo(selectedBelastungsklasse)?.dickeAsphaltbauweise}</div>
                          </div>
                        </div>
                      </>
                    )}
                    {selectedBelastungsklasse === "none" && (
                      <div className="text-center py-6 text-muted-foreground">
                        <Building className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>Bitte wählen Sie eine Belastungsklasse, um Details anzuzeigen.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Markerliste */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Markierte Standorte</CardTitle>
                        <CardDescription>
                          {markers.length} Standorte, {total.toFixed(2)} km Gesamtstrecke
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {markers.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>Klicken Sie auf die Karte, um Standorte zu markieren.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {markers.map((marker, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: marker.belastungsklasse ? belastungsklassenColors[marker.belastungsklasse as keyof typeof belastungsklassenColors] : belastungsklassenColors.none }}
                              ></div>
                              <div>
                                <div className="font-medium text-sm">
                                  {marker.strasse ? 
                                    `${marker.strasse} ${marker.hausnummer || ''}` : 
                                    marker.name || `Standort ${index + 1}`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {marker.strasse ? 
                                    `${marker.plz || ''} ${marker.ort || ''}` : 
                                    `${marker.position[0].toFixed(4)}, ${marker.position[1].toFixed(4)}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
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
                                    <p>Bearbeiten</p>
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
                                    <p>Löschen</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Materialkostentabelle */}
              {markers.length > 1 && (
                <Card className="max-w-4xl mx-auto">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Materialberechnung</CardTitle>
                        <CardDescription>
                          Berechnung für {total.toFixed(2)} km Strecke mit {roadWidth} m Breite
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        <span className="flex items-center gap-1">
                          <Calculator className="w-3.5 h-3.5" />
                          {totalCost.toFixed(2)} €
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md divide-y">
                      {materials.map((material: any, index: number) => (
                        <div key={index} className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">Material</div>
                            <div>{material.name} ({material.thickness})</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Fläche</div>
                            <div>{material.area.toFixed(0)} m²</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Kosten/m²</div>
                            <div>{material.costPerSqm.toFixed(2)} €</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Gesamt</div>
                            <div className="font-medium">{material.totalCost.toFixed(2)} €</div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="p-3 flex justify-between">
                        <div className="font-semibold">Gesamtkosten:</div>
                        <div className="font-semibold">{totalCost.toFixed(2)} €</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Marker-Bearbeitungsformular */}
            {editMarker && currentEditIndex !== -1 && (
              <Card className="mt-4 max-w-4xl mx-auto">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">Marker bearbeiten</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7"
                      onClick={() => setCurrentEditIndex(-1)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    <span>Standort bei <strong>{editMarker.position[0].toFixed(5)}, {editMarker.position[1].toFixed(5)}</strong></span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="marker-name">Name des Standorts</Label>
                    <Input 
                      id="marker-name"
                      value={editMarker.name || ''}
                      onChange={(e) => handleEditMarkerChange('name', e.target.value)}
                      placeholder="z.B. Baustelle Nord"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="Hausnummer"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      setCurrentEditIndex(-1);
                    }}
                  >
                    Abbrechen
                  </Button>
                  
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
              </Card>
            )}
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