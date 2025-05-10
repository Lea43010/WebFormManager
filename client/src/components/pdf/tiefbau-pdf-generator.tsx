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
      
      // Titel und Datum - kompaktere Version
      pdf.setFontSize(16); // Kleinere Schriftgröße
      pdf.setTextColor(0, 0, 0);
      
      // Kürze lange Projektnamen bei Bedarf
      let projectTitle = projectName || 'Tiefbau-Projekt';
      if (projectTitle.length > 25) {
        projectTitle = projectTitle.substring(0, 22) + '...';
      }
      
      const titleText = `Tiefbau-Streckenbericht: ${projectTitle}`;
      pdf.text(titleText, 14, 16);
      
      pdf.setFontSize(8); // Noch kleinere Schrift für Datum
      const dateText = `Erstellt am: ${new Date().toLocaleDateString('de-DE')}`;
      pdf.text(dateText, 14, 22);
      
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
        
        // --- Streckeninformationen und Höhenprofil nebeneinander anordnen ---
        const routeYPos = 40 + imgHeight + 10;
        pdf.setFontSize(14);
        pdf.text('Streckeninformationen', 14, routeYPos);
        
        // Streckeninformationen als kompakte Tabelle
        pdf.setFontSize(9); // Kleinere Schriftgröße für kompaktere Darstellung
        pdf.setDrawColor(0);
        pdf.setFillColor(240, 240, 240);
        
        // Überschriftenzeile mit grauem Hintergrund
        pdf.setFillColor(200, 200, 200);
        pdf.rect(14, routeYPos + 5, 80, 7, 'F'); // Schmalere und niedrigere Tabelle
        pdf.setTextColor(0);
        pdf.text("Eigenschaft", 16, routeYPos + 10);
        pdf.text("Wert", 55, routeYPos + 10);
        
        // Zeilen mit Routeninformationen
        const startY = routeYPos + 12;
        const rowHeight = 6; // Reduzierte Zeilenhöhe für kompaktere Darstellung
        
        // Funktion zum Zeichnen einer Zeile
        const addRow = (index: number, label: string, value: string) => {
          const y = startY + (index * rowHeight);
          
          // Abwechselnde Zeilenhintergründe für bessere Lesbarkeit
          if (index % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(14, y, 80, rowHeight, 'F');
          }
          
          pdf.text(label, 16, y + 4);
          pdf.text(value, 55, y + 4);
        };
        
        // Daten einfügen
        addRow(0, "Start", routeData.start);
        addRow(1, "Ziel", routeData.end);
        addRow(2, "Distanz", `${routeData.distance.toFixed(2)} km`);
        addRow(3, "Höhenmeter (Aufstieg)", `${routeData.elevationGain.toFixed(2)} m`);
        addRow(4, "Höhenmeter (Abstieg)", `${routeData.elevationLoss.toFixed(2)} m`);
        
        // Rahmen um die Tabelle zeichnen
        pdf.setDrawColor(0);
        pdf.rect(14, routeYPos + 5, 80, 7 + (5 * rowHeight), 'D');
        
        // --- Höhenprofil, falls vorhanden (rechts neben der Tabelle) ---
        if (chartContainerId) {
          const chartElement = document.getElementById(chartContainerId);
          if (chartElement) {
            try {
              const chartCanvas = await html2canvas(chartElement, {
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0,
                scale: window.devicePixelRatio || 2,
                logging: false,
                backgroundColor: null
              });
              
              // Position für das Höhenprofil rechts neben der Tabelle
              pdf.setFontSize(14);
              pdf.text('Höhenprofil', 110, routeYPos);
              
              const chartImgData = chartCanvas.toDataURL('image/jpeg', 0.9);
              const chartWidth = 80; // Schmaleres Bild
              const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;
              
              // Höhenprofil rechts neben den Streckeninformationen platzieren
              pdf.addImage(chartImgData, 'JPEG', 110, routeYPos + 5, chartWidth, chartHeight);
            } catch (chartError) {
              console.error('Fehler beim Rendern des Höhenprofils:', chartError);
            }
          }
        }
        
        // --- Bodenanalyse und Maschinenempfehlungen auf einer Seite nebeneinander ---
        // Statt einer neuen Seite erhöhen wir nur den Y-Wert
        const nextSectionY = routeYPos + Math.max(7 + (5 * rowHeight), 5 + 50) + 20; // Genug Platz nach Tabelle/Höhenprofil
        
        pdf.setFontSize(14);
        pdf.text('Bodenanalyse', 14, nextSectionY);
        
        if (bodenartData) {
          // Manuelle Tabelle für Bodenanalyse (linke Seite)
          const bodenYPos = nextSectionY + 5;
          
          // Überschriftenzeile mit grauem Hintergrund
          pdf.setFillColor(200, 200, 200);
          pdf.rect(14, bodenYPos, 80, 7, 'F'); // Schmalere und niedrigere Tabelle
          pdf.setTextColor(0);
          pdf.setFontSize(9);
          pdf.text("Eigenschaft", 16, bodenYPos + 5);
          pdf.text("Wert", 55, bodenYPos + 5);
          
          // Zeilen mit Bodenanalyse
          const bodenStartY = bodenYPos + 7;
          const rowHeight = 6; // Reduzierte Zeilenhöhe für kompaktere Darstellung
          
          // Funktion zum Zeichnen einer Zeile für Bodenanalyse
          const addBodenRow = (index: number, label: string, value: string) => {
            const y = bodenStartY + (index * rowHeight);
            
            // Abwechselnde Zeilenhintergründe
            if (index % 2 === 0) {
              pdf.setFillColor(245, 245, 245);
              pdf.rect(14, y, 80, rowHeight, 'F');
            }
            
            pdf.text(label, 16, y + 4);
            pdf.text(value, 55, y + 4);
          };
          
          // Daten einfügen
          addBodenRow(0, "Bodenart", bodenartData.name);
          addBodenRow(1, "Beschreibung", bodenartData.beschreibung);
          addBodenRow(2, "Kosten pro m²", `${bodenartData.kostenProM2.toFixed(2)} €`);
          addBodenRow(3, "Geschätzte Kosten", `${bodenartData.gesamtkosten.toFixed(2)} €`);
          
          // Rahmen um die Tabelle zeichnen
          pdf.setDrawColor(0);
          pdf.rect(14, bodenYPos, 80, 7 + (4 * rowHeight), 'D');
        } else {
          pdf.setFontSize(10);
          pdf.text('Keine Bodenanalyse verfügbar.', 14, nextSectionY + 10);
        }
        
        // --- Maschinenempfehlungen (rechte Seite) ---
        pdf.setFontSize(14);
        pdf.text('Empfohlene Maschinen', 110, nextSectionY);
        
        if (maschinenData && maschinenData.length > 0) {
          // Überschriftenzeile mit grauem Hintergrund
          const tableY = nextSectionY + 5;
          pdf.setFillColor(200, 200, 200);
          pdf.rect(110, tableY, 85, 7, 'F');
          pdf.setTextColor(0);
          pdf.setFontSize(8); // Noch kleinere Schrift für Maschinen
          
          // Spaltenüberschriften - kompaktere Version
          pdf.text("Name", 112, tableY + 5);
          pdf.text("Typ", 137, tableY + 5);
          pdf.text("Kosten/h", 180, tableY + 5);
          
          // Zeilen mit Maschinenempfehlungen
          const maschinenRowHeight = 6; // Reduzierte Zeilenhöhe für kompaktere Darstellung
          
          // Maximal 4 Maschinen anzeigen, um auf eine Seite zu passen
          const displayMachines = maschinenData.slice(0, Math.min(4, maschinenData.length));
          
          displayMachines.forEach((maschine, index) => {
            const y = tableY + 7 + (index * maschinenRowHeight);
            
            // Abwechselnde Zeilenhintergründe
            if (index % 2 === 0) {
              pdf.setFillColor(245, 245, 245);
              pdf.rect(110, y, 85, maschinenRowHeight, 'F');
            }
            
            // Daten einfügen
            pdf.text(maschine.name.substring(0, 14), 112, y + 4); // Gekürzte Namen
            pdf.text(maschine.typ.substring(0, 10), 137, y + 4);
            pdf.text(`${maschine.kostenProStunde.toFixed(2)} €`, 180, y + 4);
          });
          
          // Rahmen um die Tabelle zeichnen
          pdf.setDrawColor(0);
          pdf.rect(110, tableY, 85, 7 + (displayMachines.length * maschinenRowHeight), 'D');
          
          // Hinweis, wenn nicht alle Maschinen angezeigt werden
          if (maschinenData.length > 4) {
            pdf.setFontSize(7);
            pdf.text(`Weitere ${maschinenData.length - 4} Maschinen verfügbar`, 110, tableY + 7 + (4 * maschinenRowHeight) + 5);
          }
        } else {
          pdf.setFontSize(9);
          pdf.text('Keine Maschinenempfehlungen verfügbar.', 110, nextSectionY + 10);
        }
        
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