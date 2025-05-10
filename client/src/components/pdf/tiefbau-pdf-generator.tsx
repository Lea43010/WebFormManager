import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
        
        // @ts-ignore - jspdf-autotable erweiterung
        pdf.autoTable({
          startY: routeYPos + 5,
          head: [['Eigenschaft', 'Wert']],
          body: [
            ['Start', routeData.start],
            ['Ziel', routeData.end],
            ['Distanz', `${routeData.distance.toFixed(2)} km`],
            ['Höhenmeter (Aufstieg)', `${routeData.elevationGain.toFixed(2)} m`],
            ['Höhenmeter (Abstieg)', `${routeData.elevationLoss.toFixed(2)} m`]
          ],
          theme: 'grid',
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
          margin: { left: 14 },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 100 }
          }
        });
        
        // --- Höhenprofil, falls vorhanden ---
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
              
              // @ts-ignore - lastAutoTable ist in der typedefinition nicht enthalten
              const chartYPos = pdf.lastAutoTable?.finalY + 10 || 140;
              
              // Wenn nicht genug Platz auf der Seite, neue Seite hinzufügen
              if (chartYPos + 40 > pageHeight) {
                pdf.addPage();
                pdf.setFontSize(14);
                pdf.text('Höhenprofil', 14, 20);
                
                const chartImgData = chartCanvas.toDataURL('image/jpeg', 0.9);
                const chartWidth = 120;
                const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;
                
                pdf.addImage(chartImgData, 'JPEG', 14, 25, chartWidth, chartHeight);
              } else {
                pdf.setFontSize(14);
                pdf.text('Höhenprofil', 14, chartYPos);
                
                const chartImgData = chartCanvas.toDataURL('image/jpeg', 0.9);
                const chartWidth = 120;
                const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;
                
                pdf.addImage(chartImgData, 'JPEG', 14, chartYPos + 5, chartWidth, chartHeight);
              }
            } catch (chartError) {
              console.error('Fehler beim Rendern des Höhenprofils:', chartError);
            }
          }
        }
        
        // --- Bodenanalyse auf neuer Seite ---
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text('Bodenanalyse', 14, 20);
        
        if (bodenartData) {
          // @ts-ignore - jspdf-autotable erweiterung
          pdf.autoTable({
            startY: 25,
            head: [['Eigenschaft', 'Wert']],
            body: [
              ['Bodenart', bodenartData.name],
              ['Beschreibung', bodenartData.beschreibung],
              ['Kosten pro m²', `${bodenartData.kostenProM2.toFixed(2)} €`],
              ['Geschätzte Gesamtkosten', `${bodenartData.gesamtkosten.toFixed(2)} €`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
            margin: { left: 14 },
            columnStyles: {
              0: { cellWidth: 50 },
              1: { cellWidth: 100 }
            }
          });
        } else {
          pdf.setFontSize(10);
          pdf.text('Keine Bodenanalyse verfügbar.', 14, 25);
        }
        
        // --- Maschinenempfehlungen ---
        // @ts-ignore - lastAutoTable ist in der typedefinition nicht enthalten
        const maschinenYPos = pdf.lastAutoTable?.finalY + 10 || 60;
        pdf.setFontSize(14);
        pdf.text('Empfohlene Maschinen', 14, maschinenYPos);
        
        if (maschinenData && maschinenData.length > 0) {
          const maschinenTableData = maschinenData.map(maschine => [
            maschine.name,
            maschine.typ,
            maschine.leistung,
            `${maschine.kostenProStunde.toFixed(2)} €`
          ]);
          
          // @ts-ignore - jspdf-autotable erweiterung
          pdf.autoTable({
            startY: maschinenYPos + 5,
            head: [['Name', 'Typ', 'Leistung', 'Kosten pro Stunde']],
            body: maschinenTableData,
            theme: 'grid',
            headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
            margin: { left: 14 }
          });
        } else {
          pdf.setFontSize(10);
          pdf.text('Keine Maschinenempfehlungen verfügbar.', 14, maschinenYPos + 5);
        }
        
        // --- Fußzeile auf jeder Seite ---
        // @ts-ignore - getNumberOfPages ist in jspdf verfügbar, aber in der typedefinition fehlt es
        const totalPages = pdf.internal.getNumberOfPages(); 
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