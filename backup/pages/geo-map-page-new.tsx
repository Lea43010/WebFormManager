import { FC, useState, useRef, useEffect, useMemo } from 'react';
import { Link } from "wouter";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap,
  LayersControl,
  Tooltip as LeafletTooltip
} from 'react-leaflet';
import L from 'leaflet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  ArrowLeft,
  Download,
  FileDown,
  Loader2,
  Map as MapIcon,
  MapPin,
  Pencil,
  Route,
  Trash2,
  Layers
} from 'lucide-react';
import BayernMaps from '@/components/maps/bayern-maps';

// Mapbox-Token für die Karte
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || "pk.eyJ1IjoibGVhNDIiLCJhIjoiY2xtZ21nOTl3MGlvNDJrbzZjbTMwZTV2YiJ9.QzBDmLOzV9RQr0zTU3aW8g";

// Baumaschinen-Daten
interface Baumaschine {
  name: string;
  beschreibung: string;
  eignung: string[]; // Geeignet für diese Belastungsklassen
  bildUrl?: string;
  tagesmiete: number; // Euro pro Tag
  leistung: number; // m²/Tag
}

// Material-Kosten-Struktur
interface MaterialCosts {
  asphaltdecke: number;     // Kosten pro m² für Asphaltdecke
  asphalttragschicht: number;  // Kosten pro m² für Asphalttragschicht
  frostschutzschicht: number;  // Kosten pro m² für Frostschutzschicht
  schottertragschicht?: number; // Kosten pro m² für Schottertragschicht (optional)
}

// Marker-Information
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

// Belastungsklassen-Informationen
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

// Belastungsklassen basierend auf RStO 12 (Richtlinien für die Standardisierung des Oberbaus von Verkehrsflächen)
const belastungsklassen: BelastungsklasseInfo[] = [
  {
    klasse: "Bk100",
    beanspruchung: "Sehr starke Beanspruchung",
    beispiel: "Autobahnen, Industriezufahrten",
    bauklasse: "SV",
    dickeAsphaltbauweise: "74-79 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "22 cm",
    dickeFrostschutzschicht1: "53 cm",
    dickeSchotterTragschicht: "15 cm",
    dickeFrostschutzschicht2: "38 cm"
  },
  {
    klasse: "Bk32",
    beanspruchung: "Starke Beanspruchung",
    beispiel: "Bundesstraßen, Hauptverkehrsstraßen",
    bauklasse: "I-II",
    dickeAsphaltbauweise: "66-72 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "18 cm",
    dickeFrostschutzschicht1: "50 cm"
  },
  {
    klasse: "Bk10",
    beanspruchung: "Mittlere Beanspruchung",
    beispiel: "Kreisstraßen, Erschließungsstraßen",
    bauklasse: "III",
    dickeAsphaltbauweise: "60-66 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "14 cm",
    dickeFrostschutzschicht1: "48 cm",
    dickeSchotterTragschicht: "20 cm",
    dickeFrostschutzschicht2: "28 cm"
  },
  {
    klasse: "Bk3",
    beanspruchung: "Geringe Beanspruchung",
    beispiel: "Gemeindestraßen, Wohnstraßen",
    bauklasse: "IV",
    dickeAsphaltbauweise: "54-60 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "10 cm",
    dickeFrostschutzschicht1: "46 cm"
  },
  {
    klasse: "Bk1",
    beanspruchung: "Sehr geringe Beanspruchung",
    beispiel: "Anliegerstraßen, Parkplätze",
    bauklasse: "V",
    dickeAsphaltbauweise: "48-54 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "8 cm",
    dickeFrostschutzschicht1: "42 cm"
  },
  {
    klasse: "Bk0_3",
    beanspruchung: "Minimale Beanspruchung",
    beispiel: "Fußgängerzonen, Radwege",
    bauklasse: "VI",
    dickeAsphaltbauweise: "42-48 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "6 cm",
    dickeFrostschutzschicht1: "38 cm"
  }
];

// Standardkosten für die einzelnen Schichten
const baseMaterialCosts: MaterialCosts = {
  asphaltdecke: 17.50,      // 17,50 € pro m² für die Asphaltdeckschicht
  asphalttragschicht: 14.75, // 14,75 € pro m² für die Asphalttragschicht
  frostschutzschicht: 8.80,  // 8,80 € pro m² für die Frostschutzschicht
  schottertragschicht: 10.20 // 10,20 € pro m² für die Schottertragschicht
};

// Farbcodes für die Belastungsklassen
const belastungsklassenColors: Record<string, string> = {
  "Bk100": "#ff4500", // Orange-Red
  "Bk32": "#ff8c00",  // Dark Orange
  "Bk10": "#ffd700",  // Gold
  "Bk3": "#32cd32",   // Lime Green
  "Bk1": "#4682b4",   // Steel Blue
  "Bk0_3": "#9370db", // Medium Purple
  "none": "#888888"   // Default Gray for no class
};

