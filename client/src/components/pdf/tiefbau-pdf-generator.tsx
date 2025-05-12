import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TiefbauPDFGeneratorProps {
  projectName: string | null;
  routeData: {
    start: string;
    end: string;
    distance: number;
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
}

const TiefbauPDFGenerator = ({
  projectName,
  routeData,
  bodenartData,
  maschinenData,
  mapContainerId
}: TiefbauPDFGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Prüfe, ob notwendige Daten vorhanden sind
      if (!routeData) {
        throw new Error('Keine Routendaten vorhanden. Bitte erstellen Sie eine Route.');
      }
      
      // Screenshot der Karte machen
      const mapElement = document.getElementById(mapContainerId);
      if (!mapElement) {
        throw new Error('Kartenansicht konnte nicht gefunden werden.');
      }
      
      // PDF-Dokument erstellen (Querformat)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Zeichenfläche Größe
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Titel und Datum
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      const titleText = `Tiefbau-Streckenbericht: ${projectName || 'Tiefbau-Projekt'}`;
      pdf.text(titleText, 14, 20);
      
      pdf.setFontSize(10);
      const dateText = `Erstellt am: ${new Date().toLocaleDateString('de-DE')}`;
      pdf.text(dateText, 14, 27);
      
      // --- Karte in PDF einfügen ---
      try {
        // Optimierte html2canvas Einstellungen für bessere Qualität
        const mapCanvas = await html2canvas(mapElement, {
          useCORS: true,
          allowTaint: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          scale: window.devicePixelRatio || 2, // Höhere Skalierung für bessere Qualität
          backgroundColor: null
        });
        
        pdf.setFontSize(14);
        pdf.text('Streckenübersicht', 14, 35);
        
        const imgData = mapCanvas.toDataURL('image/jpeg', 0.9);
        const imgWidth = 120;
        const imgHeight = (mapCanvas.height * imgWidth) / mapCanvas.width;
        
        pdf.addImage(imgData, 'JPEG', 14, 40, imgWidth, imgHeight);
        
        // --- Streckeninformationen als Tabelle ---
        const routeYPos = 40 + imgHeight + 10;
        pdf.setFontSize(14);
        pdf.text('Streckeninformationen', 14, routeYPos);
        
        // Streckeninformationen als einfache Textausgabe mit Rahmen
        pdf.setFontSize(10);
        pdf.setDrawColor(0);
        pdf.setFillColor(240, 240, 240);
        
        // Überschriftenzeile mit grauem Hintergrund
        pdf.setFillColor(200, 200, 200);
        pdf.rect(14, routeYPos + 5, 170, 10, 'F'); // Breitere und höhere Tabelle
        pdf.setTextColor(0);
        pdf.setFontSize(10);
        pdf.text("Eigenschaft", 17, routeYPos + 11);
        pdf.text("Wert", 60, routeYPos + 11);
        
        // Zeilen mit Routeninformationen
        const startY = routeYPos + 13;
        const rowHeight = 10; // Erhöhte Zeilenhöhe für mehr Platz
        
        // Funktion zum Zeichnen einer Zeile
        const addRow = (index: number, label: string, value: string) => {
          const y = startY + (index * rowHeight);
          
          // Abwechselnde Zeilenhintergründe für bessere Lesbarkeit
          if (index % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(14, y, 170, rowHeight, 'F'); // Breitere Zeilen
          }
          
          pdf.text(label, 17, y + 5);
          pdf.text(value, 60, y + 5);
        };
        
        // Daten einfügen
        addRow(0, "Start", routeData.start);
        addRow(1, "Ziel", routeData.end);
        addRow(2, "Distanz", `${routeData.distance.toFixed(2)} km`);
        
        // Rahmen um die Tabelle zeichnen
        pdf.setDrawColor(0);
        pdf.rect(14, routeYPos + 5, 170, 8 + (3 * rowHeight), 'D');
        
        // Streckendaten wurden eingefügt
        
        // --- Bodenanalyse auf neuer Seite ---
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text('Bodenanalyse', 14, 20);
        
        if (bodenartData) {
          // Manuelle Tabelle für Bodenanalyse
          const bodenYPos = 25;
          
          // Überschriftenzeile mit grauem Hintergrund
          pdf.setFillColor(200, 200, 200);
          pdf.rect(14, bodenYPos, 170, 10, 'F'); // Breitere und höhere Tabelle
          pdf.setTextColor(0);
          pdf.setFontSize(10);
          pdf.text("Eigenschaft", 17, bodenYPos + 6);
          pdf.text("Wert", 60, bodenYPos + 6);
          
          // Zeilen mit Bodenanalyse
          const bodenStartY = bodenYPos + 10;
          const rowHeight = 10; // Erhöhte Zeilenhöhe für mehr Platz
          
          // Funktion zum Zeichnen einer Zeile für Bodenanalyse
          const addBodenRow = (index: number, label: string, value: string) => {
            const y = bodenStartY + (index * rowHeight);
            
            // Abwechselnde Zeilenhintergründe
            if (index % 2 === 0) {
              pdf.setFillColor(245, 245, 245);
              pdf.rect(14, y, 170, rowHeight, 'F'); // Breitere Zeilen
            }
            
            pdf.text(label, 17, y + 5);
            pdf.text(value, 60, y + 5);
          };
          
          // Daten einfügen
          addBodenRow(0, "Bodenart", bodenartData.name);
          addBodenRow(1, "Beschreibung", bodenartData.beschreibung);
          addBodenRow(2, "Kosten pro m²", `${bodenartData.kostenProM2.toFixed(2)} €`);
          addBodenRow(3, "Geschätzte Gesamtkosten", `${bodenartData.gesamtkosten.toFixed(2)} €`);
          
          // Rahmen um die Tabelle zeichnen
          pdf.setDrawColor(0);
          pdf.rect(14, bodenYPos, 170, 10 + (4 * rowHeight), 'D');
        } else {
          pdf.setFontSize(10);
          pdf.text('Keine Bodenanalyse verfügbar.', 14, 25);
        }
        
        // --- Maschinenempfehlungen ---
        const maschinenYPos = 80; // Fester Y-Wert für Maschinenempfehlungen
        pdf.setFontSize(14);
        pdf.text('Empfohlene Maschinen', 14, maschinenYPos);
        
        let maschinenEndY = maschinenYPos + 5; // Standardwert, wenn keine Maschinen vorhanden
        
        if (maschinenData && maschinenData.length > 0) {
          // Überschriftenzeile mit grauem Hintergrund
          const tableY = maschinenYPos + 5;
          pdf.setFillColor(200, 200, 200);
          pdf.rect(14, tableY, 160, 8, 'F');
          pdf.setTextColor(0);
          pdf.setFontSize(10);
          
          // Spaltenüberschriften
          pdf.text("Name", 17, tableY + 5);
          pdf.text("Typ", 57, tableY + 5);
          pdf.text("Leistung", 97, tableY + 5);
          pdf.text("Kosten/Stunde", 137, tableY + 5);
          
          // Zeilen mit Maschinenempfehlungen
          const maschinenRowHeight = 10; // Erhöhte Zeilenhöhe für mehr Platz
          
          maschinenData.forEach((maschine, index) => {
            const y = tableY + 8 + (index * maschinenRowHeight);
            
            // Abwechselnde Zeilenhintergründe
            if (index % 2 === 0) {
              pdf.setFillColor(245, 245, 245);
              pdf.rect(14, y, 160, maschinenRowHeight, 'F');
            }
            
            // Daten einfügen
            pdf.text(maschine.name, 17, y + 5);
            pdf.text(maschine.typ, 57, y + 5);
            pdf.text(maschine.leistung, 97, y + 5);
            pdf.text(`${maschine.kostenProStunde.toFixed(2)} €`, 137, y + 5);
          });
          
          // Rahmen um die Tabelle zeichnen
          pdf.setDrawColor(0);
          pdf.rect(14, tableY, 160, 8 + (maschinenData.length * maschinenRowHeight), 'D');
          
          // Endpunkt der Maschinen-Tabelle für die Position des Höhenprofils
          maschinenEndY = tableY + 8 + (maschinenData.length * maschinenRowHeight) + 20;
        } else {
          pdf.setFontSize(10);
          pdf.text('Keine Maschinenempfehlungen verfügbar.', 14, maschinenYPos + 5);
          maschinenEndY = maschinenYPos + 15;
        }
        
        // Höhenprofil-Funktion wurde entfernt
        
        // --- Fußzeile auf jeder Seite ---
        // Sichere Methode, um die Anzahl der Seiten zu erhalten
        const totalPages = pdf.getNumberOfPages ? pdf.getNumberOfPages() : 
                          (pdf.internal.pages ? pdf.internal.pages.length - 1 : 2);
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text('Bau - Structura | Automatisch generierter Bericht', 14, pageHeight - 10);
          pdf.text(`Seite ${i} von ${totalPages}`, pageWidth - 30, pageHeight - 10);
        }
        
        // PDF herunterladen
        pdf.save(`Tiefbau-Bericht_${new Date().toISOString().slice(0, 10)}.pdf`);
      } catch (renderError: any) {
        console.error('Fehler beim Rendern der Karte:', renderError);
        throw new Error('Die Karte konnte nicht gerendert werden: ' + renderError.message);
      }
      
      toast({
        title: 'PDF erstellt',
        description: 'Der Bericht wurde erfolgreich generiert und heruntergeladen.',
        duration: 5000
      });
      
    } catch (error: any) {
      console.error('Fehler bei der PDF-Generierung:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Bei der Erstellung des PDF-Berichts ist ein Fehler aufgetreten.',
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