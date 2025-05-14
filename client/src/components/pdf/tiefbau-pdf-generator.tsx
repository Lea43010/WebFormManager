import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
        
        // --- Bemerkungen zum Tiefbau-Projekt ---
        if (remarks || (remarksPhotos && remarksPhotos.length > 0)) {
          // Neue Seite für Bemerkungen und Fotos
          pdf.addPage();
          pdf.setFontSize(14);
          pdf.text('Bemerkungen zum Tiefbau-Projekt', 14, 20);
          
          let yPos = 30;
          
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
            const maxImgWidth = 80; // Maximale Bildbreite
            const margin = 14; // Seitenrand
            const gap = 10; // Abstand zwischen Bildern
            const imagesPerRow = 2; // Bilder pro Zeile
            
            // Verarbeite jedes Foto
            for (let i = 0; i < remarksPhotos.length; i++) {
              const rowIndex = Math.floor(i / imagesPerRow);
              const colIndex = i % imagesPerRow;
              
              const x = margin + (colIndex * (maxImgWidth + gap));
              const y = yPos + (rowIndex * 70); // 70px Höhe pro Bildreihe
              
              try {
                // Beim Hinzufügen des Bildes müssen wir die Base64-Daten extrahieren
                const img = remarksPhotos[i].preview;
                // Entferne den MIME-Typ und das Base64-Präfix, wenn vorhanden
                const base64Data = img.includes('base64,') ? img.split('base64,')[1] : img;
                
                pdf.addImage(base64Data, 'JPEG', x, y, maxImgWidth, 60);
              } catch (error) {
                // Wenn das Bild nicht geladen werden kann, setze einen Platzhaltertext
                pdf.setFontSize(8);
                pdf.text('Bild konnte nicht geladen werden', x, y + 30);
                console.error('Fehler beim Laden des Bildes:', error);
              }
              
              // Füge eine neue Seite hinzu, wenn wir mehr als 4 Bilder haben und gerade 4 gerendert haben
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