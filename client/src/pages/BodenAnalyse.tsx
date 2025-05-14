import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, MapPin, Database, FileSpreadsheet } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import TiefbauNavigation from '@/components/TiefbauNavigation';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface BodenanalyseErgebnis {
  coordinates: {
    lat: number;
    lng: number;
    utm32?: {
      x: number;
      y: number;
    };
  };
  success: boolean;
  data: {
    bodenart: string;
    hauptbodentyp: string;
    leitbodentyp: string;
    bodenregion: string;
    nutzung: string;
    bodeneinheit: string;
    bodengesellschaft: string;
    substratsystematik: string;
  } | {
    error: boolean;
    message: string;
  };
  error?: string;
  message?: string;
}

const BodenAnalyse: React.FC = () => {
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<BodenanalyseErgebnis | null>(null);
  const [batchResults, setBatchResults] = useState<BodenanalyseErgebnis[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [batchLoading, setBatchLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Einzelpunkt-Koordinaten abfragen
  const handleAnalyzePoint = async () => {
    if (!lat || !lng) {
      toast({
        title: "Eingabefehler",
        description: "Bitte geben Sie gültige Koordinaten ein.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setAnalysisResult(null);

    try {
      const response = await fetch(`/api/soil-analysis/point?lat=${lat}&lng=${lng}`);
      if (!response.ok) {
        throw new Error('Fehler bei der Bodenanalyse');
      }
      
      const data = await response.json();
      setAnalysisResult(data.data);
      
      if (!data.success) {
        toast({
          title: "Fehler",
          description: data.message || "Fehler bei der Bodenanalyse",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Fehler bei der Bodenanalyse:', error);
      toast({
        title: "Fehler",
        description: "Die Bodenanalyse konnte nicht durchgeführt werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Manuelle Batch-Koordinaten abfragen
  const handleBatchAnalysis = async () => {
    const points = [
      { lat: 48.1351, lng: 11.5820 }, // München
      { lat: 52.5200, lng: 13.4050 }, // Berlin
      { lat: 50.9375, lng: 6.9603 },  // Köln
      { lat: 53.5511, lng: 9.9937 },  // Hamburg
      { lat: 50.1109, lng: 8.6821 }   // Frankfurt
    ];

    setBatchLoading(true);
    setBatchResults([]);

    try {
      const response = await fetch('/api/soil-analysis/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points }),
      });

      if (!response.ok) {
        throw new Error('Fehler bei der Batch-Bodenanalyse');
      }
      
      const data = await response.json();
      setBatchResults(data.data);
      
      if (!data.success) {
        toast({
          title: "Fehler",
          description: data.message || "Fehler bei der Batch-Bodenanalyse",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Fehler bei der Batch-Bodenanalyse:', error);
      toast({
        title: "Fehler",
        description: "Die Batch-Bodenanalyse konnte nicht durchgeführt werden.",
        variant: "destructive",
      });
    } finally {
      setBatchLoading(false);
    }
  };

  // CSV-Upload für Batch-Analyse
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('csv', file);

    setBatchLoading(true);
    setBatchResults([]);

    try {
      const response = await fetch('/api/soil-analysis/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Fehler beim Verarbeiten der CSV-Datei');
      }
      
      const data = await response.json();
      setBatchResults(data.data);
      
      if (!data.success) {
        toast({
          title: "Fehler",
          description: data.message || "Fehler beim Verarbeiten der CSV-Datei",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erfolg",
          description: `${data.data.length} Koordinaten erfolgreich analysiert.`,
        });
      }
    } catch (error) {
      console.error('Fehler beim CSV-Upload:', error);
      toast({
        title: "Fehler",
        description: "Die CSV-Datei konnte nicht verarbeitet werden.",
        variant: "destructive",
      });
    } finally {
      setBatchLoading(false);
      // Formular zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Funktion zur Anzeige der Bodenanalyseergebnisse
  const renderAnalysisResult = (result: BodenanalyseErgebnis) => {
    if (!result.success) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 font-medium">Fehler bei der Analyse</p>
          <p className="text-sm text-gray-600">{result.message || 'Unbekannter Fehler'}</p>
        </div>
      );
    }

    const data = result.data as { 
      bodenart: string;
      hauptbodentyp: string;
      leitbodentyp: string;
      bodenregion: string;
      nutzung: string;
      bodeneinheit: string;
      bodengesellschaft: string;
      substratsystematik: string;
    };

    // Farbzuordnung für Bodenarten
    const getBodenartColor = (bodenart: string) => {
      const colorMap: Record<string, string> = {
        'Sand': 'bg-yellow-100 text-yellow-800',
        'Lehm': 'bg-amber-100 text-amber-800',
        'Schluff': 'bg-orange-100 text-orange-800',
        'Ton': 'bg-red-100 text-red-800',
        'Löss': 'bg-yellow-200 text-yellow-900',
        'Mergel': 'bg-blue-100 text-blue-800',
        'Moor': 'bg-brown-100 text-brown-800',
        'Kies': 'bg-gray-100 text-gray-800',
        'Fels': 'bg-slate-200 text-slate-800',
      };
      
      // Prüfen, ob der Bodenart-String eines der Schlüsselwörter enthält
      for (const [key, color] of Object.entries(colorMap)) {
        if (bodenart.toLowerCase().includes(key.toLowerCase())) {
          return color;
        }
      }
      
      return 'bg-gray-100 text-gray-800'; // Standardfarbe
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Koordinaten</h3>
            <p>
              Lat: {result.coordinates.lat.toFixed(6)}, 
              Lng: {result.coordinates.lng.toFixed(6)}
            </p>
            {result.coordinates.utm32 && (
              <p className="text-xs text-gray-500 mt-1">
                UTM32: {result.coordinates.utm32.x.toFixed(1)}, {result.coordinates.utm32.y.toFixed(1)}
              </p>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Klassifikation</h3>
            <div className={`inline-block px-2 py-1 rounded ${getBodenartColor(data.bodenart)}`}>
              {data.bodenart || 'Unbekannt'}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500">Hauptbodentyp</h3>
          <p>{data.hauptbodentyp || 'Nicht verfügbar'}</p>
          
          <h3 className="text-sm font-medium text-gray-500 mt-2">Leitbodentyp</h3>
          <p>{data.leitbodentyp || 'Nicht verfügbar'}</p>
          
          <h3 className="text-sm font-medium text-gray-500 mt-2">Bodenregion</h3>
          <p>{data.bodenregion || 'Nicht verfügbar'}</p>
          
          <h3 className="text-sm font-medium text-gray-500 mt-2">Nutzung</h3>
          <p>{data.nutzung || 'Nicht verfügbar'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <TiefbauNavigation />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">BGR Bodenanalyse</h1>
          <p className="text-gray-600">
            Analyse von Bodenarten basierend auf BGR-Daten (Bundesanstalt für Geowissenschaften und Rohstoffe)
          </p>
        </div>
        <Link href="/tiefbau-map">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Zurück zur Karte
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <MapPin size={16} />
            Einzelpunkt-Analyse
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Database size={16} />
            Batch-Analyse
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileSpreadsheet size={16} />
            CSV-Upload
          </TabsTrigger>
        </TabsList>
        
        {/* Einzelpunkt-Analyse */}
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Einzelpunkt-Bodenanalyse</CardTitle>
              <CardDescription>
                Analysen Sie die Bodenart an einem einzelnen Standort durch Eingabe von WGS84-Koordinaten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Breitengrad (Latitude, z.B. 52.5200)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="z.B. 48.1351"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Längengrad (Longitude, z.B. 13.4050)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="z.B. 11.5820"
                  />
                </div>
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={handleAnalyzePoint}
                disabled={loading}
              >
                {loading ? 'Analysiere...' : 'Bodenart analysieren'}
              </Button>
              
              {loading && (
                <div className="mt-6 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
              
              {!loading && analysisResult && (
                <div className="mt-6 border rounded-lg p-4">
                  {renderAnalysisResult(analysisResult)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Batch-Analyse */}
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>Batch-Bodenanalyse</CardTitle>
              <CardDescription>
                Führen Sie eine Batch-Analyse für mehrere vordefinierte Standorte in Deutschland durch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Diese Beispiel-Analyse verwendet folgende Standorte: München, Berlin, Köln, Hamburg und Frankfurt.
              </p>
              
              <Button 
                className="w-full" 
                onClick={handleBatchAnalysis}
                disabled={batchLoading}
              >
                {batchLoading ? 'Analysiere...' : 'Batch-Analyse starten'}
              </Button>
              
              {batchLoading && (
                <div className="mt-6 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              )}
              
              {!batchLoading && batchResults.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <Table>
                    <TableCaption>Batch-Analyseergebnisse</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Standort</TableHead>
                        <TableHead>Koordinaten</TableHead>
                        <TableHead>Bodenart</TableHead>
                        <TableHead>Hauptbodentyp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            Standort {index + 1}
                          </TableCell>
                          <TableCell>
                            {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
                          </TableCell>
                          <TableCell>
                            {result.success && 'error' in result.data ? (
                              <span className="text-red-500">Fehler: {(result.data as any).message}</span>
                            ) : (
                              <span>
                                {result.success ? (result.data as any).bodenart || 'Unbekannt' : 'Fehler'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.success && !('error' in result.data) ? 
                              (result.data as any).hauptbodentyp || 'Unbekannt' : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* CSV-Upload */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>CSV-Upload für Bodenanalyse</CardTitle>
              <CardDescription>
                Laden Sie eine CSV-Datei mit Koordinaten hoch, um Bodenanalysen für mehrere Standorte durchzuführen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-upload">CSV-Datei mit Koordinaten</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="mt-1"
                    disabled={batchLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Die CSV-Datei sollte Spalten mit den Namen "lat"/"latitude" und "lng"/"longitude" enthalten.
                  </p>
                </div>
                
                {batchLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary"></div>
                    <span className="ml-2">CSV wird verarbeitet...</span>
                  </div>
                )}
                
                {!batchLoading && batchResults.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableCaption>CSV-Upload Ergebnisse</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Koordinaten</TableHead>
                          <TableHead>Bodenart</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchResults.slice(0, 100).map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
                            </TableCell>
                            <TableCell>
                              {result.success && !('error' in result.data) && result.data && typeof result.data === 'object' ? 
                                ((result.data as any).bodenart || 'Unbekannt') : '-'}
                            </TableCell>
                            <TableCell>
                              {result.success ? (
                                <span className="text-green-500">Erfolg</span>
                              ) : (
                                <span className="text-red-500">Fehler</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {batchResults.length > 100 && (
                      <p className="text-center text-sm text-gray-500 mt-2">
                        Zeige 100 von {batchResults.length} Ergebnissen
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <Upload size={16} className="mr-2" />
                <span>Max. Dateigröße: 5MB</span>
              </div>
              <div>Format: CSV mit Spalten "lat", "lng"</div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BodenAnalyse;