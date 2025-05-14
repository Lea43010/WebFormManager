import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
// QRCode Import entfernt, da nicht mehr benötigt

interface TiefbauPDFGeneratorProps {
  projectName: string | null;
  projectData?: {
    id?: number;
    kunde?: string;
    ansprechpartner?: string;
    adresse?: string;
    telefon?: string;
    email?: string;
    startdatum?: string;
    enddatum?: string;
    status?: string;
  } | null;
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
  remarks?: string; // Bemerkungen zum Tiefbau-Projekt
  remarksPhotos?: Array<{ preview: string }>; // Fotos zu den Bemerkungen
}

const TiefbauPDFGenerator = ({
  projectName,
  projectData,
  routeData,
  bodenartData,
  maschinenData,
  mapContainerId,
  remarks,
  remarksPhotos
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
      
      // Projekt-Details hinzufügen, wenn verfügbar
      if (projectData) {
        const startY = 34;
        const lineHeight = 5;
        
        pdf.setFontSize(14);
        pdf.text('Projektdetails', 14, startY);
        
        pdf.setFontSize(10);
        pdf.setDrawColor(0);
        pdf.setFillColor(240, 240, 240);
        
        // Box für Projekt-Details
        pdf.setFillColor(245, 245, 245);
        pdf.rect(14, startY + 2, 170, 30, 'F');
        
        let currentY = startY + 8;
        
        // Linke Spalte
        if (projectData.id) {
          pdf.text(`Projekt-Nr.: ${projectData.id}`, 17, currentY);
        }
        currentY += lineHeight;
        
        if (projectData.kunde) {
          pdf.text(`Kunde: ${projectData.kunde}`, 17, currentY);
        }
        currentY += lineHeight;
        
        if (projectData.ansprechpartner) {
          pdf.text(`Ansprechpartner: ${projectData.ansprechpartner}`, 17, currentY);
        }
        currentY += lineHeight;
        
        if (projectData.adresse) {
          pdf.text(`Adresse: ${projectData.adresse}`, 17, currentY);
        }
        
        // Rechte Spalte
        currentY = startY + 8;
        
        if (projectData.telefon) {
          pdf.text(`Telefon: ${projectData.telefon}`, 90, currentY);
        }
        currentY += lineHeight;
        
        if (projectData.email) {
          pdf.text(`E-Mail: ${projectData.email}`, 90, currentY);
        }
        currentY += lineHeight;
        
        if (projectData.startdatum) {
          pdf.text(`Startdatum: ${projectData.startdatum}`, 90, currentY);
        }
        currentY += lineHeight;
        
        if (projectData.enddatum) {
          pdf.text(`Enddatum: ${projectData.enddatum}`, 90, currentY);
        }
        
        // Status in eigener Zeile unten rechts, wenn vorhanden
        if (projectData.status) {
          pdf.setFillColor(220, 220, 220);
          pdf.rect(160, startY + 26, 24, 6, 'F');
          pdf.text(`Status: ${projectData.status}`, 162, startY + 30);
        }
      }
      
      // --- Karte in PDF einfügen ---
      try {
        // Verbesserte Qualitätseinstellungen für die Karte
        const mapCanvas = await html2canvas(mapElement, {
          useCORS: true,
          allowTaint: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          scale: Math.max(window.devicePixelRatio || 1, 2.5), // Erhöhte Skalierung für bessere Qualität
          backgroundColor: null,
          removeContainer: false,
          imageTimeout: 15000, // Längeres Timeout für komplexe Karten
          onclone: (documentClone) => {
            // Optimiere die Kartendarstellung im Clone
            const clonedMap = documentClone.getElementById(mapContainerId);
            if (clonedMap) {
              // Erhöhe die Sichtbarkeit aller wichtigen Elemente
              const mapElements = clonedMap.querySelectorAll('.map-marker, .map-label, .map-route');
              mapElements.forEach(el => {
                if (el instanceof HTMLElement) {
                  el.style.opacity = '1';
                  el.style.visibility = 'visible';
                }
              });
            }
          }
        });
        
        // Position der Karte anpassen, basierend darauf, ob Projektdetails vorhanden sind
        const mapTitleY = projectData ? 70 : 35;
        const mapY = projectData ? 75 : 40;
        
        pdf.setFontSize(14);
        pdf.text('Streckenübersicht', 14, mapTitleY);
        
        // Verbesserte Bildqualität durch höhere JPEG-Qualität (1.0)
        const imgData = mapCanvas.toDataURL('image/jpeg', 1.0);
        const imgWidth = 140; // Etwas breiter für bessere Lesbarkeit
        const imgHeight = (mapCanvas.height * imgWidth) / mapCanvas.width;
        
        pdf.addImage(imgData, 'JPEG', 14, mapY, imgWidth, imgHeight);
        
        // --- Streckeninformationen als Tabelle mit verbessertem Layout ---
        // Mehr Abstand nach der Karte für bessere Übersichtlichkeit
        const routeYPos = mapY + imgHeight + 20;
        pdf.setFontSize(14);
        pdf.text('Streckeninformationen', 14, routeYPos);
        
        // Feste Abstände und größere Zeilenhöhe für bessere Lesbarkeit
        const tableStartY = routeYPos + 10;
        const rowHeight = 15; // Deutlich höhere Zeilen
        
        // Stärker strukturierte Tabelle mit klaren Linien
        // Tabellenkopf mit dunklerem Hintergrund für besseren Kontrast
        pdf.setFillColor(150, 150, 150);
        pdf.setDrawColor(50, 50, 50);
        pdf.setLineWidth(0.7);
        pdf.rect(14, tableStartY, 180, rowHeight, 'FD');
        
        // Tabellenkopf-Text
        pdf.setTextColor(0);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text("Eigenschaft", 20, tableStartY + 10);
        pdf.text("Wert", 80, tableStartY + 10);
        
        // Tabellendaten
        const dataStartY = tableStartY + rowHeight;
        pdf.setFont('helvetica', 'normal');
        
        // Hilfsfunktion zum strukturierten Einfügen der Datenzeilen
        const addRow = (index: number, label: string, value: string) => {
          const y = dataStartY + (index * rowHeight);
          
          // Abwechselnde Zeilenhintergründe für bessere Lesbarkeit
          if (index % 2 === 0) {
            pdf.setFillColor(230, 230, 230);
          } else {
            pdf.setFillColor(245, 245, 245);
          }
          
          // Jede Zeile mit Hintergrund und Rahmen zeichnen
          pdf.rect(14, y, 180, rowHeight, 'FD');
          
          // Zeilentrenner für bessere Übersicht
          pdf.setDrawColor(150, 150, 150);
          pdf.setLineWidth(0.3);
          pdf.line(14, y, 194, y);
          
          // Text in die Zelle einfügen
          pdf.setTextColor(0);
          pdf.text(label, 20, y + 10);
          
          // Werte mit Fallback für leere Daten
          const valueText = value ? value : "Nicht verfügbar";
          pdf.text(valueText, 80, y + 10);
        };
        
        // Daten für die Tabelle einfügen
        addRow(0, "Start", routeData.start || "Nicht definiert");
        addRow(1, "Ziel", routeData.end || "Nicht definiert");
        addRow(2, "Distanz", routeData.distance ? `${routeData.distance.toFixed(2)} km` : "Nicht berechnet");
        
        // Stärkerer Rahmen um die gesamte Tabelle
        pdf.setDrawColor(50, 50, 50);
        pdf.setLineWidth(0.7);
        const tableHeight = rowHeight + (3 * rowHeight);
        pdf.rect(14, tableStartY, 180, tableHeight, 'D');
        
        // Streckendaten wurden eingefügt
        
        // Die Bodenanalyse, Maschinenempfehlungen und QR-Code Abschnitte wurden entfernt
        // Stattdessen gehen wir direkt zu den Bemerkungen über
        
        // --- Bemerkungen zum Tiefbau-Projekt ---
        if (remarks || (remarksPhotos && remarksPhotos.length > 0)) {
          // Keine separate Seite mehr, da Bodenanalyse und Maschinenempfehlungen entfernt wurden
          // Berechne Position nach der Strecken-Tabelle (die bereits gezeichnet wurde)
          // Tabellenhöhe = Kopfzeile (12px) + 3 Zeilen mit Daten (je 12px) + Abstand (30px)
          const routeTableHeight = 12 + (3 * 12); // 48px Gesamthöhe der Tabelle
          
          // Prüfe, ob genug Platz für Bemerkungen auf der Seite ist
          const availableSpace = pageHeight - (routeYPos + routeTableHeight + 30); // Platz nach der Tabelle
          const minSpaceNeeded = 100; // Mindestens 100px für Bemerkungen und evtl. Bilder
          
          // Entscheide, ob eine neue Seite erforderlich ist
          let newPage = false;
          if (availableSpace < minSpaceNeeded) {
            pdf.addPage();
            newPage = true;
          }
          
          pdf.setFontSize(14);
          
          // Position der Überschrift basierend auf vorheriger Inhalte und Seitenumbruch anpassen
          const remarksStartY = newPage ? 20 : routeYPos + routeTableHeight + 30; // Bei neuer Seite oben beginnen, sonst nach Routeninformationen mit Abstand
          pdf.text('Bemerkungen zum Tiefbau-Projekt', 14, remarksStartY);
          
          let yPos = remarksStartY + 10;
          
          // Textliche Bemerkungen hinzufügen, wenn vorhanden
          if (remarks && remarks.trim()) {
            pdf.setFontSize(10);
            
            // Beschreibung mit verbesserter Formatierung
            const remarkLines = pdf.splitTextToSize(remarks, 180); // Text umbrechen, damit er auf die Seite passt
            
            // Hintergrund für bessere Lesbarkeit
            pdf.setDrawColor(100, 100, 100);
            pdf.setFillColor(245, 245, 245);
            const remarkBoxHeight = 10 + (remarkLines.length * 5);
            pdf.rect(14, yPos, 180, remarkBoxHeight, 'FD');
            
            // Text mit etwas mehr Abstand zum Rand für bessere Lesbarkeit
            pdf.setTextColor(0);
            pdf.text(remarkLines, 17, yPos + 8);
            
            // Mehr Abstand nach dem Textblock
            yPos += remarkBoxHeight + 10;
          }
          
          // Fotos hinzufügen, wenn vorhanden
          if (remarksPhotos && remarksPhotos.length > 0) {
            // Überschrift für Fotos
            pdf.setFontSize(12);
            pdf.setTextColor(0);
            pdf.text(`Fotos zum Tiefbau-Projekt (${remarksPhotos.length})`, 14, yPos);
            yPos += 10;
            
            // Verbesserte Bildlayout-Einstellungen
            const maxImgWidth = 85; // Breite für Bilder
            const margin = 14; // Seitenrand
            const gap = 10; // Abstand zwischen Bildern
            const imagesPerRow = 2; // 2 Bilder pro Zeile
            const imgHeight = 65; // Feste Bildhöhe
            
            // Verarbeite jedes Foto
            for (let i = 0; i < remarksPhotos.length; i++) {
              // Bei mehr als 2 Bildern pro Seite, füge eine neue Seite hinzu
              if (i > 0 && i % 2 === 0) {
                pdf.addPage();
                yPos = 20;
                pdf.setFontSize(12);
                pdf.text(`Fotos zum Tiefbau-Projekt (Fortsetzung)`, 14, yPos);
                yPos += 10;
              }
              
              // Berechne Position für dieses Bild
              const colIndex = i % imagesPerRow;
              const x = margin + (colIndex * (maxImgWidth + gap));
              const currentY = yPos + (colIndex === 0 ? 0 : 0); // Beide Bilder auf gleicher Höhe
              
              try {
                // Extrahiere Base64-Daten
                const img = remarksPhotos[i].preview;
                const base64Data = img.includes('base64,') ? img.split('base64,')[1] : img;
                
                // Füge das Bild mit hoher Qualität zum PDF hinzu
                pdf.addImage(base64Data, 'JPEG', x, currentY, maxImgWidth, imgHeight);
                
                // Deutlich sichtbarer Rahmen um das Bild
                pdf.setDrawColor(80, 80, 80);
                pdf.setLineWidth(0.7);
                pdf.rect(x, currentY, maxImgWidth, imgHeight, 'D');
                
                // Bildnummer als Beschriftung
                pdf.setFillColor(240, 240, 240);
                pdf.rect(x, currentY + imgHeight, maxImgWidth, 8, 'F');
                pdf.setFontSize(8);
                pdf.setTextColor(0);
                pdf.text(`Foto ${i + 1}`, x + 2, currentY + imgHeight + 6);
                
              } catch (error) {
                // Fehler-Fallback mit deutlicher Markierung
                pdf.setFillColor(240, 240, 240);
                pdf.rect(x, currentY, maxImgWidth, imgHeight, 'F');
                pdf.setTextColor(200, 0, 0); // Rot für Fehler
                pdf.setFontSize(10);
                pdf.text('Bild konnte nicht geladen werden', x + 10, currentY + 30);
                console.error('Fehler beim Laden des Bildes:', error);
              }
              
              // Nur die Y-Position erhöhen, wenn wir eine komplette Reihe haben oder beim letzten Bild
              if (colIndex === imagesPerRow - 1 || i === remarksPhotos.length - 1) {
                yPos += imgHeight + 15; // Erhöhe den Y-Wert für die nächste Zeile
              }
            }
          }
        }
        
        // QR-Code-Abschnitt entfernt, wie vom Benutzer gewünscht
        
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
          
          // Datum und Zeitstempel in der Fußzeile
          const currentDate = new Date().toLocaleDateString('de-DE');
          pdf.text(`Erstellt am: ${currentDate}`, pageWidth / 2 - 20, pageHeight - 10);
        }
        
        // PDF herunterladen mit optimiertem Dateinamen
        const dateString = new Date().toISOString().slice(0, 10);
        const projectString = projectName ? projectName.replace(/[^a-zA-Z0-9]/g, '_') : 'Unbenannt';
        pdf.save(`Tiefbau-Bericht_${projectString}_${dateString}.pdf`);
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