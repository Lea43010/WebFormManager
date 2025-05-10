import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Calculator, FileText, Map, Database, Truck, Trash2, Settings } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import jsPDF from "jspdf";
import 'jspdf-autotable';

// Mock-Daten für die erste Implementierung
const mockBodenarten = [
  { id: 1, name: "Sand", belastungsklasse: "Gering", material_kosten_pro_m2: 12.50, dichte: 1800 },
  { id: 2, name: "Lehm", belastungsklasse: "Mittel", material_kosten_pro_m2: 14.75, dichte: 1950 },
  { id: 3, name: "Fels", belastungsklasse: "Hoch", material_kosten_pro_m2: 22.80, dichte: 2400 },
  { id: 4, name: "Asphalt (bestehend)", belastungsklasse: "Mittel", material_kosten_pro_m2: 18.20, dichte: 2300 },
  { id: 5, name: "Kies", belastungsklasse: "Gering", material_kosten_pro_m2: 10.75, dichte: 1750 },
];

const mockMaschinen = [
  { id: 1, name: "CAT 320 Bagger", typ: "Bagger", kosten_pro_tag: 650, kraftstoffverbrauch: 15 },
  { id: 2, name: "BOMAG BW213 Walze", typ: "Walze", kosten_pro_tag: 480, kraftstoffverbrauch: 8 },
  { id: 3, name: "Wirtgen W200 Fräse", typ: "Fräse", kosten_pro_tag: 1200, kraftstoffverbrauch: 40 },
  { id: 4, name: "Caterpillar D6 Planierraupe", typ: "Planierraupe", kosten_pro_tag: 850, kraftstoffverbrauch: 25 },
  { id: 5, name: "JCB 3CX Baggerlader", typ: "Baggerlader", kosten_pro_tag: 420, kraftstoffverbrauch: 12 },
];

const mockRouten = [
  { 
    id: 1, 
    name: "Hauptstraße Sanierung", 
    start_address: "Bergstraße 1, Berlin", 
    end_address: "Bergstraße 50, Berlin", 
    distance: 1245,
    created_at: "2025-03-15T10:23:45Z"
  },
  { 
    id: 2, 
    name: "Kanalarbeiten Müllerweg", 
    start_address: "Müllerweg 12, München", 
    end_address: "Schulstraße 8, München", 
    distance: 820,
    created_at: "2025-04-02T09:15:12Z"
  },
  { 
    id: 3, 
    name: "Neubaugebiet Erschließung", 
    start_address: "Am Waldrand 1, Frankfurt", 
    end_address: "Feldweg 22, Frankfurt", 
    distance: 1750,
    created_at: "2025-04-25T14:05:33Z"
  },
];

