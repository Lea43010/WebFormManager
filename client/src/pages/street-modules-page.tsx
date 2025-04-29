import React, { useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Map, Table, BarChart3, AlertTriangle, ArrowLeft, Plus, Mic } from "lucide-react";
import { Link, useLocation } from "wouter";
import { RoadDamageForm } from "@/components/road-damages/road-damage-form";
import { RoadDamageList } from "@/components/road-damages/road-damage-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Belastungsklassen für RStO 12 lokal definieren (statt vom Server zu importieren)
const belastungsklassen = {
  Bk100: {
    name: 'Bk100',
    description: 'Besonders hohe Belastung, über 32 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '79cm',
    details: 'Autobahnen, Industriegebiete, Hauptverkehrsstraßen'
  },
  Bk32: {
    name: 'Bk32',
    description: 'Sehr hohe Belastung, 10 bis 32 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '75cm',
    details: 'Fernstraßen, stark befahrene Bundesstraßen'
  },
  Bk10: {
    name: 'Bk10',
    description: 'Hohe Belastung, 3 bis 10 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '69cm',
    details: 'Bundesstraßen, Landstraßen'
  },
  'Bk3.2': {
    name: 'Bk3.2',
    description: 'Mittlere Belastung, 0,8 bis 3,2 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '63cm',
    details: 'Kreisstraßen, Sammelstraßen'
  },
  'Bk1.8': {
    name: 'Bk1.8',
    description: 'Mittlere bis geringe Belastung, 0,3 bis 1,8 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '61cm',
    details: 'Sammelstraßen, wichtige Erschließungsstraßen'
  },
  'Bk1.0': {
    name: 'Bk1.0',
    description: 'Geringe Belastung, 0,3 bis 1,0 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '59cm',
    details: 'Nebenstraßen, Erschließungsstraßen'
  },
  'Bk0.3': {
    name: 'Bk0.3',
    description: 'Sehr geringe Belastung, unter 0,3 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '55cm',
    details: 'Anliegerstraßen, Wohnstraßen'
  }
};

