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
      
      // Alle Kopfzeilen sind jetzt separat implementiert 
      // im gleichen Stil für jede Seite.
      
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
      
      // 🎨 Kopfzeile für Seite 1
      pdf.setFontSize(9);
      pdf.setTextColor(150); // dezentes Grau
      pdf.setFont("helvetica", "italic");
      pdf.text('Bau - Structura | Automatisch generierter Bericht', 14, 10);

      pdf.setFont("helvetica", "normal");
      pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 170, 10, { align: 'right' });
      pdf.text(`Seite 1 von ${totalPages}`, 285, 10, { align: 'right' }); // Falls A4 (Breite 297 mm)

      // 🔷 Trennlinie unter der Kopfzeile
      pdf.setDrawColor(200);
      pdf.setLineWidth(0.5);
      pdf.line(14, 12, 285, 12); // horizontale Linie quer über die Seite
      
      // 🏗️ Titel des Berichts mit besserem Styling
      pdf.setFontSize(22);
      pdf.setTextColor(0, 51, 102); // dunkles Blau für technische Wirkung
      pdf.setFont("helvetica", "bold");
      const titleText = `Tiefbau-Streckenbericht: ${projectName || 'Tiefbau-Projekt'}`;
      pdf.text(titleText, 14, 25);
      
      // 📌 Untertitel
      pdf.setFontSize(11);
      pdf.setTextColor(80);
      pdf.setFont("helvetica", "normal");
      pdf.text('Übersicht und Dokumentation der geplanten Tiefbaumaßnahme', 14, 32);
      
      // Projekt-Details hinzufügen, wenn verfügbar
      if (projectData) {
        const startY = 40; // Mehr Abstand nach dem Untertitel
        const lineHeight = 6; // Etwas mehr Zeilenabstand für bessere Lesbarkeit
        
        // 📋 Überschrift "Projektdetails" im gleichen Stil wie die anderen Überschriften
        pdf.setFontSize(15);
        pdf.setTextColor(0, 51, 102); // dunkles Blau für technische Wirkung
        pdf.setFont("helvetica", "bold");
        pdf.text('Projektdetails', 14, startY);
        
        // Weniger Abstand zwischen Überschrift und Box
        const contentStartY = startY + 6;
        
        // Ansprechendere Box für Projekt-Details
        pdf.setFontSize(10);
        pdf.setDrawColor(200, 200, 200); // Hellgrauer Rahmen
        pdf.setFillColor(248, 248, 248); // Hellerer Hintergrund
        
        // Box mit abgerundeten Ecken
        pdf.roundedRect(14, contentStartY, 170, 36, 3, 3, 'FD');
        
        // Position für den Text innerhalb der Box
        let currentY = contentStartY + 8; // Abstand vom oberen Rand der Box
        
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
        const mapY = projectData ? 85 : 50; // Mehr Abstand nach unten für Untertitel
        
        // 🗺️ Überschrift für die Karte im gleichen Stil wie andere Überschriften
        pdf.setFontSize(15);
        pdf.setTextColor(0, 51, 102); // dunkles Blau für technische Wirkung
        pdf.setFont("helvetica", "bold");
        pdf.text('Streckenübersicht', 14, mapTitleY);
        
        // Kurzer Untertitel für die Karte
        pdf.setFontSize(11);
        pdf.setTextColor(80);
        pdf.setFont("helvetica", "normal");
        pdf.text('Visuelle Darstellung der Tiefbau-Strecke', 14, mapTitleY + 6);
        
        // Verbesserte Bildqualität durch höhere JPEG-Qualität (1.0)
        const imgData = mapCanvas.toDataURL('image/jpeg', 1.0);
        const imgWidth = 140; // Etwas breiter für bessere Lesbarkeit
        const imgHeight = (mapCanvas.height * imgWidth) / mapCanvas.width;
        
        pdf.addImage(imgData, 'JPEG', 14, mapY, imgWidth, imgHeight);
        
        // --- Streckeninformationen auf eine eigene Seite (Seite 2) verschieben ---
        // Neue Seite für die Streckeninformationen hinzufügen
        pdf.addPage();
        
        // 🎨 Kopfzeile für Seite 2
        pdf.setFontSize(9);
        pdf.setTextColor(150); // dezentes Grau
        pdf.setFont("helvetica", "italic");
        pdf.text('Bau - Structura | Automatisch generierter Bericht', 14, 10);

        pdf.setFont("helvetica", "normal");
        pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 170, 10, { align: 'right' });
        const gesamt = (remarks || (remarksPhotos && remarksPhotos.length > 0)) ? 3 : 2;
        pdf.text(`Seite 2 von ${gesamt}`, 285, 10, { align: 'right' }); // Falls A4 (Breite 297 mm)

        // 🔷 Trennlinie unter der Kopfzeile
        pdf.setDrawColor(200);
        pdf.setLineWidth(0.5);
        pdf.line(14, 12, 285, 12); // horizontale Linie quer über die Seite

        // 🧭 Überschrift „Streckeninformationen"
        pdf.setFontSize(18);
        pdf.setTextColor(0, 51, 102); // dunkles Blau für technische Wirkung
        pdf.setFont("helvetica", "bold");
        pdf.text('Streckeninformationen', 14, 30);

        // 📌 Untertitel oder kurze Infozeile
        pdf.setFontSize(11);
        pdf.setTextColor(80);
        pdf.setFont("helvetica", "normal");
        pdf.text('Details zur geplanten Tiefbaustrecke zwischen Start- und Zieladresse', 14, 36);
        
        // Einfache Textzeilen mit Styling
        const lineHeight = 10;
        const startTextY = 50; // Mehr Abstand nach dem Untertitel
        
        // Box für die Streckendetails mit ansprechendem Design
        pdf.setFillColor(248, 248, 248); // Etwas hellerer Hintergrund
        pdf.setDrawColor(180, 180, 200); // Subtiler blauer Rahmen
        pdf.setLineWidth(0.5);
        const boxHeight = 65; // Etwas mehr Platz
        pdf.roundedRect(14, startTextY - 10, 260, boxHeight, 5, 5, 'FD'); // Stärker gerundete Ecken
        
        // Daten als übersichtliche Zeilen mit Beschriftungen
        pdf.setFontSize(14);
        
        // Start-Information mit Icon
        pdf.setTextColor(0, 75, 125); // Dunkleres Blau für Labels
        pdf.setFont('helvetica', 'bold');
        pdf.text('Start:', 20, startTextY);
        pdf.setTextColor(30, 30, 30); // Fast schwarz für bessere Lesbarkeit
        pdf.setFont('helvetica', 'normal');
        const startText = routeData.start || 'Nicht definiert';
        pdf.text(startText, 80, startTextY);
        
        // Ziel-Information mit Icon
        pdf.setTextColor(0, 75, 125); // Dunkleres Blau für Labels
        pdf.setFont('helvetica', 'bold');
        pdf.text('Ziel:', 20, startTextY + lineHeight * 2);
        pdf.setTextColor(30, 30, 30); // Fast schwarz für bessere Lesbarkeit
        pdf.setFont('helvetica', 'normal');
        const zielText = routeData.end || 'Nicht definiert';
        pdf.text(zielText, 80, startTextY + lineHeight * 2);
        
        // Distanz-Information mit Icon
        pdf.setTextColor(0, 75, 125); // Dunkleres Blau für Labels
        pdf.setFont('helvetica', 'bold');
        pdf.text('Distanz:', 20, startTextY + lineHeight * 4);
        pdf.setTextColor(30, 30, 30); // Fast schwarz für bessere Lesbarkeit
        pdf.setFont('helvetica', 'normal');
        
        // Distanz mit einer Dezimalstelle und "km" in leicht anderer Farbe
        if (routeData.distance) {
            const distanceValue = `${routeData.distance.toFixed(1)} `;
            pdf.text(distanceValue, 80, startTextY + lineHeight * 4);
            
            // "km" in separater Farbe
            pdf.setTextColor(100, 100, 100); // Grau für die Einheit
            pdf.text("km", 80 + pdf.getTextWidth(distanceValue), startTextY + lineHeight * 4);
        } else {
            pdf.text("Nicht berechnet", 80, startTextY + lineHeight * 4);
        }
        
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
          
          // 🎨 Kopfzeile für Seite 3 (Bemerkungen)
          pdf.setFontSize(9);
          pdf.setTextColor(150); // dezentes Grau
          pdf.setFont("helvetica", "italic");
          pdf.text('Bau - Structura | Automatisch generierter Bericht', 14, 10);

          pdf.setFont("helvetica", "normal");
          pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 170, 10, { align: 'right' });
          pdf.text(`Seite 3 von 3`, 285, 10, { align: 'right' }); // Falls A4 (Breite 297 mm)

          // 🔷 Trennlinie unter der Kopfzeile
          pdf.setDrawColor(200);
          pdf.setLineWidth(0.5);
          pdf.line(14, 12, 285, 12); // horizontale Linie quer über die Seite
          
          // Überschrift für den Bemerkungs-Abschnitt
          pdf.setFontSize(20);
          pdf.setTextColor(0);
          
          // Position der Überschrift 
          const remarksStartY = 25; // Feste Position oben auf der neuen Seite
          
          // 🧭 Überschrift der Bemerkungen im gleichen Stil wie Seite 2
          pdf.setFontSize(18);
          pdf.setTextColor(0, 51, 102); // dunkles Blau für technische Wirkung
          pdf.setFont("helvetica", "bold");
          pdf.text('Bemerkungen zum Tiefbau-Projekt', 14, remarksStartY);
          
          // 📌 Untertitel oder kurze Infozeile
          pdf.setFontSize(11);
          pdf.setTextColor(80);
          pdf.setFont("helvetica", "normal");
          pdf.text('Ergänzende Hinweise und Anmerkungen zur geplanten Baumaßnahme', 14, remarksStartY + 6);
          
          let yPos = remarksStartY + 15; // Mehr Abstand nach dem Untertitel
          
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
            // 📸 Überschrift für Fotos im gleichen Stil wie andere Überschriften
            pdf.setFontSize(15);
            pdf.setTextColor(0, 51, 102); // dunkles Blau für technische Wirkung
            pdf.setFont("helvetica", "bold");
            pdf.text(`Fotos zum Tiefbau-Projekt (${remarksPhotos.length})`, 14, yPos);
            
            // Kurzer Untertitel für die Fotos mit Anzahl
            pdf.setFontSize(11);
            pdf.setTextColor(80);
            pdf.setFont("helvetica", "normal");
            const photoCountText = remarksPhotos.length === 1 
              ? 'Ein Foto zur Dokumentation des Bauvorhabens' 
              : `${remarksPhotos.length} Fotos zur Dokumentation des Bauvorhabens`;
            pdf.text(photoCountText, 14, yPos + 6);
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
                
                // Kopfzeile für die Fortsetzungsseite
                pdf.setFontSize(9);
                pdf.setTextColor(150); // dezentes Grau
                pdf.setFont("helvetica", "italic");
                pdf.text('Bau - Structura | Automatisch generierter Bericht', 14, 10);
                
                pdf.setFont("helvetica", "normal");
                pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 170, 10, { align: 'right' });
                const currentPageNum = 4 + Math.floor(i / 2);
                pdf.text(`Seite ${currentPageNum} von ${3 + Math.ceil(remarksPhotos.length / 2)}`, 285, 10, { align: 'right' });
                
                // Trennlinie unter der Kopfzeile
                pdf.setDrawColor(200);
                pdf.setLineWidth(0.5);
                pdf.line(14, 12, 285, 12);
                
                // Fortgesetzte Fotos-Überschrift
                yPos = 25;
                pdf.setFontSize(15);
                pdf.setTextColor(0, 51, 102);
                pdf.setFont("helvetica", "bold");
                pdf.text(`Fotos zum Tiefbau-Projekt (Fortsetzung)`, 14, yPos);
                
                // Untertitel mit Seiteninfo für die Fortsetzung
                pdf.setFontSize(11);
                pdf.setTextColor(80);
                pdf.setFont("helvetica", "normal");
                const currentPage = Math.floor(i / 2) + 1;
                const totalPages = Math.ceil(remarksPhotos.length / 2);
                pdf.text(`Fortsetzung der Fotodokumentation (Seite ${currentPage}/${totalPages})`, 14, yPos + 6);
                
                yPos += 15;
              }
              
              // Berechne Position für dieses Bild
              const colIndex = i % imagesPerRow;
              const x = margin + (colIndex * (maxImgWidth + gap));
              const currentY = yPos + (colIndex === 0 ? 0 : 0); // Beide Bilder auf gleicher Höhe
              
              try {
                // Extrahiere Base64-Daten
                const img = remarksPhotos[i].preview;
                const base64Data = img.includes('base64,') ? img.split('base64,')[1] : img;
                
                // Rahmen und Hintergrund für jedes Bild
                pdf.setFillColor(252, 252, 252);
                pdf.setDrawColor(180, 180, 200); // Subtiler blauer Rahmen
                pdf.setLineWidth(0.7);
                
                // Etwas größer als das Bild für Rahmen mit Abstand
                const frameMargin = 4;
                const captionHeight = 12;
                pdf.roundedRect(
                  x - frameMargin, 
                  currentY - frameMargin, 
                  maxImgWidth + (frameMargin * 2), 
                  imgHeight + (frameMargin * 2) + captionHeight,
                  3, 3, 'FD'
                );
                
                // Füge das Bild mit hoher Qualität zum PDF hinzu
                pdf.addImage(base64Data, 'JPEG', x, currentY, maxImgWidth, imgHeight);
                
                // Trennlinie zwischen Bild und Bildunterschrift
                pdf.setDrawColor(200, 200, 220);
                pdf.setLineWidth(0.3);
                pdf.line(
                  x - frameMargin + 2, 
                  currentY + imgHeight + 2, 
                  x + maxImgWidth + frameMargin - 2, 
                  currentY + imgHeight + 2
                );
                
                // Bildnummer als stilvolle Beschriftung
                pdf.setFontSize(9);
                pdf.setTextColor(80, 80, 100);
                pdf.setFont("helvetica", "bold");
                pdf.text(`Foto ${i + 1}`, x + 2, currentY + imgHeight + 10);
                
              } catch (error) {
                // Ansprechender Fehler-Fallback
                const frameMargin = 4;
                const captionHeight = 12;
                
                // Umgebender Rahmen mit abgerundeten Ecken
                pdf.setFillColor(248, 245, 245);
                pdf.setDrawColor(220, 180, 180);
                pdf.setLineWidth(0.7);
                pdf.roundedRect(
                  x - frameMargin, 
                  currentY - frameMargin, 
                  maxImgWidth + (frameMargin * 2), 
                  imgHeight + (frameMargin * 2) + captionHeight,
                  3, 3, 'FD'
                );
                
                // Diagonale Linien als Hinweis auf fehlendes Bild
                pdf.setDrawColor(220, 180, 180);
                pdf.setLineWidth(0.5);
                pdf.line(x, currentY, x + maxImgWidth, currentY + imgHeight);
                pdf.line(x + maxImgWidth, currentY, x, currentY + imgHeight);
                
                // Fehlermeldung mit Icon
                pdf.setTextColor(180, 60, 60);
                pdf.setFontSize(11);
                pdf.setFont("helvetica", "bold");
                pdf.text('Bild konnte nicht geladen werden', x + 10, currentY + (imgHeight/2));
                
                // Technische Info klein darunter
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "normal");
                pdf.text('Möglicher Grund: Dateigröße oder Bildformat nicht kompatibel', x + 10, currentY + (imgHeight/2) + 8);
                
                console.error('Fehler beim Laden des Bildes:', error);
              }
              
              // Nur die Y-Position erhöhen, wenn wir eine komplette Reihe haben oder beim letzten Bild
              if (colIndex === imagesPerRow - 1 || i === remarksPhotos.length - 1) {
                // Mehr Abstand zwischen Bildreihen für bessere Lesbarkeit
                const frameMargin = 4;
                const captionHeight = 12;
                const rowSpacing = 20; // Zusätzlicher Abstand zwischen den Zeilen
                yPos += imgHeight + (frameMargin * 2) + captionHeight + rowSpacing;
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