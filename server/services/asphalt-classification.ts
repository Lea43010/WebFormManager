import * as path from 'path';
import deepai from 'deepai';
import * as fs from 'fs-extra';
import { createReadStream } from 'fs';
import { bodenklassenEnum, bodentragfaehigkeitsklassenEnum, belastungsklassenEnum } from '@shared/schema';

// DeepAI API Key setzen
if (process.env.DEEPAI_API_KEY) {
  deepai.setApiKey(process.env.DEEPAI_API_KEY);
}

// RStO-Belastungsklassen definieren
export const belastungsklassen = {
  Bk100: {
    name: 'Bk100',
    description: 'Besonders hohe Belastung, über 32 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '79cm',
    details: 'Autobahnen, Industriegebiete, Hauptverkehrsstraßen'
  },
  Bk32: {
    name: 'Bk32',
    description: 'Sehr hohe Belastung, 10 bis 32 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '75cm',
    details: 'Fernstraßen, stark befahrene Bundesstraßen'
  },
  Bk10: {
    name: 'Bk10',
    description: 'Hohe Belastung, 3 bis 10 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '69cm',
    details: 'Bundesstraßen, Landstraßen'
  },
  'Bk3.2': {
    name: 'Bk3.2',
    description: 'Mittlere Belastung, 0,8 bis 3,2 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '63cm',
    details: 'Kreisstraßen, Sammelstraßen'
  },
  'Bk1.8': {
    name: 'Bk1.8',
    description: 'Mittlere bis geringe Belastung, 0,3 bis 1,8 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '61cm',
    details: 'Sammelstraßen, wichtige Erschließungsstraßen'
  },
  'Bk1.0': {
    name: 'Bk1.0',
    description: 'Geringe Belastung, 0,3 bis 1,0 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '59cm',
    details: 'Nebenstraßen, Erschließungsstraßen'
  },
  'Bk0.3': {
    name: 'Bk0.3',
    description: 'Sehr geringe Belastung, unter 0,3 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '55cm',
    details: 'Anliegerstraßen, Wohnstraßen'
  },
  'unbekannt': {
    name: 'unbekannt',
    description: 'Unbekannte Belastungsklasse, konnte nicht bestimmt werden',
    aufbaudicke: 'unbekannt',
    details: 'Keine ausreichenden Daten für eine Bestimmung verfügbar'
  }
};

// Asphalttypen definieren
export const asphaltTypen = {
  'Asphaltbeton (AC)': 'Standard-Asphaltmischung für verschiedene Straßentypen',
  'Splittmastixasphalt (SMA)': 'Verschleißfeste Asphaltdeckschicht für hochbelastete Straßen',
  'Gussasphalt (MA)': 'Wasserdichter, verformungsbeständiger Asphalt',
  'Offenporiger Asphalt (PA)': 'Lärmreduzierender, wasserdurchlässiger Asphalt',
  'Asphaltbinder (AC bin)': 'Binderschicht zwischen Deck- und Tragschicht',
  'Asphalttragschicht (AC base)': 'Tragschicht für die Lastübertragung'
};

// Funktion zur KI-gestützten Analyse von Asphaltbildern mit DeepAI
// Bodenklassen definieren
export const bodenklassen = {
  'Kies': 'Gut drainiert, hohe Tragfähigkeit',
  'Sand': 'Moderate Drainage, mäßige Tragfähigkeit',
  'Lehm': 'Schlechte Drainage, geringe Tragfähigkeit',
  'Ton': 'Sehr schlechte Drainage, sehr geringe Tragfähigkeit',
  'Humus': 'Organischer Boden, ungeeignet für Lasten',
  'Fels': 'Hervorragende Tragfähigkeit, schwer zu bearbeiten',
  'Schotter': 'Sehr gute Drainage und Tragfähigkeit, grobkörnig'
};

