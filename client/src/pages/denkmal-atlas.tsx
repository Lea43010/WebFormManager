import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Map, ExternalLink, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DenkmalAtlasPage() {
  const [activeTab, setActiveTab] = useState("bayern");
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Zeit für das Laden der iframes geben
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleExternalLink = (url: string, name: string) => {
    window.open(url, "_blank");
    toast({
      title: `${name} wird in einem neuen Tab geöffnet`,
      description: "Die externe Webseite wird in einem neuen Browserfenster geladen.",
    });
  };

  return (
    <div className="container mx-auto p-4 bg-[#F3F4F6]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#111827]">Denkmal-Atlas & Geoportale</h1>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="bg-white hover:bg-gray-50"
        >
          <Home className="h-4 w-4 mr-2" />
          Zurück
        </Button>
      </div>

      <Alert className="mb-6 bg-white border border-gray-200 shadow-sm">
        <InfoIcon className="h-4 w-4 text-[#76a730]" />
        <AlertTitle className="text-[#111827]">Wichtige Information</AlertTitle>
        <AlertDescription className="text-gray-600">
          Die folgenden Geoportale werden als externe Dienste eingebunden. 
          Sie unterstützen die Arbeit mit Denkmalschutz- und Geodaten in Deutschland. 
          Klicken Sie auf die Tabs, um zwischen den verschiedenen Portalen zu wechseln.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="bayern" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full bg-white mb-6">
          <TabsTrigger value="bayern" className="data-[state=active]:bg-[#76a730] data-[state=active]:text-white">
            DenkmalAtlas Bayern
          </TabsTrigger>
          <TabsTrigger value="geoportal" className="data-[state=active]:bg-[#76a730] data-[state=active]:text-white">
            BayernAtlas Geoportal 
          </TabsTrigger>
          <TabsTrigger value="bund" className="data-[state=active]:bg-[#76a730] data-[state=active]:text-white">
            Bundesweite Dienste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bayern" className="mt-0">
          <Card className="bg-white shadow-sm rounded-lg">
            <CardHeader>
              <CardTitle className="text-[#111827] flex items-center justify-between">
                <span>Bayerischer Denkmal-Atlas</span>
                <Button 
                  variant="outline" 
                  onClick={() => handleExternalLink("https://geoportal.bayern.de/denkmalatlas/", "Denkmal-Atlas")}
                  className="bg-white hover:bg-gray-50 border-[#76a730] text-[#76a730]"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Öffnen im neuen Tab
                </Button>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Die Online-Version der Bayerischen Denkmalliste mit Informationen zu Bau- und Bodendenkmälern.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#76a730]"></div>
                </div>
              )}
              <iframe 
                src="https://geoportal.bayern.de/denkmalatlas/" 
                title="Bayerischer Denkmal-Atlas" 
                className="w-full h-[70vh] border-0"
                loading="lazy"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geoportal" className="mt-0">
          <Card className="bg-white shadow-sm rounded-lg">
            <CardHeader>
              <CardTitle className="text-[#111827] flex items-center justify-between">
                <span>BayernAtlas Geoportal</span>
                <Button 
                  variant="outline" 
                  onClick={() => handleExternalLink("https://geoportal.bayern.de/bayernatlas/", "BayernAtlas")} 
                  className="bg-white hover:bg-gray-50 border-[#76a730] text-[#76a730]"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Öffnen im neuen Tab
                </Button>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Das offizielle Geoportal mit umfangreichen Karten und Geodaten des Freistaats Bayern.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#76a730]"></div>
                </div>
              )}
              <iframe 
                src="https://geoportal.bayern.de/bayernatlas/?topic=ba&lang=de&bgLayer=atkis&catalogNodes=11,122" 
                title="BayernAtlas" 
                className="w-full h-[70vh] border-0"
                loading="lazy"
              />
            </CardContent>
          </Card>
        </TabsContent>

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
}