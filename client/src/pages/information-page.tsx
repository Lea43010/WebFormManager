import { ExternalLink, FileText, ArrowLeft, Info, ChevronRight, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";

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
  { id: "externe-dienste", title: "Externe Geoportale und Dienste" },
  { id: "belastungsklassen", title: "RStO 12 Belastungsklassen" },
  { id: "bauweisen", title: "Bauweisen nach RStO 12" },
  { id: "hilfreiche-links", title: "Hilfreiche Links" },
  { id: "geo-anleitung", title: "Anleitung Geo-Informationen" },
  { id: "nutzungshinweise", title: "Nutzungshinweise" }
];

export default function InformationPage() {
  const [activeSection, setActiveSection] = useState<string>("externe-dienste");

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

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => {
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) observer.unobserve(element);
      });
    };
  }, []);

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
              Die Geo-Informationen-Seite bietet umfangreiche Funktionen zur Standortmarkierung, Streckenanalyse, Materialberechnung 
              und Baumaschinenempfehlung für Straßenbauprojekte.
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
          
          {/* Nutzungshinweise */}
          <div id="nutzungshinweise" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Nutzungshinweise</h2>
            <div className="grid md:grid-cols-2 gap-8">
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
          </div>
        </div>
      </div>
    </div>
  );
}