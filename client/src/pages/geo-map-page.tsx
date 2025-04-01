import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SpeechToText } from "@/components/ui/speech-to-text";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Map, FileText, ExternalLink, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Belastungsklassen nach RStO 12
type BelastungsklasseInfo = {
  klasse: string;
  beanspruchung: string;
  beispiel: string;
  bauklasse: string;
}

const belastungsklassen: BelastungsklasseInfo[] = [
  {
    klasse: "Bk100",
    beanspruchung: "> 32",
    beispiel: "Autobahnen, Schnellstraßen",
    bauklasse: "SV"
  },
  {
    klasse: "Bk32",
    beanspruchung: "> 10 und ≤ 32",
    beispiel: "Industriestraßen",
    bauklasse: "I"
  },
  {
    klasse: "Bk10",
    beanspruchung: "> 3,2 und ≤ 10",
    beispiel: "Hauptgeschäftsstraßen",
    bauklasse: "II"
  },
  {
    klasse: "Bk3,2",
    beanspruchung: "> 1,8 und ≤ 3,2",
    beispiel: "Verbindungsstraßen",
    bauklasse: "III"
  },
  {
    klasse: "Bk1,8",
    beanspruchung: "> 1,0 und ≤ 1,8",
    beispiel: "Sammelstraßen, wenig befahrene Hauptgeschäftsstraßen",
    bauklasse: "IV"
  },
  {
    klasse: "Bk1,0",
    beanspruchung: "> 0,3 und ≤ 1,0",
    beispiel: "Wohnstraßen",
    bauklasse: "V"
  },
  {
    klasse: "Bk0,3",
    beanspruchung: "≤ 0,3",
    beispiel: "Wohnwege",
    bauklasse: "V und VI"
  }
];

export default function GeoMapPage() {
  const [notes, setNotes] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBelastungsklasse, setSelectedBelastungsklasse] = useState<string>("");
  const [mapSource, setMapSource] = useState<string>("bgr");

  const handleSave = () => {
    setIsSaving(true);
    // Hier würde normalerweise die Speicherlogik implementiert werden
    setTimeout(() => {
      setIsSaving(false);
      alert("Notizen gespeichert!");
    }, 1000);
  };
  
  const getKlasseInfo = (klasseId: string): BelastungsklasseInfo | undefined => {
    return belastungsklassen.find(k => k.klasse === klasseId);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-2">Straßen-Belastungsklassen & Geoportal</h1>
      <p className="text-gray-500 mb-6">
        Erfassen Sie Belastungsklassen für Projekte nach RStO 12 und nutzen Sie externe Kartendienste.
      </p>

      <div className="mb-6">
        <Tabs defaultValue="belastungsklassen">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="belastungsklassen">Belastungsklassen (RStO)</TabsTrigger>
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
          
          <TabsContent value="kartenportale">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader>
                  <CardTitle>BGR Geoportal</CardTitle>
                  <CardDescription>
                    Geoportal der Bundesanstalt für Geowissenschaften und Rohstoffe
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center p-6 text-center rounded-md border">
                    <Map className="h-12 w-12 text-primary mb-2" />
                    <p className="text-sm text-gray-500 mb-4">
                      Geologische Karten und Bodenkarten für Deutschland
                    </p>
                    <Button 
                      variant="default" 
                      onClick={() => window.open("https://geoportal.bgr.de/mapapps/resources/apps/geoportal/index.html?lang=de#/geoviewer", "_blank")}
                    >
                      BGR Geoportal öffnen 
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>BASt GIS-Viewer</CardTitle>
                  <CardDescription>
                    GIS-System der Bundesanstalt für Straßenwesen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center p-6 text-center rounded-md border">
                    <Map className="h-12 w-12 text-primary mb-2" />
                    <p className="text-sm text-gray-500 mb-4">
                      Straßeninformationen, Bauprojekte und Verkehrsdaten
                    </p>
                    <Button 
                      variant="default" 
                      onClick={() => window.open("https://www.bast.de", "_blank")}
                    >
                      BASt Website öffnen
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Lokale Kartenansicht (vorschau)</CardTitle>
                <CardDescription>
                  Beispielansicht für zukünftige Integration einer lokalen Karte
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative aspect-video w-full overflow-hidden border bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-4">
                    <Map className="h-16 w-16 mx-auto text-primary" />
                    <h3 className="text-lg font-semibold mt-2">Kartenintegration in Arbeit</h3>
                    <p className="text-gray-500 mt-1 mb-4">
                      Eine direkte Kartenintegration ist in Entwicklung.
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open("https://geoportal.bgr.de/mapapps/resources/apps/geoportal/index.html?lang=de#/geoviewer", "_blank")}
                    >
                      BGR Geoportal
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
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
                      onClick={() => window.open("https://www.google.de/maps", "_blank")}
                    >
                      Google Maps
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
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
              <CardTitle>Projektverknüpfung</CardTitle>
              <CardDescription>
                Verknüpfen Sie diese Standortinformationen mit einem bestehenden Projekt
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
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button className="w-full" disabled>
                        Mit Projekt verknüpfen
                        <Map className="ml-2 h-4 w-4" />
                      </Button>
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