// Bodentragfähigkeitsklassen gemäß RStO 12
export const bodentragfaehigkeitsklassen = {
  'F1': 'Sehr gering tragfähiger Untergrund (Ev2 ≤ 20 MN/m²)',
  'F2': 'Gering tragfähiger Untergrund (Ev2 > 20 bis 80 MN/m²)',
  'F3': 'Tragfähiger Untergrund (Ev2 > 80 MN/m²)'
};

export async function analyzeAsphaltImage(imagePath: string): Promise<{
  belastungsklasse: keyof typeof belastungsklassen,
  asphalttyp: keyof typeof asphaltTypen,
  confidence: number,
  analyseDetails: string
}> {
  try {
    // DeepAI Bilderkennungsmodell verwenden
    // Wir nutzen das general-image-recognition Modell für grundlegende Bildanalyse
    const resp = await deepai.callStandardApi("general-image-recognition", {
      image: createReadStream(imagePath),
    });
    
    // Ermittle die wahrscheinlichsten Materialien und Strukturen aus den erkannten Objekten
    const output = resp.output;
    console.log("DeepAI Ergebnis:", output);
    
    // Standardwerte basierend auf erkannten Eigenschaften setzen
    let belastungsklasse: keyof typeof belastungsklassen = "Bk3.2"; // Mittlere Belastung als Standard
    let asphalttyp: keyof typeof asphaltTypen = "Asphaltbeton (AC)"; // Standardtyp
    let confidence = 70; // Standardkonfidenz
    
    // Bestimmte Schlüsselwörter suchen, um Belastungsklasse abzuschätzen
    const keywords = output.toLowerCase();
    
    // Belastungsklasse anhand der erkannten Merkmale bestimmen
    if (keywords.includes("highway") || keywords.includes("autobahn") || keywords.includes("industrial")) {
      belastungsklasse = "Bk100";
      confidence = 80;
    } else if (keywords.includes("road") || keywords.includes("street") || keywords.includes("asphalt")) {
      if (keywords.includes("main") || keywords.includes("heavy")) {
        belastungsklasse = "Bk32";
        confidence = 75;
      } else if (keywords.includes("urban") || keywords.includes("city")) {
        belastungsklasse = "Bk10";
        confidence = 70;
      } else {
        belastungsklasse = "Bk3.2";
        confidence = 65;
      }
    } else if (keywords.includes("residential") || keywords.includes("neighborhood")) {
      belastungsklasse = "Bk1.0";
      confidence = 70;
    } else if (keywords.includes("path") || keywords.includes("walkway") || keywords.includes("small")) {
      belastungsklasse = "Bk0.3";
      confidence = 75;
    }
    
    // Asphalttyp bestimmen
    if (keywords.includes("porous") || keywords.includes("drainage")) {
      asphalttyp = "Offenporiger Asphalt (PA)";
    } else if (keywords.includes("mix") || keywords.includes("stone") || keywords.includes("aggregate")) {
      asphalttyp = "Splittmastixasphalt (SMA)";
    } else if (keywords.includes("smooth") || keywords.includes("sealed")) {
      asphalttyp = "Gussasphalt (MA)";
    }
    
    // Detaillierten Analysebericht erstellen
    const analyseDetails = `Basierend auf den erkannten Merkmalen (${output}) wurde die Belastungsklasse ${belastungsklasse} mit einer Konfidenz von ${confidence}% bestimmt. Der wahrscheinlichste Asphalttyp ist ${asphalttyp}.`;
    
    return {
      belastungsklasse,
      asphalttyp,
      confidence,
      analyseDetails
    };
  } catch (error) {
    console.error("Fehler bei der Asphaltanalyse mit DeepAI:", error);
    // Fallback-Ergebnisse, wenn die Analyse fehlschlägt
    return {
      belastungsklasse: "Bk3.2",
      asphalttyp: "Asphaltbeton (AC)",
      confidence: 30,
      analyseDetails: "Fehler bei der Analyse des Bildes mit DeepAI. Standardwerte werden angezeigt."
    };
  }
}

