import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SpeechToText } from "@/components/ui/speech-to-text";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Map as MapIcon, FileText, ExternalLink, Info, ArrowLeft, MapPin, Ruler, 
         Layers, Search, ChevronDown, Camera, Upload, Image, Calculator, Asterisk, Download, File, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
// Direktes Mapbox-Token für zuverlässiges Laden
const MAPBOX_TOKEN = "pk.eyJ1IjoibGVhemltbWVyIiwiYSI6ImNtOWlqenRoOTAyd24yanF2dmh4MzVmYnEifQ.VCg8sM94uqeuolEObT6dbw";


// Leaflet imports mit dynamic import um SSR-Probleme zu vermeiden
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
  "Bk3,2": "#2ecc71", // Grün
  "Bk1,8": "#3498db", // Blau  
  "Bk1,0": "#9b59b6", // Lila
  "Bk0,3": "#1abc9c", // Türkis - geringste Belastung
  default: "#95a5a6"  // Grau für unklassifizierte
};

// Typen für Baumaschinen und Empfehlungen
interface Baumaschine {
  name: string;
  beschreibung: string;
  eignung: string[]; // Geeignet für diese Belastungsklassen
  bildUrl?: string;
  tagesmiete: number; // Euro pro Tag
  leistung: number; // m²/Tag
}

const baumaschinen: Baumaschine[] = [
  {
    name: "Straßenfertiger (klein)",
    beschreibung: "Für kleinere Straßenbauarbeiten und Reparaturen",
    eignung: ["Bk0,3", "Bk1,0", "Bk1,8"],
    tagesmiete: 850,
    leistung: 500
  },
  {
    name: "Straßenfertiger (mittel)",
    beschreibung: "Für mittlere Straßenbauarbeiten und Landstraßen",
    eignung: ["Bk1,8", "Bk3,2", "Bk10"],
    tagesmiete: 1200,
    leistung: 800
  },
  {
    name: "Straßenfertiger (groß)",
    beschreibung: "Für große Bundesstraßen und Autobahnen",
    eignung: ["Bk10", "Bk32", "Bk100"],
    tagesmiete: 2400,
    leistung: 1500
  },
  {
    name: "Walze (7t)",
    beschreibung: "Verdichtung von Asphalt und Schotter",
    eignung: ["Bk0,3", "Bk1,0", "Bk1,8", "Bk3,2"],
    tagesmiete: 350,
    leistung: 1200
  },
  {
    name: "Walze (12t)",
    beschreibung: "Schwere Verdichtung für stark belastete Straßen",
    eignung: ["Bk3,2", "Bk10", "Bk32", "Bk100"],
    tagesmiete: 550,
    leistung: 1600
  },
  {
    name: "Bagger (Raupe)",
    beschreibung: "Für Erdarbeiten und Bodenaushub",
    eignung: ["Bk0,3", "Bk1,0", "Bk1,8", "Bk3,2", "Bk10", "Bk32", "Bk100"],
    tagesmiete: 750,
    leistung: 400
  },
  {
    name: "Radlader",
    beschreibung: "Transport von Material auf der Baustelle",
    eignung: ["Bk0,3", "Bk1,0", "Bk1,8", "Bk3,2", "Bk10", "Bk32", "Bk100"],
    tagesmiete: 650,
    leistung: 600
  },
  {
    name: "Fräse (klein)",
    beschreibung: "Entfernung bestehender Asphaltdecken",
    eignung: ["Bk0,3", "Bk1,0", "Bk1,8"],
    tagesmiete: 950,
    leistung: 350
  },
  {
    name: "Fräse (groß)",
    beschreibung: "Großflächige Entfernung bestehender Straßenbeläge",
    eignung: ["Bk3,2", "Bk10", "Bk32", "Bk100"],
    tagesmiete: 1800,
    leistung: 700
  }
];

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
      // Vereinfacht: Alle Klicks auf die Karte erlauben
      console.log("Kartenklick erkannt an Position:", e.latlng);
      onMarkerAdd(e.latlng.lat, e.latlng.lng);
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

// Komponente zur Kontrolle der Karte und zum Zentrieren auf einen bestimmten Marker
interface MapControlProps {
  position: [number, number] | null;
  zoomLevel?: number;
}

function MapControl({ position, zoomLevel = 15 }: MapControlProps) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      console.log("Zentriere Karte auf Position:", position);
      map.flyTo(position, zoomLevel, {
        animate: true,
        duration: 1.5 // Animation in Sekunden
      });
    }
  }, [map, position, zoomLevel]);
  
  return null;
}

