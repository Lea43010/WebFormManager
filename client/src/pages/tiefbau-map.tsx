import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  BarChart, 
  Save, 
  Trash2,
  Map,
  Shovel,
  FileDown,
  ExternalLink,
  Camera, 
  Mic,
  MicOff,
  Paperclip
} from 'lucide-react';
import TiefbauPDFGenerator from '@/components/pdf/tiefbau-pdf-generator';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Vereinfachter DOM-basierter Google Maps-Komponente
import BasicGoogleMap from '@/components/maps/basic-google-map';

// Recharts-Imports für das Höhenprofil wurden entfernt

// Typdefinitionen für das Höhenprofil wurden entfernt

interface Bodenart {
  id: number;
  name: string;
  beschreibung: string;
  dichte: number;
  belastungsklasse: string;
  material_kosten_pro_m2: number;
  bearbeitungshinweise: string;
}

interface Maschine {
  id: number;
  name: string;
  typ: string;
  beschreibung: string;
  leistung: string;
  kosten_pro_stunde: number;
  kosten_pro_tag: number;
  kosten_pro_woche: number;
  kraftstoffverbrauch: number;
  gewicht: number;
  bild_url?: string;
}

const TiefbauMap: React.FC = () => {
  // Funktion zum Öffnen eines externen Links in einem neuen Tab
  const handleExternalLink = (url: string, label: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    console.log(`Externer Link geöffnet: ${label}`);
  };

  // State für die Route und Distanz
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{lat: number, lng: number}>>([]);
  const [distance, setDistance] = useState(0);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  
  // Gemeinsamer Loading-State für alle Komponenten
  const [loading, setLoading] = useState(false);
  
  // State für Höhendaten wurde entfernt
  
  // State für Bodenarten und Maschinen
  const [bodenarten, setBodenarten] = useState<Bodenart[]>([]);
  const [selectedBodenart, setSelectedBodenart] = useState<string>('');
  const [maschinen, setMaschinen] = useState<Maschine[]>([]);
  const [filteredMaschinen, setFilteredMaschinen] = useState<Maschine[]>([]);
  
  // Berechne die ausgewählte Bodenart als Objekt für einfachen Zugriff
  const selectedBodenartObj = selectedBodenart 
    ? bodenarten.find(b => b.id.toString() === selectedBodenart.toString()) 
    : null;
  
  // State für Kosten
  const [streckenkostenProM2, setStreckenkostenProM2] = useState(0);
  const [gesamtstreckenkosten, setGesamtstreckenkosten] = useState(0);
  
  // State für Projekte
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // States für Bemerkungsfeld mit Sprach- und Fotofunktion
  const [remarks, setRemarks] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedText, setRecordedText] = useState<string>('');
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  
  // Referenz für Dateiauswahl
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Referenz für die Spracherkennung
  const recognitionRef = useRef<any>(null);
  
  // Loading-State wurde bereits oben definiert
  // const [loading, setLoading] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  
  // Persistenter Route-State für Tab-Wechsel
  const [savedRoute, setSavedRoute] = useState<Array<{lat: number, lng: number}>>([]);
  
  // Container ID für Map
  const mapContainerId = "tiefbau-map-container";
  
  // Toast-Hook
  const { toast } = useToast();
  
  // Lade Projekte beim ersten Laden
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Projekte konnten nicht geladen werden');
        }
        const data = await response.json();
        console.log('Geladene Projekte:', data);
        setProjects(data);
        
        // Standardmäßig ist "Keine Auswahl" aktiv, daher setzen wir es auf null
        setSelectedProject(null);
      } catch (error) {
        console.error('Fehler beim Laden der Projekte:', error);
        toast({
          variant: 'destructive',
          title: 'Fehler',
          description: 'Projekte konnten nicht geladen werden.'
        });
      } finally {
        setIsLoadingProjects(false);
      }
    };
    
    loadProjects();
  }, [toast]);
  
  // Wenn ein Projekt ausgewählt wird, prüfen ob Koordinaten vorhanden sind und setzen diese
  useEffect(() => {
    if (selectedProject && projects.length > 0) {
      const selectedProjectData = projects.find(project => project.id === selectedProject);
      if (selectedProjectData) {
        // Wenn das Projekt Koordinaten hat (Längen- und Breitengrad), zentriere die Karte
        if (selectedProjectData.project_latitude && selectedProjectData.project_longitude) {
          const projectLocation = {
            lat: parseFloat(selectedProjectData.project_latitude),
            lng: parseFloat(selectedProjectData.project_longitude)
          };
          
          // Wir könnten diesen Wert an die BasicGoogleMap übergeben, 
          // aber die Komponente hat keinen Mechanismus, um den Mittelpunkt zu aktualisieren
          // Hier könnte man später eine Funktion hinzufügen, die es erlaubt,
          // die Karte neu zu zentrieren
          
          toast({
            title: "Projekt ausgewählt",
            description: `${selectedProjectData.project_name || 'Projekt ' + selectedProjectData.id} wurde ausgewählt.`,
            duration: 3000
          });
        }
      }
    }
  }, [selectedProject, projects, toast]);
  
  // Initialisierung der Spracherkennung
  useEffect(() => {
    // Überprüfen, ob die Web Speech API verfügbar ist
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Konfiguration
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'de-DE';
      
      // Event-Handler
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setRecordedText(prev => prev + transcript + ' ');
            setRemarks(prev => prev + transcript + ' ');
          } else {
            interimTranscript += transcript;
          }
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Spracherkennungsfehler:", event.error);
        setIsRecording(false);
        toast({
          title: "Spracherkennungsfehler",
          description: `Fehler bei der Spracherkennung: ${event.error}`,
          variant: "destructive"
        });
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
      // Aufräumen
      if (recognitionRef.current) {
        if (isRecording) {
          try {
            recognitionRef.current.stop();
          } catch (error) {
            console.error('Fehler beim Stoppen der Spracherkennung:', error);
          }
        }
      }
    };
  }, [isRecording, toast]);
  
  // Funktion zum Starten der Spracherkennung
  const startSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast({
          title: "Spracherkennung aktiv",
          description: "Bitte sprechen Sie jetzt...",
        });
      } catch (error) {
        console.error('Fehler beim Starten der Spracherkennung:', error);
        toast({
          title: "Fehler",
          description: "Die Spracherkennung konnte nicht gestartet werden",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Nicht unterstützt",
        description: "Spracherkennung wird in diesem Browser nicht unterstützt",
        variant: "destructive"
      });
    }
  };
  
  // Funktion zum Stoppen der Spracherkennung
  const stopSpeechRecognition = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
        toast({
          title: "Spracherkennung beendet",
          description: "Der Text wurde in das Bemerkungsfeld übernommen",
        });
      } catch (error) {
        console.error('Fehler beim Stoppen der Spracherkennung:', error);
      }
    }
  };
  
  // Funktion zum Hochladen eines Fotos
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      Array.from(event.target.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const preview = e.target?.result as string;
            setPhotos(prev => [...prev, { file, preview }]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };
  
  // Funktion zum Entfernen eines Fotos
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };
  
  // Funktion zum Speichern der Bemerkungen mit Fotos
  const saveRemarks = async () => {
    if (!selectedProject) {
      toast({
        title: "Projekt erforderlich",
        description: "Bitte wählen Sie ein Projekt aus, bevor Sie Bemerkungen speichern.",
        variant: "destructive"
      });
      return;
    }
    
    if (!remarks.trim() && photos.length === 0) {
      toast({
        title: "Keine Daten",
        description: "Bitte geben Sie Bemerkungen ein oder fügen Sie Fotos hinzu.",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    
    try {
      // Fotos in der Dokumentenverwaltung speichern
      const uploadedPhotos = [];
      
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('file', photo.file);
        formData.append('projectId', selectedProject.toString());
        formData.append('fileType', 'IMAGE');
        formData.append('fileCategory', 'TIEFBAU');
        formData.append('description', `Foto zur Tiefbau-Bemerkung: ${remarks.substring(0, 50)}${remarks.length > 50 ? '...' : ''}`);
        
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          uploadedPhotos.push(data);
        } else {
          throw new Error(`Fehler beim Hochladen des Fotos: ${response.statusText}`);
        }
      }
      
      // Bemerkungen mit Referenzen zu den Fotos speichern
      const remarkData = {
        projectId: selectedProject,
        text: remarks,
        photoIds: uploadedPhotos.map(photo => photo.id),
        coordinates: routeCoordinates.length > 0 ? {
          lat: routeCoordinates[0].lat,
          lng: routeCoordinates[0].lng
        } : null
      };
      
      // Bemerkungen speichern - API-Endpunkt muss noch implementiert werden
      const response = await fetch('/api/tiefbau/remarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(remarkData),
      });
      
      if (response.ok) {
        toast({
          title: "Gespeichert",
          description: "Bemerkungen und Fotos wurden erfolgreich gespeichert.",
        });
        
        // Zurücksetzen der Formulardaten
        setRemarks('');
        setRecordedText('');
        setPhotos([]);
      } else {
        throw new Error(`Fehler beim Speichern der Bemerkungen: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Lade Bodenarten beim ersten Laden
  useEffect(() => {
    // Dummy-Daten für Bodenarten
    const dummyBodenarten: Bodenart[] = [
      {
        id: 1,
        name: 'Asphaltbeton',
        beschreibung: 'Standard-Asphaltbelag für Straßen',
        dichte: 2400,
        belastungsklasse: 'SLW 60',
        material_kosten_pro_m2: 25.50,
        bearbeitungshinweise: 'Verdichtung mit Walzen erforderlich'
      },
      {
        id: 2,
        name: 'Sandboden',
        beschreibung: 'Lockerer Sandboden',
        dichte: 1600,
        belastungsklasse: 'SLW 30',
        material_kosten_pro_m2: 6.80,
        bearbeitungshinweise: 'Leicht zu bearbeiten, benötigt Stabilisierung'
      },
      {
        id: 3,
        name: 'Lehmboden',
        beschreibung: 'Bindiger Lehmboden',
        dichte: 1800,
        belastungsklasse: 'SLW 40',
        material_kosten_pro_m2: 8.20,
        bearbeitungshinweise: 'Bei Nässe schwer zu bearbeiten'
      },
      {
        id: 4,
        name: 'Kiesboden',
        beschreibung: 'Kies mit verschiedenen Korngrößen',
        dichte: 1900,
        belastungsklasse: 'SLW 50',
        material_kosten_pro_m2: 12.40,
        bearbeitungshinweise: 'Gute Drainage, einfach zu verdichten'
      },
      {
        id: 5,
        name: 'Fels',
        beschreibung: 'Harter Felsuntergrund',
        dichte: 2700,
        belastungsklasse: 'SLW 60',
        material_kosten_pro_m2: 42.00,
        bearbeitungshinweise: 'Sprengung oder schwere Maschinen erforderlich'
      }
    ];

    setBodenarten(dummyBodenarten);

    // Dummy-Daten für Maschinen
    const dummyMaschinen: Maschine[] = [
      {
        id: 1,
        name: 'CAT 320',
        typ: 'Bagger',
        beschreibung: '20-Tonnen Hydraulikbagger',
        leistung: '120 kW',
        kosten_pro_stunde: 120.50,
        kosten_pro_tag: 950.00,
        kosten_pro_woche: 4500.00,
        kraftstoffverbrauch: 18.5,
        gewicht: 20000
      },
      {
        id: 2,
        name: 'Bomag BW 213',
        typ: 'Walze',
        beschreibung: 'Vibrationswalze für Erdarbeiten',
        leistung: '98 kW',
        kosten_pro_stunde: 85.00,
        kosten_pro_tag: 680.00,
        kosten_pro_woche: 3200.00,
        kraftstoffverbrauch: 12.0,
        gewicht: 12500
      },
      {
        id: 3,
        name: 'Wirtgen W 100',
        typ: 'Fräse',
        beschreibung: 'Kompakte Kaltfräse',
        leistung: '170 kW',
        kosten_pro_stunde: 210.00,
        kosten_pro_tag: 1680.00,
        kosten_pro_woche: 8000.00,
        kraftstoffverbrauch: 35.0,
        gewicht: 18000
      },
      {
        id: 4,
        name: 'Vögele Super 1800-3',
        typ: 'Asphaltfertiger',
        beschreibung: 'Straßenfertiger mit hoher Einbaubreite',
        leistung: '129 kW',
        kosten_pro_stunde: 230.00,
        kosten_pro_tag: 1840.00,
        kosten_pro_woche: 8800.00,
        kraftstoffverbrauch: 30.0,
        gewicht: 19000
      },
      {
        id: 5,
        name: 'Liebherr PR 736',
        typ: 'Planierraupe',
        beschreibung: 'Hydrostatische Planierraupe',
        leistung: '150 kW',
        kosten_pro_stunde: 140.00,
        kosten_pro_tag: 1120.00,
        kosten_pro_woche: 5300.00,
        kraftstoffverbrauch: 22.0,
        gewicht: 20170
      }
    ];

    setMaschinen(dummyMaschinen);
    setFilteredMaschinen(dummyMaschinen);
    
    // Später API-Anfrage
    // In einer echten Implementierung würden wir hier die API-Endpunkte abfragen
    // const fetchData = async () => {
    //   try {
    //     const bodenResponse = await apiRequest("GET", "/api/bodenarten");
    //     if (bodenResponse.ok) {
    //       const bodenData = await bodenResponse.json();
    //       setBodenarten(bodenData);
    //     }
    //     
    //     const maschinenResponse = await apiRequest("GET", "/api/maschinen");
    //     if (maschinenResponse.ok) {
    //       const maschinenData = await maschinenResponse.json();
    //       setMaschinen(maschinenData);
    //       setFilteredMaschinen(maschinenData);
    //     }
    //   } catch (error) {
    //     console.error("Fehler beim Laden der Daten:", error);
    //     toast({
    //       title: "Fehler",
    //       description: "Die Daten konnten nicht geladen werden.",
    //       variant: "destructive"
    //     });
    //   }
    // };
    // fetchData();
  }, []);
  
  // Berechne die Kosten, wenn sich Bodenart oder Strecke ändert
  useEffect(() => {
    if (selectedBodenart && distance > 0) {
      const bodenart = bodenarten.find(b => b.id.toString() === selectedBodenart);
      if (bodenart) {
        // Annahme: 3m Breite für die Straße
        const strassenBreite = 3;
        const flaeche = distance * 1000 * strassenBreite; // in m²
        const kostenProM2 = bodenart.material_kosten_pro_m2;
        const gesamtkosten = flaeche * kostenProM2;
        
        setStreckenkostenProM2(kostenProM2);
        setGesamtstreckenkosten(gesamtkosten);
      }
    }
  }, [selectedBodenart, distance, bodenarten]);
  
  // Handler für Routenänderungen
  const handleRouteChange = (
    route: Array<{lat: number, lng: number}>, 
    startAddr?: string, 
    endAddr?: string
  ) => {
    setRouteCoordinates(route);
    
    // Route in den persistenten State speichern für Tab-Wechsel
    setSavedRoute(route);
    
    // Start- und Endadressen setzen, wenn vorhanden
    if (startAddr) {
      setStartAddress(startAddr);
    }
    
    if (endAddr) {
      setEndAddress(endAddr);
    }
    
    // Distanz berechnen
    if (route.length >= 2) {
      let totalDistance = 0;
      
      for (let i = 1; i < route.length; i++) {
        const p1 = new google.maps.LatLng(route[i-1].lat, route[i-1].lng);
        const p2 = new google.maps.LatLng(route[i].lat, route[i].lng);
        
        // Distanz in Metern
        const segmentDistance = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
        totalDistance += segmentDistance;
      }
      
      // Umrechnung in Kilometer mit 2 Nachkommastellen
      setDistance(parseFloat((totalDistance / 1000).toFixed(2)));
    } else {
      setDistance(0);
    }
    
    console.log(`Route aktualisiert: ${route.length} Punkte gespeichert`);
  };
  
  // Handler zum Löschen aller Marker
  const clearMarkers = () => {
    setRouteCoordinates([]);
    setSavedRoute([]); // Auch die persistente Route zurücksetzen
    setDistance(0);
    setStartAddress('');
    setEndAddress('');
    
    // Benachrichtigung, dass die Route gelöscht wurde
    toast({
      title: "Route zurückgesetzt",
      description: "Die Route wurde erfolgreich gelöscht und der Speicher freigegeben.",
      duration: 3000
    });
  };
  
  // Höhenprofil-Funktion wurde entfernt
  
  // Filtere Maschinen nach Bodenart
  const filterMaschinenByBodenart = (bodenartId: string) => {
    // Sicherheitsprüfung, ob maschinen vorhanden ist
    if (!maschinen || maschinen.length === 0) {
      setFilteredMaschinen([]);
      return;
    }
    
    if (!bodenartId) {
      setFilteredMaschinen(maschinen);
      return;
    }
    
    try {
      // Statt einer zufälligen Filterung verwenden wir eine deterministische Methode
      // basierend auf der ID der Maschine und Bodenart
      const bodenNumId = parseInt(bodenartId, 10);
      if (isNaN(bodenNumId)) {
        console.error("Ungültige Bodenart-ID");
        setFilteredMaschinen(maschinen);
        return;
      }
      
      const filtered = maschinen.filter(maschine => {
        // Deterministische Filterung basierend auf Maschinen-ID und Bodenart-ID
        // Maschinen mit gerader ID für Bodenarten mit gerader ID und umgekehrt
        if (bodenNumId % 2 === 0) {
          return maschine.id % 2 === 0;
        } else {
          return maschine.id % 2 === 1;
        }
      });
      
      setFilteredMaschinen(filtered.length > 0 ? filtered : []);
    } catch (error) {
      console.error("Fehler bei der Maschinenfilterung:", error);
      setFilteredMaschinen(maschinen);
    }
  };
  
  // Route speichern
  const saveRoute = async () => {
    if (routeCoordinates.length < 2) {
      toast({
        title: "Fehler",
        description: "Bitte markieren Sie mindestens zwei Punkte auf der Karte.",
        variant: "destructive",
        duration: 6000
      });
      return;
    }
    
    if (!selectedProject) {
      toast({
        title: "Hinweis",
        description: "Bitte wählen Sie ein Projekt aus, dem diese Strecke zugeordnet werden soll.",
        duration: 6000
      });
      return;
    }
    
    // Prüfen, ob Start- und Endadresse gesetzt sind
    const effectiveStartAddress = startAddress || `${routeCoordinates[0].lat.toFixed(6)}, ${routeCoordinates[0].lng.toFixed(6)}`;
    const effectiveEndAddress = endAddress || `${routeCoordinates[routeCoordinates.length-1].lat.toFixed(6)}, ${routeCoordinates[routeCoordinates.length-1].lng.toFixed(6)}`;
    
    // Ein sinnvoller Name für die Route
    const routeName = `Route von ${effectiveStartAddress.split(',')[0]} nach ${effectiveEndAddress.split(',')[0]}`;
    
    try {
      // Bereite die Koordinaten-Daten für den Server vor
      // Wandle alle Objekte in einfache Strukturen um, die gut serialisiert werden können
      const simplifiedCoordinates = routeCoordinates.slice(0, 50).map(point => ({
        lat: Number(point.lat),
        lng: Number(point.lng)
      }));
      
      // Finde die ausgewählte Bodenart und das Projekt
      const selectedBodenartObj = bodenarten.find(b => b.id.toString() === selectedBodenart);
      const projectData = projects.find(p => p.id === selectedProject);
      
      // Stellen sicher, dass alle Werte den richtigen Typ haben
      const routeData = {
        name: String(routeName || `Route ${new Date().toLocaleString('de-DE')}`),
        start_address: String(effectiveStartAddress || 'Unbekannter Startpunkt'),
        end_address: String(effectiveEndAddress || 'Unbekannter Endpunkt'),
        distance: Math.round(Number(distance || 100)), // Fallback-Abstand, falls keine Berechnung möglich war
        route_data: simplifiedCoordinates,
        project_id: selectedProject, // Verknüpfe die Route mit dem ausgewählten Projekt
        project_name: projectData?.projectName || '',
        bodenart_id: selectedBodenart ? parseInt(selectedBodenart) : null,
        bodenart_name: selectedBodenartObj?.name || '',
        kosten_pro_m2: streckenkostenProM2,
        gesamtkosten: gesamtstreckenkosten
      };
      
      // Detailliertes Logging vor Absenden
      console.log('Sende folgende Route an API:', JSON.stringify(routeData, null, 2));
      
      // Zum normalen Endpunkt senden
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(routeData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API-Fehler-Details:', errorData);
        throw new Error(errorData.error || 'Fehler beim Speichern der Route');
      }
      
      const data = await response.json();
      toast({
        title: "Erfolg",
        description: `Route "${data.name}" erfolgreich gespeichert!`,
        duration: 5000
      });
      
      // Optional: Zurück zur Kostenkalkulation navigieren
      // setLocation('/kostenkalkulation');
    } catch (error: any) {
      console.error('Fehler beim Speichern der Route:', error);
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Speichern der Route",
        variant: "destructive",
        duration: 6000
      });
    }
  };
  
  // formatElevationData-Funktion wurde entfernt
  
  return (
    <div className="container mx-auto p-4">
      {/* Verstecktes Input-Element für Fotouploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*"
        multiple
        onChange={handlePhotoUpload}
        className="hidden"
      />
      <div className="flex flex-col md:flex-row md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0 md:mr-6">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Tiefbau-Streckenplanung</h1>
        </div>
        
        {/* Projekt-Auswahl als Pflichtfeld */}
        <div className="flex-grow md:max-w-xs">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="project-select" className="text-sm font-medium">
                Projekt auswählen <span className="text-red-500">*</span>
              </Label>
              {!selectedProject && (
                <span className="text-red-500 text-xs">Pflichtfeld</span>
              )}
            </div>
            <Select 
              value={selectedProject?.toString() || "0"} 
              onValueChange={(value) => {
                const projectId = parseInt(value);
                setSelectedProject(projectId === 0 ? null : projectId);
              }}
              disabled={isLoadingProjects}
            >
              <SelectTrigger id="project-select" className={!selectedProject ? "border-red-300 focus:ring-red-500" : ""}>
                <SelectValue placeholder="Projekt auswählen" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingProjects ? (
                  <div className="p-2 text-center">Projekte werden geladen...</div>
                ) : (
                  <>
                    <SelectItem value="0" disabled>Bitte auswählen</SelectItem>
                    {projects.map((project) => {
                      // Expliziter Name für die Anzeige konstruieren
                      const displayName = project.projectName 
                        ? `${project.projectName} (${project.projectArt || 'Projekt'})`
                        : `Projekt ${project.id}`;
                      
                      return (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {displayName}
                        </SelectItem>
                      );
                    })}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="karte" className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="karte">
            <Map className="h-4 w-4 mr-2" />
            Kartenansicht
          </TabsTrigger>
          <Button 
            className="text-sm rounded-none bg-transparent hover:bg-gray-100 p-2 border-none text-gray-700 hover:text-black flex items-center gap-2 h-9"
            onClick={() => window.open("https://geoportal.bayern.de/denkmalatlas/", "_blank")}
          >
            <Map className="h-4 w-4" />
            DenkmalAtlas
          </Button>
          <Button 
            className="text-sm rounded-none bg-transparent hover:bg-gray-100 p-2 border-none text-gray-700 hover:text-black flex items-center gap-2 h-9"
            onClick={() => window.open("https://geoportal.bayern.de/bayernatlas/", "_blank")}
          >
            <Map className="h-4 w-4" />
            BayernAtlas
          </Button>
          <TabsTrigger value="bund">
            <Map className="h-4 w-4 mr-2" />
            Denkmal-Dienste
          </TabsTrigger>
        </TabsList>
        
        {/* Kartenansicht Tab */}
        <TabsContent value="karte" className="pt-4">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Kartenansicht</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Spezifischer Platzhalter für die Map, der von der Komponente gefunden werden kann */}
              <div className="tiefbau-map-placeholder">
                {/* Container mit der id, die in der Map-Komponente erwartet wird */}
                <div id="tiefbau-map-container" style={{ width: '100%', height: '700px' }}></div>
              </div>
              <BasicGoogleMap
                onRouteChange={handleRouteChange}
                onMarkersClear={clearMarkers}
                initialCenter={{ lat: 48.137154, lng: 11.576124 }} // München
                initialZoom={12}
                searchOutsideMap={true} // Adresssuche außerhalb der Karte platzieren
                initialRoute={savedRoute} // Gespeicherte Route übergeben
              />
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Streckeninformationen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium">Streckenlänge: {distance} km</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearMarkers} disabled={loading}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Strecke löschen
                  </Button>

                  <Button onClick={saveRoute} disabled={loading}>
                    <Save className="h-4 w-4 mr-1" />
                    Route speichern
                  </Button>
                  
                  {/* PDF Export Button - wird nur angezeigt, wenn eine Route vorhanden ist */}
                  {routeCoordinates.length > 0 && (
                    <TiefbauPDFGenerator
                      projectName={selectedProject ? 
                        projects.find(p => p.id === selectedProject)?.projectName 
                        : null}
                      routeData={{
                        start: startAddress,
                        end: endAddress,
                        distance: distance
                      }}
                      bodenartData={selectedBodenart && selectedBodenartObj ? {
                        name: selectedBodenartObj.name,
                        beschreibung: selectedBodenartObj.beschreibung,
                        kostenProM2: streckenkostenProM2,
                        gesamtkosten: gesamtstreckenkosten
                      } : null}
                      maschinenData={filteredMaschinen.length > 0 ? 
                        filteredMaschinen.map(m => ({
                          id: m.id,
                          name: m.name,
                          typ: m.typ,
                          leistung: m.leistung,
                          kostenProStunde: m.kosten_pro_stunde
                        })) : null}
                      mapContainerId={mapContainerId}
                    />
                  )}
                </div>
              </div>
              

            </CardContent>
          </Card>
          
          {/* Neue Bemerkungsfeld-Karte mit Sprach- und Fotofunktion */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Paperclip className="h-5 w-5 mr-2" />
                Bemerkungen zum Tiefbau-Projekt
              </CardTitle>
              <CardDescription>
                Erfassen Sie Bemerkungen, Fotos und Sprachnotizen zu diesem Tiefbau-Projekt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Textfeld für Bemerkungen */}
                <div className="space-y-2">
                  <Label htmlFor="remarks" className="text-sm font-medium">
                    Beschreibung oder Anmerkungen
                  </Label>
                  <Textarea
                    id="remarks"
                    placeholder="Geben Sie hier Ihre Bemerkungen zum Tiefbau-Projekt ein..."
                    className="min-h-[120px] resize-y"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
                
                {/* Aktionsbuttons für Sprach- und Fotofunktion */}
                <div className="flex flex-wrap gap-2">
                  {/* Spracherkennungsbutton */}
                  {isRecording ? (
                    <Button 
                      variant="destructive" 
                      onClick={stopSpeechRecognition}
                      className="flex items-center"
                    >
                      <MicOff className="h-4 w-4 mr-2" />
                      Spracherkennung beenden
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={startSpeechRecognition}
                      className="flex items-center"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Spracheingabe starten
                    </Button>
                  )}
                  
                  {/* Fotoupload-Button */}
                  <Button 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Fotos hinzufügen
                  </Button>
                  
                  {/* Speichern-Button */}
                  <Button
                    onClick={saveRemarks}
                    disabled={uploading || (!remarks.trim() && photos.length === 0) || !selectedProject}
                    className="ml-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {uploading ? 'Wird gespeichert...' : 'Bemerkungen speichern'}
                  </Button>
                </div>
                
                {/* Anzeige hochgeladener Fotos */}
                {photos.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Hochgeladene Fotos ({photos.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={photo.preview} 
                            alt={`Foto ${index + 1}`} 
                            className="h-24 w-full object-cover rounded-md border border-border"
                          />
                          <button 
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Foto entfernen"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Abhängigkeit vom Projekt-Auswahlfeld anzeigen, wenn kein Projekt ausgewählt ist */}
                {!selectedProject && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                    <strong>Hinweis:</strong> Sie müssen ein Projekt auswählen, bevor Sie Bemerkungen speichern können.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Verstecktes Input-Element für Foto-Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
        </TabsContent>
        {/* DenkmalAtlas Bayern Tab - Ersetzt durch direkten Weiterleitungs-Button */}

        {/* BayernAtlas Geoportal Tab - Ersetzt durch direkten Weiterleitungs-Button */}

        {/* Bundesweite Dienste Tab */}
        <TabsContent value="bund" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm rounded-lg">
              <CardHeader>
                <CardTitle className="text-[#111827]">Bundesweite Denkmalkarten</CardTitle>
                <CardDescription className="text-gray-600">
                  Überblick weiterer Denkmal-Informationssysteme in Deutschland
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExternalLink("https://www.deutsche-digitale-bibliothek.de/newspaper", "Deutsche Digitale Bibliothek")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Deutsche Digitale Bibliothek</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => handleExternalLink("https://www.dnk.de/im-fokus/deutsches-kulturerbe/", "Deutsches Kulturerbe")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Deutsches Kulturerbe (DNK)</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => handleExternalLink("https://www.archaeologie-online.de/", "Archäologie Online")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Archäologie Online</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm rounded-lg">
              <CardHeader>
                <CardTitle className="text-[#111827]">Geodaten Portale</CardTitle>
                <CardDescription className="text-gray-600">
                  Wichtige Geoportale und Kartendienste für Planungsgrundlagen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExternalLink("https://www.geoportal.de/", "Geoportal Deutschland")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Geoportal Deutschland</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => handleExternalLink("https://gdz.bkg.bund.de/", "Geodatenzentrum")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Geodatenzentrum (BKG)</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => handleExternalLink("https://www.umweltkarten.mv-regierung.de/atlas/", "Umweltkarten")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Umweltkarten Deutschland</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TiefbauMap;