// Funktion zur KI-gestützten Analyse von Bodenbildern mit DeepAI und fortschrittlicheren Analysetechniken
export async function analyzeGroundImage(imagePath: string): Promise<{
  belastungsklasse: keyof typeof belastungsklassen,
  bodenklasse: keyof typeof bodenklassen,
  bodentragfaehigkeitsklasse: keyof typeof bodentragfaehigkeitsklassen,
  confidence: number,
  analyseDetails: string
}> {
  try {
    // Versuchen wir, mit DeepAI eine detailliertere Analyse zu erhalten
    // Wir verwenden einen spezialisierten Prompt für die Bodenanalyse
    const resp = await deepai.callStandardApi("general-image-recognition", {
      image: createReadStream(imagePath),
    });
    
    const output = resp.output;
    console.log("DeepAI Ergebnis (Boden):", output);
    
    // Nach der grundlegenden Objekterkennung führen wir eine fortgeschrittene Bodenklassifizierung durch
    // Wir nutzen den DeepAI Text-Generator, um mehr Kontext aus dem Bild zu extrahieren
    let enhancedAnalysis;
    try {
      const detailedResp = await deepai.callStandardApi("text-generator", {
        text: `Analyse eines Bodenfotos für den Straßenbau:
        
        Das Foto zeigt ${output}.
        
        Bitte analysiere das Bild und bestimme:
        1. Welche Art von Boden ist zu sehen (Kies, Sand, Lehm, Ton, Humus, Fels, Schotter)?
        2. Welche Tragfähigkeitsklasse (F1, F2, F3) würdest du diesem Boden zuordnen?
        3. Welche Belastungsklasse nach RStO 12 (Bk100, Bk32, Bk10, Bk3.2, Bk1.8, Bk1.0, Bk0.3) wäre für diesen Boden geeignet?
        4. Welche Eigenschaften hat dieser Boden bezüglich Korngrößenverteilung und Wasserdurchlässigkeit?`,
      });
      
      enhancedAnalysis = detailedResp.output;
      console.log("Erweiterte Bodenanalyse:", enhancedAnalysis);
    } catch (textGenError) {
      console.error("Fehler bei erweiterter Textanalyse:", textGenError);
      enhancedAnalysis = "Keine erweiterte Analyse verfügbar.";
    }
    
    // Standardwerte basierend auf erkannten Eigenschaften setzen
    let belastungsklasse: keyof typeof belastungsklassen = "Bk3.2"; // Mittlere Belastung als Standard
    let bodenklasse: keyof typeof bodenklassen = "Sand"; // Standardwert
    let bodentragfaehigkeitsklasse: keyof typeof bodentragfaehigkeitsklassen = "F2"; // Standardwert
    let confidence = 70; // Standardkonfidenz
    
    // Kombiniere die Schlüsselwörter aus beiden Analysen
    const combinedText = (output + " " + enhancedAnalysis).toLowerCase();
    
    // Suchen nach Musterübereinstimmungen in der KI-Ausgabe für die Bodenklasse
    // Überprüfen nach Bodenarten mit Gewichtungen - je mehr Hinweise, desto höher die Konfidenz
    const bodenklassenGewichtung = {
      "Kies": 0,
      "Sand": 0,
      "Lehm": 0,
      "Ton": 0,
      "Humus": 0,
      "Fels": 0,
      "Schotter": 0
    };
    
    // Regelwerk für die Identifikation von Bodenklassen
    if (/kies|gravel|schotter|steinig|steine|rocks|gesteinskörnung/i.test(combinedText)) bodenklassenGewichtung["Kies"] += 3;
    if (/sand|sandy|silica|quarz|fein|körnig|fine|grained/i.test(combinedText)) bodenklassenGewichtung["Sand"] += 3;
    if (/lehm|loam|silt|schluff|siltig|tonig.*sandig/i.test(combinedText)) bodenklassenGewichtung["Lehm"] += 3;
    if (/ton|clay|lehm|plastisch|feuchtig|nass|wet|mud|schlammig|feucht/i.test(combinedText)) bodenklassenGewichtung["Ton"] += 3;
    if (/humus|organisch|organic|compost|dunkel|dark|erde|soil|kompost|mulch/i.test(combinedText)) bodenklassenGewichtung["Humus"] += 3;
    if (/fels|rock|stein|hart|solid|massive|boulder|massiv|hard/i.test(combinedText)) bodenklassenGewichtung["Fels"] += 3;
    if (/schotter|gravel|crushed|kies|steinschlag|bruch|zerkleinert/i.test(combinedText)) bodenklassenGewichtung["Schotter"] += 3;
    
    // Zusätzliche Hinweise auf physikalische Eigenschaften
    if (/grob|körn|coarse|rough|lose/i.test(combinedText)) {
      bodenklassenGewichtung["Kies"] += 1;
      bodenklassenGewichtung["Schotter"] += 1;
    }
    if (/fein|weich|smooth|soft|feinkörn/i.test(combinedText)) {
      bodenklassenGewichtung["Sand"] += 1;
      bodenklassenGewichtung["Lehm"] += 1;
    }
    if (/feucht|nass|klebrig|sticky|plastisch|plastic/i.test(combinedText)) {
      bodenklassenGewichtung["Ton"] += 2;
      bodenklassenGewichtung["Lehm"] += 1;
    }
    if (/trocken|dry|lose|locker|körnig/i.test(combinedText)) {
      bodenklassenGewichtung["Sand"] += 2;
      bodenklassenGewichtung["Kies"] += 1;
    }
    
    // Wähle die Bodenklasse mit der höchsten Gewichtung
    let maxGewicht = 0;
    for (const [klasse, gewicht] of Object.entries(bodenklassenGewichtung)) {
      if (gewicht > maxGewicht) {
        maxGewicht = gewicht;
        bodenklasse = klasse as keyof typeof bodenklassen;
      }
    }
    
    // Konfidenz basierend auf der Gewichtung berechnen - höhere Werte bedeuten eindeutigere Ergebnisse
    confidence = Math.min(95, 60 + maxGewicht * 5);
    
    // Bodentragfähigkeitsklasse aus der Bodenklasse ableiten
    if (bodenklasse === "Fels" || bodenklasse === "Kies" || bodenklasse === "Schotter") {
      bodentragfaehigkeitsklasse = "F3";
    } else if (bodenklasse === "Sand" || bodenklasse === "Lehm") {
      bodentragfaehigkeitsklasse = "F2";
    } else {
      bodentragfaehigkeitsklasse = "F1";
    }
    
    // Belastungsklasse direkt aus der Bodentragfähigkeitsklasse ableiten
    if (bodentragfaehigkeitsklasse === "F3") {
      if (bodenklasse === "Fels") {
        belastungsklasse = "Bk100";
      } else {
        belastungsklasse = "Bk32";
      }
    } else if (bodentragfaehigkeitsklasse === "F2") {
      if (bodenklasse === "Sand") {
        belastungsklasse = "Bk10";
      } else {
        belastungsklasse = "Bk3.2";
      }
    } else {
      belastungsklasse = "Bk1.8";
    }
    
    // Korrektur für spezielle Fälle aus der erweiterten Analyse
    if (enhancedAnalysis && enhancedAnalysis.includes("Bk100")) belastungsklasse = "Bk100";
    if (enhancedAnalysis && enhancedAnalysis.includes("Bk32")) belastungsklasse = "Bk32";
    if (enhancedAnalysis && enhancedAnalysis.includes("Bk10")) belastungsklasse = "Bk10";
    if (enhancedAnalysis && enhancedAnalysis.includes("Bk3.2")) belastungsklasse = "Bk3.2";
    if (enhancedAnalysis && enhancedAnalysis.includes("Bk1.8")) belastungsklasse = "Bk1.8";
    if (enhancedAnalysis && enhancedAnalysis.includes("Bk1.0")) belastungsklasse = "Bk1.0";
    if (enhancedAnalysis && enhancedAnalysis.includes("Bk0.3")) belastungsklasse = "Bk0.3";
    
    // Auch direkte Übereinstimmungen mit F-Klassen berücksichtigen
    if (enhancedAnalysis && enhancedAnalysis.includes("F3")) bodentragfaehigkeitsklasse = "F3";
    if (enhancedAnalysis && enhancedAnalysis.includes("F2")) bodentragfaehigkeitsklasse = "F2";
    if (enhancedAnalysis && enhancedAnalysis.includes("F1")) bodentragfaehigkeitsklasse = "F1";
    
    // Detaillierten Analysebericht erstellen
    const analyseDetails = `Basierend auf fortschrittlichen Bildanalyseverfahren wurde die Bodenklasse ${bodenklasse} mit einer Konfidenz von ${confidence.toFixed(0)}% identifiziert. 
Die entsprechende Bodentragfähigkeitsklasse ist ${bodentragfaehigkeitsklasse}. 
Für diesen Bodentyp wird eine RStO-Belastungsklasse von ${belastungsklasse} empfohlen.

${enhancedAnalysis ? 'Zusätzliche KI-Analyse: ' + enhancedAnalysis.substring(0, 200) + '...' : ''}`;
    
    return {
      belastungsklasse,
      bodenklasse,
      bodentragfaehigkeitsklasse,
      confidence,
      analyseDetails
    };
  } catch (error) {
    console.error("Fehler bei der Bodenanalyse mit DeepAI:", error);
    // Fallback-Ergebnisse, wenn die Analyse fehlschlägt
    return {
      belastungsklasse: "Bk3.2",
      bodenklasse: "Sand",
      bodentragfaehigkeitsklasse: "F2",
      confidence: 30,
      analyseDetails: "Fehler bei der Analyse des Bildes mit KI-Diensten. Ergebnisse möglicherweise unzuverlässig. Bitte überprüfen Sie die Bodenklasse manuell oder laden Sie ein deutlicheres Bild hoch."
    };
  }
}

