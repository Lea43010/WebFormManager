import { OpenAI } from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';

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

// OpenAI-Client erstellen
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Funktion zur KI-gestützten Analyse von Asphaltbildern
export async function analyzeAsphaltImage(imagePath: string): Promise<{
  belastungsklasse: keyof typeof belastungsklassen,
  asphalttyp: keyof typeof asphaltTypen,
  confidence: number,
  analyseDetails: string
}> {
  try {
    // Bild als Base64 einlesen
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // OpenAI Vision API abfragen
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `Du bist ein Experte für Straßenbau und Asphaltklassifizierung nach den deutschen RStO-Richtlinien. 
          Analysiere das Bild eines Asphalts und bestimme:
          1. Die wahrscheinliche Belastungsklasse gemäß RStO (Bk100, Bk32, Bk10, Bk3, Bk1, Bk0.3)
          2. Den wahrscheinlichen Asphalttyp
          3. Die Konfidenz deiner Einschätzung (0-100%)
          4. Begründe deine Entscheidung in 2-3 Sätzen`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            },
            {
              type: "text",
              text: "Analysiere dieses Asphaltbild und klassifiziere es nach RStO-Belastungsklassen. Antworte im JSON-Format mit den Feldern: belastungsklasse, asphalttyp, confidence (als Zahl zwischen 0-100), und analyseDetails."
            }
          ]
        }
      ],
      max_tokens: 800,
      response_format: { type: "json_object" }
    });
    
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Keine Antwort vom KI-Modell erhalten");
    }
    
    const result = JSON.parse(responseContent);
    
    // Ergebnisse validieren und standardisieren
    const belastungsklasse = validateBelastungsklasse(result.belastungsklasse);
    const asphalttyp = validateAsphalttyp(result.asphalttyp);
    const confidence = Math.min(Math.max(0, result.confidence), 100);
    
    return {
      belastungsklasse,
      asphalttyp,
      confidence,
      analyseDetails: result.analyseDetails || "Keine Details verfügbar"
    };
  } catch (error) {
    console.error("Fehler bei der Asphaltanalyse:", error);
    // Fallback-Ergebnisse, wenn die Analyse fehlschlägt
    return {
      belastungsklasse: "Bk3",
      asphalttyp: "Asphaltbeton (AC)",
      confidence: 30,
      analyseDetails: "Fehler bei der Analyse des Bildes. Standardwerte werden angezeigt."
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
    // OpenAI API nutzen, um ein Bild zu generieren
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Ein technisches, schematisches Diagramm eines Straßenquerschnitts für die RStO-Belastungsklasse ${belastungsklasse}. 
      Es zeigt deutlich die verschiedenen Schichten (Deckschicht, Binderschicht, Tragschicht, Frostschutzschicht) mit korrekten Dicken und Bezeichnungen. 
      Der Straßenaufbau soll für eine ${belastungsklassen[belastungsklasse].description} ausgelegt sein.
      Verwende eine klare, technische Darstellung mit Beschriftungen und Maßen. Keine Personen oder Fahrzeuge.`,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });
    
    // URL des generierten Bildes
    const imageUrl = response.data[0]?.url;
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
  } catch (error) {
    console.error("Fehler bei der Generierung des RStO-Visualisierungsbildes:", error);
    throw error;
  }
}