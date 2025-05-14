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
      
      // Berechne die Gesamtzahl der Seiten (1 für Hauptseite, 1 für Streckeninformationen, optional 1 für Bemerkungen)
      const totalPages = (remarks || (remarksPhotos && remarksPhotos.length > 0)) ? 3 : 2;
      
      // Hilfsfunktion für die konsistente Kopfzeile auf allen Seiten
      const addPageHeader = (pageNumber: number) => {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Bau - Structura | Automatisch generierter Bericht`, 14, 10);
        pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 170, 10);
        pdf.text(`Seite ${pageNumber} von ${totalPages}`, 250, 10);
      };
      
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
      
      // Kopfzeile für Seite 1 hinzufügen
      addPageHeader(1);
      
      // Titel des Berichts
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      const titleText = `Tiefbau-Streckenbericht: ${projectName || 'Tiefbau-Projekt'}`;
      pdf.text(titleText, 14, 20);
      
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
        
        // --- Streckeninformationen auf eine eigene Seite (Seite 2) verschieben ---
        // Neue Seite für die Streckeninformationen hinzufügen
        pdf.addPage();
        
        // Kopfzeile für Seite 2 hinzufügen
        addPageHeader(2);
        
        // Überschrift der Streckeninformationen
        pdf.setFontSize(20);
        pdf.setTextColor(0);
        pdf.text('Streckeninformationen', 14, 25);
        
        // Horizontale Linie unter der Überschrift
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.5);
        pdf.line(14, 28, 280, 28);
        
        // Einfache Textzeilen mit Styling
        const lineHeight = 10;
        const startTextY = 40;
        
        // Box für die Streckendetails
        pdf.setFillColor(245, 245, 245);
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineWidth(0.5);
        const boxHeight = 60;
        pdf.roundedRect(14, startTextY - 10, 260, boxHeight, 3, 3, 'FD');
        
        // Daten als übersichtliche Zeilen mit Beschriftungen
        pdf.setFontSize(14);
        
        // Start-Information
        pdf.setFont('helvetica', 'bold');
        pdf.text('Start:', 20, startTextY);
        pdf.setFont('helvetica', 'normal');
        const startText = routeData.start || 'Nicht definiert';
        pdf.text(startText, 80, startTextY);
        
        // Ziel-Information
        pdf.setFont('helvetica', 'bold');
        pdf.text('Ziel:', 20, startTextY + lineHeight * 2);
        pdf.setFont('helvetica', 'normal');
        const zielText = routeData.end || 'Nicht definiert';
        pdf.text(zielText, 80, startTextY + lineHeight * 2);
        
        // Distanz-Information
        pdf.setFont('helvetica', 'bold');
        pdf.text('Distanz:', 20, startTextY + lineHeight * 4);
        pdf.setFont('helvetica', 'normal');
        const distanzText = routeData.distance ? `${routeData.distance.toFixed(2)} km` : 'Nicht berechnet';
        pdf.text(distanzText, 80, startTextY + lineHeight * 4);
        
        // Variable für die Berechnung der Gesamthöhe des Streckeninfos-Abschnitts - nicht mehr verwendet
        const tableHeight = boxHeight;
        
        // Streckendaten wurden eingefügt
        
        // Die Bodenanalyse, Maschinenempfehlungen und QR-Code Abschnitte wurden entfernt
        // Stattdessen gehen wir direkt zu den Bemerkungen über
        
        // --- Bemerkungen zum Tiefbau-Projekt ---
        if (remarks || (remarksPhotos && remarksPhotos.length > 0)) {
          // Keine separate Seite mehr, da Bodenanalyse, Maschinenempfehlungen und QR-Code entfernt wurden
          
          // Streckeninformationen sind jetzt auf Seite 2
          // Bemerkungen kommen auf eine neue Seite (Seite 3)
          pdf.addPage();
          
          // Kopfzeile für Bemerkungen-Seite (Seite 3)
          addPageHeader(3);
          
          // Überschrift für den Bemerkungs-Abschnitt
          pdf.setFontSize(20);
          pdf.setTextColor(0);
          
          // Position der Überschrift 
          const remarksStartY = 25; // Feste Position oben auf der neuen Seite
          
          // Überschrift und horizontale Linie darunter
          pdf.text('Bemerkungen zum Tiefbau-Projekt', 14, remarksStartY);
          pdf.setDrawColor(180, 180, 180);
          pdf.setLineWidth(0.5);
          pdf.line(14, remarksStartY + 3, 280, remarksStartY + 3);
          
          let yPos = remarksStartY + 10;
          
          // Textliche Bemerkungen hinzufügen, wenn vorhanden
          if (remarks && remarks.trim()) {
            // Größere Schrift und mehr Abstand für bessere Lesbarkeit
            pdf.setFontSize(11);
            
            // Text mit Umbruch vorbereiten, damit er auf die Seite passt
            const remarkLines = pdf.splitTextToSize(remarks, 180);
            
            // Berechne Höhe des Textfeldes basierend auf Zeilenanzahl (plus Padding)
            const lineSpacing = 6; // Raum pro Zeile
            const remarkBoxHeight = 16 + (remarkLines.length * lineSpacing);
            
            // Hintergrund-Box mit Rahmen für bessere Lesbarkeit
            pdf.setDrawColor(120, 120, 120);
            pdf.setFillColor(250, 250, 250);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(14, yPos, 180, remarkBoxHeight, 3, 3, 'FD'); // Abgerundete Ecken
            
            // Text mit Abstand zum Rand platzieren
            pdf.setTextColor(0);
            pdf.text(remarkLines, 18, yPos + 10);
            
            // Position für nachfolgende Elemente aktualisieren
            yPos += remarkBoxHeight + 15;
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