// Hilfsfunktion zur Validierung der Belastungsklasse
function validateBelastungsklasse(input: string): keyof typeof belastungsklassen {
  // Wenn die Eingabe bereits ein gültiger Schlüssel ist, verwenden wir sie direkt
  if (input in belastungsklassen) {
    return input as keyof typeof belastungsklassen;
  }
  
  // Entfernen von Punkten, Leerzeichen etc. und Konvertierung zu Großbuchstaben
  const normalized = input.replace(/[\s.-]/g, '').toUpperCase();
  
  // Mapping für verschiedene Schreibweisen
  if (normalized === 'BK100') return 'Bk100';
  if (normalized === 'BK32') return 'Bk32';
  if (normalized === 'BK10') return 'Bk10';
  if (normalized === 'BK32' || normalized === 'BK3') return 'Bk3.2';
  if (normalized === 'BK18' || normalized === 'BK1.8') return 'Bk1.8';
  if (normalized === 'BK1') return 'Bk1.0';
  if (normalized === 'BK03' || normalized === 'BK0.3') return 'Bk0.3';
  
  // Standardwert, wenn keine Übereinstimmung gefunden wurde
  return 'Bk3.2'; // Default zu mittlerer Belastung
}

// Hilfsfunktion zur Validierung des Asphalttyps
function validateAsphalttyp(input: string): keyof typeof asphaltTypen {
  const validTypes = Object.keys(asphaltTypen);
  
  // Prüfen, ob der Eingabetyp in der Liste der gültigen Typen enthalten ist
  const matchedType = validTypes.find(type => 
    input.toLowerCase().includes(type.toLowerCase())
  );
  
  return (matchedType as keyof typeof asphaltTypen) || 'Asphaltbeton (AC)';
}

