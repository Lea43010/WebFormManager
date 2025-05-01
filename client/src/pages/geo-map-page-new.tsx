import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  MapIcon,
  Search,
  Plus,
  Route,
  FileDown,
  Loader2,
  Map,
  ArrowLeft,
  MapPin,
  Bulldozer,
  Layers,
  Building,
  AlertTriangle,
  Settings,
  X,
} from 'lucide-react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip as LeafletTooltip,
  useMap,
  useMapEvents,
  LayersControl,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import BayernMaps from '@/components/maps/bayern-maps';

// Benutzereigene Funktionen und Konstanten

// Mapbox-Token
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibGVhemltbWVyIiwiYSI6ImNtOWlqenRoOTAyd24yanF2dmh4MzVmYnEifQ.VCg8sM94uqeuolEObT6dbw';

// Farben für die Belastungsklassen
const belastungsklassenColors = {
  Bk100: '#FF0000', // Rot
  Bk32: '#FF6600',  // Orange
  Bk10: '#FFCC00',  // Gelb
  Bk3: '#00CC00',   // Grün
  Bk1: '#0066FF',   // Blau
  Bk0_3: '#9933FF', // Lila
  none: '#888888',  // Grau
};

// Informationen zu den Belastungsklassen
const belastungsklassenInfo = [
  {
    klasse: "Bk100",
    beanspruchung: "Sehr stark",
    beispiel: "Autobahnen, Industriegebiete",
    bauklasse: "SV",
    dickeAsphaltbauweise: "79 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "22 cm",
    dickeFrostschutzschicht1: "53 cm",
  },
  {
    klasse: "Bk32",
    beanspruchung: "Stark",
    beispiel: "Bundesstraßen, Hauptverkehrsstraßen",
    bauklasse: "I-II",
    dickeAsphaltbauweise: "74 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "18 cm",
    dickeFrostschutzschicht1: "52 cm",
  },
  {
    klasse: "Bk10",
    beanspruchung: "Mittel",
    beispiel: "Kreisstraßen, Erschließungsstraßen",
    bauklasse: "III",
    dickeAsphaltbauweise: "69 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "14 cm",
    dickeFrostschutzschicht1: "51 cm",
    dickeSchotterTragschicht: "15 cm",
    dickeFrostschutzschicht2: "36 cm",
  },
  {
    klasse: "Bk3",
    beanspruchung: "Gering",
    beispiel: "Anliegerstraßen, Wohnstraßen",
    bauklasse: "IV",
    dickeAsphaltbauweise: "67 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "12 cm",
    dickeFrostschutzschicht1: "51 cm",
    dickeSchotterTragschicht: "15 cm",
    dickeFrostschutzschicht2: "36 cm",
  },
  {
    klasse: "Bk1",
    beanspruchung: "Sehr gering",
    beispiel: "Wohnwege, Grundstückszufahrten",
    bauklasse: "V",
    dickeAsphaltbauweise: "64 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "10 cm",
    dickeFrostschutzschicht1: "50 cm",
    dickeSchotterTragschicht: "15 cm",
    dickeFrostschutzschicht2: "35 cm",
  },
  {
    klasse: "Bk0_3",
    beanspruchung: "Minimal",
    beispiel: "Geh- und Radwege",
    bauklasse: "VI",
    dickeAsphaltbauweise: "62 cm",
    dickeAsphaltdecke: "4 cm",
    dickeAsphaltTragschicht: "8 cm",
    dickeFrostschutzschicht1: "50 cm",
    dickeSchotterTragschicht: "15 cm",
    dickeFrostschutzschicht2: "35 cm",
  },
];