export default function StreetModulesPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleProjectSelect = (value: string) => {
    setSelectedProjectId(parseInt(value));
  };
  
  return (
    <DashboardLayout 
      title="Straßenbau-Module" 
      tabs={["Straßenbau-Module"]}
    >
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1 text-gray-500 hover:text-gray-700"
          >
            <Link to="/information">
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Informationsseite
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="zustandserfassung" className="space-y-6">
          <TabsList className="bg-white shadow-sm border w-full justify-start h-auto p-1 space-x-1">
            <TabsTrigger value="zustandserfassung" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-sm">
              Zustandserfassung
            </TabsTrigger>
            <TabsTrigger value="belastungsklassen" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-sm">
              Belastungsklassen
            </TabsTrigger>
            <TabsTrigger value="materialberechnung" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-sm">
              Materialberechnung
            </TabsTrigger>
          </TabsList>

          {/* Zustandserfassung Tab */}
          <TabsContent value="zustandserfassung" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Straßenzustandserfassung mit Sprachassistent</CardTitle>
                <CardDescription>
                  Systematische Dokumentation und Analyse von Straßenschäden gemäß ZTV BEA-StB mit KI-gestützter Spracherkennung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                  {/* Projektauswahl */}
                  <div className="w-full md:w-1/2">
                    <label className="text-sm font-medium mb-2 block">Projekt auswählen</label>
                    <Select onValueChange={handleProjectSelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Projekt zur Straßenzustandserfassung auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Autobahnausbau A7 Abschnitt Nord</SelectItem>
                        <SelectItem value="2">Ortsumgehung B27 Fulda</SelectItem>
                        <SelectItem value="3">Sanierung Hauptstraße Musterstadt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Neuen Schaden erfassen Button */}
                  <div className="flex items-end">
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          disabled={!selectedProjectId}
                          className="w-full md:w-auto gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Straßenschaden erfassen
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px]">
                        <DialogHeader>
                          <DialogTitle>Neuen Straßenschaden erfassen</DialogTitle>
                          <DialogDescription>
                            Erfassen Sie einen neuen Straßenschaden manuell oder mit Hilfe des Sprachassistenten.
                          </DialogDescription>
                        </DialogHeader>
                        {selectedProjectId && (
                          <RoadDamageForm
                            projectId={selectedProjectId}
                            userId={user?.id || 1}
                            onSuccess={() => {
                              setIsFormOpen(false);
                              toast({
                                title: "Erfolgreich gespeichert",
                                description: "Der Straßenschaden wurde erfolgreich erfasst."
                              });
                            }}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                {selectedProjectId ? (
                  <RoadDamageList projectId={selectedProjectId} />
                ) : (
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <Mic className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Sprachgestützte Schadenserkennung</h3>
                    <p className="text-blue-700 max-w-md mx-auto mb-4">
                      Wählen Sie ein Projekt aus der Liste oben, um die Straßenzustandserfassung zu starten. 
                      Sie können Schäden manuell erfassen oder die KI-gestützte Spracherfassung nutzen.
                    </p>
                    <Button
                      variant="outline"
                      className="border-blue-200"
                      onClick={() => {
                        toast({
                          title: "Hinweis",
                          description: "Bitte wählen Sie zuerst ein Projekt aus."
                        })
                      }}
                    >
                      Projekt auswählen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Belastungsklassen Tab */}
          <TabsContent value="belastungsklassen" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>RStO 12 Belastungsklassen</CardTitle>
                <CardDescription>
                  Dimensionierung des Straßenoberbaus nach den Richtlinien für die Standardisierung des Oberbaus von Verkehrsflächen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-3 py-2 text-left font-medium">Belastungsklasse</th>
                        <th className="border px-3 py-2 text-left font-medium">Äquivalente 10-t-Achsübergänge</th>
                        <th className="border px-3 py-2 text-left font-medium">Aufbaudicke</th>
                        <th className="border px-3 py-2 text-left font-medium">Typische Anwendung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(belastungsklassen).map((klasse, index) => (
                        <tr key={klasse.name} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border px-3 py-2 font-medium">{klasse.name}</td>
                          <td className="border px-3 py-2">{klasse.description.split(',')[0]}</td>
                          <td className="border px-3 py-2">{klasse.aufbaudicke}</td>
                          <td className="border px-3 py-2">{klasse.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <Link to="/geo-map">
                      <Map className="h-4 w-4" />
                      Zur Geo-Karte
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2" disabled>
                    <Download className="h-4 w-4" />
                    RStO 12 Tabellen herunterladen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materialberechnung Tab */}
          <TabsContent value="materialberechnung" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Materialberechnung für Straßenbau</CardTitle>
                <CardDescription>
                  Berechnung von Materialbedarf und -kosten für verschiedene Straßenbaumaßnahmen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Module-Übersicht */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Asphaltberechnung</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>Berechnung der Asphaltmengen für Deck-, Binder- und Tragschichten nach Fläche und Einbaudicke.</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/geo-map">
                          <Map className="mr-2 h-4 w-4" />
                          Auf Karte berechnen
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Kostenkalkulation</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>Berechnung der Materialkosten unter Berücksichtigung aktueller Preise und Transportwege.</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" disabled>In Entwicklung</Button>
                    </CardFooter>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Lebenszyklus-Berechnung</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>Berechnung der Lebenszykluskosten unter Berücksichtigung von Baukosten, Wartung und Instandhaltung.</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" disabled>In Entwicklung</Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* Status-Hinweis */}
                <div className="p-4 rounded-md border flex items-start gap-3 bg-blue-50 border-blue-200">
                  <div className="flex-shrink-0 mt-1">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800">Materialberechnung auf Karte</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Die Materialberechnung für Straßenbauprojekte ist bereits in der Geo-Karte integriert.
                      Nutzen Sie dort die Messwerkzeuge, um Flächen zu markieren und automatisch die benötigten
                      Materialmengen für verschiedene Straßentypen zu berechnen.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}