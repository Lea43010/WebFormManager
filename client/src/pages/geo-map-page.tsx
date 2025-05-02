import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Map as MapIcon, ArrowLeft, MapPin, Camera,
  Layers, Calculator, Download, AlertCircle, FileDown, Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import BayernMaps from "@/components/maps/bayern-maps";

// Mapbox-Token aus den Umgebungsvariablen laden
import { MAPBOX_TOKEN } from "@/config/mapbox";
// Debug-Ausgabe des Tokens
console.log("Geladenes Mapbox-Token:", MAPBOX_TOKEN);

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
    map.setView(position, map.getZoom());
  }, [map, position]);
  
  return null;
}

export default function GeoMapPage() {
  // Zustand für die Belastungsklasse
  const [selectedBelastungsklasse, setSelectedBelastungsklasse] = useState<string>("Bk32");
  
  // Zustand für Straßentyp und Breite
  const [roadType, setRoadType] = useState<string>("Landstraße");
  const [customRoadWidth, setCustomRoadWidth] = useState<number | null>(null);
  
  // Berechne die aktuelle Straßenbreite basierend auf dem Straßentyp oder benutzerdefinierten Wert
  const roadWidth = roadType === "Benutzerdefiniert" && customRoadWidth
    ? customRoadWidth
    : roadWidthPresets[roadType as keyof typeof roadWidthPresets];
  
  // Zustand für Marker und Route
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [editMarker, setEditMarker] = useState<MarkerInfo | null>(null);
  const [markerNotes, setMarkerNotes] = useState<string>("");
  const [addressSearch, setAddressSearch] = useState<string>("");
  

  
  // Zustand für das Exportieren als PDF
  const [exportingPDF, setExportingPDF] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  
  // Zustand für den aktuellen Tab (Straßenplanung, BayernAtlas, DenkmalAtlas)
  const [bayernTabValue, setBayernTabValue] = useState<string>("strassenplanung");
  
  // Verwalten des Exports als PDF
  const mapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  
  // Berechne Route und Materialbedarf
  const { total, segments } = calculateRouteDistances(markers);
  const { materials, total: totalCost } = calculateMaterialCosts(total, roadWidth, selectedBelastungsklasse);
  
  // Marker hinzufügen bei Klick auf die Karte
  const handleAddMarker = useCallback((lat: number, lng: number) => {
    const newMarker: MarkerInfo = {
      position: [lat, lng],
      belastungsklasse: selectedBelastungsklasse !== "none" ? selectedBelastungsklasse : undefined
    };
    
    // Marker an vorhandene Liste anhängen
    setMarkers(prev => [...prev, newMarker]);
  }, [selectedBelastungsklasse]);
  
  // Marker bearbeiten
  const handleEditMarker = (idx: number) => {
    setEditMarker(markers[idx]);
    setMarkerNotes(markers[idx].notes || "");
  };
  
  // Marker-Eigenschaften speichern
  const handleSaveMarkerNotes = () => {
    if (editMarker) {
      setMarkers(prev => 
        prev.map(m => 
          m.position === editMarker.position 
            ? { ...m, notes: markerNotes } 
            : m
        )
      );
      setEditMarker(null);
      setMarkerNotes("");
    }
  };
  
  // Marker löschen
  const handleDeleteMarker = (idx: number) => {
    setMarkers(prev => prev.filter((_, i) => i !== idx));
  };
  
  // Alle Marker löschen
  const handleClearAllMarkers = () => {
    setMarkers([]);
  };
  
  // Adresssuche
  const handleAddressSearch = async () => {
    if (addressSearch.length < 3) return;
    
    try {
      let data;
      // Falls Mapbox-Token verfügbar ist, verwende die Mapbox Geocoding API
      if (MAPBOX_TOKEN) {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressSearch)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=de,at,ch`
        );
        data = await response.json();
      } else {
        // Alternativ nutzen wir das Nominatim-API von OpenStreetMap
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}&limit=1&countrycodes=de,at,ch`
        );
        const nominatimData = await response.json();
        
        // Konvertiere Nominatim-Format in ein Format, das mit dem restlichen Code kompatibel ist
        data = {
          features: nominatimData.map((item: any) => ({
            center: [parseFloat(item.lon), parseFloat(item.lat)],
            place_name: item.display_name,
            properties: {
              address: item.display_name
            }
          }))
        };
      }
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        // Extrahiere Adressinformationen
        let strasse = "", hausnummer = "", plz = "", ort = "";
        
        if (MAPBOX_TOKEN) {
          // Versuche, Adresskomponenten aus Mapbox-Ergebnis zu extrahieren
          feature.context?.forEach((ctx: any) => {
            if (ctx.id.startsWith('postcode')) {
              plz = ctx.text;
            } else if (ctx.id.startsWith('place')) {
              ort = ctx.text;
            }
          });
          
          // Straße und Hausnummer aus der vollständigen Adresse extrahieren (Mapbox)
          const addressParts = feature.place_name.split(',')[0].trim().split(' ');
          if (addressParts.length > 1 && /\d/.test(addressParts[addressParts.length - 1])) {
            hausnummer = addressParts.pop() || "";
            strasse = addressParts.join(' ');
          } else {
            strasse = addressParts.join(' ');
          }
        } else {
          // Extrahiere Adresskomponenten aus dem OpenStreetMap-Nominatim-Ergebnis
          try {
            // Nominatim-Ergebnisse enthalten addressdetails
            const addressParts = feature.place_name.split(',');
            if (addressParts.length > 0) {
              // Erste Zeile enthält normalerweise Straße und Hausnummer
              const firstPart = addressParts[0].trim();
              const matches = firstPart.match(/^(.+?)\s+(\d+.*)$/);
              
              if (matches && matches.length >= 3) {
                strasse = matches[1];
                hausnummer = matches[2];
              } else {
                strasse = firstPart;
              }
              
              // Suche nach PLZ und Ort in den restlichen Teilen
              for (let i = 1; i < addressParts.length; i++) {
                const part = addressParts[i].trim();
                // PLZ hat typischerweise 5 Ziffern in Deutschland
                const plzMatch = part.match(/^(\d{5})\s+(.+)$/);
                if (plzMatch && plzMatch.length >= 3) {
                  plz = plzMatch[1];
                  ort = plzMatch[2];
                  break;
                } else if (!ort && part) {
                  ort = part; // Fallback für Ort
                }
              }
            }
          } catch (error) {
            console.error("Fehler beim Parsen der Adressdaten:", error);
          }
        }
        
        // Neuen Marker erstellen
        const newMarker: MarkerInfo = {
          position: [lat, lng],
          belastungsklasse: selectedBelastungsklasse !== "none" ? selectedBelastungsklasse : undefined,
          name: feature.place_name,
          strasse,
          hausnummer,
          plz,
          ort
        };
        
        // Marker hinzufügen
        setMarkers(prev => [...prev, newMarker]);
        
        // Adresssuchefeld leeren
        setAddressSearch("");
        
        // Karte auf den neuen Marker zentrieren
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 14);
        }
      }
    } catch (error) {
      console.error("Fehler bei der Adresssuche:", error);
    }
  };
  

  // Als PDF exportieren
  const handleExportPDF = async () => {
    if (markers.length === 0) return;
    
    setExportingPDF(true);
    setExportProgress(5);
    
    try {
      // Erstelle das PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Schriftgröße und -stil für die Überschrift
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      
      // Aktuelles Datum formatieren
      const today = new Date();
      const dateStr = today.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Überschrift und Datum
      pdf.text('Straßenbauplanung - Projektübersicht', 10, 15);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Datum: ${dateStr}`, 10, 23);
      
      setExportProgress(20);
      
      // Erstelle eine vereinfachte Darstellung der Karte
      setExportProgress(60);
      
      // Setze den Startpunkt für die Projektdaten
      let yPosition = 30;
      
      // Projektdaten
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Projektübersicht', 10, yPosition);
      yPosition += 8;
      
      // Setze Startposition für die Karte mit attraktiverem Hintergrund
      
      // Hintergrundraster (leicht gräulich)
      pdf.setFillColor(245, 245, 247);
      pdf.rect(10, yPosition, 190, 100, 'F');
      
      // Gitternetzlinien für eine kartografische Anmutung
      pdf.setDrawColor(230, 230, 235);
      pdf.setLineWidth(0.2);
      
      // Horizontale Linien
      for (let i = 0; i <= 10; i++) {
        const lineY = yPosition + (i * 10);
        pdf.line(10, lineY, 200, lineY);
      }
      
      // Vertikale Linien
      for (let i = 0; i <= 19; i++) {
        const lineX = 10 + (i * 10);
        pdf.line(lineX, yPosition, lineX, yPosition + 100);
      }
      
      // Kartenüberschrift
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 130);
      pdf.text('Straßenverlaufsplanung', 12, yPosition + 5);
      
      // Kompass-Symbol auf der Karte
      const compassX = 190;
      const compassY = yPosition + 10;
      
      // Äußerer Kreis
      pdf.setDrawColor(100, 100, 110);
      pdf.setFillColor(255, 255, 255);
      pdf.circle(compassX, compassY, 5, 'FD');
      
      // Nord-Richtung
      pdf.setDrawColor(0, 0, 0);
      pdf.setFillColor(230, 60, 60);
      pdf.setLineWidth(0.5);
      
      // Pfeil nach Norden
      pdf.line(compassX, compassY - 4, compassX, compassY + 4);
      pdf.line(compassX, compassY - 4, compassX - 1, compassY - 2);
      pdf.line(compassX, compassY - 4, compassX + 1, compassY - 2);
      
      // N-Markierung
      pdf.setFontSize(5);
      pdf.setTextColor(0, 0, 0);
      pdf.text('N', compassX - 1, compassY - 5);
      
      // Zeichne Route (vereinfacht)
      if (markers.length >= 2) {
        pdf.setDrawColor(59, 130, 246); // #3b82f6
        pdf.setLineWidth(0.5);
        
        // Berechne Mittelpunkt und Grenzen der Marker
        let minLat = markers[0].position[0];
        let maxLat = markers[0].position[0];
        let minLng = markers[0].position[1];
        let maxLng = markers[0].position[1];
        
        markers.forEach(marker => {
          minLat = Math.min(minLat, marker.position[0]);
          maxLat = Math.max(maxLat, marker.position[0]);
          minLng = Math.min(minLng, marker.position[1]);
          maxLng = Math.max(maxLng, marker.position[1]);
        });
        
        // Füge etwas Puffer hinzu
        const latBuffer = (maxLat - minLat) * 0.1;
        const lngBuffer = (maxLng - minLng) * 0.1;
        minLat -= latBuffer;
        maxLat += latBuffer;
        minLng -= lngBuffer;
        maxLng += lngBuffer;
        
        // Skalierungsfaktoren
        const latRange = maxLat - minLat;
        const lngRange = maxLng - minLng;
        const scaleX = 180 / (lngRange || 0.1);
        const scaleY = 90 / (latRange || 0.05);
        
        // Zeichne Linien zwischen den Markern mit visuellem Effekt
        pdf.setDrawColor(59, 130, 246); // #3b82f6
        
        // Sehr einfache Kartenansicht - fokussiert auf Klarheit ohne komplexe Elemente
        
        // Hellgrauer Hintergrund
        pdf.setFillColor(249, 249, 249);
        pdf.rect(10, yPosition, 190, 100, 'F');
        
        // Einfaches Straßennetz
        // Horizontale Hauptstraßen
        pdf.setFillColor(225, 225, 225);
        
        for (let i = 0; i < 4; i++) {
          const roadY = yPosition + 20 + (i * 20);
          pdf.rect(10, roadY, 190, 4, 'F');
          
          // Straßenmarkierungen
          pdf.setDrawColor(255, 255, 255);
          pdf.setLineWidth(0.5);
          
          for (let x = 15; x < 195; x += 12) {
            pdf.line(x, roadY + 2, x + 6, roadY + 2);
          }
        }
        
        // Vertikale Hauptstraßen
        for (let i = 0; i < 5; i++) {
          const roadX = 10 + (i * 40);
          pdf.rect(roadX, yPosition, 4, 100, 'F');
          
          // Straßenmarkierungen
          pdf.setDrawColor(255, 255, 255);
          pdf.setLineWidth(0.5);
          
          for (let y = yPosition + 5; y < yPosition + 95; y += 12) {
            pdf.line(roadX + 2, y, roadX + 2, y + 6);
          }
        }
        
        // Stadtblöcke mit einheitlichem, klarem Design
        for (let col = 0; col < 4; col++) {
          for (let row = 0; row < 3; row++) {
            const blockX = 14 + (col * 40);
            const blockY = yPosition + 24 + (row * 20);
            const blockWidth = 36;
            const blockHeight = 16;
            
            // Blockfarbe basierend auf Position
            const shade = 240 + ((col + row) % 2) * 5;
            pdf.setFillColor(shade, shade, shade);
            pdf.rect(blockX, blockY, blockWidth, blockHeight, 'F');
            
            // Vereinfachte Baugrenzen/Strukturen andeuten
            pdf.setDrawColor(220, 220, 220);
            pdf.setLineWidth(0.1);
            
            // Horizontale Unterteilungen
            for (let i = 1; i < 3; i++) {
              pdf.line(
                blockX, 
                blockY + (blockHeight / 3) * i, 
                blockX + blockWidth, 
                blockY + (blockHeight / 3) * i
              );
            }
            
            // Vertikale Unterteilungen
            for (let i = 1; i < 3; i++) {
              pdf.line(
                blockX + (blockWidth / 3) * i, 
                blockY, 
                blockX + (blockWidth / 3) * i, 
                blockY + blockHeight
              );
            }
          }
        }
        
        // Ein paar Grünflächen hinzufügen
        pdf.setFillColor(230, 240, 230);
        
        // Oben links
        pdf.rect(14, yPosition + 4, 36, 16, 'F');
        
        // Unten rechts
        pdf.rect(134, yPosition + 64, 36, 16, 'F');
        
        // Kreisverkehr in der Mitte
        pdf.setFillColor(225, 225, 225);
        pdf.circle(105, yPosition + 50, 8, 'F');
        
        pdf.setFillColor(230, 240, 230);
        pdf.circle(105, yPosition + 50, 5, 'F');
        
        // Wasserelemente (kleine Teiche/Seen)
        pdf.setFillColor(225, 235, 245);
        pdf.circle(85, yPosition + 30, 4, 'F');
        
        // Subtiles Gitternetz
        pdf.setDrawColor(240, 240, 240);
        pdf.setLineWidth(0.1);
        
        for (let i = 0; i <= 19; i++) {
          pdf.line(10 + (i * 10), yPosition, 10 + (i * 10), yPosition + 100);
        }
        
        for (let i = 0; i <= 10; i++) {
          pdf.line(10, yPosition + (i * 10), 200, yPosition + (i * 10));
        }
        
        // Zeichne Route mit modernem Stil
        // Hauptlinie für die Route (leuchtendes Blau mit besserer Sichtbarkeit)
        pdf.setDrawColor(30, 64, 175); // Dunkles Blau als Basis
        pdf.setLineWidth(3);
        pdf.setLineCap('round');
        pdf.setLineJoin('round');
        
        for (let i = 0; i < markers.length - 1; i++) {
          const startX = 10 + ((markers[i].position[1] - minLng) * scaleX);
          const startY = yPosition + ((markers[i].position[0] - minLat) * scaleY);
          const endX = 10 + ((markers[i+1].position[1] - minLng) * scaleX);
          const endY = yPosition + ((markers[i+1].position[0] - minLat) * scaleY);
          
          pdf.line(startX, startY, endX, endY);
        }
        
        // Mittlere Linie für bessere Sichtbarkeit (etwas heller)
        pdf.setDrawColor(59, 130, 246); // #3b82f6
        pdf.setLineWidth(1.8);
        
        for (let i = 0; i < markers.length - 1; i++) {
          const startX = 10 + ((markers[i].position[1] - minLng) * scaleX);
          const startY = yPosition + ((markers[i].position[0] - minLat) * scaleY);
          const endX = 10 + ((markers[i+1].position[1] - minLng) * scaleX);
          const endY = yPosition + ((markers[i+1].position[0] - minLat) * scaleY);
          
          pdf.line(startX, startY, endX, endY);
          
          // Mittellinie für bessere Sichtbarkeit
          pdf.setDrawColor(255, 255, 255); // Weiße Mittellinie
          pdf.setLineWidth(0.5);
          pdf.line(startX, startY, endX, endY);
          
          // 4. Richtungspfeile an jedem Viertel der Strecke
          const arrowSize = 2;
          
          // Funktion zum Zeichnen eines Pfeils
          const drawArrow = (posX: number, posY: number) => {
            const dx = endX - startX;
            const dy = endY - startY;
            const angle = Math.atan2(dy, dx);
            
            const arrowX1 = posX - arrowSize * Math.cos(angle - Math.PI/6);
            const arrowY1 = posY - arrowSize * Math.sin(angle - Math.PI/6);
            const arrowX2 = posX - arrowSize * Math.cos(angle + Math.PI/6);
            const arrowY2 = posY - arrowSize * Math.sin(angle + Math.PI/6);
            
            pdf.setFillColor(59, 130, 246);
            pdf.triangle(posX, posY, arrowX1, arrowY1, arrowX2, arrowY2, 'F');
          };
          
          // Pfeil in der Mitte der Verbindungslinie
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          drawArrow(midX, midY);
        }
        
        // Zeichne Marker
        markers.forEach((marker, idx) => {
          const x = 10 + ((marker.position[1] - minLng) * scaleX);
          const y = yPosition + ((marker.position[0] - minLat) * scaleY);
          
          // Markerpunkt mit Belastungsklassenfarbe
          if (marker.belastungsklasse) {
            // Farbkodierung für Belastungsklassen
            const colors: Record<string, [number, number, number]> = {
              'Bk100': [220, 53, 69], // rot
              'Bk32': [255, 128, 0],  // orange
              'Bk10': [255, 193, 7],  // gelb
              'Bk3': [25, 135, 84],   // grün
              'Bk1': [13, 110, 253],  // blau
              'Bk0_3': [111, 66, 193] // lila
            };
            
            const color = colors[marker.belastungsklasse] || [0, 0, 0];
            pdf.setFillColor(color[0], color[1], color[2]);
            pdf.circle(x, y, 2, 'F');
            
            // Weißer Rand um den Marker
            pdf.setDrawColor(255, 255, 255);
            pdf.setLineWidth(0.3);
            pdf.circle(x, y, 2, 'S');
          } else {
            // Standard schwarzer Marker
            pdf.setFillColor(0, 0, 0);
            pdf.circle(x, y, 1.5, 'F');
          }
          
          // Markerindex und Beschriftung
          pdf.setFontSize(6);
          pdf.setFont('helvetica', 'bold');
          
          // Indexnummer direkt im Marker (besser sichtbar)
          pdf.setTextColor(255, 255, 255);
          const idxText = `${idx + 1}`;
          // Alternative Zentrierungsmethode ohne Positions-Offset zu berechnen
          pdf.text(idxText, x, y + 2, { align: "center" });
          
          // Straßenname außerhalb des Markers
          if (marker.strasse) {
            const streetLabel = `${marker.strasse} ${marker.hausnummer || ''}`.substring(0, 18);
            
            // Vereinfachte Platzierungslogik
            // Immer neben dem Marker, Versatz abhängig von Position
            let textX: number;
            let textY: number;
            
            // Immer einen kleinen Versatz hinzufügen, damit Text und Marker sich nicht überlagern
            const offsetX = 4; 
            const offsetY = 0;
            
            // Bestimme, ob Text rechts oder links vom Marker
            const placeRight = x < 90; // Links der Bildmitte → Text rechts platzieren
            
            if (placeRight) {
              // Text rechts vom Marker
              textX = x + offsetX;
              textY = y + offsetY;
              
              // Hintergrund für Label
              pdf.setFillColor(255, 255, 255, 0.9); // Leicht transparent
              pdf.setDrawColor(200, 200, 200);
              pdf.setLineWidth(0.2);
              
              // Textgröße berechnen
              const textWidth = streetLabel.length * 1.3; // Vereinfachte Berechnung
              
              // Zeichne Hintergrund mit kleiner Schlagschatten für Tiefe
              pdf.setFillColor(240, 240, 240);
              pdf.roundedRect(
                textX - 0.2, 
                textY - 2.2, 
                textWidth, 
                4, 
                0.5, 
                0.5, 
                'F'
              );
              
              // Haupthintergrund
              pdf.setFillColor(255, 255, 255);
              pdf.roundedRect(
                textX, 
                textY - 2, 
                textWidth, 
                3.8, 
                0.5, 
                0.5, 
                'FD'
              );
              
              // Text
              pdf.setTextColor(30, 30, 30);
              pdf.text(streetLabel, textX + 0.8, textY);
            } else {
              // Text links vom Marker
              textX = x - offsetX;
              textY = y + offsetY;
              
              // Textgröße berechnen
              const textWidth = streetLabel.length * 1.3; // Vereinfachte Berechnung
              
              // Zeichne Hintergrund mit kleiner Schlagschatten für Tiefe
              pdf.setFillColor(240, 240, 240);
              pdf.roundedRect(
                textX - textWidth - 0.2, 
                textY - 2.2, 
                textWidth, 
                4, 
                0.5, 
                0.5, 
                'F'
              );
              
              // Haupthintergrund
              pdf.setFillColor(255, 255, 255);
              pdf.roundedRect(
                textX - textWidth, 
                textY - 2, 
                textWidth, 
                3.8, 
                0.5, 
                0.5, 
                'FD'
              );
              
              // Text rechts ausgerichtet
              pdf.setTextColor(30, 30, 30);
              pdf.text(streetLabel, textX, textY, { align: 'right' });
            }
          }
        });
      }
      
      yPosition += 105; // Nach der Karte weitermachen
      
      setExportProgress(75);
      
      // Projektzusammenfassung
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Streckendaten', 10, yPosition);
      yPosition += 8;
      
      // Tabellenüberschriften für Streckendaten
      pdf.setFillColor(240, 240, 240);
      pdf.rect(10, yPosition, 190, 7, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Eigenschaft', 12, yPosition + 5);
      pdf.text('Wert', 140, yPosition + 5);
      yPosition += 7;
      
      // Tabellendaten für Streckendaten
      pdf.setFont('helvetica', 'normal');
      pdf.text('Gesamtstrecke', 12, yPosition + 5);
      pdf.text(`${total.toFixed(2)} km`, 140, yPosition + 5);
      yPosition += 7;
      
      pdf.text('Straßentyp', 12, yPosition + 5);
      pdf.text(roadType, 140, yPosition + 5);
      yPosition += 7;
      
      pdf.text('Straßenbreite', 12, yPosition + 5);
      pdf.text(`${roadWidth.toFixed(1)} m`, 140, yPosition + 5);
      yPosition += 7;
      
      pdf.text('Belastungsklasse', 12, yPosition + 5);
      pdf.text(selectedBelastungsklasse, 140, yPosition + 5);
      yPosition += 7;
      
      pdf.text('Gesamtfläche', 12, yPosition + 5);
      pdf.text(`${(total * 1000 * roadWidth).toFixed(0)} m²`, 140, yPosition + 5);
      yPosition += 12;
      
      // Materialtabelle, wenn eine Belastungsklasse ausgewählt ist
      if (selectedBelastungsklasse !== "none" && materials.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Materialkosten (geschätzt)', 10, yPosition);
        yPosition += 8;
        
        // Tabellenüberschriften für Materialkosten
        pdf.setFillColor(240, 240, 240);
        pdf.rect(10, yPosition, 190, 7, 'F');
        pdf.setFontSize(10);
        pdf.text('Material', 12, yPosition + 5);
        pdf.text('Dicke', 80, yPosition + 5);
        pdf.text('Fläche', 110, yPosition + 5);
        pdf.text('Kosten', 150, yPosition + 5);
        yPosition += 7;
        
        // Tabellendaten für Materialkosten
        pdf.setFont('helvetica', 'normal');
        materials.forEach((material: any) => {
          pdf.text(material.name, 12, yPosition + 5);
          pdf.text(material.thickness, 80, yPosition + 5);
          pdf.text(`${material.area.toFixed(0)} m²`, 110, yPosition + 5);
          pdf.text(material.totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), 150, yPosition + 5);
          yPosition += 7;
        });
        
        // Gesamtkosten
        pdf.setFont('helvetica', 'bold');
        yPosition += 2;
        pdf.text('Gesamtkosten', 12, yPosition + 5);
        pdf.text(totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), 150, yPosition + 5);
      }
      
      // Wenn es Standorte gibt, auch diese auflisten
      if (markers.length > 0) {
        yPosition += 15;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Standorte', 10, yPosition);
        yPosition += 8;
        
        // Tabellenüberschriften für Standorte
        pdf.setFillColor(240, 240, 240);
        pdf.rect(10, yPosition, 190, 7, 'F');
        pdf.setFontSize(10);
        pdf.text('Nr.', 12, yPosition + 5);
        pdf.text('Adresse', 25, yPosition + 5);
        pdf.text('Belastungsklasse', 120, yPosition + 5);
        pdf.text('Notizen', 160, yPosition + 5);
        yPosition += 7;
        
        // Tabellendaten für Standorte
        pdf.setFont('helvetica', 'normal');
        markers.forEach((marker, idx) => {
          let address = 'Unbekannt';
          if (marker.strasse) {
            address = `${marker.strasse} ${marker.hausnummer || ''}, ${marker.plz || ''} ${marker.ort || ''}`.trim();
            if (address === ',') address = 'Unbekannt';
          }
          
          pdf.text(`${idx + 1}`, 12, yPosition + 5);
          pdf.text(address, 25, yPosition + 5);
          pdf.text(marker.belastungsklasse || 'Keine', 120, yPosition + 5);
          
          // Notizen (gekürzt, wenn zu lang)
          const notes = marker.notes || '';
          pdf.text(notes.length > 25 ? notes.substring(0, 22) + '...' : notes, 160, yPosition + 5);
          
          yPosition += 7;
          
          // Neue Seite, wenn der Platz knapp wird
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      }
      
      setExportProgress(90);
      
      // Speichern des PDFs
      pdf.save('strassenbauplanung.pdf');
      
      setExportProgress(100);
    } catch (error) {
      console.error("Fehler beim PDF-Export:", error);
    } finally {
      setTimeout(() => {
        setExportingPDF(false);
        setExportProgress(0);
      }, 500);
    }
  };
  
  // Markerposition für Auto-Zentrierung der Map
  const mapCenterPosition = React.useMemo(() => {
    if (editMarker) {
      return editMarker.position;
    }
    if (markers.length > 0) {
      return markers[markers.length - 1].position;
    }
    return [49.44, 11.07] as [number, number]; // Default: Nürnberg
  }, [markers, editMarker]);
  
  // Empfohlene Baumaschinen basierend auf der gewählten Belastungsklasse
  const empfohleneBaumaschinen = React.useMemo(() => {
    if (selectedBelastungsklasse === "none") return [];
    return baumaschinen.filter(m => m.eignung.includes(selectedBelastungsklasse));
  }, [selectedBelastungsklasse]);

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
          
          {/* Tabs unter der Hauptüberschrift */}
          <Tabs
            value={bayernTabValue}
            onValueChange={setBayernTabValue}
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
          {/* Tab-spezifischer Inhalt */}
          {bayernTabValue === "bayernatlas" && (
            <BayernMaps defaultTab="bayernatlas" />
          )}
          
          {bayernTabValue === "denkmalatlas" && (
            <BayernMaps defaultTab="denkmalatlas" />
          )}
          
          {bayernTabValue === "strassenplanung" && (
            <div className="space-y-4">
              {/* Einstellungen (kompakter für Laptops) */}
              <Card className="bg-background shadow border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Einstellungen</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Erste Zeile: Adresssuche und Aktionsbuttons */}
                    <div className="lg:col-span-8 space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <Label htmlFor="address-search">Adresssuche</Label>
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {MAPBOX_TOKEN ? 'Mapbox Geocoding' : 'OpenStreetMap Nominatim'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          id="address-search"
                          placeholder="Straße, Hausnummer, PLZ, Ort"
                          value={addressSearch}
                          onChange={(e) => setAddressSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                        />
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={handleAddressSearch}
                          disabled={addressSearch.length < 3}
                        >
                          Suchen
                        </Button>
                      </div>
                    </div>
                    
                    {/* Aktionsbuttons */}
                    <div className="lg:col-span-4 flex flex-col justify-end gap-2">

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
                    
                    {/* Zweite Zeile: Straßentyp und Belastungsklasse */}
                    <div className="lg:col-span-6">
                      <Label htmlFor="strassentyp">Straßentyp</Label>
                      <div className="flex gap-2 items-end">
                        <div className="flex-grow">
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
                          <div className="w-1/3">
                            <Label htmlFor="custom-width" className="text-xs">Breite (m)</Label>
                            <Input 
                              id="custom-width"
                              type="number"
                              min="2"
                              max="30"
                              step="0.1"
                              value={customRoadWidth || ""}
                              onChange={(e) => setCustomRoadWidth(parseFloat(e.target.value))}
                              placeholder="Breite in m"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Belastungsklasse */}
                    <div className="lg:col-span-6">
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
                </CardContent>
              </Card>
              
              {/* 3. Karte mit Markern */}
              <div className="h-[500px] relative border rounded-lg overflow-hidden">
                <MapContainer
                  center={mapCenterPosition}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  ref={mapRef}
                >
                  {/* Fallback auf OpenStreetMap, wenn kein Mapbox-Token verfügbar ist */}
                  {MAPBOX_TOKEN ? (
                    <TileLayer
                      attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                      url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                    />
                  ) : (
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  )}
                  
                  {/* Routenlinien */}
                  {markers.length >= 2 && (
                    <Polyline
                      positions={markers.map(m => m.position)}
                      color="#3b82f6"
                      weight={4}
                      opacity={0.7}
                      ref={polylineRef}
                    />
                  )}
                  
                  {/* Marker anzeigen */}
                  {markers.map((marker, idx) => (
                    <Marker
                      key={idx}
                      position={marker.position}
                      icon={createCustomIcon(marker.belastungsklasse)}
                    >
                      <Popup>
                        <div className="text-sm space-y-2">
                          {marker.strasse ? (
                            <h3 className="font-semibold">
                              {marker.strasse} {marker.hausnummer || ''} 
                              {marker.plz || marker.ort ? <>, </> : ''}
                              {marker.plz} {marker.ort}
                            </h3>
                          ) : (
                            <h3 className="font-semibold">Standort {idx + 1}</h3>
                          )}
                          
                          {marker.belastungsklasse && (
                            <p>Belastungsklasse: <strong>{marker.belastungsklasse}</strong></p>
                          )}
                          
                          {marker.notes && (
                            <div>
                              <p className="font-medium">Notizen:</p>
                              <p>{marker.notes}</p>
                            </div>
                          )}
                          
                          <div className="flex space-x-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditMarker(idx)}
                            >
                              Bearbeiten
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteMarker(idx)}
                            >
                              Entfernen
                            </Button>
                          </div>
                        </div>
                      </Popup>
                      
                      {/* Zusätzliche Tooltip-Beschriftung für den Marker */}
                      <LeafletTooltip direction="top" offset={[0, -10]} permanent>
                        <span className="font-medium">
                          {marker.strasse 
                            ? `${marker.strasse} ${marker.hausnummer || ''}`
                            : idx + 1}
                        </span>
                      </LeafletTooltip>
                    </Marker>
                  ))}
                  
                  {/* Map-Events */}
                  <MapClicker 
                    onMarkerAdd={handleAddMarker} 
                    selectedBelastungsklasse={selectedBelastungsklasse}
                  />
                  <MapControl position={mapCenterPosition} />
                </MapContainer>
                
                {/* Mapbox-Attribution (erforderlich laut ToS) */}
                <div className="absolute bottom-0 right-0 bg-white/80 text-xs p-1 z-[1000]">
                  <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener noreferrer">© Mapbox</a>
                </div>
              </div>
              
              {/* 4. Zusammenfassung und Materialberechnungen */}
              {markers.length >= 2 && (
                <Card className="bg-background shadow border-border/40">
                  <CardHeader>
                    <CardTitle className="text-lg">Zusammenfassung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Streckeninformationen */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-base">Streckeninformationen</h3>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="text-muted-foreground">Gesamtstrecke:</div>
                          <div className="font-medium">{total.toFixed(2)} km</div>
                          
                          <div className="text-muted-foreground">Einzelabschnitte:</div>
                          <div className="text-sm">{segments.map(s => s.toFixed(2)).join(' + ')} km</div>
                          
                          <div className="text-muted-foreground">Straßenbreite:</div>
                          <div className="font-medium">{roadWidth.toFixed(1)} m</div>
                          
                          <div className="text-muted-foreground">Gesamtfläche:</div>
                          <div className="font-medium">{(total * 1000 * roadWidth).toFixed(0)} m²</div>
                        </div>
                      </div>
                      
                      {/* Materialkosten */}
                      {selectedBelastungsklasse !== "none" && (
                        <div className="space-y-4">
                          <h3 className="font-medium text-base">Materialkosten (geschätzt)</h3>
                          
                          <div className="space-y-2">
                            {materials.map((material: any, idx: number) => (
                              <div key={idx} className="grid grid-cols-2 gap-x-4">
                                <div className="text-muted-foreground">{material.name}:</div>
                                <div className="font-medium">
                                  {material.totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                </div>
                              </div>
                            ))}
                            
                            <Separator className="my-2" />
                            
                            <div className="grid grid-cols-2 gap-x-4">
                              <div className="text-muted-foreground font-medium">Gesamtkosten:</div>
                              <div className="font-medium text-primary">
                                {totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Empfohlene Baumaschinen anzeigen wenn Belastungsklasse ausgewählt */}
              {selectedBelastungsklasse !== "none" && empfohleneBaumaschinen.length > 0 && (
                <Card className="bg-background shadow border-border/40">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Layers className="w-5 h-5 mr-2" />
                      Empfohlene Baumaschinen
                    </CardTitle>
                    <CardDescription>
                      Basierend auf Belastungsklasse {selectedBelastungsklasse}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {empfohleneBaumaschinen.map((maschine, idx) => (
                        <Card key={idx} className="bg-background/50">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base">{maschine.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 text-sm space-y-1">
                            <p className="text-muted-foreground">{maschine.beschreibung}</p>
                            <div className="flex justify-between mt-2">
                              <span className="text-muted-foreground">Tagesmiete:</span>
                              <span className="font-medium">{maschine.tagesmiete.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Leistung:</span>
                              <span className="font-medium">{maschine.leistung} m²/Tag</span>
                            </div>
                            
                            {/* Geeignete Belastungsklassen */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {maschine.eignung.map(klasse => (
                                <Badge 
                                  key={klasse} 
                                  variant={klasse === selectedBelastungsklasse ? "default" : "outline"}
                                  className="text-xs"
                                >
                                  {klasse}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal zum Bearbeiten eines Markers */}
      {editMarker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editMarker.strasse 
                  ? `${editMarker.strasse} ${editMarker.hausnummer || ''}`
                  : "Standort bearbeiten"
                }
              </CardTitle>
              <CardDescription>
                {editMarker.strasse 
                  ? (editMarker.plz || editMarker.ort ? `${editMarker.plz || ''} ${editMarker.ort || ''}` : '')
                  : `Position: ${editMarker.position[0].toFixed(5)}, ${editMarker.position[1].toFixed(5)}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="marker-notes">Notizen</Label>
                  <Textarea 
                    id="marker-notes"
                    value={markerNotes}
                    onChange={(e) => setMarkerNotes(e.target.value)}
                    placeholder="Notizen zu diesem Standort"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-4 pt-0">
              <Button variant="outline" onClick={() => setEditMarker(null)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveMarkerNotes}>
                Speichern
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
