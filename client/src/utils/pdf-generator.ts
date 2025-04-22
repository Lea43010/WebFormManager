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
  const currentDate = new Date().toLocaleDateString('de-DE');
  const title = "Bau-Structura App: Konformität mit EU Data Act und EU KI Act (Stand: April 2025)";
  
  const content = [
    {
      heading: "1. Einführung",
      text: "Dieses Dokument beschreibt die Maßnahmen, die in der Bau-Structura App implementiert wurden, um die vollständige Konformität mit dem EU Data Act und dem EU KI Act zu gewährleisten. Die Bau-Structura App verwendet verschiedene KI-Funktionen zur Bildklassifizierung, Dokument-Analyse und Materialberechnung, die alle den EU-Vorschriften entsprechen."
    },
    {
      heading: "2. Konformität mit dem EU Data Act (2023)",
      text: "Die Bau-Structura App wurde unter Berücksichtigung aller Anforderungen des EU Data Act konzipiert, um Transparenz, Datenportabilität und Datenschutz zu gewährleisten.",
      subsections: [
        {
          subheading: "2.1 Datenportabilität (Art. 5, 6 EU Data Act)",
          text: "Die Datenbankstruktur unterstützt den Export aller projektbezogenen Daten in standardisierten Formaten (CSV, JSON, PDF), was den Nutzern ermöglicht, ihre Daten zwischen verschiedenen Diensten zu übertragen. Datenexporte können jederzeit über die entsprechenden Exportfunktionen durchgeführt werden, ohne technische oder vertragliche Hindernisse."
        },
        {
          subheading: "2.2 Transparenz und Rechenschaftspflicht (Art. 8, 10 EU Data Act)",
          text: "Die App bietet eine klare Dokumentation der Datenstrukturen und ihrer Beziehungen, sowie eine vollständige Übersicht über alle gespeicherten Daten. Änderungen an Daten werden protokolliert und ermöglichen eine lückenlose Nachverfolgung (Audit-Trail) im Einklang mit Art. 10 des EU Data Act."
        },
        {
          subheading: "2.3 Datenschutz und -sicherheit (Art. 11 EU Data Act, DSGVO)",
          text: "Sensible Daten wie Benutzerpasswörter werden nur in gehashter Form gespeichert, und personenbezogene Daten werden nur im erforderlichen Umfang gespeichert, um das Prinzip der Datenminimierung zu erfüllen. Die Anwendung implementiert technische und organisatorische Maßnahmen zum Schutz aller Daten gemäß Art. 11."
        },
        {
          subheading: "2.4 Interoperabilität und Standardisierung (Art. 28, 29 EU Data Act)",
          text: "Die Datenbank verwendet international anerkannte Datentypen und Strukturen, um die Interoperabilität mit anderen Systemen zu gewährleisten. Alle Datenformate entsprechen gängigen Standards, um einen nahtlosen Datenaustausch zu ermöglichen."
        },
        {
          subheading: "2.5 Rechtmäßige Datenweitergabe (Art. 19, 20 EU Data Act)",
          text: "Die Weitergabe von Daten an Dritte (z.B. für KI-basierte Analysen) erfolgt nur mit expliziter Zustimmung der Nutzer. Eine vollständige Transparenz wird durch klare Kennzeichnung und Informationen über Umfang und Zweck der Datenweitergabe gewährleistet, einschließlich der Möglichkeit, diese Zustimmung jederzeit zu widerrufen."
        }
      ]
    },
    {
      heading: "3. Konformität mit dem EU KI Act (Artificial Intelligence Act 2024)",
      text: "Die in der App implementierten KI-Systeme wurden einer gründlichen Risikobewertung unterzogen und fallen in die Kategorie mit minimalem Risiko gemäß EU KI Act, da sie keine autonomen Entscheidungen über Personen treffen, keine Bereiche mit hohem Risiko betreffen, ausschließlich als Unterstützungswerkzeuge dienen und jederzeit menschlicher Überprüfung und Korrekturmöglichkeiten unterliegen.",
      subsections: [
        {
          subheading: "3.1 Risikobasierte Kategorisierung (Art. 6, 9 EU KI Act)",
          text: "Alle KI-Systeme in der Bau-Structura App wurden gemäß Art. 6 und 9 des EU KI Act bewertet und kategorisiert. Da sie keine hochriskanten Anwendungsbereiche betreffen und keine eigenständigen Entscheidungen mit direkten Auswirkungen auf natürliche Personen treffen, wurden sie in die Kategorie mit minimalem Risiko eingestuft, unterliegen aber dennoch den Transparenz- und Qualitätsanforderungen."
        },
        {
          subheading: "3.2 Boden- und Asphaltklassifizierung (KI-gestützte Bildanalyse)",
          text: "Die KI-basierte Analyse von hochgeladenen Fotos zur Bestimmung von Bodenklasse und Belastungsklasse erfüllt alle Anforderungen des EU KI Acts durch: explizite Anzeige von Konfidenzwerten bei jeder Klassifizierung, menschliche Aufsicht mit jederzeit möglicher manueller Korrektur, Erklärbarkeitsfunktion, die Analysegrundlagen transparent macht, und Dokumentation der Trainingsdaten und verwendeten Algorithmen."
        },
        {
          subheading: "3.3 Transparenz und Information (Art. 13, 52 EU KI Act)",
          text: "Alle KI-gestützten Funktionen sind klar als solche gekennzeichnet gemäß Art. 52. Die App informiert Nutzer transparent über die eingesetzten KI-Systeme, deren Zweck, Funktionsweise und Grenzen. Konfidenzwerte werden angezeigt, und die Entscheidungsprozesse der KI werden verständlich dokumentiert, um den Anforderungen an Transparenz und Erklärbarkeit zu genügen."
        },
        {
          subheading: "3.4 Datenschutz und Datensicherheit (Art. 10, 15 EU KI Act)",
          text: "Die KI-Systeme verwenden nur die für die Analyse notwendigen Daten, führen Analysen wenn möglich lokal durch, gewährleisten sichere Übertragung zu externen KI-Diensten und speichern temporäre Analysen nicht länger als notwendig. Alle Datenverarbeitungsprozesse entsprechen den strengen Vorgaben des EU KI Act in Bezug auf Datensicherheit."
        },
        {
          subheading: "3.5 Qualitätsmanagement und kontinuierliche Verbesserung (Art. 17 EU KI Act)",
          text: "Alle KI-Systeme werden regelmäßig auf Qualität, Genauigkeit und potentielle Verzerrungen geprüft. Nutzerrückmeldungen und -korrekturen werden zur kontinuierlichen Verbesserung der Modelle verwendet, unter strikter Einhaltung der Datenschutzbestimmungen. Die App dokumentiert alle Aktualisierungen und Verbesserungen der KI-Komponenten gemäß Art. 17."
        },
        {
          subheading: "3.6 Governance und Verantwortlichkeit (Art. 16, 30 EU KI Act)",
          text: "Die Bau-Structura App hat klare Verantwortlichkeiten für KI-Systeme implementiert, mit dokumentierten Prozessen für die Behandlung von technischen Problemen und Fehlern. Alle eingesetzten KI-Systeme wurden vor der Implementierung auf Konformität mit dem EU KI Act geprüft und werden kontinuierlich überwacht, um die Verantwortlichkeitsanforderungen nach Art. 16 und 30 zu erfüllen."
        },
        {
          subheading: "3.7 Registrierung und Dokumentation (Art. 51, 60 EU KI Act)",
          text: "Obwohl nicht gesetzlich erforderlich für KI-Systeme mit minimalem Risiko, führt die Bau-Structura App dennoch eine umfassende Dokumentation aller KI-Komponenten, inkl. Entscheidungsregistrierung und technische Dokumentation, die den Standards des EU KI Act entspricht. Dies als Teil unserer Verpflichtung zur Transparenz und zum verantwortungsvollen Einsatz von KI-Technologien."
        }
      ]
    },
    {
      heading: "4. Datenschutzerklärung und Nutzerrechte",
      text: "Die Bau-Structura App verarbeitet personenbezogene Daten im Einklang mit der DSGVO, dem EU Data Act und dem EU KI Act. Es werden nur die für den Betrieb notwendigen Daten erhoben, und der Zugriff auf diese Daten ist auf autorisierte Benutzer beschränkt. Benutzer haben das umfassende Recht, ihre Daten einzusehen, zu korrigieren, zu übertragen oder löschen zu lassen, sowie der Verarbeitung zu widersprechen, wie durch EU-Recht vorgeschrieben.",
      subsections: [
        {
          subheading: "4.1 Datenverarbeitung und Speicherung",
          text: "Alle Datenverarbeitungsvorgänge werden transparent dokumentiert und sind für berechtigte Nutzer nachvollziehbar. Die Speicherdauer von Daten ist auf den erforderlichen Zeitraum begrenzt, und es werden klare Löschfristen eingehalten."
        },
        {
          subheading: "4.2 Ausübung von Betroffenenrechten",
          text: "Die Bau-Structura App ermöglicht es Nutzern, ihre Rechte direkt über die Benutzeroberfläche auszuüben, mit klaren Anweisungen für die Ausübung von Rechten wie Datenzugriff, Berichtigung und Löschung."
        }
      ]
    },
    {
      heading: "5. Empfehlungen für die Nutzung",
      text: "Bei der Nutzung der KI-Funktionen der Bau-Structura App empfehlen wir, alle Vorschläge kritisch zu prüfen und wichtige Entscheidungen nicht ausschließlich auf KI-Analysen zu stützen. Die KI-Funktionen dienen als Unterstützung für fachkundige Benutzer, ersetzen aber nicht deren Expertise und Beurteilungsvermögen."
    },
    {
      heading: "6. Fazit und Kontakt",
      text: "Die Bau-Structura App ist bestrebt, alle regulatorischen Anforderungen der Europäischen Union zu erfüllen und kontinuierlich zu überwachen. Bei Fragen zur Konformität mit dem EU Data Act oder EU KI Act steht Ihnen unser Datenschutzbeauftragter unter datenschutz@bau-structura.de zur Verfügung.\n\nDieses Dokument wurde am " + currentDate + " erstellt und wird regelmäßig aktualisiert, um Änderungen in der Gesetzgebung zu berücksichtigen."
    }
  ];
  
  generateStructuredPdf(title, content, "Bau-Structura-EU-Konformitaet");
};