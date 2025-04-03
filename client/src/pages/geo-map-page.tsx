import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SpeechToText } from "@/components/ui/speech-to-text";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Map as MapIcon, FileText, ExternalLink, Info, ArrowLeft, MapPin, Ruler, 
         Layers, Search, ChevronDown, Camera, Upload, Image } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
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

// Hilfsfunktion zum Abrufen von Belastungsklasse-Informationen
function getKlasseInfo(klasseId: string): BelastungsklasseInfo | undefined {
  return belastungsklassen.find(k => k.klasse === klasseId);
}

// Berechnet Materialkosten für eine Straße basierend auf:
// - Belastungsklasse (bestimmt Materialstärke und Qualität)
// - Streckenlänge in km
// - Straßenbreite in Metern
function calculateMaterialCosts(
  belastungsklasse: string,
  distanceKm: number,
  roadWidthMeters: number
): {
  totalCost: number;
  costBreakdown: {
    asphaltdecke: number;
    asphalttragschicht: number;
    frostschutzschicht: number;
    schottertragschicht?: number;
  };
  areaSquareMeters: number;
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
  
  // Kostenfaktor basierend auf der Belastungsklasse
  const costFactor = belastungsklassenCostFactors[belastungsklasse] || belastungsklassenCostFactors.default;
  
  // Fläche in Quadratmetern
  const areaSquareMeters = distanceKm * 1000 * roadWidthMeters;
  
  // Materialkosten pro Schicht
  const asphaltdeckeKosten = areaSquareMeters * asphaltdeckeDicke * baseMaterialCosts.asphaltdecke * costFactor;
  const asphalttragschichtKosten = areaSquareMeters * asphalttragschichtDicke * baseMaterialCosts.asphalttragschicht * costFactor;
  const frostschutzschichtKosten = areaSquareMeters * frostschutzDicke * baseMaterialCosts.frostschutzschicht * costFactor;
  
  let schottertragschichtKosten = 0;
  if (schottertragschichtDicke > 0 && baseMaterialCosts.schottertragschicht) {
    schottertragschichtKosten = areaSquareMeters * schottertragschichtDicke * baseMaterialCosts.schottertragschicht * costFactor;
  }
  
  // Gesamtkosten
  const totalCost = asphaltdeckeKosten + asphalttragschichtKosten + frostschutzschichtKosten + schottertragschichtKosten;
  
  // Kostenzusammenfassung
  const costBreakdown: {
    asphaltdecke: number;
    asphalttragschicht: number;
    frostschutzschicht: number;
    schottertragschicht?: number;
  } = {
    asphaltdecke: Math.round(asphaltdeckeKosten),
    asphalttragschicht: Math.round(asphalttragschichtKosten),
    frostschutzschicht: Math.round(frostschutzschichtKosten)
  };
  
  if (schottertragschichtDicke > 0) {
    costBreakdown.schottertragschicht = Math.round(schottertragschichtKosten);
  }
  
  return {
    totalCost: Math.round(totalCost),
    costBreakdown,
    areaSquareMeters: Math.round(areaSquareMeters)
  };
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
  const [strasse, setStrasse] = useState("");
  const [hausnummer, setHausnummer] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBelastungsklasse, setSelectedBelastungsklasse] = useState<string>("");
  const [mapSource, setMapSource] = useState<string>("bgr");
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [roadWidth, setRoadWidth] = useState<number>(6.5); // Standard Landstraße als Standard
  const [selectedRoadPreset, setSelectedRoadPreset] = useState<string>("Landstraße");
  const [showCostEstimation, setShowCostEstimation] = useState<boolean>(false);
  const [showNewMarkerDialog, setShowNewMarkerDialog] = useState(false);
  const [newMarkerPosition, setNewMarkerPosition] = useState<[number, number] | null>(null);
  const [searchAddress, setSearchAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMapProvider, setSelectedMapProvider] = useState("osm");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{
    display_name: string;
    lat: string;
    lon: string;
    address?: {
      road?: string;
      pedestrian?: string;
      street?: string;
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
    };
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapRef = useRef<any>(null);
  const [, navigate] = useLocation();

  const handleSave = () => {
    setIsSaving(true);
    
    // Marker aktualisieren, wenn einer ausgewählt ist
    if (selectedMarkerIndex !== null) {
      updateMarker(selectedMarkerIndex, {
        name: selectedLocation,
        strasse: strasse,
        hausnummer: hausnummer,
        plz: plz,
        ort: ort,
        notes: notes,
        belastungsklasse: selectedBelastungsklasse
      });
    }
    
    setTimeout(() => {
      setIsSaving(false);
      alert("Standortinformationen gespeichert!");
    }, 1000);
  };
  
  // Adresse anhand der Koordinaten ermitteln (Reverse Geocoding mit OpenStreetMap)
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      
      if (data && data.address) {
        // Straßennamen und Hausnummer aus den OSM-Daten extrahieren
        const street = data.address.road || data.address.pedestrian || data.address.street || data.address.path || "";
        const houseNumber = data.address.house_number || "";
        const postalCode = data.address.postcode || "";
        const city = data.address.city || data.address.town || data.address.village || data.address.municipality || "";
        
        setStrasse(street);
        setHausnummer(houseNumber);
        setPlz(postalCode);
        setOrt(city);
        
        return { 
          street, 
          houseNumber,
          postalCode,
          city
        };
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Adressdaten:", error);
    }
    return { 
      street: "", 
      houseNumber: "",
      postalCode: "",
      city: "" 
    };
  };
  
  // Oberflächenanalyse für einen Marker durchführen
  const analyzeSurface = useCallback(async (index: number, file: File) => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setUploadProgress(0);
    setAnalyzeError(null);
    
    try {
      // Formular für den Upload vorbereiten
      const formData = new FormData();
      formData.append('image', file);
      
      // Fortschritts-Tracking für den Upload
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/map-surface-analysis', true);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };
      
      // Promise für XHR-Request erstellen
      const result = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Fehler beim Parsen der Antwort'));
            }
          } else {
            reject(new Error(`Server-Fehler: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Netzwerkfehler bei der Übertragung'));
        xhr.send(formData);
      });
      
      // Aktuelle Zeit für Zeitstempel
      const now = Date.now();
      
      // Marker mit den Analyseergebnissen aktualisieren
      updateMarker(index, {
        surfaceAnalysis: {
          imageUrl: result.imageUrl,
          belastungsklasse: result.belastungsklasse,
          asphalttyp: result.asphalttyp,
          confidence: result.confidence,
          analyseDetails: `${result.belastungsklasseDetails?.beanspruchung}, ${result.asphaltTypDetails?.beschreibung || ''}`,
          visualizationUrl: result.visualizationUrl,
          timestamp: now
        }
      });
      
      // Basierend auf der Analyse auch die Belastungsklasse des Markers aktualisieren
      if (result.belastungsklasse) {
        updateMarker(index, { belastungsklasse: result.belastungsklasse });
      }
      
      return result;
    } catch (error) {
      console.error('Fehler bei der Oberflächenanalyse:', error);
      setAnalyzeError(error instanceof Error ? error.message : 'Unbekannter Fehler bei der Analyse');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);
  
  // Straßensuche mit Autovervollständigung
  const getSuggestions = async (query: string) => {
    if (!query || query.trim().length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      // Die Nominatim API unterstützt keine "autocomplete" Suche direkt, aber wir können nach Straßen filtern
      // und mehrere Ergebnisse zeigen (countrycodes=de für Deutschland, limit=5 für maximal 5 Vorschläge)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=de&limit=5&addressdetails=1`);
      const data = await response.json();
      
      // Ergebnisse filtern, die Straßen enthalten
      const filteredData = data.filter((item: any) => 
        item.address && (item.address.road || item.address.pedestrian || item.address.street)
      );
      
      setAddressSuggestions(filteredData);
      setShowSuggestions(filteredData.length > 0);
    } catch (error) {
      console.error("Fehler beim Laden der Adressvorschläge:", error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Verzögerte Suche implementieren, um die API nicht bei jedem Tastendruck aufzurufen
  useEffect(() => {
    const timer = setTimeout(() => {
      getSuggestions(searchAddress);
    }, 300); // 300ms Verzögerung

    return () => clearTimeout(timer);
  }, [searchAddress]);

  // Adresse suchen und auf der Karte anzeigen
  const searchForAddress = async (selectedAddress?: string, selectedLat?: string, selectedLon?: string) => {
    // Wenn explizit ein Wert übergeben wurde, diesen verwenden, ansonsten die Sucheingabe
    const searchTerm = selectedAddress || searchAddress;
    
    if (!searchTerm || searchTerm.trim() === "" || !mapRef.current) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    
    try {
      // Wenn Koordinaten übergeben wurden, diese direkt verwenden
      if (selectedLat && selectedLon) {
        const lat = parseFloat(selectedLat);
        const lng = parseFloat(selectedLon);
        
        // Karte auf die gefundene Adresse zentrieren
        mapRef.current.setView([lat, lng], 16);
        
        // Marker setzen
        addMarker(lat, lng);
      } else {
        // Sonst über die API suchen
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          
          // Karte auf die gefundene Adresse zentrieren
          mapRef.current.setView([lat, lng], 16);
          
          // Marker setzen
          addMarker(lat, lng);
        } else {
          alert("Keine Ergebnisse für diese Adresssuche gefunden.");
        }
      }
    } catch (error) {
      console.error("Fehler bei der Adresssuche:", error);
      alert("Fehler bei der Adresssuche. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSearching(false);
    }
  };

  // Beim Klick auf die Karte wird diese Funktion aufgerufen
  const addMarker = async (lat: number, lng: number) => {
    // Speichere die Position und zeige den Dialog an
    setNewMarkerPosition([lat, lng]);
    setShowNewMarkerDialog(true);
    
    // Versuche, die Adresse automatisch zu ermitteln
    await getAddressFromCoordinates(lat, lng);
  };
  
  // Bestätigung zum Hinzufügen eines Markers
  const confirmAddMarker = () => {
    if (!newMarkerPosition) return;
    
    const newMarker: MarkerInfo = {
      position: newMarkerPosition,
      belastungsklasse: selectedBelastungsklasse || undefined,
      name: selectedLocation || `Standort #${markers.length + 1}`,
      strasse: strasse || undefined,
      hausnummer: hausnummer || undefined,
      plz: plz || undefined,
      ort: ort || undefined,
      notes: notes || undefined
    };
    
    setMarkers(prev => [...prev, newMarker]);
    setShowNewMarkerDialog(false);
    setNewMarkerPosition(null);
    
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
              <div className="flex p-4 border rounded-md bg-card">
                <div>
                  <h3 className="text-base font-semibold mb-1">BGR Geoportal</h3>
                  <p className="text-xs text-muted-foreground mb-2">Geoportal der Bundesanstalt für Geowissenschaften und Rohstoffe</p>
                  <div className="flex items-center gap-2 text-xs">
                    <MapIcon className="h-4 w-4 text-primary" />
                    <span>Geologische Karten und Bodenkarten für Deutschland</span>
                  </div>
                  <Button 
                    variant="default"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open("https://geoportal.bgr.de/mapapps/resources/apps/geoportal/index.html?lang=de#/geoviewer", "_blank")}
                  >
                    BGR Geoportal öffnen 
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex p-4 border rounded-md bg-card">
                <div>
                  <h3 className="text-base font-semibold mb-1">BASt GIS-Viewer</h3>
                  <p className="text-xs text-muted-foreground mb-2">GIS-System der Bundesanstalt für Straßenwesen</p>
                  <div className="flex items-center gap-2 text-xs">
                    <MapIcon className="h-4 w-4 text-primary" />
                    <span>Straßeninformationen, Bauprojekte und Verkehrsdaten</span>
                  </div>
                  <Button 
                    variant="default"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open("https://www.bast.de", "_blank")}
                  >
                    BASt Website öffnen
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Interaktive Kartenansicht</CardTitle>
                <CardDescription>
                  Karte zur Visualisierung von Projektstandorten
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full overflow-hidden border rounded-md">
                    <div className="px-3 py-2 bg-muted/50 border-b flex items-center">
                      <div className="flex-1 flex gap-2 items-center">
                        <div className="relative flex-1">
                          <Input 
                            placeholder="Adresse suchen..." 
                            className="h-8 text-xs pr-8"
                            value={searchAddress}
                            onChange={(e) => setSearchAddress(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchForAddress()}
                            onBlur={() => {
                              // Verzögerung beim Ausblenden, damit man noch klicken kann
                              setTimeout(() => setShowSuggestions(false), 150);
                            }}
                            onFocus={() => {
                              if (addressSuggestions.length > 0) {
                                setShowSuggestions(true);
                              }
                            }}
                          />
                          
                          {/* Dropdown für Vorschläge */}
                          {showSuggestions && addressSuggestions.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                              <ul className="py-1 max-h-60 overflow-auto">
                                {addressSuggestions.map((suggestion, index) => {
                                  // Extrahiere die Stadt und Straße für eine besser lesbare Anzeige
                                  const address = suggestion.address || {};
                                  const street = address.road || address.pedestrian || address.street || '';
                                  const city = address.city || address.town || address.village || address.municipality || '';
                                  const displayStr = street ? `${street}, ${city}` : suggestion.display_name;
                                  
                                  return (
                                    <li 
                                      key={index} 
                                      className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100"
                                      onClick={() => {
                                        setSearchAddress(displayStr);
                                        setShowSuggestions(false);
                                        searchForAddress(displayStr, suggestion.lat, suggestion.lon);
                                      }}
                                    >
                                      {displayStr}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          className="h-8"
                          disabled={isSearching || !searchAddress}
                          onClick={() => searchForAddress()} 
                          type="button"
                        >
                          {isSearching ? "Suche..." : "Suchen"}
                          <Search className="ml-2 h-3 w-3" />
                        </Button>
                      </div>
                      <div className="ml-2 flex">
                        <div className="border rounded-md p-1 flex items-center text-xs">
                          <div className="flex items-center mr-2">
                            <Layers className="h-4 w-4 mr-1" />
                            <span>Kartenebene:</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant={selectedMapProvider === "osm" ? "default" : "outline"}
                              className="h-7 px-2 py-1 text-xs"
                              onClick={() => setSelectedMapProvider("osm")}
                            >
                              OSM
                            </Button>
                            <Button 
                              variant={selectedMapProvider === "satellit" ? "default" : "outline"}
                              className="h-7 px-2 py-1 text-xs"
                              onClick={() => setSelectedMapProvider("satellit")}
                            >
                              Satellit
                            </Button>
                            <Button 
                              variant={selectedMapProvider === "topo" ? "default" : "outline"}
                              className="h-7 px-2 py-1 text-xs"
                              onClick={() => setSelectedMapProvider("topo")}
                            >
                              Topo
                            </Button>
                            <Button 
                              variant={selectedMapProvider === "cyclemap" ? "default" : "outline"}
                              className="h-7 px-2 py-1 text-xs"
                              onClick={() => setSelectedMapProvider("cyclemap")}
                            >
                              Cycle
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  
                  <MapContainer 
                    center={[51.1657, 10.4515]} 
                    zoom={6} 
                    style={{ height: '500px', width: '100%' }}
                    ref={mapRef}
                  >
                    {/* Karten-Tiles basierend auf ausgewähltem Provider */}
                    {selectedMapProvider === "osm" && (
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                    )}
                    {selectedMapProvider === "satellit" && (
                      <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='&copy; <a href="https://www.esri.com">Esri</a>'
                      />
                    )}
                    {selectedMapProvider === "topo" && (
                      <TileLayer
                        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
                        maxZoom={17}
                      />
                    )}
                    {selectedMapProvider === "cyclemap" && (
                      <TileLayer
                        url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        maxZoom={19}
                      />
                    )}
                    
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
                            
                            {/* Adresse prominent anzeigen */}
                            {(marker.strasse || marker.hausnummer || marker.plz || marker.ort) && (
                              <div className="mt-1 text-sm text-primary">
                                <span className="font-medium">Adresse: </span>
                                {marker.strasse}{marker.strasse && marker.hausnummer ? " " : ""}{marker.hausnummer}
                                {(marker.strasse || marker.hausnummer) && (marker.plz || marker.ort) ? ", " : ""}
                                {marker.plz}{marker.plz && marker.ort ? " " : ""}{marker.ort}
                              </div>
                            )}
                            
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
                            {index > 0 && (
                              <div className="mt-2 text-xs">
                                <div className="font-medium flex items-center gap-1">
                                  <Ruler className="h-3 w-3" /> 
                                  Entfernung vom vorherigen Punkt:
                                </div>
                                <p className="text-primary">
                                  {calculateDistance(
                                    markers[index-1].position[0],
                                    markers[index-1].position[1],
                                    marker.position[0],
                                    marker.position[1]
                                  ).toFixed(2)} km
                                </p>
                              </div>
                            )}
                            {selectedMarkerIndex === index ? (
                              <div className="mt-3 space-y-3">
                                <div className="border p-2 rounded-md bg-muted/30">
                                  <div className="text-xs font-medium mb-2">Standort bearbeiten</div>
                                  <div className="space-y-2">
                                    <div>
                                      <Label htmlFor={`popup-strasse-${index}`} className="text-xs">Straße</Label>
                                      <Input 
                                        id={`popup-strasse-${index}`}
                                        placeholder="Straße eingeben" 
                                        className="h-7 text-xs"
                                        value={strasse}
                                        onChange={(e) => setStrasse(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`popup-hausnummer-${index}`} className="text-xs">Hausnummer</Label>
                                      <Input 
                                        id={`popup-hausnummer-${index}`}
                                        placeholder="Hausnummer eingeben" 
                                        className="h-7 text-xs"
                                        value={hausnummer}
                                        onChange={(e) => setHausnummer(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`popup-plz-${index}`} className="text-xs">PLZ</Label>
                                      <Input 
                                        id={`popup-plz-${index}`}
                                        placeholder="Postleitzahl eingeben" 
                                        className="h-7 text-xs"
                                        value={plz}
                                        onChange={(e) => setPlz(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`popup-ort-${index}`} className="text-xs">Ort</Label>
                                      <Input 
                                        id={`popup-ort-${index}`}
                                        placeholder="Ort eingeben" 
                                        className="h-7 text-xs"
                                        value={ort}
                                        onChange={(e) => setOrt(e.target.value)}
                                      />
                                    </div>
                                    <div className="flex justify-between pt-1">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                          setSelectedMarkerIndex(null);
                                        }}
                                      >
                                        Abbrechen
                                      </Button>
                                      <Button 
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                          updateMarker(index, {
                                            strasse: strasse,
                                            hausnummer: hausnummer,
                                            plz: plz,
                                            ort: ort
                                          });
                                          setSelectedMarkerIndex(null);
                                        }}
                                      >
                                        Speichern
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {marker.surfaceAnalysis && (
                                  <div className="mt-3 mb-1">
                                    <Separator className="my-2" />
                                    <div className="text-xs font-medium mb-1">Oberflächenanalyse</div>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Aufnahme</div>
                                        <a href={marker.surfaceAnalysis.imageUrl} target="_blank" rel="noopener noreferrer">
                                          <div className="aspect-video bg-muted rounded-md overflow-hidden">
                                            <img 
                                              src={marker.surfaceAnalysis.imageUrl} 
                                              alt="Oberflächenaufnahme"
                                              className="w-full h-full object-cover" 
                                            />
                                          </div>
                                        </a>
                                        <div className="text-[10px] text-muted-foreground mt-1">
                                          {new Date(marker.surfaceAnalysis.timestamp || Date.now()).toLocaleString('de-DE')}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">RStO-Visualisierung</div>
                                        <a href={marker.surfaceAnalysis.visualizationUrl} target="_blank" rel="noopener noreferrer">
                                          <div className="aspect-video bg-muted rounded-md overflow-hidden">
                                            <img 
                                              src={marker.surfaceAnalysis.visualizationUrl} 
                                              alt="RStO Visualisierung"
                                              className="w-full h-full object-cover" 
                                            />
                                          </div>
                                        </a>
                                        <div className="text-xs font-medium text-primary mt-1">
                                          {marker.surfaceAnalysis.belastungsklasse} ({marker.surfaceAnalysis.confidence?.toFixed(0)}%)
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="text-xs mt-1">
                                      <span className="font-medium">Asphalttyp:</span> {marker.surfaceAnalysis.asphalttyp}
                                    </div>
                                    {marker.surfaceAnalysis.analyseDetails && (
                                      <div className="text-xs mt-0.5">
                                        <span className="font-medium">Details:</span> {marker.surfaceAnalysis.analyseDetails}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <div className="mt-3 space-y-2">
                                  <div className="flex justify-between">
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedMarkerIndex(index);
                                          setSelectedLocation(marker.name || "");
                                          setStrasse(marker.strasse || "");
                                          setHausnummer(marker.hausnummer || "");
                                          setPlz(marker.plz || "");
                                          setOrt(marker.ort || "");
                                          setNotes(marker.notes || "");
                                          setSelectedBelastungsklasse(marker.belastungsklasse || "");
                                        }}
                                      >
                                        Bearbeiten
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        title="Adresse automatisch ermitteln"
                                        onClick={async () => {
                                          const { street, houseNumber, postalCode, city } = await getAddressFromCoordinates(
                                            marker.position[0],
                                            marker.position[1]
                                          );
                                          updateMarker(index, {
                                            strasse: street,
                                            hausnummer: houseNumber,
                                            plz: postalCode,
                                            ort: city
                                          });
                                        }}
                                      >
                                        <MapPin className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-destructive"
                                      onClick={() => deleteMarker(index)}
                                    >
                                      Entfernen
                                    </Button>
                                  </div>
                                
                                  {/* Bildupload für Oberflächenanalyse */}
                                  <div className="pt-1">
                                    {isAnalyzing ? (
                                      <div className="space-y-2">
                                        <div className="text-xs text-center">Oberfläche wird analysiert...</div>
                                        <Progress value={uploadProgress} className="h-2" />
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <div className="bg-muted/50 p-2 rounded-md text-xs">
                                          <div className="font-medium mb-1 text-primary">Straßenoberfläche analysieren</div>
                                          <p>Laden Sie ein Foto der Straßenoberfläche hoch, um die Belastungsklasse (RStO) automatisch zu bestimmen.</p>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="default"
                                            size="sm"
                                            className="w-full flex gap-1"
                                            onClick={() => {
                                              // Erstelle ein unsichtbares Datei-Input-Element
                                              const input = document.createElement('input');
                                              input.type = 'file';
                                              input.accept = 'image/*';
                                              input.style.display = 'none';
                                              
                                              // Füge das Element zum DOM hinzu
                                              document.body.appendChild(input);
                                              
                                              // Überwache Dateiauswahl
                                              input.onchange = async (e) => {
                                                const file = (e.target as HTMLInputElement).files?.[0];
                                                if (file) {
                                                  await analyzeSurface(index, file);
                                                }
                                                // Entferne das Element wieder
                                                input.remove();
                                              };
                                              
                                              // Klicke auf das Input-Element, um den Datei-Dialog zu öffnen
                                              input.click();
                                            }}
                                          >
                                            <Camera className="h-4 w-4" />
                                            <span>Foto hochladen & analysieren</span>
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {analyzeError && (
                                      <div className="text-xs text-destructive mt-1">
                                        Fehler: {analyzeError}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    
                    {/* Polyline für die Strecke zwischen den Markern */}
                    {markers.length > 1 && (
                      <Polyline
                        positions={markers.map(marker => marker.position)}
                        color="#3366ff"
                        weight={3}
                        opacity={0.7}
                        dashArray="5, 10"
                      >
                        <LeafletTooltip sticky>
                          <div className="p-1 text-xs">
                            <strong>Gesamtdistanz:</strong> {calculateRouteDistances(markers).total} km
                          </div>
                        </LeafletTooltip>
                      </Polyline>
                    )}
                    
                    {/* Temporärer Marker für die Adresseingabe */}
                    {showNewMarkerDialog && newMarkerPosition && (
                      <Marker
                        position={newMarkerPosition}
                        icon={createCustomIcon(selectedBelastungsklasse)}
                      >
                        <Popup closeButton={false} autoClose={false} autoPan closeOnClick={false}>
                          <div className="p-2">
                            <h3 className="font-medium">Neuer Standort</h3>
                            <div className="mt-3 space-y-3">
                              <div className="border p-2 rounded-md bg-muted/30">
                                <div className="flex justify-between items-center">
                                  <div className="text-xs font-medium">Adressinformationen eingeben</div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    title="Adresse automatisch ermitteln"
                                    onClick={async () => {
                                      if (!newMarkerPosition) return;
                                      const { street, houseNumber, postalCode, city } = await getAddressFromCoordinates(
                                        newMarkerPosition[0],
                                        newMarkerPosition[1]
                                      );
                                      setStrasse(street);
                                      setHausnummer(houseNumber);
                                      setPlz(postalCode);
                                      setOrt(city);
                                    }}
                                  >
                                    <MapPin className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <Label htmlFor="popup-new-strasse" className="text-xs">Straße</Label>
                                    <Input 
                                      id="popup-new-strasse"
                                      placeholder="Straße eingeben" 
                                      className="h-7 text-xs"
                                      value={strasse}
                                      onChange={(e) => setStrasse(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="popup-new-hausnummer" className="text-xs">Hausnummer</Label>
                                    <Input 
                                      id="popup-new-hausnummer"
                                      placeholder="Hausnummer eingeben" 
                                      className="h-7 text-xs"
                                      value={hausnummer}
                                      onChange={(e) => setHausnummer(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="popup-new-plz" className="text-xs">PLZ</Label>
                                    <Input 
                                      id="popup-new-plz"
                                      placeholder="Postleitzahl eingeben" 
                                      className="h-7 text-xs"
                                      value={plz}
                                      onChange={(e) => setPlz(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="popup-new-ort" className="text-xs">Ort</Label>
                                    <Input 
                                      id="popup-new-ort"
                                      placeholder="Ort eingeben" 
                                      className="h-7 text-xs"
                                      value={ort}
                                      onChange={(e) => setOrt(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex justify-between pt-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        setShowNewMarkerDialog(false);
                                        setNewMarkerPosition(null);
                                      }}
                                    >
                                      Abbrechen
                                    </Button>
                                    <Button 
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={confirmAddMarker}
                                    >
                                      Marker hinzufügen
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* Komponente zum Erfassen von Klicks auf der Karte */}
                    <MapClicker onMarkerAdd={addMarker} selectedBelastungsklasse={selectedBelastungsklasse} />
                  </MapContainer>
                </div>
                <div className="p-4 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium">
                      {markers.length} Standort(e) markiert
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => markers.length >= 3 && setMarkers(optimizeRouteOrder(markers))}
                        disabled={markers.length < 3}
                        className="flex items-center"
                      >
                        <Ruler className="h-3 w-3 mr-1" />
                        Route optimieren
                      </Button>
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
                  
                  {/* Entfernungsmessung */}
                  {markers.length >= 2 && (
                    <div className="mb-4 rounded-md border overflow-hidden">
                      <div className="bg-muted/50 px-3 py-1.5 text-xs font-medium flex items-center">
                        <Ruler className="h-3 w-3 mr-1" /> Entfernungsmessung
                      </div>
                      <div className="p-3">
                        <div className="mb-2">
                          <div className="text-sm font-semibold flex items-center">
                            <span>Gesamtstrecke: </span>
                            <span className="ml-2 text-primary">{calculateRouteDistances(markers).total.toFixed(2)} km</span>
                          </div>
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="font-medium">Teilstrecken:</div>
                          <div className="grid grid-cols-1 gap-1">
                            {calculateRouteDistances(markers).segments.map((distance, idx) => (
                              <div key={idx} className="space-y-1 mb-2">
                                <div className="flex justify-between items-center">
                                  <span>Von {markers[idx].name || `Standort #${idx + 1}`} nach {markers[idx+1].name || `Standort #${idx + 2}`}:</span>
                                  <span className="font-medium">{distance.toFixed(2)} km</span>
                                </div>
                                {(markers[idx].strasse || markers[idx+1].strasse || markers[idx].plz || markers[idx+1].plz || markers[idx].ort || markers[idx+1].ort) && (
                                  <div className="text-[10px] text-muted-foreground">
                                    {(markers[idx].strasse || markers[idx].hausnummer || markers[idx].plz || markers[idx].ort) && (
                                      <div>
                                        <span className="font-medium">Standort {idx + 1}:</span> 
                                        {markers[idx].strasse}{markers[idx].strasse && markers[idx].hausnummer ? " " : ""}{markers[idx].hausnummer || ""}
                                        {(markers[idx].strasse || markers[idx].hausnummer) && (markers[idx].plz || markers[idx].ort) ? ", " : ""}
                                        {markers[idx].plz}{markers[idx].plz && markers[idx].ort ? " " : ""}{markers[idx].ort || ""}
                                      </div>
                                    )}
                                    {(markers[idx+1].strasse || markers[idx+1].hausnummer || markers[idx+1].plz || markers[idx+1].ort) && (
                                      <div>
                                        <span className="font-medium">Standort {idx + 2}:</span> 
                                        {markers[idx+1].strasse}{markers[idx+1].strasse && markers[idx+1].hausnummer ? " " : ""}{markers[idx+1].hausnummer || ""}
                                        {(markers[idx+1].strasse || markers[idx+1].hausnummer) && (markers[idx+1].plz || markers[idx+1].ort) ? ", " : ""}
                                        {markers[idx+1].plz}{markers[idx+1].plz && markers[idx+1].ort ? " " : ""}{markers[idx+1].ort || ""}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Marker-Farblegende */}
                  <div className="mb-4 rounded-md border overflow-hidden">
                    <div className="bg-muted/50 px-3 py-1.5 text-xs font-medium">
                      Legende - Belastungsklassen Farbkodierung
                    </div>
                    <div className="p-3 space-y-2 text-xs">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(belastungsklassenColors).filter(([key]) => key !== "default").map(([klasse, farbe]) => {
                          const klasseInfo = getKlasseInfo(klasse);
                          return (
                            <div key={klasse} className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: farbe }}
                              />
                              <div>
                                <span className="font-medium">{klasse}</span>
                                {klasseInfo && (
                                  <div className="text-gray-500 text-[10px]">{klasseInfo.beispiel}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-[10px] text-muted-foreground pt-1 border-t">
                        Die Farbcodierung entspricht der RStO 12 Klassifizierung von Straßen nach der Belastbarkeit.
                        Rot (Bk100) steht für höchste, Blau (Bk0,3) für niedrigste Belastung.
                      </div>
                    </div>
                  </div>
                  
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="strasse">Straße</Label>
                    <Input 
                      id="strasse" 
                      placeholder="z.B. Hauptstraße" 
                      value={strasse}
                      onChange={(e) => setStrasse(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hausnummer">Hausnummer</Label>
                    <Input 
                      id="hausnummer" 
                      placeholder="z.B. 123" 
                      value={hausnummer}
                      onChange={(e) => setHausnummer(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="plz">Postleitzahl</Label>
                    <Input 
                      id="plz" 
                      placeholder="z.B. 12345" 
                      value={plz}
                      onChange={(e) => setPlz(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ort">Ort</Label>
                    <Input 
                      id="ort" 
                      placeholder="z.B. Berlin" 
                      value={ort}
                      onChange={(e) => setOrt(e.target.value)}
                    />
                  </div>
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
              <CardTitle>Projektverknüpfung & Kostenabschätzung</CardTitle>
              <CardDescription>
                Verknüpfen Sie die Standortinformationen mit einem Projekt und berechnen Sie Materialkosten
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
              
              {markers.length >= 2 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Materialkostenberechnung</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCostEstimation(!showCostEstimation)}
                      className="text-xs h-7 px-2"
                    >
                      {showCostEstimation ? "Ausblenden" : "Berechnen"}
                    </Button>
                  </div>
                  
                  <div className={`${showCostEstimation ? "block" : "hidden"} space-y-3`}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="road-type" className="text-xs">Straßentyp</Label>
                        <Select 
                          value={selectedRoadPreset} 
                          onValueChange={(value) => {
                            setSelectedRoadPreset(value);
                            setRoadWidth(roadWidthPresets[value]);
                          }}
                        >
                          <SelectTrigger id="road-type" className="h-8 text-xs">
                            <SelectValue placeholder="Straßentyp wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(roadWidthPresets).map((preset) => (
                              <SelectItem key={preset} value={preset} className="text-xs">
                                {preset} ({roadWidthPresets[preset]} m)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="road-width" className="text-xs">Straßenbreite (m)</Label>
                        <Input
                          id="road-width"
                          type="number"
                          min="1"
                          max="25"
                          step="0.5"
                          className="h-8 text-xs"
                          value={roadWidth}
                          onChange={(e) => setRoadWidth(parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    {selectedBelastungsklasse && showCostEstimation && (
                      <div className="p-3 border rounded-md bg-muted/30">
                        {(() => {
                          const routeDistance = calculateRouteDistances(markers).total;
                          const costEstimation = calculateMaterialCosts(
                            selectedBelastungsklasse,
                            routeDistance,
                            roadWidth
                          );
                          
                          return (
                            <div className="text-xs space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold">Materialkosten-Schätzung:</span>
                                <span className="font-bold text-primary text-sm">
                                  {new Intl.NumberFormat('de-DE', { 
                                    style: 'currency', 
                                    currency: 'EUR',
                                    maximumFractionDigits: 0 
                                  }).format(costEstimation.totalCost)}
                                </span>
                              </div>
                              
                              <div className="py-1 border-t border-b text-[10px] text-muted-foreground">
                                Strecke: {routeDistance.toFixed(2)} km × {roadWidth.toFixed(1)} m = {costEstimation.areaSquareMeters} m²
                              </div>
                              
                              <div className="space-y-1">
                                <div className="font-medium mb-2 text-primary border-b pb-1">Kostenaufschlüsselung:</div>
                                <div className="border rounded-md p-3 bg-muted/30">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="py-1 text-left font-medium">Schicht</th>
                                        <th className="py-1 text-right font-medium">Kosten</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td className="py-1">Asphaltdecke</td>
                                        <td className="py-1 text-right">{new Intl.NumberFormat('de-DE', { 
                                          style: 'currency', 
                                          currency: 'EUR',
                                          maximumFractionDigits: 0 
                                        }).format(costEstimation.costBreakdown.asphaltdecke)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1">Asphalttragschicht</td>
                                        <td className="py-1 text-right">{new Intl.NumberFormat('de-DE', { 
                                          style: 'currency', 
                                          currency: 'EUR',
                                          maximumFractionDigits: 0 
                                        }).format(costEstimation.costBreakdown.asphalttragschicht)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1">Frostschutzschicht</td>
                                        <td className="py-1 text-right">{new Intl.NumberFormat('de-DE', { 
                                          style: 'currency', 
                                          currency: 'EUR',
                                          maximumFractionDigits: 0 
                                        }).format(costEstimation.costBreakdown.frostschutzschicht)}</td>
                                      </tr>
                                      {costEstimation.costBreakdown.schottertragschicht && (
                                        <tr>
                                          <td className="py-1">Schottertragschicht</td>
                                          <td className="py-1 text-right">{new Intl.NumberFormat('de-DE', { 
                                            style: 'currency', 
                                            currency: 'EUR',
                                            maximumFractionDigits: 0 
                                          }).format(costEstimation.costBreakdown.schottertragschicht)}</td>
                                        </tr>
                                      )}
                                    </tbody>
                                    <tfoot>
                                      <tr className="border-t">
                                        <td className="py-2 font-semibold">Gesamt</td>
                                        <td className="py-2 text-right font-semibold text-primary">{new Intl.NumberFormat('de-DE', { 
                                          style: 'currency', 
                                          currency: 'EUR',
                                          maximumFractionDigits: 0 
                                        }).format(costEstimation.totalCost)}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                              
                              <div className="text-[10px] text-muted-foreground pt-1 border-t">
                                Diese Schätzung basiert auf durchschnittlichen Materialpreisen und berücksichtigt
                                die RStO 12 Bauklasse {getKlasseInfo(selectedBelastungsklasse)?.bauklasse} mit 
                                entsprechenden Schichtdicken.
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-2">
                      <Button className="w-full">
                        Mit Projekt verknüpfen
                        <MapIcon className="ml-2 h-4 w-4" />
                      </Button>
                      
                      {markers.length >= 2 && (
                        <div className="p-3 bg-muted/30 rounded-md border text-xs">
                          <div className="font-medium flex items-center mb-1">
                            <Ruler className="h-3 w-3 mr-1" /> Streckendaten speichern
                          </div>
                          <div className="text-gray-600">
                            Gesamtlänge: {calculateRouteDistances(markers).total.toFixed(2)} km über {markers.length} Punkte
                            {showCostEstimation && selectedBelastungsklasse && (
                              <div className="mt-1 font-medium text-primary">
                                Geschätzte Materialkosten: {new Intl.NumberFormat('de-DE', { 
                                  style: 'currency', 
                                  currency: 'EUR',
                                  maximumFractionDigits: 0 
                                }).format(calculateMaterialCosts(
                                  selectedBelastungsklasse,
                                  calculateRouteDistances(markers).total,
                                  roadWidth
                                ).totalCost)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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