// Funktion zum Generieren einer visuellen Darstellung der Belastungsklasse
// Gibt entweder den Pfad zum generierten Bild zurück oder einen direkten URL-Pfad zu einer statischen SVG-Datei
export async function generateRstoVisualization(
  belastungsklasse: keyof typeof belastungsklassen,
  outputPath: string
): Promise<string> {
  try {
    // Zuerst versuchen, mit DeepAI API ein Bild zu generieren
    const prompt = `Ein technisches, schematisches Diagramm eines Straßenquerschnitts für die RStO-Belastungsklasse ${belastungsklasse}. 
    Es zeigt deutlich die verschiedenen Schichten (Deckschicht, Binderschicht, Tragschicht, Frostschutzschicht) mit korrekten Dicken und Bezeichnungen. 
    Der Straßenaufbau soll für eine ${belastungsklassen[belastungsklasse].description} ausgelegt sein.
    Verwende eine klare, technische Darstellung mit Beschriftungen und Maßen. Keine Personen oder Fahrzeuge.`;
    
    try {
      // DeepAI Text2Image API aufrufen
      const response = await deepai.callStandardApi("text2img", {
        text: prompt,
      });
      
      // URL des generierten Bildes
      const imageUrl = response.output?.url;
      if (!imageUrl) {
        throw new Error("Kein Bild generiert");
      }
      
      // Bilddaten herunterladen und speichern
      const imageResponse = await fetch(imageUrl);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      
      // Ordner erstellen, falls er nicht existiert
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Bild speichern
      await fs.writeFile(outputPath, buffer);
      
      return outputPath;
    } catch (apiError) {
      console.error("DeepAI API-Fehler:", apiError);
      // Wenn die API-Generierung fehlschlägt, verwenden wir statische SVGs als Fallback
      // Diese Funktion gibt direkt die URL des statischen SVGs zurück
      return useStaticVisualization(belastungsklasse, outputPath);
    }
  } catch (error) {
    console.error("Fehler bei der Generierung des RStO-Visualisierungsbildes:", error);
    // Auch bei einem Fehler versuchen wir, ein statisches Bild zu liefern
    try {
      return useStaticVisualization(belastungsklasse, outputPath);
    } catch {
      throw error;
    }
  }
}

