import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import Papa from 'papaparse'; // Abhängigkeit für CSV-Verarbeitung

interface SoilAnalysisResult {
  bodenartCode: string;
  bodenartDescription: string;
  classification: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  color: string;
}

interface BatchAnalysisResult {
  results: SoilAnalysisResult[];
  count: number;
}

// Hilfsfunktion zur Koordinatenvalidierung
const isValidCoordinate = (value: number | string, isLongitude = false): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return false;
  
  // Begrenzungen für Deutschland
  if (isLongitude) {
    return num >= 5.0 && num <= 16.0;
  } else {
    return num >= 47.0 && num <= 56.0;
  }
};

const BodenAnalyse: React.FC = () => {
  const { toast } = useToast();
  const [latitude, setLatitude] = useState<string>('51.0');
  const [longitude, setLongitude] = useState<string>('10.0');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Array<{ longitude: number, latitude: number }>>([]);
  const [activeTab, setActiveTab] = useState('einzelanalyse');
  
  // Abfrage der Farbzuordnung für die Legende
  const { data: colorMapping } = useQuery({
    queryKey: ['/api/soil-analysis/color-mapping'],
  });
  
  // Einzelpunkt-Analyse
  const {
    data: singlePointResult,
    isLoading: isLoadingSinglePoint,
    refetch: refetchSinglePoint
  } = useQuery<SoilAnalysisResult>({
    queryKey: ['/api/soil-analysis', { lat: latitude, lon: longitude }],
    enabled: false, // Nicht automatisch ausführen
  });
  
  // Batch-Analyse
  const batchMutation = useMutation({
    mutationFn: async (coordinates: Array<{ lon: number, lat: number }>) => {
      const response = await apiRequest('POST', '/api/soil-analysis/batch', { coordinates, maxPoints: 100 });
      return response.json() as Promise<BatchAnalysisResult>;
    },
    onSuccess: () => {
      toast({
        title: 'Batch-Analyse abgeschlossen',
        description: 'Die Bodenanalyse für alle Koordinaten wurde erfolgreich durchgeführt.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler bei der Batch-Analyse',
        description: error.message || 'Es ist ein Fehler bei der Batch-Verarbeitung aufgetreten.',
        variant: 'destructive',
      });
    },
  });
  
  // CSV-Datei verarbeiten
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          const validData = results.data
            .filter((row: any) => row.longitude !== undefined && row.latitude !== undefined)
            .filter((row: any) => 
              isValidCoordinate(row.longitude, true) && 
              isValidCoordinate(row.latitude, false)
            );
          
          setParsedData(validData as Array<{ longitude: number, latitude: number }>);
          
          toast({
            title: 'CSV-Datei geladen',
            description: `${validData.length} gültige Koordinaten gefunden.`,
          });
        },
        error: (error) => {
          toast({
            title: 'Fehler beim Parsen der CSV-Datei',
            description: error.message,
            variant: 'destructive',
          });
        }
      });
    }
  };
  
  // Einzelpunkt-Analyse starten
  const handleSinglePointAnalysis = () => {
    if (!isValidCoordinate(latitude, false) || !isValidCoordinate(longitude, true)) {
      toast({
        title: 'Ungültige Koordinaten',
        description: 'Bitte geben Sie gültige Koordinaten für Deutschland ein (Längengrad: 5-16, Breitengrad: 47-56).',
        variant: 'destructive',
      });
      return;
    }
    
    refetchSinglePoint();
  };
  
  // Batch-Analyse starten
  const handleBatchAnalysis = () => {
    if (parsedData.length === 0) {
      toast({
        title: 'Keine Daten',
        description: 'Bitte laden Sie zuerst eine CSV-Datei mit gültigen Koordinaten hoch.',
        variant: 'destructive',
      });
      return;
    }
    
    // Koordinaten für die API-Anfrage umwandeln
    const coordinates = parsedData.map(row => ({ 
      lon: row.longitude, 
      lat: row.latitude 
    }));
    
    batchMutation.mutate(coordinates);
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Bodenanalyse</h1>
      
      <Tabs defaultValue="einzelanalyse" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="einzelanalyse">Einzelpunkt-Analyse</TabsTrigger>
          <TabsTrigger value="batchanalyse">Batch-Analyse</TabsTrigger>
        </TabsList>
        
        <TabsContent value="einzelanalyse">
          <Card>
            <CardHeader>
              <CardTitle>Bodenart an einem Standort bestimmen</CardTitle>
              <CardDescription>
                Geben Sie die Koordinaten ein, um die Bodenart an diesem Standort zu analysieren.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="longitude">Längengrad (Dezimalgrad)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="z.B. 10.0"
                    min="5.0"
                    max="16.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Gültiger Bereich für Deutschland: 5.0 - 16.0</p>
                </div>
                <div>
                  <Label htmlFor="latitude">Breitengrad (Dezimalgrad)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="z.B. 51.0"
                    min="47.0"
                    max="56.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Gültiger Bereich für Deutschland: 47.0 - 56.0</p>
                </div>
              </div>
              
              <Button 
                onClick={handleSinglePointAnalysis} 
                disabled={isLoadingSinglePoint}
                className="w-full"
              >
                {isLoadingSinglePoint ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analysiere...
                  </>
                ) : 'Bodenart abfragen'}
              </Button>
            </CardContent>
            
            {singlePointResult && (
              <CardFooter className="flex flex-col items-start">
                <Separator className="my-4" />
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-2">Analyseergebnis</h3>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <div className="font-medium">Koordinaten:</div>
                    <div>{singlePointResult.coordinates.lat}, {singlePointResult.coordinates.lng}</div>
                    
                    <div className="font-medium">BGR-Code:</div>
                    <div>{singlePointResult.bodenartCode}</div>
                    
                    <div className="font-medium">Beschreibung:</div>
                    <div>{singlePointResult.bodenartDescription}</div>
                    
                    <div className="font-medium">Klassifikation:</div>
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 mr-2 rounded-full" 
                        style={{ backgroundColor: singlePointResult.color }}
                      />
                      {singlePointResult.classification}
                    </div>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="batchanalyse">
          <Card>
            <CardHeader>
              <CardTitle>Batch-Verarbeitung von Koordinaten</CardTitle>
              <CardDescription>
                Laden Sie eine CSV-Datei mit Koordinaten hoch, um mehrere Standorte gleichzeitig zu analysieren.
                Die Datei sollte Spalten "longitude" und "latitude" enthalten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="csv-upload">CSV-Datei mit Koordinaten</Label>
                <div className="flex items-center mt-2">
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="ml-2"
                    onClick={() => document.getElementById('csv-upload')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {csvFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Datei: {csvFile.name} ({parsedData.length} gültige Koordinaten)
                  </p>
                )}
              </div>
              
              <Button 
                onClick={handleBatchAnalysis} 
                disabled={parsedData.length === 0 || batchMutation.isPending}
                className="w-full"
              >
                {batchMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verarbeite...
                  </>
                ) : 'Batch-Verarbeitung starten'}
              </Button>
            </CardContent>
            
            {batchMutation.isSuccess && batchMutation.data?.results && (
              <CardFooter className="flex flex-col items-start">
                <Separator className="my-4" />
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-2">
                    Batch-Analyseergebnisse ({batchMutation.data.results.length} Standorte)
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Längengrad</TableHead>
                          <TableHead>Breitengrad</TableHead>
                          <TableHead>BGR-Code</TableHead>
                          <TableHead>Klassifikation</TableHead>
                          <TableHead>Beschreibung</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchMutation.data.results.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>{result.coordinates.lng}</TableCell>
                            <TableCell>{result.coordinates.lat}</TableCell>
                            <TableCell>{result.bodenartCode}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 mr-2 rounded-full" 
                                  style={{ backgroundColor: result.color }}
                                />
                                {result.classification}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {result.bodenartDescription}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Legende für Bodenarten */}
      {colorMapping && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Legende: Bodenklassifikationen</CardTitle>
            <CardDescription>
              Farbkodierung und Erklärung der verschiedenen Bodenklassen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(colorMapping.colorMapping).map(([key, color]) => (
                <div key={key} className="flex items-center">
                  <div 
                    className="w-4 h-4 mr-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: color as string }}
                  />
                  <span className="text-sm">{key}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BodenAnalyse;