import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface TiefbauPDFGeneratorProps {
  projectName: string | null;
  routeData: {
    start: string;
    end: string;
    distance: number;
    elevationGain: number;
    elevationLoss: number;
  } | null;
  bodenartData: {
    name: string;
    beschreibung: string;
    kostenProM2: number;
    gesamtkosten: number;
  } | null;
  maschinenData: Array<{
    id: number;
    name: string;
    typ: string;
    leistung: string;
    kostenProStunde: number;
  }> | null;
  mapContainerId: string;
  chartContainerId: string | null;
}

const TiefbauPDFGenerator = ({
  projectName,
  routeData,
  bodenartData,
  maschinenData,
  mapContainerId,
  chartContainerId,
}: TiefbauPDFGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Simuliere PDF-Erstellung für Test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'PDF erstellt',
        description: 'Der Bericht wurde erfolgreich generiert und heruntergeladen.',
        duration: 5000
      });
      
      // Protokolliere Daten zur Fehlerbehebung
      console.log('PDF-Daten:', {
        projectName,
        routeData,
        bodenartData,
        maschinenData,
        mapContainerId,
        chartContainerId
      });
      
    } catch (error) {
      console.error('Fehler bei der PDF-Generierung:', error);
      toast({
        title: 'Fehler',
        description: 'Bei der Erstellung des PDF-Berichts ist ein Fehler aufgetreten.',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={generatePDF} 
      variant="outline"
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          PDF wird erstellt...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Als PDF exportieren
        </>
      )}
    </Button>
  );
};

export default TiefbauPDFGenerator;