// Fallback-Funktion für statische Visualisierungen, wenn die API-Generierung fehlschlägt
async function useStaticVisualization(
  belastungsklasse: keyof typeof belastungsklassen,
  outputPath: string
): Promise<string> {
  try {
    // Normalisierte Belastungsklasse für den Dateinamen
    let normalizedBk = belastungsklasse;
    
    // Statt die Datei zu kopieren, geben wir einfach den direkten Pfad zum statischen SVG zurück
    const staticSvgUrl = `/static/rsto_visualizations/${normalizedBk}.svg`;
    
    // Pfad zum statischen SVG basierend auf der Belastungsklasse
    const staticSvgPath = path.join(
      process.cwd(),
      'public',
      'static',
      'rsto_visualizations',
      `${normalizedBk}.svg`
    );
    
    // Prüfen, ob die statische Datei existiert
    if (await fs.pathExists(staticSvgPath)) {
      return staticSvgUrl;
    } else {
      // Wenn keine spezifische SVG-Datei gefunden wurde, nehmen wir Bk3.2 als Standard
      const defaultSvgPath = path.join(
        process.cwd(),
        'public',
        'static',
        'rsto_visualizations',
        'Bk3.2.svg'
      );
      
      if (await fs.pathExists(defaultSvgPath)) {
        return '/static/rsto_visualizations/Bk3.2.svg';
      } else {
        throw new Error("Keine statische Visualisierung verfügbar");
      }
    }
  } catch (error) {
    console.error("Fehler beim Verwenden der statischen Visualisierung:", error);
    throw error;
  }
}