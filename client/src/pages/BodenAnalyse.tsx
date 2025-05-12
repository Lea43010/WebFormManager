import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import TiefbauNavigation from '@/components/TiefbauNavigation';

interface Bodenart {
  id: number;
  name: string;
  beschreibung: string;
  dichte: number;
  belastungsklasse: string;
  material_kosten_pro_m2: number;
  bearbeitungshinweise: string;
}

const BodenAnalyse: React.FC = () => {
  const [bodenarten, setBodenarten] = useState<Bodenart[]>([]);
  const [selectedBodenart, setSelectedBodenart] = useState<Bodenart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Lade Bodenarten aus der Datenbank
  useEffect(() => {
    const fetchBodenarten = async () => {
      try {
        const response = await fetch('/api/bodenarten');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Bodenarten');
        }
        const data = await response.json();
        setBodenarten(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        toast({
          title: "Fehler",
          description: `Fehler beim Laden der Bodenarten: ${err.message}`,
          variant: "destructive"
        });
      }
    };

    fetchBodenarten();
  }, []);

  // Zeige Details einer ausgewählten Bodenart
  const handleSelectBodenart = (bodenart: Bodenart) => {
    setSelectedBodenart(bodenart);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Bodenarten & RStO 12 Belastungsklassen</h1>
      </div>

      <TiefbauNavigation />
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          Fehler: {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Verfügbare Bodenarten</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {bodenarten.map((bodenart) => (
                  <li 
                    key={bodenart.id} 
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedBodenart?.id === bodenart.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleSelectBodenart(bodenart)}
                  >
                    <div className="font-medium">{bodenart.name}</div>
                    <div className="text-sm">RStO 12: {bodenart.belastungsklasse}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            {selectedBodenart ? (
              <>
                <CardHeader>
                  <CardTitle>{selectedBodenart.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md mb-4">
                    <p>{selectedBodenart.beschreibung}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Dichte:</h3>
                      <p className="text-lg font-medium">{selectedBodenart.dichte} kg/m³</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Belastungsklasse (RStO 12):</h3>
                      <p className="text-lg font-medium">{selectedBodenart.belastungsklasse}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Materialkosten:</h3>
                      <p className="text-lg font-medium">{selectedBodenart.material_kosten_pro_m2} €/m²</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="font-medium mb-2">Bearbeitungshinweise:</h3>
                    <p>{selectedBodenart.bearbeitungshinweise}</p>
                  </div>
                  
                  <div className="mt-6 flex gap-2">
                    <Button onClick={() => window.location.href = `/maschinen-auswahl?bodenart=${selectedBodenart.id}`}>
                      Geeignete Maschinen anzeigen
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = `/kosten-kalkulation?bodenart=${selectedBodenart.id}`}>
                      Zur Kostenkalkulation
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center p-4">
                  <p className="text-muted-foreground mb-2">Bitte wählen Sie eine Bodenart aus der Liste</p>
                </div>
              </CardContent>
            )}
          </Card>
          
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>RStO 12 Belastungsklassen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p>Die Richtlinien für die Standardisierung des Oberbaus von Verkehrsflächen (RStO 12) definieren verschiedene Belastungsklassen, die für die Dimensionierung des Straßenoberbaus maßgebend sind.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left border">Klasse</th>
                      <th className="p-3 text-left border">Beanspruchung</th>
                      <th className="p-3 text-left border">Typische Anwendung</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border">Bk100</td>
                      <td className="p-3 border">&gt; 32 Mio.</td>
                      <td className="p-3 border">Autobahnen, stark belastete Bundesstraßen</td>
                    </tr>
                    <tr>
                      <td className="p-3 border">Bk32</td>
                      <td className="p-3 border">10 - 32 Mio.</td>
                      <td className="p-3 border">Bundesstraßen, Hauptverkehrsstraßen</td>
                    </tr>
                    <tr>
                      <td className="p-3 border">Bk10</td>
                      <td className="p-3 border">3,2 - 10 Mio.</td>
                      <td className="p-3 border">Landstraßen, Haupterschließungsstraßen</td>
                    </tr>
                    <tr>
                      <td className="p-3 border">Bk3.2</td>
                      <td className="p-3 border">1,0 - 3,2 Mio.</td>
                      <td className="p-3 border">Erschließungsstraßen, Wohnsammelstraßen</td>
                    </tr>
                    <tr>
                      <td className="p-3 border">Bk1.8</td>
                      <td className="p-3 border">0,3 - 1,0 Mio.</td>
                      <td className="p-3 border">Wohnstraßen, Anliegerstraßen</td>
                    </tr>
                    <tr>
                      <td className="p-3 border">Bk0.3</td>
                      <td className="p-3 border">&lt; 0,3 Mio.</td>
                      <td className="p-3 border">Leicht belastete Nebenstraßen, Parkplätze</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BodenAnalyse;