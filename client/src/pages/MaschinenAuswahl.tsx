import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from '@/hooks/use-toast';
import TiefbauNavigation from '@/components/TiefbauNavigation';

interface Maschine {
  id: number;
  name: string;
  typ: string;
  beschreibung: string;
  leistung: string;
  kosten_pro_stunde: number;
  kosten_pro_tag: number;
  kosten_pro_woche: number;
  kraftstoffverbrauch: number;
  gewicht: number;
  bild_url?: string;
  effizienz_faktor?: number;
  bearbeitungszeit_pro_m2?: number;
}

interface Bodenart {
  id: number;
  name: string;
  beschreibung: string;
  dichte: number;
  belastungsklasse: string;
  material_kosten_pro_m2: number;
  bearbeitungshinweise: string;
}

const MaschinenAuswahl: React.FC = () => {
  const [maschinen, setMaschinen] = useState<Maschine[]>([]);
  const [filteredMaschinen, setFilteredMaschinen] = useState<Maschine[]>([]);
  const [bodenarten, setBodenarten] = useState<Bodenart[]>([]);
  const [selectedMaschine, setSelectedMaschine] = useState<Maschine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter-Einstellungen
  const [filter, setFilter] = useState({
    typ: '',
    bodenartId: '',
    minLeistung: 0,
    maxKosten: 2000
  });
  
  const { toast } = useToast();
  
  // Hole Bodenart-ID aus der URL wenn vorhanden
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bodenartId = params.get('bodenart');
    
    if (bodenartId) {
      setFilter(prev => ({ ...prev, bodenartId }));
    }
  }, []);

  // Lade Maschinen und Bodenarten aus der Datenbank
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lade alle Maschinen
        const maschinenResponse = await fetch('/api/maschinen');
        if (!maschinenResponse.ok) throw new Error('Fehler beim Laden der Maschinen');
        const maschinenData = await maschinenResponse.json();
        setMaschinen(maschinenData);
        setFilteredMaschinen(maschinenData);
        
        // Lade alle Bodenarten
        const bodenResponse = await fetch('/api/bodenarten');
        if (!bodenResponse.ok) throw new Error('Fehler beim Laden der Bodenarten');
        const bodenData = await bodenResponse.json();
        setBodenarten(bodenData);
        
        // Wenn eine Bodenart-ID im Filter ist (und nicht '_all'), lade spezifische Maschinen für diese Bodenart
        if (filter.bodenartId && filter.bodenartId !== '_all') {
          const geeigneteResponse = await fetch(`/api/maschinen/bodenart/${filter.bodenartId}`);
          if (geeigneteResponse.ok) {
            const geeigneteData = await geeigneteResponse.json();
            setFilteredMaschinen(geeigneteData);
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        toast({
          title: "Fehler",
          description: `Fehler beim Laden der Daten: ${err.message}`,
          variant: "destructive"
        });
      }
    };

    fetchData();
  }, [filter.bodenartId]);

  // Filtere Maschinen basierend auf Filter-Einstellungen
  useEffect(() => {
    let result = [...maschinen];
    
    // Filter nach Maschinentyp
    if (filter.typ && filter.typ !== '_all') {
      result = result.filter(maschine => maschine.typ === filter.typ);
    }
    
    // Filter nach Leistung (als Zahl aus dem String extrahieren)
    if (filter.minLeistung > 0) {
      result = result.filter(maschine => {
        const leistungMatch = maschine.leistung.match(/(\d+)/);
        if (leistungMatch && leistungMatch[1]) {
          const leistungValue = parseInt(leistungMatch[1]);
          return leistungValue >= filter.minLeistung;
        }
        return true;
      });
    }
    
    // Filter nach Kosten
    if (filter.maxKosten < 2000) {
      result = result.filter(maschine => maschine.kosten_pro_tag <= filter.maxKosten);
    }
    
    setFilteredMaschinen(result);
  }, [filter.typ, filter.minLeistung, filter.maxKosten, maschinen]);

  // Handler für Maschinenauswahl
  const handleSelectMaschine = (maschine: Maschine) => {
    setSelectedMaschine(maschine);
  };

  // Handler für Filter-Änderungen
  const handleFilterChange = (key: string, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  // Einzigartige Maschinentypen für Dropdown
  const maschinenTypen = Array.from(new Set(maschinen.map(m => m.typ))).filter(Boolean);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Maschinenauswahl</h1>
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
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <Label htmlFor="bodenartSelect">Bodenart</Label>
                  <Select 
                    value={filter.bodenartId} 
                    onValueChange={(value) => handleFilterChange('bodenartId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Bodenarten" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Alle Bodenarten</SelectItem>
                      {bodenarten.map(bodenart => (
                        <SelectItem key={bodenart.id} value={bodenart.id.toString()}>
                          {bodenart.name} ({bodenart.belastungsklasse})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="typSelect">Maschinentyp</Label>
                  <Select 
                    value={filter.typ} 
                    onValueChange={(value) => handleFilterChange('typ', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Typen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Alle Typen</SelectItem>
                      {maschinenTypen.map(typ => (
                        <SelectItem key={typ} value={typ}>
                          {typ}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="minLeistung">Min. Leistung (kW)</Label>
                  <div className="pt-2">
                    <Slider
                      value={[filter.minLeistung]}
                      min={0}
                      max={200}
                      step={10}
                      onValueChange={(value) => handleFilterChange('minLeistung', value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0 kW</span>
                      <span>{filter.minLeistung} kW</span>
                      <span>200 kW</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="maxKosten">Max. Kosten pro Tag (€)</Label>
                  <div className="pt-2">
                    <Slider
                      value={[filter.maxKosten]}
                      min={0}
                      max={2000}
                      step={100}
                      onValueChange={(value) => handleFilterChange('maxKosten', value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0 €</span>
                      <span>{filter.maxKosten} €</span>
                      <span>2000 €</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium mb-4">Verfügbare Maschinen</h3>
              {filter.bodenartId && filter.bodenartId !== '_all' && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Geeignete Maschinen für Bodenart: {
                    bodenarten.find(b => b.id.toString() === filter.bodenartId)?.name || 'Unbekannt'
                  }
                </p>
              )}
              
              {filteredMaschinen.length === 0 ? (
                <div className="bg-muted p-6 rounded-md text-center">
                  Keine Maschinen gefunden, die den Filterkriterien entsprechen.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMaschinen.map((maschine) => (
                    <Card 
                      key={maschine.id} 
                      className={`cursor-pointer transition-shadow hover:shadow-md ${
                        selectedMaschine?.id === maschine.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleSelectMaschine(maschine)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex justify-between">
                          <span>{maschine.name}</span>
                          <span className="text-sm text-muted-foreground">{maschine.typ}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-3">{maschine.beschreibung}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Leistung:</p>
                            <p className="font-medium">{maschine.leistung}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Gewicht:</p>
                            <p className="font-medium">{maschine.gewicht} kg</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Tagespreis:</p>
                            <p className="font-medium">{parseFloat(String(maschine.kosten_pro_tag)).toFixed(2)} €</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Verbrauch:</p>
                            <p className="font-medium">{maschine.kraftstoffverbrauch} l/h</p>
                          </div>
                          {maschine.effizienz_faktor && (
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Effizienz für diese Bodenart:</p>
                              <p className="font-medium">{parseFloat(String(maschine.effizienz_faktor * 100)).toFixed(0)}%</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            <div className="md:col-span-1">
              {selectedMaschine ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Maschinendetails</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-lg">{selectedMaschine.name}</h3>
                        <p className="text-muted-foreground">{selectedMaschine.typ}</p>
                      </div>
                      
                      <div className="bg-muted p-3 rounded-md">
                        <p>{selectedMaschine.beschreibung}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Technische Daten:</h4>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span>Leistung:</span>
                            <span className="font-medium">{selectedMaschine.leistung}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Gewicht:</span>
                            <span className="font-medium">{selectedMaschine.gewicht} kg</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Kraftstoffverbrauch:</span>
                            <span className="font-medium">{selectedMaschine.kraftstoffverbrauch} l/h</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Kosten:</h4>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span>Stundensatz:</span>
                            <span className="font-medium">{parseFloat(String(selectedMaschine.kosten_pro_stunde)).toFixed(2)} €</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Tagessatz:</span>
                            <span className="font-medium">{parseFloat(String(selectedMaschine.kosten_pro_tag)).toFixed(2)} €</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Wochensatz:</span>
                            <span className="font-medium">{parseFloat(String(selectedMaschine.kosten_pro_woche)).toFixed(2)} €</span>
                          </li>
                        </ul>
                      </div>
                      
                      {selectedMaschine.effizienz_faktor && (
                        <div>
                          <h4 className="font-medium mb-2">Effizienz:</h4>
                          <div className="bg-primary/10 p-3 rounded-md">
                            <p><span className="font-medium">Effizienzbewertung:</span> {
                              selectedMaschine.effizienz_faktor >= 1.2 ? 'Sehr gut' :
                              selectedMaschine.effizienz_faktor >= 1.0 ? 'Gut' :
                              selectedMaschine.effizienz_faktor >= 0.8 ? 'Ausreichend' : 'Nicht optimal'
                            }</p>
                            <p><span className="font-medium">Faktor:</span> {parseFloat(String(selectedMaschine.effizienz_faktor)).toFixed(2)}</p>
                            <p><span className="font-medium">Bearbeitungszeit:</span> {selectedMaschine.bearbeitungszeit_pro_m2 ? parseFloat(String(selectedMaschine.bearbeitungszeit_pro_m2)).toFixed(2) : '-'} min/m²</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-2">
                        <Button 
                          className="w-full" 
                          onClick={() => window.location.href = `/kosten-kalkulation?maschine=${selectedMaschine.id}${filter.bodenartId && filter.bodenartId !== '_all' ? `&bodenart=${filter.bodenartId}` : ''}`}
                        >
                          Zur Kostenkalkulation
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center p-4">
                      <p className="text-muted-foreground mb-2">Bitte wählen Sie eine Maschine aus der Liste</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MaschinenAuswahl;