// Baumaschinen-Liste
const baumaschinen: Baumaschine[] = [
  {
    name: "Straßenfertiger SUPER 1800-3i",
    beschreibung: "Leistungsstarker Fertiger für große Flächen, ideal für Bk100/Bk32",
    eignung: ["Bk100", "Bk32"],
    tagesmiete: 2200,
    leistung: 5000
  },
  {
    name: "Straßenfertiger SUPER 1303-3i",
    beschreibung: "Kompakter Fertiger für mittelgroße Straßen, optimiert für Bk10/Bk3",
    eignung: ["Bk10", "Bk3"],
    tagesmiete: 1600,
    leistung: 3500
  },
  {
    name: "Tandemwalze HD+ 90i",
    beschreibung: "Schwere Walze für alle Beanspruchungsklassen",
    eignung: ["Bk100", "Bk32", "Bk10", "Bk3", "Bk1"],
    tagesmiete: 850,
    leistung: 6000
  },
  {
    name: "Tandemwalze HD 13i",
    beschreibung: "Mittelgroße Walze für normale Verdichtungsarbeit",
    eignung: ["Bk10", "Bk3", "Bk1", "Bk0_3"],
    tagesmiete: 650,
    leistung: 4500
  },
  {
    name: "Kompaktfräse W 100 Fi",
    beschreibung: "Präzisionsfräse für Reparaturarbeiten aller Belastungsklassen",
    eignung: ["Bk100", "Bk32", "Bk10", "Bk3", "Bk1", "Bk0_3"],
    tagesmiete: 1800,
    leistung: 2500
  },
  {
    name: "Kaltfräse W 200 Fi",
    beschreibung: "Leistungsstarke Fräse für stark beanspruchte Straßen",
    eignung: ["Bk100", "Bk32", "Bk10"],
    tagesmiete: 2400,
    leistung: 4000
  },
  {
    name: "Kompaktlader 906M",
    beschreibung: "Vielseitiger Kompaktlader für kleine bis mittlere Projekte",
    eignung: ["Bk3", "Bk1", "Bk0_3"],
    tagesmiete: 380,
    leistung: 1800
  },
  {
    name: "Bagger 320 GC",
    beschreibung: "Mittelgroßer Bagger für Tiefbauarbeiten",
    eignung: ["Bk100", "Bk32", "Bk10", "Bk3"],
    tagesmiete: 950,
    leistung: 300
  }
];

// Funktion: Berechnet die Entfernung zwischen zwei Punkten in km
function calculateDistance(
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number {
  const R = 6371; // Radius der Erde in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Funktion: Berechnet die Gesamtstrecke und Teilstrecken für eine Reihe von Markern
function calculateRouteDistances(markers: MarkerInfo[]): {total: number, segments: number[]} {
  let total = 0;
  const segments: number[] = [];
  
  for (let i = 0; i < markers.length - 1; i++) {
    const distance = calculateDistance(
      markers[i].position[0], markers[i].position[1],
      markers[i + 1].position[0], markers[i + 1].position[1]
    );
    segments.push(distance);
    total += distance;
  }
  
  return { total, segments };
}

// Funktion: Optimiert die Reihenfolge der Marker für kürzeste Strecke (einfacher Nearest Neighbor)
function optimizeRouteOrder(markers: MarkerInfo[]): MarkerInfo[] {
  if (markers.length <= 2) return [...markers];
  
  const optimizedMarkers: MarkerInfo[] = [markers[0]];
  const unvisited = new Set(markers.slice(1));
  
  while (unvisited.size > 0) {
    const current = optimizedMarkers[optimizedMarkers.length - 1];
    let minDist = Infinity;
    let nearest: MarkerInfo | null = null;
    
    for (const marker of unvisited) {
      const dist = calculateDistance(
        current.position[0], current.position[1],
        marker.position[0], marker.position[1]
      );
      
      if (dist < minDist) {
        minDist = dist;
        nearest = marker;
      }
    }
    
    if (nearest) {
      optimizedMarkers.push(nearest);
      unvisited.delete(nearest);
    }
  }
  
  return optimizedMarkers;
}

// Funktion: Gibt Informationen zu einer bestimmten Belastungsklasse zurück
function getKlasseInfo(klasseId: string): BelastungsklasseInfo | undefined {
  return belastungsklassen.find(k => k.klasse === klasseId);
}

// Funktion: Berechnet die Materialkosten basierend auf der Belastungsklasse und Strecke
function calculateMaterialCosts(
  belastungsklasse: string,
  streckenlaenge: number, // in km
  strassenbreite: number, // in m
  materialCosts: MaterialCosts = baseMaterialCosts
): { 
  totalCost: number;
  asphaltdeckeCost: number;
  asphalttragschichtCost: number;
  frostschutzschichtCost: number;
  schottertragschichtCost?: number;
  totalArea: number;
} {
  const klasseInfo = getKlasseInfo(belastungsklasse);
  if (!klasseInfo) return { 
    totalCost: 0, 
    asphaltdeckeCost: 0, 
    asphalttragschichtCost: 0, 
    frostschutzschichtCost: 0, 
    totalArea: 0 
  };
  
  // Berechne die Gesamtfläche in m²
  const totalArea = streckenlaenge * 1000 * strassenbreite; // km zu m umrechnen
  
  // Berechne die Kosten für jede Schicht
  const asphaltdeckeCost = totalArea * materialCosts.asphaltdecke;
  const asphalttragschichtCost = totalArea * materialCosts.asphalttragschicht;
  
  let frostschutzschichtCost: number;
  let schottertragschichtCost: number | undefined;
  
  if (klasseInfo.dickeSchotterTragschicht) {
    // Wenn es eine Schottertragschicht gibt, berechne deren Kosten
    schottertragschichtCost = totalArea * (materialCosts.schottertragschicht || 0);
    frostschutzschichtCost = totalArea * materialCosts.frostschutzschicht;
  } else {
    // Wenn es keine Schottertragschicht gibt, nur Frostschutzschicht
    frostschutzschichtCost = totalArea * materialCosts.frostschutzschicht;
    schottertragschichtCost = undefined;
  }
  
  // Berechne die Gesamtkosten
  const totalCost = asphaltdeckeCost + asphalttragschichtCost + frostschutzschichtCost + (schottertragschichtCost || 0);
  
  return {
    totalCost,
    asphaltdeckeCost,
    asphalttragschichtCost,
    frostschutzschichtCost,
    schottertragschichtCost,
    totalArea
  };
}

// Funktion: Erstellt ein benutzerdefiniertes Icon für Marker basierend auf der Belastungsklasse
function createCustomIcon(belastungsklasse?: string): L.DivIcon {
  const color = belastungsklasse && belastungsklasse !== "none"
    ? belastungsklassenColors[belastungsklasse] || belastungsklassenColors.none
    : belastungsklassenColors.none;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

interface MapClickerProps {
  onMarkerAdd: (lat: number, lng: number) => void;
  selectedBelastungsklasse: string;
}

function MapClicker({ onMarkerAdd, selectedBelastungsklasse }: MapClickerProps) {
  const map = useMapEvents({
    click: (e) => {
      onMarkerAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  
  return null;
}

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

interface MapControlProps {
  position: [number, number];
}

function MapControl({ position }: MapControlProps) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  
  return null;
}

const GeoMapPage: FC = () => {
  // State für die Tabs
  const [bayernTabValue, setBayernTabValue] = useState<"strassenplanung" | "bayernatlas" | "denkmalatlas">("strassenplanung");
  
  // State für die Marker
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [selectedBelastungsklasse, setSelectedBelastungsklasse] = useState<string>("Bk10");
  const [roadType, setRoadType] = useState<string>("Landstraße");
  const [customRoadWidth, setCustomRoadWidth] = useState<number | null>(null);
  
  // State für die Karte
  const [mapCenterPosition, setMapCenterPosition] = useState<[number, number]>([48.137154, 11.576124]);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // State für die Marker-Bearbeitung
  const [editMarker, setEditMarker] = useState<MarkerInfo | null>(null);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  
  // State für die PDF-Generierung
  const [exportingPDF, setExportingPDF] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  
  // State für die Adresssuche
  const [addressSearch, setAddressSearch] = useState<string>("");
  
  // Berechnet die Straßenbreite basierend auf dem ausgewählten Straßentyp
  const roadWidth = useMemo(() => {
    if (roadType === "Benutzerdefiniert" && customRoadWidth) {
      return customRoadWidth;
    }
    
    const roadWidths: Record<string, number> = {
      "Autobahn": 25,
      "Bundesstraße": 12,
      "Landstraße": 7.5,
      "Kreisstraße": 6,
      "Gemeindestraße": 5,
    };
    
    return roadWidths[roadType] || 7.5;
  }, [roadType, customRoadWidth]);
  
  // Berechnet die Strecke und Teilstrecken
  const { total, segments } = useMemo(() => {
    return calculateRouteDistances(markers);
  }, [markers]);
  
  // Berechnet die Materialkosten
  const materialCosts = useMemo(() => {
    if (selectedBelastungsklasse === "none" || markers.length < 2) {
      return null;
    }
    
    return calculateMaterialCosts(selectedBelastungsklasse, total, roadWidth);
  }, [selectedBelastungsklasse, total, roadWidth, markers.length]);
  
  // Filtert Baumaschinen nach der ausgewählten Belastungsklasse
  const empfohleneBaumaschinen = useMemo(() => {
    if (selectedBelastungsklasse === "none") return [];
    return baumaschinen.filter(m => m.eignung.includes(selectedBelastungsklasse));
  }, [selectedBelastungsklasse]);
  
  // Funktion: Event-Handler für das Hinzufügen eines Markers
  const handleAddMarker = (lat: number, lng: number) => {
    const newMarker: MarkerInfo = {
      position: [lat, lng],
      belastungsklasse: selectedBelastungsklasse === "none" ? undefined : selectedBelastungsklasse,
    };
    
    setMarkers(prev => [...prev, newMarker]);
    setMapCenterPosition([lat, lng]);
  };
  
  // Funktion: Event-Handler für das Aktualisieren der Position eines Markers
  const handleUpdateMarkerPosition = (index: number, lat: number, lng: number) => {
    setMarkers(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        position: [lat, lng]
      };
      return updated;
    });
  };
  
  // Funktion: Event-Handler für das Löschen eines Markers
  const handleDeleteMarker = (index: number) => {
    setMarkers(prev => prev.filter((_, i) => i !== index));
  };
  
  // Funktion: Event-Handler für das Optimieren der Route
  const handleOptimizeRoute = () => {
    if (markers.length < 3) return;
    
    const optimized = optimizeRouteOrder(markers);
    setMarkers(optimized);
  };
  
  // Funktion: Event-Handler für das Ziehen eines Markers
  const handleMarkerDrag = (e: L.LeafletEvent, index: number) => {
    const latlng = (e.target as L.Marker).getLatLng();
    handleUpdateMarkerPosition(index, latlng.lat, latlng.lng);
  };
  
  // Funktion: Event-Handler für die Änderung der Kartenmitte
  const handleMapMove = (map: L.Map) => {
    const center = map.getCenter();
    setMapCenterPosition([center.lat, center.lng]);
    setMapZoom(map.getZoom());
  };
  
  // Funktion: Event-Handler für die Bearbeitung eines Markers
  const handleEditMarker = (index: number) => {
    setCurrentEditIndex(index);
    setEditMarker({...markers[index]});
  };
  
  // Funktion: Event-Handler für das Schließen des Bearbeitungsdialogs
  const handleCloseEdit = () => {
    setEditMarker(null);
    setCurrentEditIndex(null);
  };
  
  // Funktion: Event-Handler für das Speichern eines bearbeiteten Markers
  const handleSaveMarker = () => {
    if (editMarker && currentEditIndex !== null) {
      setMarkers(prev => {
        const updated = [...prev];
        updated[currentEditIndex] = editMarker;
        return updated;
      });
    }
    handleCloseEdit();
  };
  
  // Funktion: Event-Handler für das Ändern eines Marker-Attributs
  const handleEditMarkerChange = (field: keyof MarkerInfo, value: any) => {
    if (!editMarker) return;
    
    setEditMarker(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        [field]: value
      };
    });
  };
  
  // Funktion: Event-Handler für das Entfernen eines Markers
  const handleRemoveMarker = (index: number) => {
    setMarkers(prev => prev.filter((_, i) => i !== index));
  };
  
  // Funktion: Event-Handler für die Adresssuche
  const handleAddressSearch = async () => {
    if (addressSearch.length < 3) return;
    
    try {
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressSearch)}.json?access_token=${MAPBOX_TOKEN}&country=de&language=de&limit=1`;
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [longitude, latitude] = feature.center;
        
        // Bereite Adressinformationen vor
        const addressParts = feature.place_name.split(',');
        let street = '';
        let houseNumber = '';
        let city = '';
        let postal = '';
        
        // Extrahiere Teile der Adresse
        if (addressParts.length >= 2) {
          const streetPart = addressParts[0].trim();
          
          // Versuche, Straße und Hausnummer zu trennen
          const streetMatch = streetPart.match(/^(.*?)\s+(\d+\w*)$/);
          if (streetMatch) {
            street = streetMatch[1].trim();
            houseNumber = streetMatch[2].trim();
          } else {
            street = streetPart;
          }
          
          // Extrahiere PLZ und Ort
          const cityPart = addressParts[1].trim();
          const postalMatch = cityPart.match(/^(\d{5})\s+(.*)$/);
          if (postalMatch) {
            postal = postalMatch[1].trim();
            city = postalMatch[2].trim();
          } else {
            city = cityPart;
          }
        }
        
        // Erstelle einen neuen Marker mit den Adressinformationen
        const newMarker: MarkerInfo = {
          position: [latitude, longitude],
          belastungsklasse: selectedBelastungsklasse !== "none" ? selectedBelastungsklasse : undefined,
          name: feature.text || addressSearch,
          strasse: street,
          hausnummer: houseNumber,
          plz: postal,
          ort: city
        };
        
        setMarkers(prev => [...prev, newMarker]);
        setMapCenterPosition([latitude, longitude]);
        setAddressSearch("");
      }
    } catch (error) {
      console.error("Fehler bei der Adresssuche:", error);
    }
  };
  
  // Funktion: Event-Handler für den PDF-Export
  const handleExportPDF = async () => {
    if (!mapContainerRef.current || markers.length === 0 || exportingPDF) return;
    
    setExportingPDF(true);
    setExportProgress(10);
    
    try {
      // Erfasse das Datum für den Dateinamen und die Überschrift
      const currentDate = new Date();
      const dateString = currentDate.toLocaleDateString('de-DE');
      const timeString = currentDate.toLocaleTimeString('de-DE');
      const fileName = `Strassenplanung_${currentDate.toISOString().slice(0, 10)}.pdf`;
      
      // Erstelle ein neues PDF (Format A4 Portrait)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // A4 dimensionen in mm
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      
      // Setze die Überschrift
      pdf.setFontSize(18);
      pdf.text('Straßenplanungs-Bericht', margin, margin);
      
      // Füge das Datum hinzu
      pdf.setFontSize(10);
      pdf.text(`Erstellt am: ${dateString} um ${timeString}`, margin, margin + 10);
      
      // Füge die Projektinformationen hinzu
      pdf.setFontSize(12);
      pdf.text(`Belastungsklasse: ${selectedBelastungsklasse}`, margin, margin + 20);
      pdf.text(`Straßentyp: ${roadType}${roadType === "Benutzerdefiniert" ? ` (${customRoadWidth} m)` : ""}`, margin, margin + 26);
      pdf.text(`Straßenbreite: ${roadWidth} m`, margin, margin + 32);
      
      if (markers.length > 1) {
        pdf.text(`Gesamtlänge: ${total.toFixed(2)} km`, margin, margin + 38);
        pdf.text(`Gesamtfläche: ${(total * 1000 * roadWidth).toFixed(2)} m²`, margin, margin + 44);
      }
      
      setExportProgress(30);
      
      // Capture the map
      let mapCanvas;
      try {
        mapCanvas = await html2canvas(mapContainerRef.current.querySelector('.leaflet-container') as HTMLElement, {
          logging: false,
          useCORS: true,
          allowTaint: true,
          scale: 2
        });
      } catch (err) {
        console.error("Error capturing map:", err);
        setExportingPDF(false);
        return;
      }
      
      // Calculate map dimensions, maximizing it while fitting in the page (65% of page height)
      const maxMapHeight = pageHeight * 0.35;
      const mapAspectRatio = mapCanvas.width / mapCanvas.height;
      let mapWidth = contentWidth;
      let mapHeight = mapWidth / mapAspectRatio;
      
      if (mapHeight > maxMapHeight) {
        mapHeight = maxMapHeight;
        mapWidth = mapHeight * mapAspectRatio;
      }
      
      // Center the map on the page
      const mapX = margin + (contentWidth - mapWidth) / 2;
      const mapY = margin + 52;
      
      // Add the map image to the PDF
      const mapImageData = mapCanvas.toDataURL('image/jpeg', 0.9);
      pdf.addImage(mapImageData, 'JPEG', mapX, mapY, mapWidth, mapHeight);
      
      setExportProgress(60);
      
      // Start Y position for the tables (after the map)
      let currentY = mapY + mapHeight + 10;
      
      // Standortdaten in Tabellenform hinzufügen
      if (markers.length > 0) {
        // Tabellentitel
        pdf.setFontSize(12);
        pdf.text('Standorte:', margin, currentY);
        currentY += 6;
        
        // Tabellenkopf
        pdf.setFillColor(230, 230, 230);
        pdf.rect(margin, currentY, contentWidth, 8, 'F');
        pdf.setFontSize(10);
        pdf.text('Nr.', margin + 4, currentY + 5);
        pdf.text('Name', margin + 15, currentY + 5);
        pdf.text('Position', margin + 70, currentY + 5);
        pdf.text('Belastungsklasse', margin + 145, currentY + 5);
        currentY += 8;
        
        // Tabellendaten
        pdf.setFontSize(9);
        for (let i = 0; i < markers.length; i++) {
          const marker = markers[i];
          
          if (currentY > pageHeight - margin) {
            // Neue Seite, wenn die aktuelle Seite voll ist
            pdf.addPage();
            currentY = margin;
            
            // Tabellenkopf auf der neuen Seite wiederholen
            pdf.setFillColor(230, 230, 230);
            pdf.rect(margin, currentY, contentWidth, 8, 'F');
            pdf.setFontSize(10);
            pdf.text('Nr.', margin + 4, currentY + 5);
            pdf.text('Name', margin + 15, currentY + 5);
            pdf.text('Position', margin + 70, currentY + 5);
            pdf.text('Belastungsklasse', margin + 145, currentY + 5);
            currentY += 8;
            pdf.setFontSize(9);
          }
          
          // Zeile mit alternierender Hintergrundfarbe
          if (i % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, currentY, contentWidth, 7, 'F');
          }
          
          pdf.text(`${i + 1}`, margin + 4, currentY + 5);
          pdf.text(marker.name || `Punkt ${i + 1}`, margin + 15, currentY + 5);
          pdf.text(`${marker.position[0].toFixed(5)}, ${marker.position[1].toFixed(5)}`, margin + 70, currentY + 5);
          pdf.text(marker.belastungsklasse || 'Keine', margin + 145, currentY + 5);
          
          currentY += 7;
        }
      }
      
      setExportProgress(75);
      
      // Neue Seite für Materialkosten, wenn nötig
      if (materialCosts && markers.length > 1) {
        if (currentY > pageHeight - margin - 50) {
          pdf.addPage();
          currentY = margin;
        } else {
          currentY += 10;
        }
        
        // Tabellentitel für Materialkosten
        pdf.setFontSize(12);
        pdf.text('Materialkosten:', margin, currentY);
        currentY += 6;
        
        // Tabellenkopf
        pdf.setFillColor(230, 230, 230);
        pdf.rect(margin, currentY, contentWidth, 8, 'F');
        pdf.setFontSize(10);
        pdf.text('Material', margin + 4, currentY + 5);
        pdf.text('Fläche (m²)', margin + 70, currentY + 5);
        pdf.text('Kosten/m²', margin + 110, currentY + 5);
        pdf.text('Gesamtkosten (€)', margin + 150, currentY + 5);
        currentY += 8;
        
        // Tabellendaten
        pdf.setFontSize(9);
        
        // Zeile 1: Asphaltdecke
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, currentY, contentWidth, 7, 'F');
        pdf.text('Asphaltdecke', margin + 4, currentY + 5);
        pdf.text(materialCosts.totalArea.toFixed(2), margin + 70, currentY + 5);
        pdf.text(`${baseMaterialCosts.asphaltdecke.toFixed(2)} €`, margin + 110, currentY + 5);
        pdf.text(`${materialCosts.asphaltdeckeCost.toFixed(2)} €`, margin + 150, currentY + 5);
        currentY += 7;
        
        // Zeile 2: Asphalttragschicht
        pdf.text('Asphalttragschicht', margin + 4, currentY + 5);
        pdf.text(materialCosts.totalArea.toFixed(2), margin + 70, currentY + 5);
        pdf.text(`${baseMaterialCosts.asphalttragschicht.toFixed(2)} €`, margin + 110, currentY + 5);
        pdf.text(`${materialCosts.asphalttragschichtCost.toFixed(2)} €`, margin + 150, currentY + 5);
        currentY += 7;
        
        // Zeile 3: Schottertragschicht (optional)
        if (materialCosts.schottertragschichtCost) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, currentY, contentWidth, 7, 'F');
          pdf.text('Schottertragschicht', margin + 4, currentY + 5);
          pdf.text(materialCosts.totalArea.toFixed(2), margin + 70, currentY + 5);
          pdf.text(`${baseMaterialCosts.schottertragschicht?.toFixed(2) || '0.00'} €`, margin + 110, currentY + 5);
          pdf.text(`${materialCosts.schottertragschichtCost.toFixed(2)} €`, margin + 150, currentY + 5);
          currentY += 7;
        }
        
        // Zeile 4: Frostschutzschicht
        if (materialCosts.schottertragschichtCost) {
          pdf.text('Frostschutzschicht', margin + 4, currentY + 5);
        } else {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, currentY, contentWidth, 7, 'F');
          pdf.text('Frostschutzschicht', margin + 4, currentY + 5);
        }
        pdf.text(materialCosts.totalArea.toFixed(2), margin + 70, currentY + 5);
        pdf.text(`${baseMaterialCosts.frostschutzschicht.toFixed(2)} €`, margin + 110, currentY + 5);
        pdf.text(`${materialCosts.frostschutzschichtCost.toFixed(2)} €`, margin + 150, currentY + 5);
        currentY += 7;
        
        // Zeile 5: Gesamtkosten
        pdf.setFillColor(210, 210, 210);
        pdf.rect(margin, currentY, contentWidth, 7, 'F');
        pdf.setFont("helvetica", "bold");
        pdf.text('Gesamtkosten', margin + 4, currentY + 5);
        pdf.text('', margin + 70, currentY + 5);
        pdf.text('', margin + 110, currentY + 5);
        pdf.text(`${materialCosts.totalCost.toFixed(2)} €`, margin + 150, currentY + 5);
        pdf.setFont("helvetica", "normal");
        currentY += 7;
        
        // Füge eine Fußnote für die Kostenberechnung hinzu
        currentY += 10;
        pdf.setFontSize(8);
        pdf.text('Hinweis: Die Materialkosten sind Schätzungen basierend auf Durchschnittswerten und können je nach Region und Anbieter variieren.', 
                 margin, currentY, { maxWidth: contentWidth });
      }
      
      setExportProgress(90);
      
      // Speichere das PDF
      pdf.save(fileName);
    } catch (error) {
      console.error("Fehler beim PDF-Export:", error);
    } finally {
      setExportingPDF(false);
      setExportProgress(100);
      
      // Zurücksetzen des Fortschritts nach kurzer Verzögerung
      setTimeout(() => {
        setExportProgress(0);
      }, 1500);
    }
  };
  
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
          
          {/* Tabs direkt unter der Hauptüberschrift */}
          <Tabs
            value={bayernTabValue}
            onValueChange={setBayernTabValue as any}
            className="w-full mt-4"
          >
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="strassenplanung">Straßenplanung</TabsTrigger>
              <TabsTrigger value="bayernatlas">BayernAtlas</TabsTrigger>
              <TabsTrigger value="denkmalatlas">DenkmalAtlas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
            {/* Bayern- und DenkmalAtlas-Inhalte */}
            {bayernTabValue === "bayernatlas" && (
              <div className="lg:col-span-3">
                <BayernMaps defaultTab="bayernatlas" />
              </div>
            )}
            
            {bayernTabValue === "denkmalatlas" && (
              <div className="lg:col-span-3">
                <BayernMaps defaultTab="denkmalatlas" />
              </div>
            )}
            
            {/* Straßenplanung-Inhalte */}
            {bayernTabValue === "strassenplanung" && (
              <>
                {/* 1. Adresssuche und Buttons für Marker */}
                <Card className="lg:col-span-3 bg-background shadow border-border/40">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Adresssuche */}
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="address-search">Adresssuche</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="address-search"
                            placeholder="Straße, Hausnummer, PLZ, Ort"
                            value={addressSearch}
                            onChange={(e) => setAddressSearch(e.target.value)}
                          />
                          <Button 
                            variant="secondary"
                            onClick={handleAddressSearch}
                            disabled={addressSearch.length < 3}
                          >
                            Suchen
                          </Button>
                        </div>
                      </div>
                      
                      {/* Aktionsbuttons */}
                      <div className="flex flex-col justify-end gap-2">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={handleOptimizeRoute}
                          disabled={markers.length < 3}
                        >
                          <Route className="h-4 w-4 mr-2" />
                          Route optimieren
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={handleExportPDF}
                          disabled={markers.length === 0 || exportingPDF}
                        >
                          {exportingPDF ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Exportiere... {exportProgress}%
                            </>
                          ) : (
                            <>
                              <FileDown className="h-4 w-4 mr-2" />
                              Als PDF exportieren
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* 2. Straßentyp und Belastungsklasse */}
                <Card className="lg:col-span-3 bg-background shadow border-border/40 mt-4">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Straßentyp */}
                      <div className="space-y-2">
                        <Label htmlFor="strassentyp">Straßentyp</Label>
                        <Select value={roadType} onValueChange={value => setRoadType(value)}>
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
                        
                        {roadType === "Benutzerdefiniert" && (
                          <div className="mt-2">
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
                      </div>
                      
                      {/* Belastungsklasse */}
                      <div className="space-y-2">
                        <Label htmlFor="belastungsklasse">Belastungsklasse</Label>
                        <Select value={selectedBelastungsklasse} onValueChange={value => setSelectedBelastungsklasse(value)}>
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
                        
                        {selectedBelastungsklasse !== "none" && (
                          <div className="mt-4 space-y-4 border p-4 rounded-md bg-muted/50">
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* 3. Karte mit Markern */}
                <Card className="lg:col-span-3 bg-background shadow border-border/40 mt-4">
                  <CardContent className="p-0 h-[600px] relative" ref={mapContainerRef}>
                    <MapContainer 
                      center={mapCenterPosition} 
                      zoom={mapZoom} 
                      className="h-full w-full rounded-md z-0"
                      ref={mapRef as any}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      <MapClicker 
                        onMarkerAdd={handleAddMarker}
                        selectedBelastungsklasse={selectedBelastungsklasse}
                      />
                      
                      <MapEvents onMoveEnd={handleMapMove} />
                      
                      {/* Marker anzeigen */}
                      {markers.map((marker, index) => (
                        <Marker 
                          key={`marker-${index}`}
                          position={marker.position}
                          icon={createCustomIcon(marker.belastungsklasse)}
                          draggable={true}
                          eventHandlers={{
                            dragend: (e) => handleMarkerDrag(e, index),
                          }}
                        >
                          <Popup>
                            <div className="p-1 max-w-[250px]">
                              <h3 className="font-medium text-sm">
                                {marker.name || `Marker ${index + 1}`}
                              </h3>
                              
                              {marker.belastungsklasse && marker.belastungsklasse !== "none" && (
                                <p className="text-xs">
                                  Belastungsklasse: <span className="font-semibold">{marker.belastungsklasse}</span>
                                </p>
                              )}
                              
                              {marker.strasse && (
                                <p className="text-xs">
                                  Adresse: {marker.strasse} {marker.hausnummer || ""}, 
                                  {marker.plz || ""} {marker.ort || ""}
                                </p>
                              )}
                              
                              {marker.notes && <p className="text-xs mt-1">{marker.notes}</p>}
                              
                              <div className="flex justify-between mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-xs"
                                  onClick={() => handleEditMarker(index)}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Bearbeiten
                                </Button>
                                
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleRemoveMarker(index)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Entfernen
                                </Button>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                      
                      {/* Verbindungslinien zeichnen, wenn mehr als ein Marker vorhanden ist */}
                      {markers.length > 1 && (
                        <Polyline
                          positions={markers.map(m => m.position)}
                          color="blue"
                          weight={4}
                          opacity={0.7}
                          dashArray="10,5"
                        />
                      )}
                    </MapContainer>
                  </CardContent>
                </Card>
                
                {/* 4. Zusammenfassung (Streckeninformationen und Baumaschinen) */}
                <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  {/* Streckeninformationen */}
                  <Card className="bg-background shadow border-border/40">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        Streckeninformationen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {markers.length > 0 ? (
                        <div className="space-y-4">
                          {/* Basisdaten */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium">Standorte</h3>
                              <p className="text-2xl font-bold">{markers.length}</p>
                            </div>
                            
                            {markers.length > 1 && (
                              <div>
                                <h3 className="text-sm font-medium">Gesamtstrecke</h3>
                                <p className="text-2xl font-bold">{total.toFixed(2)} km</p>
                              </div>
                            )}
                          </div>
                          
                          {markers.length > 1 && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h3 className="text-sm font-medium">Fläche</h3>
                                <p className="text-2xl font-bold">{(total * 1000 * roadWidth).toFixed(0)} m²</p>
                              </div>
                              
                              <div>
                                <h3 className="text-sm font-medium">Straßenbreite</h3>
                                <p className="text-2xl font-bold">{roadWidth.toFixed(1)} m</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Materialkosten, wenn vorhanden */}
                          {materialCosts && markers.length > 1 && (
                            <>
                              <Separator />
                              
                              <div>
                                <h3 className="text-sm font-medium">Materialkosten</h3>
                                <p className="text-2xl font-bold">{materialCosts.totalCost.toFixed(2)} €</p>
                                
                                <div className="text-sm mt-2 space-y-1">
                                  <div className="flex justify-between">
                                    <span>Asphaltdecke:</span>
                                    <span>{materialCosts.asphaltdeckeCost.toFixed(2)} €</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Asphalttragschicht:</span>
                                    <span>{materialCosts.asphalttragschichtCost.toFixed(2)} €</span>
                                  </div>
                                  {materialCosts.schottertragschichtCost !== undefined && (
                                    <div className="flex justify-between">
                                      <span>Schottertragschicht:</span>
                                      <span>{materialCosts.schottertragschichtCost.toFixed(2)} €</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span>Frostschutzschicht:</span>
                                    <span>{materialCosts.frostschutzschichtCost.toFixed(2)} €</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                          
                          {/* Standortliste, wenn mehr als 2 Marker */}
                          {markers.length > 2 && (
                            <>
                              <Separator />
                              
                              <div>
                                <h3 className="text-sm font-medium mb-2">Standortliste</h3>
                                <div className="max-h-[200px] overflow-y-auto border rounded-md divide-y">
                                  {markers.map((marker, index) => (
                                    <div key={index} className="p-2 text-sm">
                                      <div className="font-medium">{marker.name || `Punkt ${index + 1}`}</div>
                                      {marker.belastungsklasse && marker.belastungsklasse !== "none" && (
                                        <div className="text-xs">
                                          <Badge variant="outline" className="mt-1">
                                            {marker.belastungsklasse}
                                          </Badge>
                                        </div>
                                      )}
                                      {marker.strasse && (
                                        <div className="text-xs mt-1">
                                          {marker.strasse} {marker.hausnummer || ""},&nbsp;
                                          {marker.plz || ""} {marker.ort || ""}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
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
                  
                  {/* Empfohlene Baumaschinen */}
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
                            <div className="grid grid-cols-1 gap-4">
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
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
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
              
              <div className="space-y-2">
                <Label htmlFor="marker-belastungsklasse">Belastungsklasse</Label>
                <Select 
                  value={editMarker.belastungsklasse || "none"} 
                  onValueChange={(value) => handleEditMarkerChange('belastungsklasse', value === "none" ? undefined : value)}
                >
                  <SelectTrigger id="marker-belastungsklasse">
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
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="marker-strasse">Straße</Label>
                <Input
                  id="marker-strasse"
                  value={editMarker.strasse || ''}
                  onChange={(e) => handleEditMarkerChange('strasse', e.target.value)}
                  placeholder="Straßenname"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marker-hausnummer">Hausnummer</Label>
                  <Input
                    id="marker-hausnummer"
                    value={editMarker.hausnummer || ''}
                    onChange={(e) => handleEditMarkerChange('hausnummer', e.target.value)}
                    placeholder="Nr."
                  />
                </div>
                
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
                <Label htmlFor="marker-notes">Notizen</Label>
                <Input
                  id="marker-notes"
                  value={editMarker.notes || ''}
                  onChange={(e) => handleEditMarkerChange('notes', e.target.value)}
                  placeholder="Zusätzliche Informationen"
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-4 pt-0">
              <Button variant="outline" onClick={handleCloseEdit}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveMarker}>
                Speichern
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GeoMapPage;