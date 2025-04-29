import fs from "fs";
import path from "path";
import { promisify } from "util";
import { randomUUID } from "crypto";
import OpenAI from "openai";

// Prüfen, ob der OpenAI API-Schlüssel vorhanden ist
if (!process.env.OPENAI_API_KEY) {
  console.warn("[Warnung] OPENAI_API_KEY ist nicht gesetzt. Spracherkennung wird nicht funktionieren.");
}

// OpenAI Instanz erstellen
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Verzeichnis für temporäre Audiodateien
const tempDir = path.join(process.cwd(), "temp", "audio");

// Sicherstellen, dass das Temp-Verzeichnis existiert
try {
  fs.mkdirSync(tempDir, { recursive: true });
} catch (error) {
  console.error("Fehler beim Erstellen des temporären Verzeichnisses:", error);
}

// Promisify für asynchrone Dateioperationen
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

/**
 * Schnittstelle für das Ergebnis der Sprachanalyse
 */
export interface SpeechAnalysisResult {
  transcription: string;
  analyzedData: {
    damageType?: string;
    severity?: string;
    position?: string;
    description?: string;
    recommendedAction?: string;
    estimatedCost?: number;
  };
  confidence: number;
}

/**
 * Speichert eine Audiodatei temporär
 */
export async function saveTempAudioFile(audioBuffer: Buffer): Promise<string> {
  const filename = `${randomUUID()}.webm`;
  const filepath = path.join(tempDir, filename);
  
  await writeFileAsync(filepath, audioBuffer);
  return filepath;
}

/**
 * Transkribiert eine Audiodatei zu Text mit OpenAI Whisper
 */
export async function transcribeAudio(audioFilePath: string): Promise<string> {
  try {
    const readStream = fs.createReadStream(audioFilePath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: readStream,
      model: "whisper-1",
      language: "de",
    });
    
    return transcription.text;
  } catch (error) {
    console.error("Fehler bei der Transkription:", error);
    throw new Error("Spracherkennung fehlgeschlagen");
  }
}

/**
 * Analysiert den transkribierten Text und extrahiert relevante Informationen
 */
export async function analyzeTranscription(transcription: string): Promise<SpeechAnalysisResult> {
  try {
    // Stellen Sie sicher, dass der transcription-Text nicht leer ist
    if (!transcription || transcription.trim() === "") {
      throw new Error("Die Transkription ist leer");
    }
    
    // Systemanweisung für GPT, um Straßenschäden zu analysieren
    const systemPrompt = `
    Du bist ein Experte für Straßenbau und Straßenschäden. Analysiere die folgende Beschreibung eines Straßenschadens und extrahiere alle relevanten Informationen.
    Rückgabeformat: JSON mit folgenden Eigenschaften:
    - damageType: einer der folgenden Werte: "riss", "schlagloch", "netzriss", "verformung", "ausbruch", "abplatzung", "kantenschaden", "fugenausbruch", "abnutzung", "sonstiges"
    - severity: einer der folgenden Werte: "leicht", "mittel", "schwer", "kritisch"
    - position: Standort des Schadens (wenn angegeben)
    - description: detaillierte Beschreibung des Schadens
    - recommendedAction: empfohlene Maßnahmen zur Behebung (wenn ableitbar)
    - estimatedCost: geschätzte Reparaturkosten in Euro (wenn ableitbar, sonst null)
    - confidence: Zahl zwischen 0 und 1, die das Vertrauen in die Analyse angibt

    Falls ein Wert nicht aus dem Text abgeleitet werden kann, setze ihn auf null.
    Antworte NUR mit dem JSON-Objekt ohne weitere Erklärungen.
    `;
    
    // GPT-Anfrage erstellen
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Fortgeschrittenes Modell für bessere Analyse
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcription },
      ],
      temperature: 0.3, // Niedrige Temperatur für deterministischere Antworten
      response_format: { type: "json_object" }, // Format als JSON anfordern
    });
    
    // Antwort extrahieren und parsen
    const responseText = completion.choices[0].message.content;
    
    if (!responseText) {
      throw new Error("Keine Antwort von der KI erhalten");
    }
    
    const result = JSON.parse(responseText);
    
    // Rückgabeformat zusammenstellen
    return {
      transcription,
      analyzedData: {
        damageType: result.damageType || "sonstiges",
        severity: result.severity || "mittel",
        position: result.position || null,
        description: result.description || transcription,
        recommendedAction: result.recommendedAction || null,
        estimatedCost: result.estimatedCost || null,
      },
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error("Fehler bei der Analyse der Transkription:", error);
    
    // Fallback-Rückgabe mit der Transkription als Beschreibung
    return {
      transcription,
      analyzedData: {
        damageType: "sonstiges",
        severity: "mittel",
        description: transcription,
      },
      confidence: 0.1,
    };
  } finally {
    // Hier keine Bereinigung, da wir nur mit Text arbeiten
  }
}

/**
 * Prozessiert eine Audiodatei und gibt die analysierte Spracherkennung zurück
 */
export async function processAudio(audioFilePath: string): Promise<SpeechAnalysisResult> {
  try {
    // Audiodatei transkribieren
    const transcription = await transcribeAudio(audioFilePath);
    
    // Transkription analysieren
    const analysis = await analyzeTranscription(transcription);
    
    return analysis;
  } catch (error) {
    console.error("Fehler bei der Audioverarbeitung:", error);
    throw new Error("Audioverarbeitung fehlgeschlagen");
  } finally {
    // Temporäre Datei bereinigen
    try {
      await unlinkAsync(audioFilePath);
    } catch (cleanupError) {
      console.error("Fehler beim Bereinigen der temporären Datei:", cleanupError);
    }
  }
}