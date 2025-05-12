import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Home, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GeoportalePage() {
  const { toast } = useToast();

  const openExternalLink = (url: string, name: string) => {
    window.open(url, "_blank");
    toast({
      title: `${name} wird geöffnet`,
      description: "Die externe Webseite wird in einem neuen Browserfenster geladen.",
    });
  };

  return (
    <div className="container mx-auto p-4 bg-[#F3F4F6]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#111827]">Geoportale</h1>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="bg-white hover:bg-gray-50"
        >
          <Home className="h-4 w-4 mr-2" />
          Zurück
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Karten und Atlanten */}
        <Card className="bg-white shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="text-[#111827] flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-[#76a730]" />
              Bayerische Atlanten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                variant="default" 
                onClick={() => openExternalLink("https://geoportal.bayern.de/denkmalatlas/", "Denkmal-Atlas")}
                className="w-full justify-between bg-[#76a730] hover:bg-[#638c28] text-white"
              >
                <span>Denkmal-Atlas Bayern</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>

              <Button 
                variant="default" 
                onClick={() => openExternalLink("https://atlas.bayern.de/?c=677751,5422939&z=7&r=0&l=vt_standard&mid=1", "BayernAtlas")}
                className="w-full justify-between bg-[#76a730] hover:bg-[#638c28] text-white"
              >
                <span>BayernAtlas Geoportal</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bundesweite Portale */}
        <Card className="bg-white shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="text-[#111827] flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-[#76a730]" />
              Bundesweite Geoportale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={() => openExternalLink("https://www.geoportal.de/", "Geoportal Deutschland")}
                className="w-full justify-between bg-white hover:bg-gray-50"
              >
                <span>Geoportal Deutschland</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>

              <Button 
                variant="outline" 
                onClick={() => openExternalLink("https://gdz.bkg.bund.de/", "Geodatenzentrum")}
                className="w-full justify-between bg-white hover:bg-gray-50"
              >
                <span>Geodatenzentrum (BKG)</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Denkmalschutz-Ressourcen */}
        <Card className="bg-white shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="text-[#111827] flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-[#76a730]" />
              Denkmalschutz-Ressourcen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={() => openExternalLink("https://www.deutsche-digitale-bibliothek.de/newspaper", "Deutsche Digitale Bibliothek")}
                className="w-full justify-between bg-white hover:bg-gray-50"
              >
                <span>Deutsche Digitale Bibliothek</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>

              <Button 
                variant="outline" 
                onClick={() => openExternalLink("https://www.dnk.de/im-fokus/deutsches-kulturerbe/", "Deutsches Kulturerbe")}
                className="w-full justify-between bg-white hover:bg-gray-50"
              >
                <span>Deutsches Kulturerbe (DNK)</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Zusätzliche Ressourcen */}
        <Card className="bg-white shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="text-[#111827] flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-[#76a730]" />
              Weitere Informationsquellen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={() => openExternalLink("https://www.archaeologie-online.de/", "Archäologie Online")}
                className="w-full justify-between bg-white hover:bg-gray-50"
              >
                <span>Archäologie Online</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>

              <Button 
                variant="outline" 
                onClick={() => openExternalLink("https://www.umweltkarten.mv-regierung.de/atlas/", "Umweltkarten")}
                className="w-full justify-between bg-white hover:bg-gray-50"
              >
                <span>Umweltkarten Deutschland</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}