// Baumaschinen-Daten
const baumaschinen = [
  {
    name: "Straßenfräse W 200 H",
    beschreibung: "Große Straßenfräse für hohe Beanspruchung",
    eignung: ["Bk100", "Bk32", "Bk10"],
    bildUrl: "/maschinen/strassenfraese.jpg",
    tagesmiete: 2800,
    leistung: 3000,
  },
  {
    name: "Fertiger BF 600 C",
    beschreibung: "Asphaltfertiger für mittlere bis hohe Belastungen",
    eignung: ["Bk100", "Bk32", "Bk10", "Bk3"],
    bildUrl: "/maschinen/fertiger.jpg",
    tagesmiete: 2400,
    leistung: 2500,
  },
  {
    name: "Walze HD 110",
    beschreibung: "Tandemwalze für vibrationsarmes Verdichten",
    eignung: ["Bk100", "Bk32", "Bk10", "Bk3", "Bk1"],
    bildUrl: "/maschinen/walze.jpg",
    tagesmiete: 1200,
    leistung: 4000,
  },
  {
    name: "Kompaktfertiger BF 300",
    beschreibung: "Kleiner Asphaltfertiger für geringe Belastungen",
    eignung: ["Bk3", "Bk1", "Bk0_3"],
    bildUrl: "/maschinen/kompaktfertiger.jpg",
    tagesmiete: 1600,
    leistung: 1500,
  },
  {
    name: "Mini-Walze HD 12",
    beschreibung: "Kompaktwalze für leichte Verdichtungsarbeiten",
    eignung: ["Bk1", "Bk0_3"],
    bildUrl: "/maschinen/miniwalze.jpg",
    tagesmiete: 450,
    leistung: 2000,
  }
];

// Materialkosten für verschiedene Bestandteile des Straßenaufbaus
const materialPreise = {
  asphaltdecke: 32, // € pro m²
  asphalttragschicht: 24, // € pro m²
  frostschutzschicht: 14, // € pro m²
  schottertragschicht: 18, // € pro m²
};

// Standardstraßenbreiten je nach Typ
const strassenBreiten: Record<string, number> = {
  'Autobahn': 15.5,
  'Bundesstraße': 12.5,
  'Landstraße': 8.5,
  'Kreisstraße': 6.5,
  'Gemeindestraße': 5.5,
  'Benutzerdefiniert': 0,
};

// Hilfsfunktionen

// Funktion zur Berechnung der Entfernung zwischen zwei Punkten
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Erdradius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Berechne die Entfernungen einer Route (Gesamt und Einzelabschnitte)
function calculateRouteDistances(markers: MarkerInfo[]): {total: number, segments: number[]} {
  let total = 0;
  const segments: number[] = [];
  
  for (let i = 0; i < markers.length - 1; i++) {
    const [lat1, lon1] = markers[i].position;
    const [lat2, lon2] = markers[i + 1].position;
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    segments.push(distance);
    total += distance;
  }
  
  return { total, segments };
}

// Optimierung der Routenreihenfolge (einfacher Nearest-Neighbor-Algorithmus)
function optimizeRouteOrder(markers: MarkerInfo[]): MarkerInfo[] {
  if (markers.length <= 2) return [...markers];
  
  const startMarker = markers[0];
  const endMarker = markers[markers.length - 1];
  const midMarkers = markers.slice(1, markers.length - 1);
  
  const optimizedRoute = [startMarker];
  let currentMarker = startMarker;
  
  const remainingMarkers = [...midMarkers];
  
  while (remainingMarkers.length > 0) {
    let nearestIdx = 0;
    let minDistance = Number.MAX_VALUE;
    
    remainingMarkers.forEach((marker, idx) => {
      const [lat1, lon1] = currentMarker.position;
      const [lat2, lon2] = marker.position;
      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIdx = idx;
      }
    });
    
    currentMarker = remainingMarkers[nearestIdx];
    optimizedRoute.push(currentMarker);
    remainingMarkers.splice(nearestIdx, 1);
  }
  
  optimizedRoute.push(endMarker);
  return optimizedRoute;
}

// Hole Informationen zu einer Belastungsklasse
function getKlasseInfo(klasseId: string): BelastungsklasseInfo | undefined {
  return belastungsklassenInfo.find(k => k.klasse === klasseId);
}

