import * as path from 'path';
import deepai from 'deepai';
import * as fs from 'fs-extra';
import { createReadStream } from 'fs';

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
  Bk3: {
    name: 'Bk3',
    description: 'Mittlere Belastung, 0,8 bis 3 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '63cm',
    details: 'Kreisstraßen, Sammelstraßen'
  },
  Bk1: {
    name: 'Bk1',
    description: 'Geringe Belastung, 0,3 bis 0,8 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '59cm',
    details: 'Nebenstraßen, Erschließungsstraßen'
  },
  Bk0_3: {
    name: 'Bk0.3',
    description: 'Sehr geringe Belastung, unter 0,3 Mio. äquivalente 10-t-Achsübergänge',
    aufbaudicke: '55cm',
    details: 'Anliegerstraßen, Wohnstraßen'
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
    let belastungsklasse: keyof typeof belastungsklassen = "Bk3"; // Mittlere Belastung als Standard
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
        belastungsklasse = "Bk3";
        confidence = 65;
      }
    } else if (keywords.includes("residential") || keywords.includes("neighborhood")) {
      belastungsklasse = "Bk1";
      confidence = 70;
    } else if (keywords.includes("path") || keywords.includes("walkway") || keywords.includes("small")) {
      belastungsklasse = "Bk0_3";
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
      belastungsklasse: "Bk3",
      asphalttyp: "Asphaltbeton (AC)",
      confidence: 30,
      analyseDetails: "Fehler bei der Analyse des Bildes mit DeepAI. Standardwerte werden angezeigt."
    };
  }
}

// Hilfsfunktion zur Validierung der Belastungsklasse
function validateBelastungsklasse(input: string): keyof typeof belastungsklassen {
  const normalized = input.replace(/[\s.-]/g, '').toUpperCase();
  
  // Mapping für verschiedene Schreibweisen
  const mapping: Record<string, keyof typeof belastungsklassen> = {
    'BK100': 'Bk100',
    'BK32': 'Bk32',
    'BK10': 'Bk10',
    'BK3': 'Bk3',
    'BK1': 'Bk1',
    'BK03': 'Bk0_3',
    'BK0.3': 'Bk0_3'
  };
  
  return mapping[normalized] || 'Bk3'; // Default zu mittlerer Belastung
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
      // Wenn die API-Generierung fehlschlägt, verwenden wir statische Bilder als Fallback
      return useStaticVisualization(belastungsklasse, outputPath);
    }
  } catch (error) {
    console.error("Fehler bei der Generierung des RStO-Visualisierungsbildes:", error);
    throw error;
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
      // SVG-Datei kopieren
      await fs.copyFile(staticSvgPath, outputPath);
      return outputPath;
    } else {
      // Wenn keine spezifische SVG-Datei gefunden wurde, nehmen wir Bk3 als Standard
      const defaultSvgPath = path.join(
        process.cwd(),
        'public',
        'static',
        'rsto_visualizations',
        'Bk3.svg'
      );
      
      if (await fs.pathExists(defaultSvgPath)) {
        await fs.copyFile(defaultSvgPath, outputPath);
        return outputPath;
      } else {
        throw new Error("Keine statische Visualisierung verfügbar");
      }
    }
  } catch (error) {
    console.error("Fehler beim Verwenden der statischen Visualisierung:", error);
    throw error;
  }
}