import { ExternalLink, FileText, ArrowLeft, Info, ChevronRight, Map, Download, RefreshCw, FileCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";
import { generateCompliancePdf } from "@/utils/pdf-generator";
import { 
  fetchUpdateInfo, 
  getUpdateInfo, 
  saveUpdateInfo, 
  formatUpdateDate, 
  setupUpdateChecker 
} from "@/utils/update-tracker";

// Belastungsklassen und Bauweisen-Daten für die Tabellen
const belastungsklassen = [
  {
    klasse: "Bk100",
    beanspruchung: "> 32",
    beispiel: "Autobahnen, Schnellstraßen",
    bauklasse: "SV",
    dickeAsphaltbauweise: "59 69 79 89",
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
    dickeFrostschutzschicht2: "30-40"
  },
  {
    klasse: "Bk3.2",
    beanspruchung: "> 1,0 und ≤ 3,2",
    beispiel: "Erschließungsstraßen",
    bauklasse: "III",
    dickeAsphaltbauweise: "45 55 65 75",
    dickeAsphaltdecke: "8",
    dickeAsphaltTragschicht: "14",
    dickeFrostschutzschicht1: "23-53",
    dickeSchotterTragschicht: "15",
    dickeFrostschutzschicht2: "24-34"
  },
  {
    klasse: "Bk1.8",
    beanspruchung: "> 0,3 und ≤ 1,0",
    beispiel: "Wohnstraßen",
    bauklasse: "IV",
    dickeAsphaltbauweise: "37 47 57 67",
    dickeAsphaltdecke: "8",
    dickeAsphaltTragschicht: "10",
    dickeFrostschutzschicht1: "19-49",
    dickeSchotterTragschicht: "15",
    dickeFrostschutzschicht2: "16-26"
  },
  {
    klasse: "Bk1.0",
    beanspruchung: "> 0,1 und ≤ 0,3",
    beispiel: "Gering belastete Straßen",
    bauklasse: "V",
    dickeAsphaltbauweise: "29 39 49 59",
    dickeAsphaltdecke: "8",
    dickeAsphaltTragschicht: "6",
    dickeFrostschutzschicht1: "15-45",
    dickeSchotterTragschicht: "15",
    dickeFrostschutzschicht2: "8-18"
  },
  {
    klasse: "Bk0.3",
    beanspruchung: "≤ 0,1",
    beispiel: "Sehr gering belastete Straßen",
    bauklasse: "VI",
    dickeAsphaltbauweise: "21 31 41 51",
    dickeAsphaltdecke: "6",
    dickeAsphaltTragschicht: "0",
    dickeFrostschutzschicht1: "15-45",
    dickeSchotterTragschicht: "15",
    dickeFrostschutzschicht2: "2-12"
  }
];

// Definiere die Inhaltsabschnitte für das Seitenmenü
const sections = [
  { id: "datenarchitektur", title: "Datenarchitektur" },
  { id: "externe-dienste", title: "Externe Geoportale und Dienste" },
  { id: "belastungsklassen", title: "RStO 12 Belastungsklassen" },
  { id: "bauweisen", title: "Bauweisen nach RStO 12" },
  { id: "hilfreiche-links", title: "Hilfreiche Links" },
  { id: "geo-anleitung", title: "Geo-Informationen" },
  { id: "gps-tracking", title: "GPS-Tracking" },
  { id: "bewegungsprotokolle", title: "Bewegungsprotokolle" },
  { id: "flaechenmessung", title: "Strecken- & Flächenmessung" },
  { id: "geofencing", title: "GeoFencing" },
  { id: "strassenbau-module", title: "Straßenbau-Module" },
  { id: "nutzungshinweise", title: "Nutzungshinweise" },
  { id: "eu-konformitaet", title: "EU-Konformität" }
];

// Das Letzte Aktualisierungsdatum für die Informationsseite
const LAST_UPDATED = "2024-04-20";

export default function InformationPage() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string>("datenarchitektur");
  const [sectionUpdates, setSectionUpdates] = useState<Record<string, string>>({});
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  
  // Callback für Aktualisierungen
  const handleSectionUpdate = useCallback((section: string, info: any) => {
    setSectionUpdates(prev => ({
      ...prev,
      [section]: info.timestamp
    }));
    
    toast({
      title: "Abschnitt aktualisiert",
      description: `Der Abschnitt "${sections.find(s => s.id === section)?.title}" wurde aktualisiert.`,
      variant: "default",
    });
  }, [toast]);
  
  // Aktualisierungen manuell prüfen
  const checkForUpdates = useCallback(async () => {
    setIsCheckingUpdates(true);
    
    try {
      // Sammel die IDs aller Abschnitte
      const sectionIds = sections.map(s => s.id);
      
      // Prüfe jeden Abschnitt auf Updates
      for (const sectionId of sectionIds) {
        const localInfo = getUpdateInfo(sectionId);
        const serverInfo = await fetchUpdateInfo(sectionId);
        
        // Wenn der Server eine neuere Version hat, aktualisiere
        if (new Date(serverInfo.timestamp) > new Date(localInfo.timestamp)) {
          saveUpdateInfo(sectionId, serverInfo);
          setSectionUpdates(prev => ({
            ...prev,
            [sectionId]: serverInfo.timestamp
          }));
        }
      }
      
      toast({
        title: "Aktualisierungsprüfung abgeschlossen",
        description: "Alle Informationen sind auf dem neuesten Stand.",
        variant: "default",
      });
    } catch (error) {
      console.error("Fehler bei der Aktualisierungsprüfung:", error);
      toast({
        title: "Fehler",
        description: "Bei der Aktualisierungsprüfung ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingUpdates(false);
    }
  }, [toast]);

  // Funktion zur Beobachtung der sichtbaren Abschnitte beim Scrollen
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    // Lade initial die lokal gespeicherten Zeitstempel
    const initialSectionUpdates: Record<string, string> = {};
    sections.forEach(section => {
      const updateInfo = getUpdateInfo(section.id);
      initialSectionUpdates[section.id] = updateInfo.timestamp;
    });
    setSectionUpdates(initialSectionUpdates);
    
    // Setup Aktualisierungsprüfung
    const cleanup = setupUpdateChecker(
      sections.map(s => s.id),
      handleSectionUpdate
    );

    // Setup Observer für Scroll-Verhalten
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => {
      // Cleanup für Beobachter und Update-Checker
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) observer.unobserve(element);
      });
      cleanup();
    };
  }, [handleSectionUpdate]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Hilfe & Info</h1>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
      </div>

      {/* Haupt-Content mit Sidebar für Navigation */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sticky-Seitenmenü */}
        <div className="lg:w-1/4 order-2 lg:order-1">
          <div className="lg:sticky lg:top-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-lg mb-4 pb-2 border-b">Navigieren</h3>
              <ScrollArea className="h-[calc(100vh-250px)] pr-3">
                <div className="space-y-2">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`flex items-center p-2 rounded-md transition-colors ${
                        activeSection === section.id
                          ? "bg-primary text-white font-medium"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }}
                    >
                      {section.title}
                    </a>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
        
        {/* Hauptinhalt */}
        <div className="lg:w-3/4 order-1 lg:order-2 space-y-8">
          {/* Datenarchitektur Sektion */}
          <div id="datenarchitektur" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Datenarchitektur</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Die Bau - Structura App verwendet eine PostgreSQL-Datenbank mit einem umfassenden Datenbankschema, 
              das alle Anforderungen für die Verwaltung von Bauprojekten, Kunden, Firmen und zugehörigen Informationen erfüllt.
            </p>
            
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Kernentitäten</CardTitle>
                  <CardDescription>
                    Die Hauptentitäten der Anwendung und ihre Beziehungen zueinander
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary/10 border-b">
                          <th className="text-left p-2 font-medium">Entität</th>
                          <th className="text-left p-2 font-medium">Tabelle</th>
                          <th className="text-left p-2 font-medium">Hauptfunktion</th>
                          <th className="text-left p-2 font-medium">Beziehungen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Benutzer</td>
                          <td className="p-2 font-mono text-xs">tbluser</td>
                          <td className="p-2">Verwaltung der Benutzerkonten mit Berechtigungen</td>
                          <td className="p-2">Erstellt Projekte, wird protokolliert in Login-Logs</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Projekte</td>
                          <td className="p-2 font-mono text-xs">tblproject</td>
                          <td className="p-2">Zentrale Projektdaten und Metainformationen</td>
                          <td className="p-2">Verbunden mit Kunden, Firmen, Anhängen, Analysen</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Kunden</td>
                          <td className="p-2 font-mono text-xs">tblcustomer</td>
                          <td className="p-2">Kundendaten mit Kontaktinformationen</td>
                          <td className="p-2">Kann mehrere Projekte haben</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Firmen</td>
                          <td className="p-2 font-mono text-xs">tblcompany</td>
                          <td className="p-2">Firmendaten für Auftragnehmer/Partner</td>
                          <td className="p-2">Verbunden mit Projekten und Personen</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Personen</td>
                          <td className="p-2 font-mono text-xs">tblperson</td>
                          <td className="p-2">Ansprechpartner für Firmen</td>
                          <td className="p-2">Gehört zu Firma und/oder Projekt</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Anhänge</td>
                          <td className="p-2 font-mono text-xs">tblattachment</td>
                          <td className="p-2">Dokumente und Dateien zu Projekten</td>
                          <td className="p-2">Gehört zu Projekt</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Spezialfunktionen</CardTitle>
                  <CardDescription>
                    Entitäten für erweiterte Funktionalitäten der Anwendung
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary/10 border-b">
                          <th className="text-left p-2 font-medium">Funktion</th>
                          <th className="text-left p-2 font-medium">Tabelle</th>
                          <th className="text-left p-2 font-medium">Beschreibung</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Oberflächenanalyse</td>
                          <td className="p-2 font-mono text-xs">tblsurface_analysis</td>
                          <td className="p-2">Speichert Analyseergebnisse für Asphalt- und Bodenklassifizierungen mit GPS-Koordinaten</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Bodenreferenzdaten</td>
                          <td className="p-2 font-mono text-xs">tblsoil_reference_data</td>
                          <td className="p-2">Referenzdaten zu verschiedenen Bodenarten und deren Eigenschaften</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Meilensteine</td>
                          <td className="p-2 font-mono text-xs">tblmilestones</td>
                          <td className="p-2">Projektmeilensteine mit zeitlicher Planung nach Kalenderwochen</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Meilenstein-Details</td>
                          <td className="p-2 font-mono text-xs">tblmilestonedetails</td>
                          <td className="p-2">Detailinformationen zu Meilensteinen mit EWB/FÖB Status</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Bedarfs-/Kapazitätsplanung</td>
                          <td className="p-2 font-mono text-xs">tblBedarfKapa</td>
                          <td className="p-2">Ressourcenplanung für Projekte nach Kalenderwochen</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Dateiorganisationsvorschläge</td>
                          <td className="p-2 font-mono text-xs">tblfile_organization_suggestion</td>
                          <td className="p-2">KI-basierte Vorschläge zur besseren Organisation von Projektdateien</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sicherheits- und Verwaltungsfunktionen</CardTitle>
                  <CardDescription>
                    Entitäten für Sicherheit, Authentifizierung und Systemverwaltung
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary/10 border-b">
                          <th className="text-left p-2 font-medium">Funktion</th>
                          <th className="text-left p-2 font-medium">Tabelle</th>
                          <th className="text-left p-2 font-medium">Beschreibung</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Login-Protokollierung</td>
                          <td className="p-2 font-mono text-xs">tbllogin_logs</td>
                          <td className="p-2">Erfasst alle Anmelde-, Abmelde- und Registrierungsereignisse</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Verifizierungscodes</td>
                          <td className="p-2 font-mono text-xs">tblverification_codes</td>
                          <td className="p-2">Temporäre Codes für Zwei-Faktor-Authentifizierung und Passwort-Zurücksetzung</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Benutzerrollen und Berechtigungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary/10 border-b">
                          <th className="text-left p-2 font-medium">Rolle</th>
                          <th className="text-left p-2 font-medium">Berechtigungen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Administrator</td>
                          <td className="p-2">Vollständiger Zugriff auf alle Funktionen, Benutzerverwaltung, Datenübertragung</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Manager</td>
                          <td className="p-2">Projekt-, Kunden- und Firmenverwaltung, Zugriff auf den Admin-Bereich</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-2 font-medium">Benutzer</td>
                          <td className="p-2">Grundlegende Projektansicht und -interaktion, keine Verwaltungsfunktionen</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <p>
                  <strong>Hinweis:</strong> Die Datenarchitektur wird regelmäßig aktualisiert, um neue Funktionen und Verbesserungen zu unterstützen.
                  <br />
                  Letzte Aktualisierung: {(() => {
                    const timestamp = sectionUpdates["datenarchitektur"] || LAST_UPDATED;
                    return formatUpdateDate(timestamp);
                  })()}
                </p>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={checkForUpdates}
                disabled={isCheckingUpdates}
                className="flex items-center gap-2 text-xs"
              >
                <RefreshCw className={`h-3 w-3 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                Aktualisieren
              </Button>
            </div>
          </div>
          
          {/* Externe Dienste Sektion */}
          <div id="externe-dienste" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Externe Geoportale und Dienste</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-2">BGR Geoportal</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Das Geoportal des Bundesanstalt für Geowissenschaften und Rohstoffe (BGR) 
                  bietet zahlreiche Karten und Dienste zu Boden, Geologie und Rohstoffen.
                </p>
                <a 
                  href="https://www.bgr.bund.de/DE/Themen/Geodatenmanagement/Geodienste/geodienste_node.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  Zum BGR Geoportal
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">BASt GIS-Viewer</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Der GIS-Viewer der Bundesanstalt für Straßenwesen (BASt) stellt straßenbezogene
                  Informationen und Karten wie Verkehrsbelastungen und Bauwerke bereit.
                </p>
                <a 
                  href="https://www.bast.de/BASt_2017/DE/Verkehrstechnik/Fachthemen/v2-verkehrszaehlung/Aktuell/zaehl_aktuell_node.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  Zum BASt GIS-Viewer
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">OpenStreetMap</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  OpenStreetMap ist ein freies Projekt, das frei nutzbare Geodaten sammelt, strukturiert und für 
                  die Allgemeinheit verfügbar macht.
                </p>
                <a 
                  href="https://www.openstreetmap.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  Zu OpenStreetMap
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          
          {/* RStO 12 Belastungsklassen */}
          <div id="belastungsklassen" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">RStO 12 Belastungsklassen</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Die Richtlinien für die Standardisierung des Oberbaus von Verkehrsflächen (RStO 12) definieren 
              verschiedene Belastungsklassen, die für die Dimensionierung des Straßenoberbaus maßgebend sind.
            </p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border px-3 py-2 text-left font-semibold">Klasse</th>
                    <th className="border px-3 py-2 text-left font-semibold">Beanspruchung</th>
                    <th className="border px-3 py-2 text-left font-semibold">Typische Anwendung</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="even:bg-gray-50">
                    <td className="border px-3 py-2 font-medium">Bk100</td>
                    <td className="border px-3 py-2">&gt; 32 Mio.</td>
                    <td className="border px-3 py-2">Autobahnen, stark belastete Bundesstraßen</td>
                  </tr>
                  <tr className="even:bg-gray-50">
                    <td className="border px-3 py-2 font-medium">Bk32</td>
                    <td className="border px-3 py-2">10 - 32 Mio.</td>
                    <td className="border px-3 py-2">Bundesstraßen, Hauptverkehrsstraßen</td>
                  </tr>
                  <tr className="even:bg-gray-50">
                    <td className="border px-3 py-2 font-medium">Bk10</td>
                    <td className="border px-3 py-2">3,2 - 10 Mio.</td>
                    <td className="border px-3 py-2">Landstraßen, Haupterschließungsstraßen</td>
                  </tr>
                  <tr className="even:bg-gray-50">
                    <td className="border px-3 py-2 font-medium">Bk3.2</td>
                    <td className="border px-3 py-2">1,0 - 3,2 Mio.</td>
                    <td className="border px-3 py-2">Erschließungsstraßen, Wohnsammelstraßen</td>
                  </tr>
                  <tr className="even:bg-gray-50">
                    <td className="border px-3 py-2 font-medium">Bk1.8</td>
                    <td className="border px-3 py-2">0,3 - 1,0 Mio.</td>
                    <td className="border px-3 py-2">Wohnstraßen, Anliegerstraßen</td>
                  </tr>
                  <tr className="even:bg-gray-50">
                    <td className="border px-3 py-2 font-medium">Bk1.0</td>
                    <td className="border px-3 py-2">0,1 - 0,3 Mio.</td>
                    <td className="border px-3 py-2">Gering belastete Straßen</td>
                  </tr>
                  <tr className="even:bg-gray-50">
                    <td className="border px-3 py-2 font-medium">Bk0.3</td>
                    <td className="border px-3 py-2">&lt; 0,1 Mio.</td>
                    <td className="border px-3 py-2">Sehr gering belastete Straßen, Wege</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-6">
              <Button asChild variant="outline" className="inline-flex items-center">
                <Link to="/geo-map">
                  Zur Geo-Karte mit RStO 12 Visualisierung
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Bauweisen nach RStO 12 */}
          <div id="bauweisen" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Bauweisen nach RStO 12</h2>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Bewährte Bauweisen nach RStO 12</AlertTitle>
              <AlertDescription>
                Aufbaudicken nach Tafel 1, Zeilen 1 und 3 der RStO 12. Alle Dickenangaben in cm.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Asphaltbauweise (Tafel 1, Zeile 1)</CardTitle>
                  <CardDescription>
                    Asphalttragschicht auf Frostschutzschicht
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary/10 border-b">
                          <th className="text-left p-2 font-medium">Klasse</th>
                          <th className="text-left p-2 font-medium">Beanspruchung</th>
                          <th className="text-left p-2 font-medium">Aufbau</th>
                          <th className="text-left p-2 font-medium">Decke</th>
                          <th className="text-left p-2 font-medium">Tragschicht</th>
                          <th className="text-left p-2 font-medium">Frost</th>
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
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Asphalttragschicht und Schottertragschicht (Tafel 1, Zeile 3)</CardTitle>
                  <CardDescription>
                    Asphalttragschicht und Schottertragschicht auf Frostschutzschicht
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary/10 border-b">
                          <th className="text-left p-2 font-medium">Klasse</th>
                          <th className="text-left p-2 font-medium">Beanspruchung</th>
                          <th className="text-left p-2 font-medium">Decke</th>
                          <th className="text-left p-2 font-medium">Tragschicht</th>
                          <th className="text-left p-2 font-medium">Schotter</th>
                          <th className="text-left p-2 font-medium">Frost</th>
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
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-sm text-gray-500 italic mt-6">
              Quelle: RStO 12 Richtlinien für die Standardisierung des Oberbaus von Verkehrsflächen, Tafel 1
            </div>
          </div>
          
          {/* Hilfreiche Links */}
          <div id="hilfreiche-links" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Hilfreiche Links</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Externe Ressourcen für Straßenplanung und -bau
            </p>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => window.open("https://www.fgsv-verlag.de/rsto-12-richtlinien-fuer-die-standardisierung-des-oberbaues-von-verkehrsflaechen", "_blank")}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>RStO 12 Richtlinien (FGSV)</span>
                <ExternalLink className="ml-auto h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => window.open("https://www.bast.de/BASt_2017/DE/Verkehrstechnik/Publikationen/Regelwerke/Entwurf/RDO-Asphalt-09.html", "_blank")}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>RDO Asphalt 09</span>
                <ExternalLink className="ml-auto h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => window.open("https://www.bast.de", "_blank")}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>BASt - Bundesanstalt für Straßenwesen</span>
                <ExternalLink className="ml-auto h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Anleitung Geo-Informationen */}
          <div id="geo-anleitung" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Anleitung Geo-Informationen</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Die Geo-Informationen-Seite bietet umfangreiche Funktionen zur Standortmarkierung, Streckenanalyse, Materialberechnung, 
              GPS-Tracking, Flächen-/Streckenmessung sowie GeoFencing für Bauprojekte und mobile Teams.
            </p>
            
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>1. Standorte markieren</CardTitle>
                  <CardDescription>
                    Es gibt drei Möglichkeiten, Standorte auf der Karte zu markieren:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Direkt auf die Karte klicken</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Klicken Sie einfach an beliebigen Stellen auf die Karte, um dort einen Marker zu setzen. 
                      Jeder Marker wird automatisch mit der aktuell ausgewählten Belastungsklasse verbunden.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Koordinaten eingeben</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Verwenden Sie das "Koordinaten" Feld, um einen Standort anhand von Längen- und Breitengraden 
                      exakt zu bestimmen. Geben Sie die Koordinaten im Format "Breitengrad, Längengrad" ein und 
                      klicken Sie auf "Gehe zu".
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Adresse suchen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Nutzen Sie die Adresssuche, um einen Standort anhand einer Straßenadresse zu finden. 
                      Geben Sie die vollständige Adresse ein und klicken Sie auf "Suchen", um die entsprechenden 
                      Koordinaten zu finden und einen Marker zu setzen.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>2. Belastungsklassen und Streckenverbindungen</CardTitle>
                  <CardDescription>
                    Streckenplanung und Visualisierung der Belastungsklassen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Belastungsklasse auswählen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Wählen Sie vor dem Markieren die passende Belastungsklasse aus dem Dropdown-Menü über der Karte aus.
                      Die gewählte Klasse bestimmt die Farbe der Marker und Verbindungslinien sowie die berechneten Materialkosten.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Verbindungslinien</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Verbindungslinien zwischen den Markern werden automatisch erzeugt und farblich entsprechend der 
                      Belastungsklasse dargestellt. Diese Linien zeigen die geplante Route und dienen als Basis für die
                      Materialkosten- und Streckenlängenberechnung.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>3. Materialkosten und Baumaschinen</CardTitle>
                  <CardDescription>
                    Automatische Berechnung von Materialkosten und Maschinenempfehlungen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Straßentyp und Breite</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Wählen Sie den passenden Straßentyp aus (z.B. Autobahn, Bundesstraße, Landstraße) oder 
                      geben Sie eine benutzerdefinierte Straßenbreite ein. Die Breite ist entscheidend für die 
                      Berechnung der Materialmengen und -kosten.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Materialkostenberechnung</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die Materialkosten werden automatisch basierend auf der gewählten Belastungsklasse, 
                      der Streckenlänge und der Straßenbreite berechnet. Die Kosten werden getrennt für Asphaltdecke, 
                      Asphalttragschicht und Frostschutzschicht angezeigt.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Baumaschinenempfehlungen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Basierend auf der gewählten Belastungsklasse werden passende Baumaschinen vorgeschlagen. 
                      Für jede Maschine werden Tagesmiete und Leistungsdaten angezeigt, um die Bauplanung und 
                      Kostenkalkulation zu unterstützen.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Weitere Geo-Funktionen</CardTitle>
                  <CardDescription>
                    Überblick über die erweiterten Geo-Funktionalitäten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Integrierte Spezialfunktionen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die Geo-Informationsseite bietet umfangreiche Zusatzfunktionen:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>GPS-Tracking für Teams und Ausrüstung</li>
                        <li>Strecken- und Flächenmessung</li>
                        <li>GeoFencing mit automatischen Benachrichtigungen</li>
                        <li>Spezialmodule für Straßenbau und -instandhaltung</li>
                      </ul>
                      Detaillierte Beschreibungen zu den einzelnen Funktionen finden Sie in den entsprechenden Abschnitten dieser Hilfeseite.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <Button asChild className="gap-2">
                <Link to="/geo-map">
                  <Map className="h-4 w-4" />
                  Zur Geo-Informationsseite
                </Link>
              </Button>
            </div>
          </div>

          {/* GPS-Tracking */}
          <div id="gps-tracking" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">GPS-Tracking für Mobile-Teams und Ausrüstung</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Mit dem integrierten GPS-Tracking-System können Sie mobile Teams und wertvolle Ausrüstungsgegenstände in Echtzeit verfolgen, 
              die Arbeitsfortschritte kontrollieren und Ihre Ressourcen optimal einsetzen.
            </p>
            
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Live-Tracking aktivieren</CardTitle>
                  <CardDescription>
                    Echtzeit-Verfolgung von Teams und Geräten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Grundfunktionen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Aktivieren Sie das GPS-Tracking über das Menü "Team-Tracking" in der oberen Navigationsleiste.
                      Nach der Aktivierung werden mobile Geräte und Baumaschinen mit GPS-Sendern in Echtzeit auf der Karte angezeigt.
                      Die Position wird alle 30 Sekunden aktualisiert, wenn eine aktive Internetverbindung besteht.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Datensparsamkeit</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Das Tracking-System verwendet eine intelligente Datenübertragung, die den Datenverbrauch minimiert:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Bei Stillstand werden Positionsdaten seltener übertragen</li>
                        <li>Bei schneller Bewegung erfolgt eine häufigere Aktualisierung</li>
                        <li>Bei Offline-Betrieb werden Daten zwischengespeichert und später synchronisiert</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team-Verwaltung</CardTitle>
                  <CardDescription>
                    Koordination und Überwachung von Baustellenteams
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Teams anlegen und verwalten</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Im Bereich "Mobile Teams" können Sie Teams erstellen und Mitarbeiter zuweisen. Jedem Team wird
                      auf der Karte eine eigene Farbe zugeordnet. Klicken Sie auf ein Team-Symbol, um Details wie
                      aktuelle Tätigkeit, Arbeitsfortschritt und geschätzte Fertigstellungszeit zu sehen.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Aufgabenzuweisung</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Weisen Sie Teams direkt aus der Kartenansicht Aufgaben zu:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Klicken Sie auf ein Team und wählen Sie "Neue Aufgabe"</li>
                        <li>Definieren Sie die Aufgabendetails mit Priorität und Zeitvorgabe</li>
                        <li>Fügen Sie bei Bedarf Fotos oder Dokumente hinzu</li>
                        <li>Die Teammitglieder erhalten sofort eine Benachrichtigung</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ausrüstungs-Tracking</CardTitle>
                  <CardDescription>
                    Verfolgung und Schutz wertvoller Baumaschinen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Geräte registrieren</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Wertvolle Baumaschinen und Ausrüstungsgegenstände können separat verfolgt werden. Fügen Sie
                      im Bereich "Ausrüstung" die GPS-ID des Trackers sowie eine Beschreibung der Maschine hinzu.
                      Die App überwacht dann deren Position und kann bei unerwarteten Bewegungen außerhalb der Arbeitszeit
                      automatisch Warnmeldungen senden.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Diebstahlschutz</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Der integrierte Diebstahlschutz bietet mehrere Sicherheitsfunktionen:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Alarmauslösung bei unerlaubter Bewegung</li>
                        <li>Automatische SMS- oder E-Mail-Benachrichtigung an definierte Kontakte</li>
                        <li>Lokale Alarmsignale können ferngesteuert aktiviert werden</li>
                        <li>Export des Bewegungsprotokolls für Versicherungszwecke</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bewegungsprotokolle</CardTitle>
                  <CardDescription>
                    Dokumentation und Analyse aller Bewegungsdaten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Automatische Protokollierung</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Alle Bewegungen werden automatisch protokolliert und können unter "Tracking-Protokolle" eingesehen werden.
                      Diese Daten sind nützlich für die Dokumentation von Arbeitsstunden, Routenoptimierung und können
                      bei Bedarf als CSV- oder PDF-Datei exportiert werden.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Statistische Auswertung</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Das System bietet umfangreiche Analysetools:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Fahrwege und Standzeiten pro Maschine/Mitarbeiter</li>
                        <li>Durchschnittliche Verweildauer an Baustellen</li>
                        <li>Anfahrtszeiten und Routeneffizienz</li>
                        <li>Vergleichsanalysen zwischen Teams und Projekten</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <Button asChild className="gap-2">
                <Link to="/tracking">
                  <Map className="h-4 w-4" />
                  Zum GPS-Tracking
                </Link>
              </Button>
            </div>
          </div>

          {/* Bewegungsprotokolle */}
          <div id="bewegungsprotokolle" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Bewegungsprotokolle</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Die Bewegungsprotokolle dokumentieren umfassend alle aufgezeichneten Bewegungen von Teams und Ausrüstung und ermöglichen 
              detaillierte Analysen, Effizienzauswertungen und Nachweise für verschiedene Zwecke.
            </p>
            
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Protokollübersicht</CardTitle>
                  <CardDescription>
                    Übersicht und Zugriff auf Bewegungsdaten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Protokollzugriff</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Öffnen Sie die Bewegungsprotokolle über den Button "Bewegungsprotokolle" in der oberen rechten Ecke der Geo-Informationsseite.
                      Alternativ können Sie auch den direkten Link im Hauptmenü unter "Geo-Daten" verwenden. Die Protokolle werden nach Zeitraum, 
                      Team oder Ausrüstung gefiltert angezeigt.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Datenanalyse und Visualisierung</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Bewegungsprotokolle werden in verschiedenen Formaten dargestellt:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Tabellarische Listenansicht mit Filtern und Sortierung</li>
                        <li>Kartenvisualisierung mit farbcodierten Bewegungsspuren</li>
                        <li>Zeitleistenansicht für chronologische Übersicht</li>
                        <li>Statistische Auswertungen und Diagramme</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Protokollauswertung</CardTitle>
                  <CardDescription>
                    Erweiterte Analyseoptionen für Bewegungsdaten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Effizienzoptimierung</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die Analyse der Bewegungsdaten hilft bei der Optimierung von Arbeitsabläufen:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Identifizierung ineffizienter Routen und Fahrwege</li>
                        <li>Erkennung von Engpässen und Wartezeiten</li>
                        <li>Vorschläge zur Optimierung von Teamwegen und -zuordnungen</li>
                        <li>Automatische Berechnung von Kostenersparnis-Potenzialen</li>
                      </ul>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Dokumentation und Export</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Protokolldaten können für verschiedene Zwecke exportiert werden:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>PDF-Berichte mit Bewegungsspuren für Abrechnungen</li>
                        <li>Excel-Exporte für detaillierte Zeiterfassung</li>
                        <li>Leistungsnachweise für Kunden und Auftraggeber</li>
                        <li>Exportformate für Buchhaltungs- und ERP-Systeme</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <Button asChild className="gap-2">
                <Link to="/tracking/reports">
                  <FileText className="h-4 w-4" />
                  Zu den Bewegungsprotokollen
                </Link>
              </Button>
            </div>
          </div>

          {/* Strecken- & Flächenmessung */}
          <div id="flaechenmessung" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Strecken- und Flächenmessung</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Die integrierte Vermessungsfunktion ermöglicht präzise Messungen direkt in der Anwendung, ohne zusätzliche Geräte 
              oder Software zu benötigen. Ideal für Planungs-, Kalkulationszwecke und Baustellendokumentation.
            </p>
            
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Streckenmessung</CardTitle>
                  <CardDescription>
                    Präzise Vermessung von Strecken und Entfernungen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Grundfunktionen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Aktivieren Sie die Streckenmessung über den Button "Strecke messen" in der Kartenwerkzeugleiste.
                      Klicken Sie dann nacheinander auf mehrere Punkte, um einen Streckenverlauf zu markieren.
                      Die Gesamtlänge sowie die Teilstrecken werden automatisch berechnet und angezeigt.
                      Für präzisere Messungen können Sie in die Karte hineinzoomen.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Erweiterte Funktionen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die Streckenmessung bietet zusätzliche Optionen:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Automatische Routenberechnung zwischen Punkten (Straßen, Feldwege, etc.)</li>
                        <li>Höhenprofildarstellung bei Verfügbarkeit von Höhendaten</li>
                        <li>Steigungsanalyse mit prozentualer und Winkelangabe</li>
                        <li>Wegpunkte mit Notizen und Fotos versehen</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Flächenmessung</CardTitle>
                  <CardDescription>
                    Vermessung und Berechnung von Flächen aller Art
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Grundfunktionen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Für die Vermessung von Flächen nutzen Sie den Button "Fläche messen". Markieren Sie dann 
                      mindestens drei Punkte auf der Karte, um ein Polygon zu erzeugen. Die eingeschlossene Fläche
                      wird in Quadratmetern und Hektar angegeben. Komplexe Formen können durch das Setzen
                      zusätzlicher Punkte genauer umrissen werden.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Erweiterte Funktionen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die Flächenmessung bietet nützliche Zusatzfunktionen:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Automatische Erkennung von Grundstücksgrenzen (wo verfügbar)</li>
                        <li>Volumenberechnung bei Eingabe einer Höhe/Tiefe</li>
                        <li>Unterflächenaufteilung in Teilbereiche</li>
                        <li>Materialbedarf basierend auf Flächengröße und gewähltem Material</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Speichern und Teilen</CardTitle>
                  <CardDescription>
                    Dokumentation und Weitergabe der Messergebnisse
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Projektbezogene Speicherung</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Gemessene Strecken und Flächen können mit einem Klick auf "Messung speichern" dem aktuellen 
                      Projekt zugeordnet werden. Gespeicherte Messungen erscheinen in der Projektansicht und können
                      als Grundlage für Materialberechnungen, Ausschreibungen oder zur Dokumentation verwendet werden.
                      Über die Teilen-Funktion können Messungen auch als Link oder Screenshot an Projektbeteiligte 
                      weitergegeben werden.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Exportmöglichkeiten</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die Messergebnisse können in verschiedenen Formaten exportiert werden:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>PDF-Bericht mit Kartenansicht, Maßen und Notizen</li>
                        <li>GeoJSON-Export für die Verwendung in GIS-Anwendungen</li>
                        <li>KML-Format für Google Earth und andere Kartendienste</li>
                        <li>Excel-Tabelle mit detaillierten Messwerten</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <Button asChild className="gap-2">
                <Link to="/geo-map">
                  <Map className="h-4 w-4" />
                  Zur Vermessungsfunktion
                </Link>
              </Button>
            </div>
          </div>

          {/* GeoFencing */}
          <div id="geofencing" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">GeoFencing: Automatische Benachrichtigungen</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              GeoFencing ermöglicht die Einrichtung virtueller Grenzen auf der Karte, um automatische Aktionen und 
              Benachrichtigungen auszulösen, wenn diese Grenzen von Personen oder Geräten überschritten werden.
            </p>
            
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>GeoFencing einrichten</CardTitle>
                  <CardDescription>
                    Erstellung und Konfiguration virtueller Zäune
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Grundfunktionen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Im Bereich "GeoFencing" können Sie virtuelle Zäune um bestimmte Bereiche ziehen.
                      Klicken Sie auf "Neuer Zaun", geben Sie einen Namen ein und zeichnen Sie dann
                      die Begrenzung auf der Karte. Für jeden GeoFence können Sie festlegen, ob beim Betreten,
                      beim Verlassen oder bei beidem eine Benachrichtigung ausgelöst werden soll.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Zaun-Typen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Es stehen verschiedene Zaun-Typen zur Verfügung:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Kreis-Zaun: Definiert durch Mittelpunkt und Radius</li>
                        <li>Polygon-Zaun: Flexibel mit beliebig vielen Punkten</li>
                        <li>Korridor-Zaun: Entlang einer Route mit definierter Breite</li>
                        <li>Zeit-Zaun: Nur zu bestimmten Zeiten aktiv</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Einsatzmöglichkeiten</CardTitle>
                  <CardDescription>
                    Praktische Anwendungsfälle für GeoFencing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Baustellen-Management</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      GeoFences bieten vielfältige Anwendungen:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Automatische Zeiterfassung beim Betreten/Verlassen der Baustelle</li>
                        <li>Diebstahlschutz durch Alarme bei unerlaubter Bewegung von Maschinen</li>
                        <li>Sicherheitsbenachrichtigungen beim Betreten gefährlicher Bereiche</li>
                        <li>Automatische Materialbestellung beim Erreichen eines Lagers</li>
                        <li>Fortschrittsdokumentation beim Erreichen bestimmter Bauabschnitte</li>
                      </ul>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Personalmanagement</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Optimieren Sie die Teamkoordination:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Automatische Meldung wenn Teams bestimmte Arbeitsbereiche erreichen</li>
                        <li>Berechnung der effektiven Arbeitszeit pro Bereich</li>
                        <li>Einhaltung von Pausenzeiten überwachen</li>
                        <li>Notfallmeldungen bei unerwarteten Bewegungsmustern</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Benachrichtigungsoptionen</CardTitle>
                  <CardDescription>
                    Konfiguration von Meldungen und automatischen Aktionen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Benachrichtigungskanäle</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Legen Sie fest, wie Sie über GeoFence-Ereignisse informiert werden möchten:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Push-Benachrichtigungen auf mobilen Endgeräten</li>
                        <li>E-Mail-Benachrichtigungen an definierte Empfänger</li>
                        <li>SMS-Benachrichtigungen für besonders wichtige Ereignisse</li>
                        <li>Automatische Einträge im Bautagebuch</li>
                      </ul>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Automatisierte Aktionen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      GeoFence-Ereignisse können automatische Aktionen auslösen:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Status-Änderungen in Projekten oder Aufgaben</li>
                        <li>Automatisches Ein-/Auschecken zur Zeiterfassung</li>
                        <li>Dokumente zum Unterschreiben bereitstellen</li>
                        <li>Checklisten für bestimmte Baustellen/Bereiche öffnen</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <Button asChild className="gap-2">
                <Link to="/geofencing">
                  <Map className="h-4 w-4" />
                  Zum GeoFencing
                </Link>
              </Button>
            </div>
          </div>

          {/* Straßenbau-Module */}
          <div id="strassenbau-module" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Spezialmodule für Straßenbau</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Die Spezialmodule für Straßenbau bieten umfassende Werkzeuge zur Erfassung, Analyse und Planung 
              von Straßenbauprojekten gemäß aktueller Normen und Richtlinien.
            </p>
            
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Straßenzustandserfassung</CardTitle>
                  <CardDescription>
                    Systematische Dokumentation und Analyse von Straßenschäden
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Erfassungsmethoden</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die App ermöglicht die systematische Erfassung von Straßenzuständen durch:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Foto-Upload mit automatischer GPS-Verortung</li>
                        <li>KI-gestützte Schadensanalyse mit Erkennung von Rissen, Schlaglöchern etc.</li>
                        <li>Manuelle Bewertungsskala (1-5) mit strukturierten Eingabefeldern</li>
                        <li>Spracherkennung für schnelle Schadensbeschreibungen</li>
                      </ul>
                      Alle Erfassungen werden automatisch auf der Karte visualisiert und können
                      nach Schadenstyp, Schweregrad oder Erfassungsdatum gefiltert werden.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Mobile Datenerfassung</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Für die Arbeit vor Ort bietet die mobile Version:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Offline-Funktionalität für Gebiete ohne Mobilfunkabdeckung</li>
                        <li>Schnellerfassung per Kamera mit automatischer Positionierung</li>
                        <li>Vorausfüllung von Metadaten basierend auf der Position</li>
                        <li>Sprachsteuerung für freihändige Bedienung</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Standardisierte Klassifikation</CardTitle>
                  <CardDescription>
                    Normgerechte Bewertung und Dokumentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Klassifikationssystem</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die erfassten Daten werden gemäß aktueller Normen wie ZTV BEA-StB oder ZTV Asphalt-StB
                      klassifiziert. Dies umfasst:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Systematische Erfassung von Oberflächenschäden nach Typ und Ausmaß</li>
                        <li>Berechnung standardisierter Zustandsindizes</li>
                        <li>Einstufung in Zustandsklassen von 1 (sehr gut) bis 5 (sehr schlecht)</li>
                        <li>Normgerechte Dokumentation für behördliche Anforderungen</li>
                      </ul>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Schadenstypen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Das System unterscheidet zwischen verschiedenen Schadenstypen:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Risse (Netzrisse, Längsrisse, Querrisse)</li>
                        <li>Verformungen (Spurrinnen, Aufwölbungen, Setzungen)</li>
                        <li>Substanzverlust (Ausbrüche, Schlaglöcher)</li>
                        <li>Oberflächenschäden (Kornausbruch, Bindemittelverlust)</li>
                        <li>Flickstellen und Aufgrabungen</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maßnahmenplanung</CardTitle>
                  <CardDescription>
                    Automatische Instandsetzungsvorschläge und Kostenprognosen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Automatische Empfehlungen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Basierend auf der Zustandserfassung generiert die App automatisch Instandsetzungsvorschläge:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Angepasste Sanierungsempfehlungen je nach Schadenstyp und -ausmaß</li>
                        <li>Kostenprognosen für verschiedene Sanierungsvarianten</li>
                        <li>Priorisierungsvorschläge basierend auf Schadensrelevanz und Verkehrsbelastung</li>
                        <li>Exportmöglichkeit für Ausschreibungsunterlagen</li>
                      </ul>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Maßnahmentypen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die App unterscheidet zwischen verschiedenen Maßnahmentypen:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Oberflächenbehandlung (Versiegelung, dünne Schichten)</li>
                        <li>Deckenerneuerung (Fräsen und Neuasphaltierung der obersten Schicht)</li>
                        <li>Vollausbau (kompletter Austausch des Straßenaufbaus)</li>
                        <li>Lokale Reparatur (punktuelle Instandsetzung)</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historischer Vergleich</CardTitle>
                  <CardDescription>
                    Zeitreihenanalyse und Prognosemodelle
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Zeitliche Entwicklung</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Besonders wertvoll ist die Möglichkeit, Straßenzustände über Zeit zu verfolgen:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Zeitreihenanalyse mit grafischer Darstellung der Zustandsentwicklung</li>
                        <li>Vergleichsansicht "vorher/nachher" mit Bildmaterial</li>
                        <li>Prognosemodelle zur Abschätzung der weiteren Zustandsentwicklung</li>
                        <li>Langzeitdokumentation für Gewährleistungsfragen</li>
                      </ul>
                      Dies ermöglicht eine vorausschauende Erhaltungsplanung und optimierte Budgetallokation.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Lebenszyklus-Management</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die App unterstützt das Management des gesamten Lebenszyklus:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Erfassung der ursprünglichen Bauart und Baujahr</li>
                        <li>Dokumentation aller Instandsetzungsmaßnahmen</li>
                        <li>Berechnung der Restnutzungsdauer</li>
                        <li>Optimaler Zeitpunkt für präventive Instandhaltung</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <Button asChild className="gap-2">
                <Link to="/street-modules">
                  <Map className="h-4 w-4" />
                  Zu den Straßenbau-Modulen
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Nutzungshinweise */}
          <div id="nutzungshinweise" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Nutzungshinweise</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-medium text-lg mb-3">Standortanalyse</h3>
                <p className="text-gray-600 leading-relaxed">
                  Mit der Geo-Karte können Sie Standorte markieren und analysieren. Nutzen Sie die 
                  Asphaltanalyse-Funktion, um automatisch die passende Belastungsklasse zu ermitteln und
                  detaillierte Informationen über geeignete Bauweisen zu erhalten.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-3">Materialkostenberechnung</h3>
                <p className="text-gray-600 leading-relaxed">
                  Die Anwendung unterstützt Sie bei der Berechnung von Materialkosten für unterschiedliche
                  Straßenbauweisen basierend auf der gewählten Belastungsklasse, Streckenlänge und Straßenbreite.
                </p>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Umfassende Benutzeranleitung</h3>
            
            <div className="space-y-6 text-gray-600">
              <div>
                <h4 className="font-medium text-lg mb-2">1. Anmeldung und Startbildschirm</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Melden Sie sich mit Ihrem Benutzernamen und Passwort an</li>
                  <li>Nach erfolgreicher Anmeldung gelangen Sie zum Dashboard</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-lg mb-2">2. Firmendaten anlegen</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Klicken Sie in der Seitenleiste auf "Firmendaten"</li>
                  <li>Wählen Sie "Neue Firma" und füllen Sie das Formular aus</li>
                  <li>Tragen Sie Firmennamen, Kontaktdaten und Ansprechpartner ein</li>
                  <li>Wählen Sie das Bundesland aus der Dropdown-Liste</li>
                  <li>Klicken Sie auf "Speichern"</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-lg mb-2">3. Kundendaten anlegen</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Klicken Sie in der Seitenleiste auf "Kundendaten"</li>
                  <li>Wählen Sie "Neuer Kunde" und füllen Sie das Formular aus</li>
                  <li>Geben Sie die Kundennummer ein oder verwenden Sie die Vorschlagsfunktion</li>
                  <li>Wählen Sie den Kundentyp und tragen Sie Vor- und Nachname ein</li>
                  <li>Vervollständigen Sie die Adressdaten und Kontaktinformationen</li>
                  <li>Klicken Sie auf "Speichern"</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-lg mb-2">4. Projekt erstellen</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Navigieren Sie zur "Projektverwaltung" in der Seitenleiste</li>
                  <li>Klicken Sie auf "Neues Projekt" und geben Sie die Basisdaten ein</li>
                  <li>Wählen Sie Kunde, Firma und entsprechende Ansprechpartner aus</li>
                  <li>Tragen Sie Abmessungen und Projektnotizen ein</li>
                  <li>Klicken Sie auf "Speichern"</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-lg mb-2">5. Bedarfs- und Kapazitätsplanung</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Öffnen Sie die Projektdetails durch Klicken auf "Details" bei einem Projekt</li>
                  <li>Wechseln Sie zum Tab "Bedarf/Kapazitäten"</li>
                  <li>Wählen Sie eine Kategorie aus dem Dropdown-Menü</li>
                  <li>Geben Sie die Anzahl der benötigten Teams ein</li>
                  <li>Legen Sie Kalenderwoche und Jahr fest</li>
                  <li>Klicken Sie auf "Hinzufügen"</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-lg mb-2">6. Meilensteine verwalten</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Öffnen Sie die Projektdetails und wechseln Sie zum Tab "Meilensteine"</li>
                  <li>Wählen Sie einen Meilensteintyp aus</li>
                  <li>Legen Sie Start- und Endtermin fest</li>
                  <li>Wählen Sie den EWB/FÖB-Status und tragen Sie Soll-Mengen ein</li>
                  <li>Klicken Sie auf "Meilenstein erstellen"</li>
                  <li>Zur Bearbeitung klicken Sie auf einen Meilenstein in der Liste</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-lg mb-2">7. Dokumentenverwaltung</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Navigieren Sie zu "Dokumente" in der Seitenleiste</li>
                  <li>Wählen Sie ein Projekt aus und laden Sie Dokumente hoch</li>
                  <li>Kategorisieren Sie die Dokumente und fügen Sie Beschreibungen hinzu</li>
                  <li>Klicken Sie auf "Hochladen"</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-lg mb-2">8. Geo-Informationen nutzen</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Klicken Sie auf "Geo-Informationen" in der Seitenleiste</li>
                  <li>Wählen Sie ein Projekt aus dem Dropdown-Menü</li>
                  <li>Nutzen Sie GPS-Tracking zur Überwachung von Teams und Ausrüstung</li>
                  <li>Verwenden Sie Strecken- und Flächenmessung für präzise Planungen</li>
                  <li>Richten Sie GeoFences für automatische Benachrichtigungen ein</li>
                  <li>Nutzen Sie Spezialmodule zur Straßenzustandserfassung</li>
                  <li>Markieren Sie Standorte durch direktes Klicken auf die Karte</li>
                  <li>Wählen Sie für jeden Standort die entsprechende Boden- und Lastklasse</li>
                  <li>Verbinden Sie Standorte für Routenberechnung und Materialbedarfsanalyse</li>
                  <li>Exportieren Sie die Daten als PDF mit dem Export-Button</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-lg mb-2">9. Tipps zur effizienten Nutzung</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Nutzen Sie die Kachelansicht für einen schnellen visuellen Überblick</li>
                  <li>Verwenden Sie Filterung in Listen-Ansichten</li>
                  <li>Sparen Sie Zeit durch Nutzung der Spracherkennung bei Notizen</li>
                  <li>Planen Sie mit der Kalenderwochen-Ansicht für effiziente zeitliche Organisation</li>
                  <li>Nutzen Sie die App auf mobilen Geräten für Zugriff von unterwegs</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* EU-Konformität */}
          <div id="eu-konformitaet" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">EU-Konformität</h2>
            
            <Alert className="mb-6">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Konformität mit EU Data Act und EU KI Act</AlertTitle>
              <AlertDescription>
                Die Bau-Structura App wurde unter Berücksichtigung der aktuellen Anforderungen des EU Data Act und des EU KI Act (stand April 2025) entwickelt.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>EU Data Act Konformität</CardTitle>
                  <CardDescription>
                    Maßnahmen zur Gewährleistung von Transparenz, Datenportabilität und Datenschutz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Datenportabilität (Art. 5, 6 EU Data Act)</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die Datenbankstruktur unterstützt den Export aller projektbezogenen Daten in standardisierten 
                      Formaten (CSV, JSON, PDF), was den Nutzern ermöglicht, ihre Daten zwischen verschiedenen Diensten zu übertragen.
                      Datenexporte können jederzeit über die entsprechenden Exportfunktionen durchgeführt werden.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Transparenz und Rechenschaftspflicht (Art. 8, 10 EU Data Act)</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die App bietet eine klare Dokumentation der Datenstrukturen und ihrer Beziehungen, 
                      sowie eine vollständige Übersicht über alle gespeicherten Daten. Änderungen an Daten werden 
                      protokolliert und ermöglichen eine lückenlose Nachverfolgung (Audit-Trail).
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Datenschutz und -sicherheit (Art. 11 EU Data Act, DSGVO)</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Sensible Daten wie Benutzerpasswörter werden nur in gehashter Form gespeichert, und 
                      personenbezogene Daten werden nur im erforderlichen Umfang gespeichert, um das Prinzip 
                      der Datenminimierung zu erfüllen. Die Anwendung implementiert technische und organisatorische 
                      Maßnahmen zum Schutz aller Daten.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Rechtmäßige Datenweitergabe (Art. 19, 20 EU Data Act)</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die Weitergabe von Daten an Dritte (z.B. für KI-basierte Analysen) erfolgt nur mit expliziter 
                      Zustimmung der Nutzer. Eine vollständige Transparenz wird durch klare Kennzeichnung und 
                      Informationen über Umfang und Zweck der Datenweitergabe gewährleistet.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>EU KI Act Konformität</CardTitle>
                  <CardDescription>
                    Risikominimierung und Transparenz bei KI-gestützten Funktionen gemäß neuestem EU KI Act
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Risikobasierte Kategorisierung (Art. 6, 9 EU KI Act)</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die in der App implementierten KI-Systeme wurden einer sorgfältigen Risikobewertung unterzogen 
                      und fallen in die Kategorie mit minimalem Risiko, da sie keine autonomen Entscheidungen über Personen treffen, 
                      keine Bereiche mit hohem Risiko betreffen, ausschließlich als Unterstützungswerkzeuge dienen 
                      und jederzeit menschlicher Überprüfung und Korrekturmöglichkeiten unterliegen.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Transparenz und Information (Art. 13, 52 EU KI Act)</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Alle KI-gestützten Funktionen sind klar als solche gekennzeichnet. Die App informiert Nutzer 
                      transparent über die eingesetzten KI-Systeme, deren Zweck, Funktionsweise und Grenzen. 
                      Konfidenzwerte werden angezeigt, und die Entscheidungsprozesse der KI werden 
                      verständlich dokumentiert.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Boden- und Asphaltklassifizierung (KI-gestützte Bildanalyse)</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die KI-basierte Analyse von hochgeladenen Fotos zur Bestimmung von Bodenklasse und 
                      Belastungsklasse erfüllt alle Anforderungen des EU KI Acts durch:
                      <ul className="list-disc ml-4 mt-1">
                        <li>Explizite Anzeige von Konfidenzwerten bei jeder Klassifizierung</li>
                        <li>Menschliche Aufsicht mit jederzeit möglicher manueller Korrektur</li>
                        <li>Erklärbarkeitsfunktion, die Analysegrundlagen transparent macht</li>
                        <li>Dokumentation der Trainingsdaten und verwendeten Algorithmen</li>
                      </ul>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Qualitätsmanagement und kontinuierliche Verbesserung (Art. 17 EU KI Act)</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Alle KI-Systeme werden regelmäßig auf Qualität, Genauigkeit und potentielle Verzerrungen geprüft.
                      Nutzerrückmeldungen und -korrekturen werden zur kontinuierlichen Verbesserung der Modelle verwendet,
                      unter strikter Einhaltung der Datenschutzbestimmungen. Die App dokumentiert alle Aktualisierungen
                      und Verbesserungen der KI-Komponenten.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Governance und Verantwortlichkeit (Art. 16, 30 EU KI Act)</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Die Bau-Structura App hat klare Verantwortlichkeiten für KI-Systeme implementiert, mit
                      dokumentierten Prozessen für die Behandlung von technischen Problemen und Fehlern.
                      Alle eingesetzten KI-Systeme wurden vor der Implementierung auf Konformität mit dem 
                      EU KI Act geprüft und werden kontinuierlich überwacht.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-center">
                <Button 
                  className="gap-2" 
                  onClick={() => generateCompliancePdf()}
                >
                  <Download className="h-4 w-4" />
                  Vollständige EU-Konformitätsdokumentation herunterladen (PDF)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}