// Berechne die Materialkosten für eine Strecke
function calculateMaterialCosts(
  streckenlaengeKm: number,
  strassenbreiteM: number,
  belastungsklasse: string
): { materials: any[]; total: number } {
  if (streckenlaengeKm <= 0 || strassenbreiteM <= 0 || belastungsklasse === "none") {
    return { materials: [], total: 0 };
  }
  
  const klasseInfo = getKlasseInfo(belastungsklasse);
  if (!klasseInfo) {
    return { materials: [], total: 0 };
  }
  
  // Fläche in m²
  const flaecheM2 = streckenlaengeKm * 1000 * strassenbreiteM;
  
  // Kostenberechnung
  const materials = [];
  let totalCost = 0;
  
  // Asphaltdecke
  const deckeCost = flaecheM2 * materialPreise.asphaltdecke;
  materials.push({
    name: "Asphaltdecke",
    thickness: klasseInfo.dickeAsphaltdecke,
    area: flaecheM2,
    costPerSqm: materialPreise.asphaltdecke,
    totalCost: deckeCost
  });
  totalCost += deckeCost;
  
  // Asphalttragschicht
  const tragschichtCost = flaecheM2 * materialPreise.asphalttragschicht;
  materials.push({
    name: "Asphalttragschicht",
    thickness: klasseInfo.dickeAsphaltTragschicht,
    area: flaecheM2,
    costPerSqm: materialPreise.asphalttragschicht,
    totalCost: tragschichtCost
  });
  totalCost += tragschichtCost;
  
  // Optional: Schottertragschicht
  if (klasseInfo.dickeSchotterTragschicht) {
    const schotterCost = flaecheM2 * materialPreise.schottertragschicht;
    materials.push({
      name: "Schottertragschicht",
      thickness: klasseInfo.dickeSchotterTragschicht,
      area: flaecheM2,
      costPerSqm: materialPreise.schottertragschicht,
      totalCost: schotterCost
    });
    totalCost += schotterCost;
    
    // Frostschutzschicht (Version mit Schottertragschicht)
    const frostschutzCost = flaecheM2 * materialPreise.frostschutzschicht;
    materials.push({
      name: "Frostschutzschicht",
      thickness: klasseInfo.dickeFrostschutzschicht2,
      area: flaecheM2,
      costPerSqm: materialPreise.frostschutzschicht,
      totalCost: frostschutzCost
    });
    totalCost += frostschutzCost;
  } else {
    // Frostschutzschicht (Version ohne Schottertragschicht)
    const frostschutzCost = flaecheM2 * materialPreise.frostschutzschicht;
    materials.push({
      name: "Frostschutzschicht",
      thickness: klasseInfo.dickeFrostschutzschicht1,
      area: flaecheM2,
      costPerSqm: materialPreise.frostschutzschicht,
      totalCost: frostschutzCost
    });
    totalCost += frostschutzCost;
  }
  
  return { materials, total: totalCost };
}