export default function GeoMapPage() {
  const [, setLocation] = useLocation();
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.1657, 10.4515]); // Deutschland
  const [lastAddedMarkerPosition, setLastAddedMarkerPosition] = useState<[number, number] | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const materialCostsRef = useRef<HTMLDivElement>(null);
  const routeDataRef = useRef<HTMLDivElement>(null);
  const exportMapRef = useRef<HTMLDivElement>(null);
  
  // PDF Export Funktion
  const exportToPdf = async () => {
    if (!mapRef.current || markers.length < 1) {
      alert("Bitte fügen Sie zuerst Marker hinzu");
      return;
    }
    
    try {
      setIsExporting(true);
      
      // Timestamp für Dateinamen
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `Baustellen-Karte_${dateStr}_${timeStr}.pdf`;
      
      // PDF vorbereiten (A4 Querformat)
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Titel
      pdf.setFontSize(18);
      pdf.text('Baustellen-Projektdokumentation', pdfWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Erstellt am: ${date.toLocaleString('de-DE')}`, pdfWidth / 2, 22, { align: 'center' });
      
      // Karte (wenn mapRef.current gesetzt ist)
      if (mapRef.current) {
        const mapCanvas = await html2canvas(mapRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false
        });
        
        const mapImgData = mapCanvas.toDataURL('image/jpeg', 0.8);
        const mapAspectRatio = mapCanvas.width / mapCanvas.height;
        
        // Map positionieren (linke Hälfte)
        const mapWidth = pdfWidth * 0.55;
        const mapHeight = mapWidth / mapAspectRatio;
        pdf.addImage(mapImgData, 'JPEG', 10, 30, mapWidth, mapHeight);
      }
      
      // Standorte/Marker in Tabelle (rechts oben)
      pdf.setFontSize(12);
      pdf.text('Standorte', pdfWidth * 0.7, 35, { align: 'center' });
      pdf.setFontSize(8);
      
      let yPos = 40;
      markers.forEach((marker, index) => {
        pdf.text(`${index + 1}. ${marker.name || `Standort ${index + 1}`}`, pdfWidth * 0.6, yPos);
        yPos += 5;
        if (marker.strasse) {
          pdf.text(`   ${marker.strasse} ${marker.hausnummer}, ${marker.plz} ${marker.ort}`, pdfWidth * 0.6, yPos);
          yPos += 5;
        }
        if (marker.belastungsklasse) {
          pdf.text(`   Belastungsklasse: ${marker.belastungsklasse}`, pdfWidth * 0.6, yPos);
          yPos += 5;
        }
        yPos += 2;
      });
      
      // Streckendaten (rechts mitte)
      const routeDistances = calculateRouteDistances(markers);
      const totalKm = routeDistances.total;
      
      yPos += 5;
      pdf.setFontSize(12);
      pdf.text('Streckendaten', pdfWidth * 0.7, yPos, { align: 'center' });
      pdf.setFontSize(8);
      
      yPos += 7;
      pdf.text(`Gesamtstrecke: ${totalKm.toFixed(2)} km`, pdfWidth * 0.6, yPos);
      
      // Wenn eine Belastungsklasse und Straßenbreite ausgewählt ist, zeige Materialkosten
      if (selectedBelastungsklasse !== "none" && roadWidth > 0) {
        // Materialkosten (rechts unten)
        const costs = calculateMaterialCosts(totalKm, roadWidth, selectedBelastungsklasse);
        
        yPos += 10;
        pdf.setFontSize(12);
        pdf.text('Materialkosten', pdfWidth * 0.7, yPos, { align: 'center' });
        pdf.setFontSize(8);
        
        yPos += 7;
        pdf.text(`Belastungsklasse: ${selectedBelastungsklasse}`, pdfWidth * 0.6, yPos);
        yPos += 5;
        pdf.text(`Straßenbreite: ${roadWidth.toFixed(1)} m`, pdfWidth * 0.6, yPos);
        yPos += 5;
        pdf.text(`Gesamtfläche: ${(totalKm * 1000 * roadWidth).toFixed(0)} m²`, pdfWidth * 0.6, yPos);
        
        yPos += 7;
        pdf.text('Schicht', pdfWidth * 0.6, yPos);
        pdf.text('Dicke (cm)', pdfWidth * 0.7, yPos);
        pdf.text('Kosten (€)', pdfWidth * 0.8, yPos);
        
        costs.materials.forEach((material, i) => {
          yPos += 5;
          pdf.text(material.name, pdfWidth * 0.6, yPos);
          pdf.text(material.thickness.toString(), pdfWidth * 0.7, yPos);
          pdf.text(material.totalCost.toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }), pdfWidth * 0.8, yPos);
        });
        
        yPos += 7;
        pdf.setFontSize(10);
        pdf.text('Gesamtkosten:', pdfWidth * 0.6, yPos);
        pdf.text(costs.total.toLocaleString('de-DE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' €', pdfWidth * 0.8, yPos);
      }
      
      // Fußzeile
      pdf.setFontSize(8);
      pdf.text('Automatisch erstellt mit der Bau - Structura App', pdfWidth / 2, pdfHeight - 10, { align: 'center' });
      
      // PDF speichern
      pdf.save(fileName);
    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      alert('Beim Exportieren ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsExporting(false);
    }
  };
  
  // State-Update-Log für Debugging
  useEffect(() => {
    console.log("Marker wurden aktualisiert:", markers);
  }, [markers]);
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
    console.log("addMarker aufgerufen mit:", lat, lng);
    
    // Reverse Geocoding verwenden, um Adresse zu ermitteln
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=de&types=address&language=de`
    )
      .then(response => {
        if (!response.ok) {
          throw new Error("Fehler bei der Adresssuche");
        }
        return response.json();
      })
      .then(data => {
        let strasse = "";
        let hausnummer = "";
        let plz = "";
        let ort = "";
        let markerName = `Standort ${markers.length + 1}`;
        
        if (data.features && data.features.length > 0) {
          const addressInfo = data.features[0];
          
          // Adresskomponenten extrahieren
          if (addressInfo.text) {
            // Mapbox liefert oft Straße und Hausnummer zusammen im "text"-Feld
            const addressParts = addressInfo.text.split(' ');
            
            // Letztes Element könnte die Hausnummer sein, wenn es numerisch ist
            const lastPart = addressParts[addressParts.length - 1];
            if (/^\d+[a-zA-Z]?$/.test(lastPart)) {
              hausnummer = lastPart;
              strasse = addressParts.slice(0, -1).join(' ');
            } else {
              strasse = addressInfo.text;
            }
          }
          
          if (addressInfo.context) {
            // Mapbox liefert Postleitzahl und Ort in context-Array
            for (const context of addressInfo.context) {
              if (context.id.startsWith('postcode')) {
                plz = context.text;
              } else if (context.id.startsWith('place')) {
                ort = context.text;
              }
            }
          }
          
          // Einen aussagekräftigen Namen für den Marker generieren
          if (strasse && hausnummer && ort) {
            markerName = `${strasse} ${hausnummer}, ${ort}`;
          } else if (strasse && ort) {
            markerName = `${strasse}, ${ort}`;
          } else if (ort) {
            markerName = ort;
          }
        }
        
        const newMarkerPosition: [number, number] = [lat, lng];
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
        
        console.log("Füge neuen Marker hinzu:", newMarker);
        setMarkers([...markers, newMarker]);
        setSelectedMarkerIndex(markers.length);
        
        // Setze den letzten hinzugefügten Marker für das Auto-Panning
        setLastAddedMarkerPosition(newMarkerPosition);
      })
      .catch(error => {
        console.error("Fehler beim Reverse Geocoding:", error);
        
        // Fallback: Marker ohne Adressinformationen hinzufügen
        const newMarkerPosition: [number, number] = [lat, lng];
        const newMarker: MarkerInfo = {
          position: newMarkerPosition,
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
        setLastAddedMarkerPosition(newMarkerPosition);
      });
  }, [markers, selectedBelastungsklasse]);
  
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
    
    // Setze den letzten hinzugefügten Marker für das Auto-Panning
    setLastAddedMarkerPosition(tempLocation);
    
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
      
      {/* Hinweis auf Bautagebuch als zentrale Dokumentationslösung */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex-1">
          <h3 className="text-lg font-medium flex items-center text-blue-700 mb-2">
            <Info className="h-5 w-5 mr-1" /> Bautagebuch-Dokumentation
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Nutzen Sie das Bautagebuch für die zentrale Dokumentation aller relevanten Bauprojektaktivitäten!
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Button className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-auto" onClick={() => setLocation("/construction-diary-debug")}>
            <FileText className="h-4 w-4 mr-2" />
            Zum Bautagebuch
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-120px)] flex flex-col">
            {/* Belastungsklasse-Auswahl als separater Button über der Karte */}
            <div className="p-2 mx-4 mt-4 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
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
      </div>
    </div>
    

    </>
  );
}