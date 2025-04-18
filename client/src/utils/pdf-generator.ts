import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generiert ein PDF aus HTML-Inhalt
 * 
 * @param elementId Die ID des HTML-Elements, das in ein PDF umgewandelt werden soll
 * @param filename Der Dateiname des zu erstellenden PDFs
 */
export const generatePdfFromElement = async (
  elementId: string,
  filename: string
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element mit ID ${elementId} wurde nicht gefunden`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 1.5, // Höhere Qualität
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
    });

    // A4 Größe: 210x297mm
    const imgWidth = 190;
    const pageHeight = 287;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10; // Anfangsposition (10mm von oben)

    // Erste Seite
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Zusätzliche Seiten, falls der Inhalt zu groß ist
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Fehler bei der PDF-Generierung:', error);
  }
};

/**
 * Generiert ein PDF direkt aus strukturierten Daten (ohne HTML-Element)
 * 
 * @param title Der Titel des Dokuments
 * @param content Das Dokument in Abschnitten mit Überschriften und Text
 * @param filename Der Dateiname des zu erstellenden PDFs
 */
export const generateStructuredPdf = (
  title: string,
  content: { heading: string; text: string; subsections?: { subheading: string; text: string }[] }[],
  filename: string
): void => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
    });

    // Schriftart und Größe für Titel
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    
    // Titel hinzufügen
    pdf.text(title, 20, 20);
    pdf.line(20, 25, 190, 25);
    
    let yPosition = 35;
    const pageWidth = 210;
    const margin = 20;
    const textWidth = pageWidth - 2 * margin;
    
    // Inhalt hinzufügen
    content.forEach((section) => {
      // Prüfen, ob neue Seite benötigt wird
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Abschnittsüberschrift
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(section.heading, margin, yPosition);
      yPosition += 8;
      
      // Abschnittstext
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      
      const splitText = pdf.splitTextToSize(section.text, textWidth);
      pdf.text(splitText, margin, yPosition);
      yPosition += splitText.length * 6 + 5;
      
      // Unterabschnitte, falls vorhanden
      if (section.subsections) {
        section.subsections.forEach((subsection) => {
          // Prüfen, ob neue Seite benötigt wird
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Unterabschnittsüberschrift
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.text(subsection.subheading, margin, yPosition);
          yPosition += 6;
          
          // Unterabschnittstext
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(11);
          
          const splitSubText = pdf.splitTextToSize(subsection.text, textWidth);
          pdf.text(splitSubText, margin, yPosition);
          yPosition += splitSubText.length * 6 + 5;
        });
      }
      
      // Abstandszeile zwischen den Abschnitten
      yPosition += 3;
    });
    
    // Fußzeile mit Erstellungsdatum
    const today = new Date();
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.text(
      `Dokument erstellt am ${today.toLocaleDateString('de-DE')}`,
      margin,
      287
    );
    
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Fehler bei der PDF-Generierung:', error);
  }
};

/**
 * Generiert ein PDF-Dokument zur EU-Konformität
 */
export const generateCompliancePdf = (): void => {
  const title = "Baustellen-App: Konformität mit EU Data Act und EU KI Act";
  
  const content = [
    {
      heading: "1. Einführung",
      text: "Dieses Dokument beschreibt die Maßnahmen, die in der Baustellen-App implementiert wurden, um die Konformität mit dem EU Data Act und dem EU KI Act zu gewährleisten. Die Baustellen-App verwendet verschiedene KI-Funktionen zur Bildklassifizierung, Dokument-Analyse und Materialberechnung."
    },
    {
      heading: "2. Konformität mit dem EU Data Act",
      text: "Die Baustellen-App wurde unter Berücksichtigung der Anforderungen des EU Data Act konzipiert, um Transparenz, Datenportabilität und Datenschutz zu gewährleisten.",
      subsections: [
        {
          subheading: "2.1 Datenportabilität",
          text: "Die Datenbankstruktur unterstützt den Export aller projektbezogenen Daten in standardisierten Formaten, was den Nutzern ermöglicht, ihre Daten zwischen verschiedenen Diensten zu übertragen."
        },
        {
          subheading: "2.2 Transparenz",
          text: "Die App bietet eine klare Dokumentation der Datenstrukturen und ihrer Beziehungen, was für die Benutzer verständlich ist und ihnen ermöglicht, den Umfang der gespeicherten Daten zu verstehen."
        },
        {
          subheading: "2.3 Datenschutz",
          text: "Sensible Daten wie Benutzerpasswörter werden nur in gehashter Form gespeichert, und personenbezogene Daten werden nur im erforderlichen Umfang gespeichert, um das Prinzip der Datenminimierung zu erfüllen."
        },
        {
          subheading: "2.4 Interoperabilität",
          text: "Die Datenbank verwendet standardisierte Datentypen und Strukturen, um die Interoperabilität mit anderen Systemen zu gewährleisten."
        },
        {
          subheading: "2.5 Zugänglichkeit",
          text: "Die Anwendung bietet Mechanismen, um auf eigene Daten zuzugreifen und diese zu exportieren, was den Benutzern Kontrolle über ihre Daten gibt."
        }
      ]
    },
    {
      heading: "3. Konformität mit dem EU KI Act",
      text: "Die in der App implementierten KI-Systeme fallen in die Kategorie mit minimalem Risiko, da sie keine autonomen Entscheidungen über Personen treffen, keine Bereiche mit hohem Risiko betreffen, ausschließlich als Unterstützungswerkzeuge dienen und jederzeit menschlicher Überprüfung unterliegen.",
      subsections: [
        {
          subheading: "3.1 Boden- und Asphaltklassifizierung",
          text: "Die KI-basierte Analyse von hochgeladenen Fotos zur Bestimmung von Bodenklasse, Belastungsklasse und Materialeigenschaften wird mit Transparenzmaßnahmen wie der Anzeige von Konfidenzwerten, menschlicher Aufsicht, Korrekturfunktionen und Erklärbarkeit umgesetzt."
        },
        {
          subheading: "3.2 Intelligente Dateiorganisation",
          text: "Die KI-gestützte Analyse von Dokumenten erfolgt nur auf explizite Anforderung des Benutzers (Opt-in). Vorschläge werden mit Begründung und Konfidenzwert angezeigt und erst nach expliziter Bestätigung angewendet, wobei alle Aktionen nachvollziehbar dokumentiert werden."
        },
        {
          subheading: "3.3 Materialberechnung und Maschineneinsatz",
          text: "Die Berechnung von Materialmengen und Empfehlungen für den Maschineneinsatz basieren auf transparenten Algorithmen, bieten manuelle Anpassungsmöglichkeiten und gewährleisten Rückverfolgbarkeit der Berechnungsparameter."
        },
        {
          subheading: "3.4 Transparenz und Information",
          text: "Alle KI-generierten Inhalte sind deutlich als solche gekennzeichnet, die Benutzeroberfläche kommuniziert klar, welche Funktionen KI-gestützt sind, und eine umfassende Dokumentation ist in der Hilfe-Sektion verfügbar."
        },
        {
          subheading: "3.5 Datenschutz und Datensicherheit",
          text: "Die KI-Systeme verwenden nur die für die Analyse notwendigen Daten, führen Analysen wenn möglich lokal durch, gewährleisten sichere Übertragung zu externen KI-Diensten und speichern temporäre Analysen nicht länger als notwendig."
        },
        {
          subheading: "3.6 Qualitätsmanagement",
          text: "Die KI-Modelle werden regelmäßig aktualisiert, um ihre Genauigkeit zu verbessern, Benutzerkorrektur von Klassifizierungen kann für Modellverbesserung genutzt werden, und die Leistung der KI-Vorhersagen wird überwacht und dokumentiert."
        },
        {
          subheading: "3.7 Governance und Verantwortlichkeit",
          text: "Es wird ein Verantwortlicher für die KI-Systeme innerhalb der Organisation ernannt, regelmäßige Tests der KI-Systeme werden dokumentiert, und es gibt einen dokumentierten Prozess für den Umgang mit Fehlfunktionen."
        }
      ]
    },
    {
      heading: "4. Datenschutzerklärung",
      text: "Die Baustellen-App verarbeitet personenbezogene Daten im Einklang mit der DSGVO und dem EU Data Act. Es werden nur die für den Betrieb notwendigen Daten erhoben, und der Zugriff auf diese Daten ist auf autorisierte Benutzer beschränkt. Benutzer haben das Recht, ihre Daten einzusehen, zu korrigieren oder zu löschen."
    },
    {
      heading: "5. Empfehlungen für die Nutzung",
      text: "Bei der Nutzung der KI-Funktionen der Baustellen-App empfehlen wir, alle Vorschläge kritisch zu prüfen und wichtige Entscheidungen nicht ausschließlich auf KI-Analysen zu stützen. Die KI-Funktionen dienen als Unterstützung für fachkundige Benutzer, ersetzen aber nicht deren Expertise."
    }
  ];
  
  generateStructuredPdf(title, content, "Baustellen-App-EU-Konformitaet");
};