// Erstelle ein benutzerdefiniertes Icon für Marker
function createCustomIcon(belastungsklasse?: string): L.DivIcon {
  const color = belastungsklasse && belastungsklasse !== "none"
    ? belastungsklassenColors[belastungsklasse as keyof typeof belastungsklassenColors]
    : belastungsklassenColors.none;
  
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        width: 26px;
        height: 36px;
        position: relative;
      ">
        <svg viewBox="0 0 24 36" width="24" height="36" fill="${color}" style="position: absolute; top: 0; left: 0">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24c0-6.6-5.4-12-12-12zm0 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" />
        </svg>
      </div>
    `,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36]
  });
}

// Komponenten für die Karte

// MapClicker-Komponente zum Hinzufügen von Markern
function MapClicker({ onMarkerAdd, selectedBelastungsklasse }: MapClickerProps) {
  const map = useMapEvents({
    click: (e) => {
      onMarkerAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  
  return null;
}

// MapEvents-Komponente für Event-Handling
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

// MapControl-Komponente für Kartenkontrolle
function MapControl({ position }: MapControlProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(position, 13);
  }, [map, position]);
  
  return null;
}

// Hauptkomponente
export default function GeoMapPage() {
  // Zustand für Tabs
  const [bayernTabValue, setBayernTabValue] = useState<string>("strassenplanung");
  
  // Standorte
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  
  // Aktuelle Bearbeitung
  const [editMarker, setEditMarker] = useState<MarkerInfo | undefined>(undefined);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  
  // Straßenparameter
  const [roadType, setRoadType] = useState<string>("Gemeindestraße");
  const [customRoadWidth, setCustomRoadWidth] = useState<number | null>(null);
  const [selectedBelastungsklasse, setSelectedBelastungsklasse] = useState<string>("Bk3");
  
  // Adresssuche
  const [addressSearch, setAddressSearch] = useState<string>("");
  
  // Export-Status
  const [exportingPDF, setExportingPDF] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  
  // Ref für die Map-Container
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Straßenbreite basierend auf Typ oder benutzerdefinierten Wert
  const roadWidth = roadType === "Benutzerdefiniert" 
    ? (customRoadWidth || 3.5)
    : strassenBreiten[roadType];
  
  // Marker hinzufügen
  const handleAddMarker = useCallback((lat: number, lng: number) => {
    const newMarker: MarkerInfo = {
      position: [lat, lng],
      belastungsklasse: selectedBelastungsklasse,
    };
    
    setMarkers(prev => [...prev, newMarker]);
  }, [selectedBelastungsklasse]);
  
  // Marker bearbeiten und speichern
  const handleSaveMarker = useCallback(() => {
    if (editMarker && currentEditIndex !== null) {
      setMarkers(prev => {
        const newMarkers = [...prev];
        newMarkers[currentEditIndex] = editMarker;
        return newMarkers;
      });
    }
    
    setEditMarker(undefined);
    setCurrentEditIndex(null);
  }, [editMarker, currentEditIndex]);
  
  // Marker löschen
  const handleDeleteMarker = useCallback((index: number) => {
    setMarkers(prev => {
      const newMarkers = [...prev];
      newMarkers.splice(index, 1);
      return newMarkers;
    });
  }, []);
  
  // Route optimieren
  const handleOptimizeRoute = useCallback(() => {
    if (markers.length < 3) return;
    
    const optimizedMarkers = optimizeRouteOrder(markers);
    setMarkers(optimizedMarkers);
    
    toast({
      title: "Route optimiert",
      description: "Die Reihenfolge der Standorte wurde optimiert.",
    });
  }, [markers]);
  
  // Adresssuche
  const handleAddressSearch = useCallback(async () => {
    if (addressSearch.length < 3) return;
    
    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressSearch)}.json?access_token=${MAPBOX_TOKEN}&country=de&language=de`);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        // Adressbestandteile extrahieren
        let streetName = '';
        let houseNumber = '';
        let postalCode = '';
        let city = '';
        
        // Context enthält Informationen zu Stadt/Land/PLZ etc.
        if (feature.context) {
          for (const ctx of feature.context) {
            if (ctx.id.startsWith('postcode')) {
              postalCode = ctx.text;
            } else if (ctx.id.startsWith('place')) {
              city = ctx.text;
            }
          }
        }
        
        // Bei Adressen: Straße und Hausnummer extrahieren
        if (feature.address) {
          houseNumber = feature.address;
        }
        
        if (feature.text) {
          streetName = feature.text;
        }
        
        const newMarker: MarkerInfo = {
          position: [lat, lng],
          belastungsklasse: selectedBelastungsklasse,
          name: feature.place_name,
          strasse: streetName,
          hausnummer: houseNumber,
          plz: postalCode,
          ort: city
        };
        
        setMarkers(prev => [...prev, newMarker]);
        setAddressSearch('');
        
        toast({
          title: "Standort hinzugefügt",
          description: feature.place_name,
        });
      } else {
        toast({
          title: "Adresse nicht gefunden",
          description: "Bitte versuchen Sie eine andere Adresse",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fehler bei der Adresssuche:", error);
      toast({
        title: "Fehler bei der Adresssuche",
        description: "Bitte prüfen Sie Ihre Internetverbindung",
        variant: "destructive",
      });
    }
  }, [addressSearch, selectedBelastungsklasse]);
  
  // PDF exportieren
  const handleExportPDF = useCallback(async () => {
    if (!mapContainerRef.current || markers.length === 0) {
      return;
    }
    
    try {
      setExportingPDF(true);
      setExportProgress(10);
      
      // Polylines temporär ausblenden für den Export (verhindert Render-Probleme)
      const polylines = mapContainerRef.current.querySelectorAll('.leaflet-overlay-pane path');
      const polylinesVisibility: boolean[] = [];
      
      polylines.forEach((line: any) => {
        polylinesVisibility.push(line.style.display !== 'none');
        line.style.display = 'none';
      });
      
      setExportProgress(20);
      
      // Warte einen Moment, um sicherzustellen, dass die Änderungen gerendert werden
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Karte abfotografieren
      const mapElement = mapContainerRef.current.querySelector('.leaflet-container');
      if (!mapElement) {
        throw new Error("Karten-Element konnte nicht gefunden werden");
      }
      
      setExportProgress(40);
      
      const canvas = await html2canvas(mapElement as HTMLElement, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        scale: 2,
      });
      
      setExportProgress(60);
      
      // PDF erstellen
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
      });
      
      // Seitengröße anpassen
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Canvas-Seitenverhältnis beibehalten, aber auf 65% der ursprünglichen Größe reduzieren
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const sizeReduction = 0.65; // Karte auf 65% verkleinern
      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight) * sizeReduction;
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;
      
      // Projekttitel und Datum zum PDF hinzufügen (vor dem Bild)
      pdf.setFontSize(16);
      pdf.text('Bau - Structura: Straßenplanung', 14, 15);
      
      // Benutzerinformationen
      pdf.setFontSize(10);
      const currentDate = new Date().toLocaleDateString('de-DE');
      const currentTime = new Date().toLocaleTimeString('de-DE');
      pdf.text(`Erstellt am: ${currentDate} um ${currentTime} Uhr`, 14, 25);
      
      // Streckendaten - Tabellen-Header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(14, 32, pdfWidth - 28, 7, 'F');
      pdf.setFont("helvetica", "bold");
      pdf.text('Projektinformationen', 16, 37);
      pdf.setFont("helvetica", "normal");
      
      // Streckendaten als Tabelle
      let yPos = 42;
      const { total, segments } = calculateRouteDistances(markers);
      pdf.text(`Gesamte Streckenlänge:`, 16, yPos);
      pdf.text(`${total.toFixed(2)} km`, 85, yPos);
      yPos += 7;
      
      pdf.text(`Straßenbreite:`, 16, yPos);
      pdf.text(`${roadWidth} m`, 85, yPos);
      yPos += 7;
      
      pdf.text(`Belastungsklasse:`, 16, yPos);
      pdf.text(`${selectedBelastungsklasse}`, 85, yPos);
      yPos += 7;
      
      // Materialdaten - Tabellen-Header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(14, yPos, pdfWidth - 28, 7, 'F');
      pdf.setFont("helvetica", "bold");
      pdf.text('Materialinformationen', 16, yPos + 5);
      pdf.setFont("helvetica", "normal");
      yPos += 12;
      
      // Materialdaten als Tabelle, wenn Marker vorhanden sind
      if (markers.length > 1) {
        const { materials, total: totalCost } = calculateMaterialCosts(total, roadWidth, selectedBelastungsklasse);
        
        // Tabellen-Header
        pdf.setFillColor(245, 245, 245);
        pdf.rect(16, yPos - 5, 60, 6, 'F');
        pdf.rect(76, yPos - 5, 30, 6, 'F');
        pdf.rect(106, yPos - 5, 40, 6, 'F');
        pdf.rect(146, yPos - 5, 40, 6, 'F');
        
        pdf.setFont("helvetica", "bold");
        pdf.text('Material', 18, yPos);
        pdf.text('Fläche (m²)', 78, yPos);
        pdf.text('Preis/m²', 108, yPos);
        pdf.text('Gesamt (€)', 148, yPos);
        pdf.setFont("helvetica", "normal");
        
        yPos += 8;
        
        // Materialzeilen
        materials.forEach((material: any, index: number) => {
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(16, yPos - 5, 170, 6, 'F');
          }
          
          pdf.text(`${material.name} (${material.thickness})`, 18, yPos);
          pdf.text(`${material.area.toFixed(2)}`, 78, yPos);
          pdf.text(`${material.costPerSqm.toFixed(2)} €`, 108, yPos);
          pdf.text(`${material.totalCost.toFixed(2)} €`, 148, yPos);
          
          yPos += 8;
        });
        
        // Gesamtkosten
        pdf.setFillColor(240, 240, 240);
        pdf.rect(16, yPos - 5, 170, 6, 'F');
        pdf.setFont("helvetica", "bold");
        pdf.text('Gesamte Materialkosten:', 18, yPos);
        pdf.text(`${totalCost.toFixed(2)} €`, 148, yPos);
        pdf.setFont("helvetica", "normal");
        
        yPos += 12;
      }
      
      // Wenn Marker mit unterschiedlichen Belastungsklassen vorhanden sind, Hinweis hinzufügen
      const uniqueKlassen = Array.from(new Set(markers.filter(m => m.belastungsklasse).map(m => m.belastungsklasse)));
      if (uniqueKlassen.length > 1) {
        pdf.setFont("helvetica", "italic");
        pdf.text('Hinweis: Die Strecke enthält Abschnitte mit unterschiedlichen Belastungsklassen.', 14, yPos);
        pdf.text('Die Materialberechnung basiert auf der global gewählten Belastungsklasse.', 14, yPos + 5);
        pdf.setFont("helvetica", "normal");
        yPos += 15;
      }
      
      // Bild zur Mitte der Seite ausrichten und unter den Informationen platzieren
      const x = (pdfWidth - imgWidth) / 2;
      const y = yPos + 5; // Nach den Informationen platzieren
      
      // Bild aus dem Canvas in das PDF einfügen
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      setExportProgress(80);
      
      // PDF speichern
      pdf.save('strassenplanung.pdf');
      
      // Polylines wieder sichtbar machen
      polylines.forEach((line: any, index: number) => {
        if (polylinesVisibility[index]) {
          line.style.display = '';
        }
      });
      
    } catch (error) {
      console.error("Fehler beim Exportieren als PDF:", error);
      
      // Polylines im Fehlerfall auch wiederherstellen
      const polylines = mapContainerRef.current?.querySelectorAll('.leaflet-overlay-pane path');
      if (polylines) {
        polylines.forEach((line: any) => {
          line.style.display = '';
        });
      }
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
  const polyline = React.useMemo(() => {
    const positions = markers.map(marker => marker.position);
    return positions.length > 1 ? positions : [];
  }, [markers]);
  
  // Streckeninformationen berechnen
  const { total, segments } = React.useMemo(() => {
    return calculateRouteDistances(markers);
  }, [markers]);
  
  // Materialkosten berechnen
  const { materials, total: totalCost } = React.useMemo(() => {
    return calculateMaterialCosts(total, roadWidth, selectedBelastungsklasse);
  }, [total, roadWidth, selectedBelastungsklasse]);
  
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
          
          {/* Tabs direkt unter der Hauptüberschrift */}
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
          {/* Bayern- und DenkmalAtlas-Inhalte */}
          {bayernTabValue === "bayernatlas" && (
            <BayernMaps defaultTab="bayernatlas" />
          )}
          
          {bayernTabValue === "denkmalatlas" && (
            <BayernMaps defaultTab="denkmalatlas" />
          )}
          
          {/* Straßenplanung-Inhalt */}
          {bayernTabValue === "strassenplanung" && (
            <div className="space-y-4">
              {/* 1. Adresssuche und Buttons für Marker */}
              <Card className="bg-background shadow border-border/40">
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
                          size="sm"
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
              <Card className="bg-background shadow border-border/40">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Straßentyp */}
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
                </CardContent>
              </Card>
              
              {/* 3. Karte mit Markern */}
              <Card className="bg-background shadow border-border/40">
                <CardContent className="p-0">
                  <div className="h-[500px] relative" ref={mapContainerRef}>
                    <MapContainer
                      center={mapCenterPosition}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
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
                </CardContent>
              </Card>
              
              {/* 4. Zusammenfassung und Informationen unter der Karte */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Streckeninformationen */}
                <Card className="bg-background shadow border-border/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Streckeninformationen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {markers.length > 0 ? (
                      <div>
                        <div className="text-sm">
                          <div className="flex justify-between border-b pb-2 mb-2">
                            <span className="text-muted-foreground">Anzahl Standorte:</span>
                            <span className="font-medium">{markers.length}</span>
                          </div>
                          
                          {markers.length > 1 && (
                            <>
                              <div className="flex justify-between border-b pb-2 mb-2">
                                <span className="text-muted-foreground">Streckenlänge:</span>
                                <span className="font-medium">{total.toFixed(2)} km</span>
                              </div>
                              <div className="flex justify-between border-b pb-2 mb-2">
                                <span className="text-muted-foreground">Straßenbreite:</span>
                                <span className="font-medium">{roadWidth} m</span>
                              </div>
                              <div className="flex justify-between pb-2">
                                <span className="text-muted-foreground">Fläche gesamt:</span>
                                <span className="font-medium">{(total * roadWidth * 1000).toFixed(2)} m²</span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Belastungsklasse-Informationen */}
                        {selectedBelastungsklasse !== "none" && (
                          <div className="space-y-2 text-sm mt-4 pt-4 border-t">
                            <h4 className="font-medium">Belastungsklasse {selectedBelastungsklasse}</h4>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-muted-foreground">Beanspruchung:</div>
                              <div>{getKlasseInfo(selectedBelastungsklasse)?.beanspruchung}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-muted-foreground">Beispiel:</div>
                              <div>{getKlasseInfo(selectedBelastungsklasse)?.beispiel}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-muted-foreground">Bauklasse:</div>
                              <div>{getKlasseInfo(selectedBelastungsklasse)?.bauklasse}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* RStO-Aufbau-Visualisierung */}
                        {selectedBelastungsklasse !== "none" && (
                          <div className="relative h-24 border rounded-md bg-background overflow-hidden mt-4">
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
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>Klicken Sie auf die Karte, um Standorte hinzuzufügen.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Materialkosten */}
                <Card className="bg-background shadow border-border/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center">
                      <Layers className="w-4 h-4 mr-2" />
                      Materialkosten
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {markers.length > 1 ? (
                      <div>
                        <div className="text-sm mb-2">
                          <div className="font-medium mb-2">Materialkosten für {total.toFixed(2)} km:</div>
                          
                          <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/40 border-b">
                                  <th className="text-left p-2">Material</th>
                                  <th className="text-right p-2">Kosten</th>
                                </tr>
                              </thead>
                              <tbody>
                                {materials.map((material, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-muted/10' : ''}>
                                    <td className="p-2">
                                      <div>{material.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {material.thickness} · {material.area.toFixed(2)} m²
                                      </div>
                                    </td>
                                    <td className="text-right p-2 font-medium">{material.totalCost.toFixed(2)} €</td>
                                  </tr>
                                ))}
                                <tr className="bg-muted/40 border-t">
                                  <td className="p-2 font-medium">Gesamt</td>
                                  <td className="text-right p-2 font-medium">{totalCost.toFixed(2)} €</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>Materialdaten werden angezeigt, wenn mindestens zwei Standorte markiert sind.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Maschinenbedarf */}
                <Card className="bg-background shadow border-border/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center">
                      <Bulldozer className="w-4 h-4 mr-2" />
                      Maschinenbedarf
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {selectedBelastungsklasse !== "none" && markers.length > 1 ? (
                      <div>
                        <div className="text-sm">
                          {empfohleneBaumaschinen.length > 0 ? (
                            <div className="border rounded-md overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-muted/40 border-b">
                                    <th className="text-left p-2">Maschine</th>
                                    <th className="text-right p-2">Dauer/Kosten</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {empfohleneBaumaschinen.map((maschine, index) => {
                                    const benoetigteTage = Math.ceil((total * 1000 * roadWidth) / maschine.leistung);
                                    const maschinenkosten = benoetigteTage * maschine.tagesmiete;
                                    
                                    return (
                                      <tr key={index} className={index % 2 === 0 ? 'bg-muted/10' : ''}>
                                        <td className="p-2">
                                          <div>{maschine.name}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {maschine.leistung} m²/Tag · {maschine.tagesmiete} €/Tag
                                          </div>
                                        </td>
                                        <td className="text-right p-2">
                                          <div className="font-medium">{maschinenkosten.toFixed(2)} €</div>
                                          <div className="text-xs text-muted-foreground">{benoetigteTage} Tage</div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              <p>Keine passenden Baumaschinen für diese Belastungsklasse gefunden.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>Maschinendaten werden angezeigt, wenn eine Belastungsklasse ausgewählt ist und mindestens zwei Standorte markiert sind.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Marker-Bearbeitungsdialog */}
      <Dialog open={!!editMarker} onOpenChange={(open) => !open && setEditMarker(undefined)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Standort bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Informationen für diesen Standort.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="marker-name">Name</Label>
              <Input
                id="marker-name"
                value={editMarker?.name || ''}
                onChange={(e) => setEditMarker(prev => prev ? {...prev, name: e.target.value} : prev)}
                placeholder="z.B. Baustellenzufahrt Nord"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marker-strasse">Straße</Label>
                <Input
                  id="marker-strasse"
                  value={editMarker?.strasse || ''}
                  onChange={(e) => setEditMarker(prev => prev ? {...prev, strasse: e.target.value} : prev)}
                  placeholder="Straßenname"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="marker-hausnummer">Hausnummer</Label>
                <Input
                  id="marker-hausnummer"
                  value={editMarker?.hausnummer || ''}
                  onChange={(e) => setEditMarker(prev => prev ? {...prev, hausnummer: e.target.value} : prev)}
                  placeholder="z.B. 12a"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marker-plz">PLZ</Label>
                <Input
                  id="marker-plz"
                  value={editMarker?.plz || ''}
                  onChange={(e) => setEditMarker(prev => prev ? {...prev, plz: e.target.value} : prev)}
                  placeholder="z.B. 90402"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="marker-ort">Ort</Label>
                <Input
                  id="marker-ort"
                  value={editMarker?.ort || ''}
                  onChange={(e) => setEditMarker(prev => prev ? {...prev, ort: e.target.value} : prev)}
                  placeholder="z.B. Nürnberg"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="marker-belastungsklasse">Belastungsklasse</Label>
              <Select 
                value={editMarker?.belastungsklasse || "none"}
                onValueChange={(value) => setEditMarker(prev => prev ? {...prev, belastungsklasse: value} : prev)}
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
                  <SelectItem value="none">Keine - Nur Standort markieren</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="marker-notes">Notizen</Label>
              <Textarea
                id="marker-notes"
                value={editMarker?.notes || ''}
                onChange={(e) => setEditMarker(prev => prev ? {...prev, notes: e.target.value} : prev)}
                placeholder="Zusätzliche Informationen zum Standort"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMarker(undefined)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveMarker}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Typ-Definitionen
interface MapClickerProps {
  onMarkerAdd: (lat: number, lng: number) => void;
  selectedBelastungsklasse: string;
}

interface MapEventsProps {
  onMoveEnd: (map: L.Map) => void;
}

interface MapControlProps {
  position: [number, number];
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