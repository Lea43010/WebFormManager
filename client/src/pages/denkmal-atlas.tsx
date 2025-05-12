import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Map, ExternalLink, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Karten-Komponente für Denkmal-Atlas
const DenkmalAtlasMap = ({ onOpenExternal }: { onOpenExternal: () => void }) => (
  <div className="w-full max-w-3xl h-[50vh] bg-white border-2 border-gray-200 shadow-md rounded-lg flex flex-col items-center justify-center overflow-hidden p-4">
    <div className="text-xl font-bold text-gray-800 mb-4">Freistaat Bayern</div>
    
    <div className="relative w-full h-full flex items-center justify-center">
      <svg 
        viewBox="0 0 350 300" 
        className="h-full w-auto max-w-full"
      >
        {/* Bayern als einfache, abgerundete Form */}
        <path
          d="M220,50 C260,80 290,150 270,210 C250,260 180,280 130,260 C80,240 40,170 70,110 C100,60 170,10 220,50 z"
          fill="#76a730"
        />
        
        {/* Wichtige Städte */}
        <circle cx="120" cy="100" r="5" fill="#d04848" />
        <text x="120" y="90" textAnchor="middle" fontSize="10" fill="#000">Würzburg</text>
        
        <circle cx="170" cy="120" r="5" fill="#d04848" />
        <text x="170" y="110" textAnchor="middle" fontSize="10" fill="#000">Nürnberg</text>
        
        <circle cx="210" cy="140" r="5" fill="#d04848" />
        <text x="210" y="130" textAnchor="middle" fontSize="10" fill="#000">Regensburg</text>
        
        <circle cx="150" cy="190" r="5" fill="#d04848" />
        <text x="150" y="180" textAnchor="middle" fontSize="10" fill="#000">Augsburg</text>
        
        <circle cx="190" cy="210" r="5" fill="#d04848" />
        <text x="190" y="200" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#000">München</text>
      </svg>
    </div>
  </div>
);

// Karten-Komponente für BayernAtlas
const BayernAtlasMap = ({ onOpenExternal }: { onOpenExternal: () => void }) => (
  <div className="w-full max-w-3xl h-[50vh] bg-white border-2 border-gray-200 shadow-md rounded-lg flex flex-col items-center justify-center overflow-hidden p-4">
    <div className="text-lg font-bold text-gray-800 mb-4">Freistaat Bayern</div>
    
    <div className="relative w-full h-full flex items-center justify-center">
      <svg 
        viewBox="0 0 300 300" 
        className="h-full w-auto max-w-full"
        style={{ filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))" }}
      >
        {/* Bayerns Grundform - Vereinfacht */}
        <path
          d="M150,30 C120,35 110,70 100,90 C90,110 80,130 70,150 C60,170 60,200 70,220 C80,240 90,250 100,260 C110,270 130,280 150,280 C170,280 190,270 210,250 C220,240 230,220 240,200 C250,180 240,160 230,140 C220,120 210,100 200,80 C190,60 180,25 150,30 z"
          fill="#76a730"
          stroke="#fff"
          strokeWidth="1"
        />
        
        {/* Wichtige Städte */}
        <circle cx="130" cy="80" r="4" fill="#d04848" />
        <text x="130" y="70" textAnchor="middle" fontSize="8" fontWeight="normal">Würzburg</text>
        
        <circle cx="160" cy="120" r="4" fill="#d04848" />
        <text x="160" y="110" textAnchor="middle" fontSize="8" fontWeight="normal">Nürnberg</text>
        
        <circle cx="190" cy="140" r="4" fill="#d04848" />
        <text x="190" y="130" textAnchor="middle" fontSize="8" fontWeight="normal">Regensburg</text>
        
        <circle cx="145" cy="180" r="4" fill="#d04848" />
        <text x="145" y="170" textAnchor="middle" fontSize="8" fontWeight="normal">Augsburg</text>
        
        <circle cx="175" cy="200" r="4" fill="#d04848" />
        <text x="175" y="190" textAnchor="middle" fontSize="8" fontWeight="bold">München</text>
      </svg>
    </div>
  </div>
);

// Wrapper-Komponente für Kartenansicht mit einheitlichem Button
const MapContainer = ({ 
  title, 
  description, 
  children, 
  externalUrl, 
  externalName 
}: { 
  title: string; 
  description: string; 
  children: React.ReactNode; 
  externalUrl: string; 
  externalName: string 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleExternalLink = () => {
    window.open(externalUrl, "_blank");
    toast({
      title: `${externalName} wird in einem neuen Tab geöffnet`,
      description: "Die externe Webseite wird in einem neuen Browserfenster geladen.",
    });
  };

  return (
    <Card className="bg-white shadow-sm rounded-lg">
      <CardHeader>
        <CardTitle className="text-[#111827]">
          <span>{title}</span>
        </CardTitle>
        <CardDescription className="text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#76a730]"></div>
          </div>
        )}
        <div className="w-full h-[70vh] bg-gray-50 flex flex-col items-center justify-center p-4">
          {children}
          <div className="mt-4 text-center space-y-3">
            <p className="text-gray-700">Die direkte Einbindung ist aufgrund von Verbindungsbeschränkungen nicht möglich.</p>
            <Button 
              variant="default" 
              onClick={handleExternalLink}
              className="bg-[#76a730] hover:bg-[#638c28] text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Öffnen im neuen Tab
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DenkmalAtlasPage() {
  const [activeTab, setActiveTab] = useState("bayern");

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
          <MapContainer 
            title="Bayerischer Denkmal-Atlas" 
            description="Die Online-Version der Bayerischen Denkmalliste mit Informationen zu Bau- und Bodendenkmälern."
            externalUrl="https://geoportal.bayern.de/denkmalatlas/"
            externalName="Denkmal-Atlas"
          >
            <DenkmalAtlasMap 
              onOpenExternal={() => window.open("https://geoportal.bayern.de/denkmalatlas/", "_blank")}
            />
          </MapContainer>
        </TabsContent>

        <TabsContent value="geoportal" className="mt-0">
          <MapContainer 
            title="BayernAtlas Geoportal" 
            description="Das offizielle Geoportal mit umfangreichen Karten und Geodaten des Freistaats Bayern."
            externalUrl="https://geoportal.bayern.de/bayernatlas/"
            externalName="BayernAtlas"
          >
            <BayernAtlasMap 
              onOpenExternal={() => window.open("https://geoportal.bayern.de/bayernatlas/", "_blank")}
            />
          </MapContainer>
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
                    onClick={() => window.open("https://www.deutsche-digitale-bibliothek.de/newspaper", "_blank")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Deutsche Digitale Bibliothek</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => window.open("https://www.dnk.de/im-fokus/deutsches-kulturerbe/", "_blank")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Deutsches Kulturerbe (DNK)</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => window.open("https://www.archaeologie-online.de/", "_blank")}
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
                    onClick={() => window.open("https://www.geoportal.de/", "_blank")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Geoportal Deutschland</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => window.open("https://gdz.bkg.bund.de/", "_blank")}
                    className="w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span>Geodatenzentrum (BKG)</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => window.open("https://www.umweltkarten.mv-regierung.de/atlas/", "_blank")}
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