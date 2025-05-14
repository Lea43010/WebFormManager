import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';

/**
 * Testkomponente für BGR-Bodenanalyse-API
 * 
 * Diese Komponente dient zum Testen der BGR-Bodenanalyse-API-Endpunkte.
 * Es ermöglicht die Durchführung von Einzelpunkt- und Batch-Anfragen an den Service.
 */
const BodenanalyseServiceTest: React.FC = () => {
  const [lat, setLat] = useState<string>('52.5200');
  const [lng, setLng] = useState<string>('13.4050');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Test für Einzelpunkt-Analyse
  const testPointAnalysis = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await fetch(`/api/soil-analysis/point?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      
      setResult(JSON.stringify(data, null, 2));
      
      if (data.success) {
        toast({
          title: "Erfolg",
          description: "Bodenanalyse erfolgreich durchgeführt",
        });
      } else {
        toast({
          title: "Fehler",
          description: data.message || "Fehler bei der Bodenanalyse",
          variant: "destructive",
        });
      }
    } catch (error) {
      setResult(`Fehler: ${error}`);
      toast({
        title: "Fehler",
        description: "API-Anfrage fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Test für Batch-Analyse
  const testBatchAnalysis = async () => {
    setLoading(true);
    setResult('');
    
    const points = [
      { lat: 48.1351, lng: 11.5820 }, // München
      { lat: 52.5200, lng: 13.4050 }, // Berlin
    ];
    
    try {
      const response = await fetch('/api/soil-analysis/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points }),
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      
      if (data.success) {
        toast({
          title: "Erfolg",
          description: `${data.data.length} Standorte analysiert`,
        });
      } else {
        toast({
          title: "Fehler",
          description: data.message || "Fehler bei der Batch-Bodenanalyse",
          variant: "destructive",
        });
      }
    } catch (error) {
      setResult(`Fehler: ${error}`);
      toast({
        title: "Fehler",
        description: "API-Anfrage fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>BGR-Bodenanalyse API Test</CardTitle>
          <CardDescription>
            Testen der Bodenanalyse-API-Endpunkte mit verschiedenen Parametern
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="z.B. 52.5200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="z.B. 13.4050"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
            <Button onClick={testPointAnalysis} disabled={loading}>
              {loading ? 'Wird ausgeführt...' : 'Einzelpunkt-Test'}
            </Button>
            <Button onClick={testBatchAnalysis} disabled={loading} variant="outline">
              {loading ? 'Wird ausgeführt...' : 'Batch-Test (2 Punkte)'}
            </Button>
          </div>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <Label>Ergebnis:</Label>
              <pre className="mt-2 p-2 bg-black text-white rounded-md overflow-auto max-h-[400px] text-xs">
                {result}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BodenanalyseServiceTest;