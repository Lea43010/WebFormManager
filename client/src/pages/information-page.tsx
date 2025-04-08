import { ExternalLink, FileText, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

export default function InformationPage() {
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
      
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {/* Externe Links Karte */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Externe Geoportale und Dienste</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg mb-2">BGR Geoportal</h3>
              <p className="text-gray-600 mb-2">
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
              <p className="text-gray-600 mb-2">
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
              <p className="text-gray-600 mb-2">
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
        
        {/* RStO 12 Informationen */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">RStO 12 Belastungsklassen</h2>
          <p className="text-gray-600 mb-4">
            Die Richtlinien für die Standardisierung des Oberbaus von Verkehrsflächen (RStO 12) definieren 
            verschiedene Belastungsklassen, die für die Dimensionierung des Straßenoberbaus maßgebend sind.
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-4 py-2 text-left">Belastungsklasse</th>
                  <th className="border px-4 py-2 text-left">Bemessungsrelevante Achsübergänge</th>
                  <th className="border px-4 py-2 text-left">Typische Anwendung</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-4 py-2 font-medium">Bk100</td>
                  <td className="border px-4 py-2">&gt; 32 Mio.</td>
                  <td className="border px-4 py-2">Autobahnen, stark belastete Bundesstraßen</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">Bk32</td>
                  <td className="border px-4 py-2">10 - 32 Mio.</td>
                  <td className="border px-4 py-2">Bundesstraßen, Hauptverkehrsstraßen</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">Bk10</td>
                  <td className="border px-4 py-2">3,2 - 10 Mio.</td>
                  <td className="border px-4 py-2">Landstraßen, Haupterschließungsstraßen</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">Bk3.2</td>
                  <td className="border px-4 py-2">1,0 - 3,2 Mio.</td>
                  <td className="border px-4 py-2">Erschließungsstraßen, Wohnsammelstraßen</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">Bk1.8</td>
                  <td className="border px-4 py-2">0,3 - 1,0 Mio.</td>
                  <td className="border px-4 py-2">Wohnstraßen, Anliegerstraßen</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">Bk1.0</td>
                  <td className="border px-4 py-2">0,1 - 0,3 Mio.</td>
                  <td className="border px-4 py-2">Gering belastete Straßen</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">Bk0.3</td>
                  <td className="border px-4 py-2">&lt; 0,1 Mio.</td>
                  <td className="border px-4 py-2">Sehr gering belastete Straßen, Wege</td>
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
      </div>
      
      {/* Bauweisen nach RStO 12 */}
      <div className="bg-white p-6 rounded-lg shadow-sm mt-8">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Bauweisen nach RStO 12</h2>
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
        
        <div className="text-sm text-gray-500 italic mb-4">
          Quelle: RStO 12 Richtlinien für die Standardisierung des Oberbaus von Verkehrsflächen, Tafel 1
        </div>
      </div>
      
      {/* Hilfreiche Links */}
      <div className="bg-white p-6 rounded-lg shadow-sm mt-8">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Hilfreiche Links</h2>
        <p className="text-gray-600 mb-4">
          Externe Ressourcen für Straßenplanung und -bau
        </p>
        <div className="space-y-2">
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
      
      {/* Vorschläge und Nutzungshinweise */}
      <div className="bg-white p-6 rounded-lg shadow-sm mt-8">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Nutzungshinweise</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium text-lg mb-2">Standortanalyse</h3>
            <p className="text-gray-600">
              Mit der Geo-Karte können Sie Standorte markieren und analysieren. Nutzen Sie die 
              Asphaltanalyse-Funktion, um automatisch die passende Belastungsklasse zu ermitteln und
              detaillierte Informationen über geeignete Bauweisen zu erhalten.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-2">Materialkostenberechnung</h3>
            <p className="text-gray-600">
              Die Anwendung unterstützt Sie bei der Berechnung von Materialkosten für unterschiedliche
              Straßenbauweisen basierend auf der gewählten Belastungsklasse, Streckenlänge und Straßenbreite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}