export default function KostenKalkulationPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Daten aus der Datenbank
  const [bodenarten, setBodenarten] = useState(mockBodenarten);
  const [maschinen, setMaschinen] = useState(mockMaschinen);
  const [routen, setRouten] = useState<any[]>([]);
  
  // Ausgewählte Elemente
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedBodenartId, setSelectedBodenartId] = useState<string | null>(null);
  const [selectedMaschineId, setSelectedMaschineId] = useState<string | null>(null);
  
  // Funktion zum Löschen einer Route
  const deleteRoute = async (routeId: string) => {
    try {
      // Bestätigungsdialog
      if (!window.confirm('Möchten Sie diese Route wirklich löschen?')) {
        return;
      }
      
      // API-Anfrage zum Löschen der Route
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Route konnte nicht gelöscht werden');
      }
      
      // Erfolgsbenachrichtigung
      toast({
        title: "Route gelöscht",
        description: "Die Route wurde erfolgreich gelöscht.",
      });
      
      // Routen neu laden
      const routenResponse = await fetch('/api/routes');
      const routenData = await routenResponse.json();
      setRouten(routenData);
      
      // Falls die gelöschte Route ausgewählt war, Auswahl zurücksetzen
      if (selectedRouteId === routeId) {
        setSelectedRouteId(null);
      }
      
    } catch (error) {
      console.error('Fehler beim Löschen der Route:', error);
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Die Route konnte nicht gelöscht werden.',
      });
    }
  };
  
  // Parameter für die Kalkulation
  const [kalkulationsParameter, setKalkulationsParameter] = useState({
    breite: 2.5, // Standardbreite in Metern
    tiefe: 0.3,  // Standardtiefe in Metern
    arbeitsstunden_pro_tag: 8,
    arbeitstage: 5,
    zusatzkosten_prozent: 10,
    personalkosten_pro_stunde: 45,
    anzahl_personal: 3
  });
  
  // Kalkulationsergebnisse
  const [kalkulation, setKalkulation] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Hole Parameter aus der URL wenn vorhanden und lade Daten aus der API
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bodenartId = params.get('bodenart');
    const maschineId = params.get('maschine');
    
    if (bodenartId) {
      setSelectedBodenartId(bodenartId);
    }
    
    if (maschineId) {
      setSelectedMaschineId(maschineId);
    }

    // Lade die Routen aus der API
    const loadRoutes = async () => {
      try {
        setLoading(true);
        
        // Temporäre Lösung: Verwende Mock-Daten, wenn API noch nicht verfügbar
        try {
          // Routen aus der API laden
          const routenResponse = await fetch('/api/routes');
          
          if (!routenResponse.ok) {
            throw new Error('Fehler beim Laden der Routen');
          }
          
          const routenData = await routenResponse.json();
          
          // Setze die geladenen Routen in den State
          setRouten(routenData);
        } catch (apiError) {
          console.warn('API noch nicht verfügbar, verwende Mock-Daten:', apiError);
          setRouten(mockRouten);
        }
        
        // In Zukunft: Auch Bodenarten und Maschinen aus der API laden
        // const bodenResponse = await fetch('/api/bodenarten');
        // const maschinenResponse = await fetch('/api/maschinen');
        
        setLoading(false);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        setError('Die Daten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
        setLoading(false);
      }
    };
    
    loadRoutes();
  }, []);

  // Handler für Parameteränderungen
  const handleParameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setKalkulationsParameter(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };
  
  // PDF Export Funktion
  const exportToPDF = () => {
    if (!kalkulation) return;
    
    const doc = new jsPDF();
    const logoImg = new Image();
    
    // Seitentitel und Metadaten
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Bau-Structura Kostenkalkulation", 15, 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 15, 25);
    
    // Projekttitel
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    
    const selectedRoute = routen.find(r => r.id === selectedRouteId);
    const selectedBodenart = mockBodenarten.find(b => b.id === Number(selectedBodenartId));
    const selectedMaschine = mockMaschinen.find(m => m.id === Number(selectedMaschineId));
    
    doc.text(`Streckenprojekt: ${selectedRoute?.name || ""}`, 15, 35);
    
    // Projektdetails
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    const details = [
      [`Strecke: ${kalkulation.strecke} m`, `Breite: ${kalkulation.breite} m`, `Tiefe: ${kalkulation.tiefe} m`],
      [`Fläche: ${parseFloat(String(kalkulation.flaeche)).toFixed(1)} m²`, `Volumen: ${parseFloat(String(kalkulation.volumen)).toFixed(1)} m³`],
      [`Bodenart: ${selectedBodenart?.name || ""}`, `Maschine: ${selectedMaschine?.name || ""}`],
      [`Dauer: ${kalkulation.benoetigte_tage} Tage (${parseFloat(String(kalkulation.gesamtzeit_stunden)).toFixed(1)} Stunden)`]
    ];
    
    let y = 45;
    details.forEach(line => {
      doc.text(line.join("   "), 15, y);
      y += 6;
    });
    
    // Kosten Tabelle
    doc.autoTable({
      startY: y + 5,
      head: [['Position', 'Berechnung', 'Kosten (€)']],
      body: [
        ['Materialkosten', `${parseFloat(String(kalkulation.flaeche)).toFixed(0)} m² × Materialkosten`, parseFloat(String(kalkulation.materialkosten)).toFixed(2)],
        ['Maschinenkosten', `${kalkulation.benoetigte_tage} Tage × Tageskosten`, parseFloat(String(kalkulation.maschinenkosten)).toFixed(2)],
        ['Personalkosten', `${parseFloat(String(kalkulation.gesamtzeit_stunden)).toFixed(1)} Stunden × Stundenkosten × Anzahl`, parseFloat(String(kalkulation.personalkosten)).toFixed(2)],
        ['Kraftstoffkosten', `${parseFloat(String(kalkulation.gesamtzeit_stunden)).toFixed(1)} Stunden × Verbrauch × Preis/Liter`, parseFloat(String(kalkulation.kraftstoffkosten)).toFixed(2)],
        ['Zwischensumme', '', parseFloat(String(kalkulation.zwischensumme)).toFixed(2)],
        ['Zusatzkosten', `${kalkulationsParameter.zusatzkosten_prozent}% der Zwischensumme`, parseFloat(String(kalkulation.zusatzkosten)).toFixed(2)],
        ['Gesamtkosten', '', parseFloat(String(kalkulation.gesamtkosten)).toFixed(2)],
        ['Kosten pro Meter', '', `${parseFloat(String(kalkulation.kosten_pro_meter)).toFixed(2)} €/m`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [118, 167, 48] }, // Grün entsprechend dem Farbschema
      styles: { font: 'helvetica', fontSize: 10 }
    });
    
    // Fußzeile
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        'Bau-Structura App - Kostenkalkulation',
        15,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Seite ${i} von ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }
    
    // PDF herunterladen
    const projektName = selectedRoute?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'strecke';
    const dateiname = `bau_structura_kostenkalkulation_${projektName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    
    doc.save(dateiname);
    
    toast({
      title: "PDF erstellt",
      description: `Die Kostenkalkulation wurde als ${dateiname} gespeichert.`,
    });
  };

  // Führe Kalkulation durch
  const berechneKosten = async () => {
    console.log("berechneKosten wurde aufgerufen");
    console.log("Routen:", routen);
    console.log("Ausgewählte Route ID:", selectedRouteId);
    console.log("Ausgewählte Bodenart ID:", selectedBodenartId);
    console.log("Ausgewählte Maschine ID:", selectedMaschineId);
    
    if (!selectedRouteId || !selectedBodenartId || !selectedMaschineId) {
      toast({
        title: "Eingaben unvollständig",
        description: "Bitte wählen Sie Route, Bodenart und Maschine aus.",
        variant: "destructive"
      });
      return;
    }

    setIsCalculating(true);

    try {
      // In einer realen Implementierung würden wir einen API-Aufruf durchführen
      // Hier simulieren wir das für die erste Version
      
      // Daten für die Berechnung holen
      const selectedRoute = routen.find(r => r.id.toString() === selectedRouteId);
      const selectedBodenart = bodenarten.find(b => b.id.toString() === selectedBodenartId);
      const selectedMaschine = maschinen.find(m => m.id.toString() === selectedMaschineId);
      
      if (!selectedRoute || !selectedBodenart || !selectedMaschine) {
        throw new Error("Ausgewählte Daten konnten nicht gefunden werden");
      }
      
      // Berechnung durchführen (lokale Berechnung als Fallback)
      const strecke = selectedRoute.distance; // in Metern
      const breite = kalkulationsParameter.breite;
      const tiefe = kalkulationsParameter.tiefe;
      const volumen = strecke * breite * tiefe;
      const flaeche = strecke * breite;
      
      // Materialkosten
      const materialkosten = flaeche * selectedBodenart.material_kosten_pro_m2;
      
      // Effizienzfaktor simulieren
      let effizienzFaktor = 1.0;
      let bearbeitungszeit = 0.1; // Standardwert in Minuten pro m²
      
      if (selectedMaschine.typ === 'Bagger' && selectedBodenart.name.includes('Sand')) {
        effizienzFaktor = 1.2;
        bearbeitungszeit = 0.08;
      } else if (selectedMaschine.typ === 'Walze' && selectedBodenart.name.includes('Asphalt')) {
        effizienzFaktor = 1.25;
        bearbeitungszeit = 0.06;
      } else if (selectedMaschine.typ === 'Fräse' && selectedBodenart.name.includes('Asphalt')) {
        effizienzFaktor = 1.5;
        bearbeitungszeit = 0.05;
      }
      
      // Gesamte Bearbeitungszeit in Stunden
      const gesamtzeit_minuten = flaeche * bearbeitungszeit / effizienzFaktor;
      const gesamtzeit_stunden = gesamtzeit_minuten / 60;
      
      // Anzahl der Arbeitstage
      const arbeitsstunden_pro_tag = kalkulationsParameter.arbeitsstunden_pro_tag;
      const benoetigte_tage = Math.ceil(gesamtzeit_stunden / arbeitsstunden_pro_tag);
      
      // Maschinenkosten
      const maschinenkosten = benoetigte_tage * selectedMaschine.kosten_pro_tag;
      
      // Personalkosten
      const personalkosten = gesamtzeit_stunden * kalkulationsParameter.personalkosten_pro_stunde * kalkulationsParameter.anzahl_personal;
      
      // Kraftstoffkosten
      const kraftstoffkosten = gesamtzeit_stunden * selectedMaschine.kraftstoffverbrauch * 1.50; // 1.50€ pro Liter
      
      // Gesamtkosten vor Zusatzkosten
      const zwischensumme = materialkosten + maschinenkosten + personalkosten + kraftstoffkosten;
      
      // Zusatzkosten (Unvorhergesehenes, Verwaltung, etc.)
      const zusatzkosten = zwischensumme * (kalkulationsParameter.zusatzkosten_prozent / 100);
      
      // Gesamtkosten
      const gesamtkosten = zwischensumme + zusatzkosten;
      
      // Kosten pro Meter
      const kosten_pro_meter = gesamtkosten / strecke;
      
      // Verzögerung simulieren, um die Berechnung zu visualisieren
      setTimeout(() => {
        setKalkulation({
          strecke,
          breite,
          tiefe,
          flaeche,
          volumen,
          materialkosten,
          maschinenkosten,
          personalkosten,
          kraftstoffkosten,
          zusatzkosten,
          gesamtkosten,
          kosten_pro_meter,
          gesamtzeit_stunden,
          benoetigte_tage
        });
        
        setIsCalculating(false);
        
        toast({
          title: "Kalkulation abgeschlossen",
          description: "Die Kostenberechnung wurde erfolgreich durchgeführt."
        });
      }, 1200);
      
    } catch (err: any) {
      setError(err.message);
      setIsCalculating(false);
      
      toast({
        title: "Fehler bei der Berechnung",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // PDF-Export der Kalkulation
  const exportAsPDF = () => {
    toast({
      title: "PDF-Export",
      description: "Die Export-Funktion wird vorbereitet...",
    });
    
    // In einer tatsächlichen Implementierung würde hier die PDF-Generierung erfolgen
    setTimeout(() => {
      toast({
        title: "PDF erstellt",
        description: "Die Kalkulation wurde als PDF exportiert."
      });
    }, 1500);
  };

  if (loading) {
    return (
      <DashboardLayout title="Kostenkalkulation" description="Berechnung von Projektkosten im Tiefbau">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Lade Daten für Kalkulation...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Kostenkalkulation" description="Berechnung von Projektkosten im Tiefbau">
        <div className="bg-destructive/10 p-4 rounded-lg border border-destructive">
          <h3 className="text-destructive font-medium">Fehler bei der Berechnung</h3>
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setError(null)}
          >
            Zurück
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Kostenkalkulation" description="Berechnung von Projektkosten im Tiefbau">
      <div className="space-y-6 bg-[#F3F4F6] p-6 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-[#111827]">Kostenkalkulation für Tiefbau</h2>
            <p className="text-muted-foreground">
              Berechnen Sie die Projektkosten basierend auf Route, Bodenart und Maschinenauswahl
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
          <Card className="bg-white shadow rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-[#111827]">
                <Map className="h-5 w-5 text-[#6a961f]" />
                <span>1. Route auswählen</span>
              </CardTitle>
              <CardDescription>
                Wählen Sie die Strecke für Ihr Bauprojekt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedRouteId || ""} onValueChange={setSelectedRouteId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Route auswählen --" />
                </SelectTrigger>
                <SelectContent>
                  {routen.length > 0 ? (
                    routen.map(route => (
                      <SelectItem key={route.id} value={route.id.toString()}>
                        {route.name} ({(route.distance / 1000).toFixed(2)} km)
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      Keine Routen vorhanden
                    </div>
                  )}
                </SelectContent>
              </Select>
              
              <div className="mt-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setLocation("/tiefbau-map")}
                  className="w-full bg-[#76a730] hover:bg-[#6a961f] text-white flex items-center justify-center text-xs"
                >
                  <Map className="h-4 w-4 mr-1.5" />
                  Neue Route planen
                </Button>
              </div>

              {selectedRouteId && (
                <div className="rounded-md border p-3 bg-card">
                  {(() => {
                    const route = routen.find(r => r.id.toString() === selectedRouteId);
                    if (!route) return null;
                    return (
                      <>
                        <div className="relative">
                          <div className="absolute top-0 right-0">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-destructive" 
                              onClick={() => deleteRoute(selectedRouteId)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Route löschen</span>
                            </Button>
                          </div>
                          
                          <h3 className="text-base font-semibold mb-2">
                            Route von {route.start_address.split(',')[0]} nach {route.end_address.split(',')[0]}
                          </h3>
                          
                          <div className="text-[10px] space-y-2">
                            <div className="grid grid-cols-4 gap-1">
                              <span className="text-muted-foreground col-span-1">Von:</span>
                              <span className="col-span-3 truncate">{route.start_address}</span>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-1">
                              <span className="text-muted-foreground col-span-1">Nach:</span>
                              <span className="col-span-3 truncate">{route.end_address}</span>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-1">
                              <span className="text-muted-foreground col-span-1">Länge:</span>
                              <span className="col-span-3">{(route.distance / 1000).toFixed(2)} km</span>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-1">
                              <span className="text-muted-foreground col-span-1">Erstellt:</span>
                              <span className="col-span-3">{format(new Date(route.created_at), 'dd.MM.yyyy', { locale: de })}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-[#111827]">
                <Database className="h-5 w-5 text-[#6a961f]" />
                <span>2. Bodenart auswählen</span>
              </CardTitle>
              <CardDescription>
                Wählen Sie die relevante Bodenart für das Projekt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedBodenartId || ""} onValueChange={setSelectedBodenartId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Bodenart auswählen --" />
                </SelectTrigger>
                <SelectContent>
                  {bodenarten.map(bodenart => (
                    <SelectItem key={bodenart.id} value={bodenart.id.toString()}>
                      {bodenart.name} - {bodenart.belastungsklasse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedBodenartId && (
                <div className="rounded-md border p-3 bg-muted/50">
                  {(() => {
                    const bodenart = bodenarten.find(b => b.id.toString() === selectedBodenartId);
                    if (!bodenart) return null;
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-1 text-[9px]">
                          <div className="text-muted-foreground">Belastungsklasse:</div>
                          <div className="font-medium">{bodenart.belastungsklasse}</div>
                          <div className="text-muted-foreground">Materialkosten:</div>
                          <div className="font-medium">{parseFloat(String(bodenart.material_kosten_pro_m2)).toFixed(2)} €/m²</div>
                          <div className="text-muted-foreground">Dichte:</div>
                          <div className="font-medium">{bodenart.dichte} kg/m³</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <Button 
                className="w-full bg-[#76a730] hover:bg-[#6a961f] text-white flex items-center justify-center text-xs" 
                variant="default"
                onClick={() => setLocation("/bodenanalyse")}
              >
                <Database className="h-4 w-4 mr-1.5" />
                Bodenarten vergleichen
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-[#111827]">
                <Truck className="h-4 w-4 text-[#6a961f]" />
                <span>3. Maschine auswählen</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Wählen Sie die geeignete Maschine aus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedMaschineId || ""} onValueChange={setSelectedMaschineId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Maschine auswählen --" />
                </SelectTrigger>
                <SelectContent>
                  {maschinen.map(maschine => (
                    <SelectItem key={maschine.id} value={maschine.id.toString()}>
                      {maschine.name} ({maschine.typ})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedMaschineId && (
                <div className="rounded-md border p-3 bg-muted/50">
                  {(() => {
                    const maschine = maschinen.find(m => m.id.toString() === selectedMaschineId);
                    if (!maschine) return null;
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-1 text-[9px]">
                          <div className="text-muted-foreground">Typ:</div>
                          <div className="font-medium">{maschine.typ}</div>
                          <div className="text-muted-foreground">Tageskosten:</div>
                          <div className="font-medium">{parseFloat(String(maschine.kosten_pro_tag)).toFixed(2)} €</div>
                          <div className="text-muted-foreground">Kraftstoffverbrauch:</div>
                          <div className="font-medium">{maschine.kraftstoffverbrauch} l/h</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <Button 
                className="w-full bg-[#76a730] hover:bg-[#6a961f] text-white flex items-center justify-center text-xs" 
                variant="default"
                onClick={() => {
                  // Scroll zum Ergebnis wenn verfügbar, sonst berechnen
                  if (kalkulation) {
                    const resultElement = document.getElementById('ergebnis-section');
                    if (resultElement) {
                      resultElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else {
                    berechneKosten();
                  }
                }}
              >
                <Truck className="h-4 w-4 mr-1.5" />
                Ergebnis anzeigen
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-[#111827]">
              <Settings className="h-5 w-5 text-[#6a961f]" />
              <span>4. Parameter einstellen</span>
            </CardTitle>
            <CardDescription>
              Passen Sie die Projektparameter an Ihre Anforderungen an
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor="breite">Breite (m)</Label>
                <Input
                  id="breite"
                  name="breite"
                  type="number"
                  value={kalkulationsParameter.breite}
                  onChange={handleParameterChange}
                  step="0.1"
                  min="0.5"
                  max="10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tiefe">Tiefe (m)</Label>
                <Input
                  id="tiefe"
                  name="tiefe"
                  type="number"
                  value={kalkulationsParameter.tiefe}
                  onChange={handleParameterChange}
                  step="0.1"
                  min="0.1"
                  max="5"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="arbeitsstunden_pro_tag">Arbeitsstunden/Tag</Label>
                <Input
                  id="arbeitsstunden_pro_tag"
                  name="arbeitsstunden_pro_tag"
                  type="number"
                  value={kalkulationsParameter.arbeitsstunden_pro_tag}
                  onChange={handleParameterChange}
                  min="1"
                  max="24"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="anzahl_personal">Anzahl Personal</Label>
                <Input
                  id="anzahl_personal"
                  name="anzahl_personal"
                  type="number"
                  value={kalkulationsParameter.anzahl_personal}
                  onChange={handleParameterChange}
                  min="1"
                  max="20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="personalkosten_pro_stunde">Personalkosten/Stunde (€)</Label>
                <Input
                  id="personalkosten_pro_stunde"
                  name="personalkosten_pro_stunde"
                  type="number"
                  value={kalkulationsParameter.personalkosten_pro_stunde}
                  onChange={handleParameterChange}
                  min="20"
                  max="100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zusatzkosten_prozent">Zusatzkosten (%)</Label>
                <Input
                  id="zusatzkosten_prozent"
                  name="zusatzkosten_prozent"
                  type="number"
                  value={kalkulationsParameter.zusatzkosten_prozent}
                  onChange={handleParameterChange}
                  min="0"
                  max="50"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <button 
              className="flex items-center justify-center text-xs w-full sm:w-auto px-4 py-2 rounded-md bg-[#76a730] hover:bg-[#6a961f] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                console.log("Button wurde geklickt!");
                console.log("Routen:", routen);
                console.log("Ausgewählte Route ID:", selectedRouteId);
                console.log("Ausgewählte Bodenart ID:", selectedBodenartId);
                console.log("Ausgewählte Maschine ID:", selectedMaschineId);
                
                if (!selectedRouteId || !selectedBodenartId || !selectedMaschineId) {
                  toast({
                    title: "Eingaben unvollständig",
                    description: "Bitte wählen Sie Route, Bodenart und Maschine aus.",
                    variant: "destructive"
                  });
                  return;
                }
                
                berechneKosten();
              }}
              disabled={!selectedRouteId || !selectedBodenartId || !selectedMaschineId || isCalculating}
            >
              {isCalculating ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  <span>Berechnung läuft...</span>
                </>
              ) : (
                <>
                  <Calculator className="mr-1.5 h-4 w-4" />
                  <span>Kosten berechnen</span>
                </>
              )}
            </button>
          </CardFooter>
        </Card>

        {kalkulation && (
          <Card className="bg-white shadow rounded-lg mt-6" id="ergebnis-section">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-[#111827]">
                <Calculator className="h-3 w-3 text-[#76a730]" />
                <span>Kostenberechnung Ergebnis</span>
              </CardTitle>
              <CardDescription className="text-[9px]">
                Detaillierte Aufstellung der berechneten Projektkosten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-md border p-3 bg-primary/5">
                  <div className="text-xs font-semibold pb-1">Gesamtkosten</div>
                  <div className="text-lg font-bold text-primary">
                    {parseFloat(String(kalkulation.gesamtkosten)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs font-semibold pb-1">Kosten pro Meter</div>
                  <div className="text-base font-bold">
                    {parseFloat(String(kalkulation.kosten_pro_meter)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })}/m
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs font-semibold pb-1">Benötigte Zeit</div>
                  <div className="text-base font-bold">
                    {kalkulation.benoetigte_tage} Arbeitstage
                  </div>
                  <div className="text-[8px] text-muted-foreground">
                    ({parseFloat(String(kalkulation.gesamtzeit_stunden)).toFixed(1)} Arbeitsstunden)
                  </div>
                </div>
              </div>

              <Table className="text-[9px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] text-[8px] py-1">Position</TableHead>
                    <TableHead className="text-[8px] py-1">Berechnung</TableHead>
                    <TableHead className="text-right text-[8px] py-1">Kosten (€)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-[8px] py-1">Materialkosten</TableCell>
                    <TableCell className="text-muted-foreground text-[8px] py-1">
                      {parseFloat(String(kalkulation.flaeche)).toFixed(0)} m² × Materialkosten
                    </TableCell>
                    <TableCell className="text-right text-[8px] py-1">
                      {parseFloat(String(kalkulation.materialkosten)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-[8px] py-1">Maschinenkosten</TableCell>
                    <TableCell className="text-muted-foreground text-[8px] py-1">
                      {kalkulation.benoetigte_tage} Tage × Tagesmiete
                    </TableCell>
                    <TableCell className="text-right text-[8px] py-1">
                      {parseFloat(String(kalkulation.maschinenkosten)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-[8px] py-1">Personalkosten</TableCell>
                    <TableCell className="text-muted-foreground text-[8px] py-1">
                      {parseFloat(String(kalkulation.gesamtzeit_stunden)).toFixed(1)} h × {kalkulationsParameter.anzahl_personal} P. × {kalkulationsParameter.personalkosten_pro_stunde} €/h
                    </TableCell>
                    <TableCell className="text-right text-[8px] py-1">
                      {parseFloat(String(kalkulation.personalkosten)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-[8px] py-1">Kraftstoffkosten</TableCell>
                    <TableCell className="text-muted-foreground text-[8px] py-1">
                      {parseFloat(String(kalkulation.gesamtzeit_stunden)).toFixed(1)} h × Verbr. × 1,50 €/l
                    </TableCell>
                    <TableCell className="text-right text-[8px] py-1">
                      {parseFloat(String(kalkulation.kraftstoffkosten)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium border-b-0 text-[8px] py-1">Zusatzkosten ({kalkulationsParameter.zusatzkosten_prozent}%)</TableCell>
                    <TableCell className="text-muted-foreground border-b-0 text-[8px] py-1">
                      Zwischensumme × {kalkulationsParameter.zusatzkosten_prozent}%
                    </TableCell>
                    <TableCell className="text-right border-b-0 text-[8px] py-1">
                      {parseFloat(String(kalkulation.zusatzkosten)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <Button 
                  onClick={exportToPDF} 
                  className="flex items-center text-[10px] bg-[#76a730] hover:bg-[#6a961f] text-white py-1 h-7"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Als PDF exportieren
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}