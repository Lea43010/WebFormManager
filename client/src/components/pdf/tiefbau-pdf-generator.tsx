import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

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
        
        // --- Streckeninformationen als Tabelle ---
        const routeYPos = mapY + imgHeight + 10;
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
        
        // Die Bodenanalyse und Maschinenempfehlungen-Abschnitte wurden entfernt
        // Stattdessen gehen wir direkt zu Bemerkungen oder QR-Code über
        
        // --- Bemerkungen zum Tiefbau-Projekt ---
        if (remarks || (remarksPhotos && remarksPhotos.length > 0)) {
          // Keine separate Seite mehr, da Bodenanalyse und Maschinenempfehlungen entfernt wurden
          // Berechne den verfügbaren Platz auf der aktuellen Seite
          const availableSpace = pageHeight - (routeYPos + 60);
          const neededSpace = 80; // Geschätzter Platzbedarf für Überschrift und mindestens ein paar Zeilen Text
          
          // Entscheide, ob eine neue Seite erforderlich ist
          let newPage = false;
          if (availableSpace < neededSpace) {
            pdf.addPage();
            newPage = true;
          }
          
          pdf.setFontSize(14);
          
          // Position der Überschrift basierend auf vorheriger Inhalte und Seitenumbruch anpassen
          const remarksStartY = newPage ? 20 : routeYPos + 60; // Bei neuer Seite oben beginnen, sonst nach Routeninformationen
          pdf.text('Bemerkungen zum Tiefbau-Projekt', 14, remarksStartY);
          
          let yPos = remarksStartY + 10;
          
          // Textliche Bemerkungen hinzufügen, wenn vorhanden
          if (remarks && remarks.trim()) {
            pdf.setFontSize(10);
            
            // Beschreibung
            const remarkLines = pdf.splitTextToSize(remarks, 180); // Text umbrechen, damit er auf die Seite passt
            pdf.setDrawColor(0);
            pdf.setFillColor(245, 245, 245);
            pdf.rect(14, yPos, 180, 10 + (remarkLines.length * 5), 'F');
            pdf.setTextColor(0);
            pdf.text(remarkLines, 17, yPos + 7);
            
            yPos += 15 + (remarkLines.length * 5);
          }
          
          // Fotos hinzufügen, wenn vorhanden
          if (remarksPhotos && remarksPhotos.length > 0) {
            pdf.setFontSize(12);
            pdf.text(`Fotos zum Tiefbau-Projekt (${remarksPhotos.length})`, 14, yPos);
            yPos += 10;
            
            // Berechne maximal mögliche Bildbreite für die Anordnung
            const maxImgWidth = 85; // Etwas größere Bilder für bessere Qualität
            const margin = 14; // Seitenrand
            const gap = 10; // Abstand zwischen Bildern
            const imagesPerRow = 2; // Bilder pro Zeile
            const imgHeight = 65; // Feste Bildhöhe für konsistente Darstellung
            
            // Verarbeite jedes Foto
            for (let i = 0; i < remarksPhotos.length; i++) {
              // Berechnung der Zeilen- und Spaltenposition
              const rowIndex = Math.floor(i / imagesPerRow) % 2; // Max 2 Zeilen pro Seite
              const colIndex = i % imagesPerRow;
              
              const x = margin + (colIndex * (maxImgWidth + gap));
              const y = yPos + (rowIndex * (imgHeight + 10)); // Mehr Abstand zwischen Reihen
              
              try {
                // Beim Hinzufügen des Bildes müssen wir die Base64-Daten extrahieren
                const img = remarksPhotos[i].preview;
                // Entferne den MIME-Typ und das Base64-Präfix, wenn vorhanden
                const base64Data = img.includes('base64,') ? img.split('base64,')[1] : img;
                
                // Füge das Bild zum PDF hinzu
                pdf.addImage(base64Data, 'JPEG', x, y, maxImgWidth, imgHeight);
                
                // Einen Rahmen um das Bild zeichnen
                pdf.setDrawColor(100, 100, 100);
                pdf.rect(x, y, maxImgWidth, imgHeight, 'D');
                
                // Optionaler Bildindex am unteren Rand
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`Foto ${i + 1}`, x + 2, y + imgHeight + 5);
              } catch (error) {
                // Wenn das Bild nicht geladen werden kann, setze einen Platzhaltertext
                pdf.setFillColor(240, 240, 240);
                pdf.rect(x, y, maxImgWidth, imgHeight, 'F');
                pdf.setTextColor(100, 100, 100);
                pdf.setFontSize(10);
                pdf.text('Bild konnte nicht geladen werden', x + 10, y + 30);
                console.error('Fehler beim Laden des Bildes:', error);
              }
              
              // Füge eine neue Seite hinzu, wenn wir eine volle Seite haben (4 Bilder) und noch mehr kommen
              if ((i + 1) % 4 === 0 && i < remarksPhotos.length - 1) {
                pdf.addPage();
                yPos = 20;
                pdf.setFontSize(12);
                pdf.text(`Fotos zum Tiefbau-Projekt (Fortsetzung)`, 14, yPos);
                yPos += 10;
              }
            }
          }
        }
        
        // --- QR-Code für schnellen Projektzugriff generieren ---
        try {
          // Generiere eine URL für den Projektzugriff (mit projektspezifischen Daten)
          const projectUrlBase = window.location.origin + '/tiefbau-map';
          const projectParams = new URLSearchParams();
          
          if (projectData?.id) {
            projectParams.append('projectId', projectData.id.toString());
          }
          
          if (routeData) {
            projectParams.append('start', routeData.start);
            projectParams.append('end', routeData.end);
          }
          
          const projectUrl = `${projectUrlBase}?${projectParams.toString()}`;
          
          // QR-Code als DataURL generieren
          const qrCodeDataUrl = await QRCode.toDataURL(projectUrl, {
            width: 100,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          
          // QR-Code auf der letzten Seite hinzufügen
          pdf.addPage();
          pdf.setFontSize(16);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Projektinformationen teilen', 14, 20);
          
          pdf.setFontSize(10);
          pdf.setTextColor(80, 80, 80);
          pdf.text('Scannen Sie den untenstehenden QR-Code, um direkt auf die Projektdaten zuzugreifen.', 14, 30);
          pdf.text('Oder verwenden Sie diesen Link:', 14, 40);
          
          pdf.setTextColor(0, 0, 200);
          pdf.text(projectUrl, 14, 45);
          
          // QR-Code platzieren
          pdf.addImage(qrCodeDataUrl, 'PNG', 70, 60, 70, 70);
          
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text('Hinweis: Für den Zugriff auf Projektdaten sind entsprechende Berechtigungen erforderlich.', 40, 140);
        } catch (qrError) {
          console.error('Fehler beim Generieren des QR-Codes:', qrError);
          // Fehler beim QR-Code-Generieren darf den Rest des PDF-Prozesses nicht abbrechen
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