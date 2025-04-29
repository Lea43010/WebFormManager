import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { createReadStream } from "fs";
import { v4 as uuidv4 } from "uuid";
import { RoadDamageType, DamageSeverity } from "@shared/schema-road-damage";

// Initialisiere OpenAI API-Client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Temporärer Speicherort für Audio-Dateien
const TEMP_AUDIO_DIR = path.join(process.cwd(), "temp", "audio");

// Stelle sicher, dass das Verzeichnis existiert
if (!fs.existsSync(TEMP_AUDIO_DIR)) {
  fs.mkdirSync(TEMP_AUDIO_DIR, { recursive: true });
}

/**
 * Speichert eine Audio-Datei temporär
 * @param audioBuffer Buffer mit Audio-Daten
 * @returns Pfad zur gespeicherten Datei
 */
export async function saveAudioTemporarily(audioBuffer: Buffer): Promise<string> {
  const filename = `${uuidv4()}.webm`;
  const filePath = path.join(TEMP_AUDIO_DIR, filename);
  
  await fs.promises.writeFile(filePath, audioBuffer);
  return filePath;
}

/**
 * Bereinigt eine temporäre Audio-Datei
 * @param filePath Pfad zur Audio-Datei
 */
export async function cleanupTempAudio(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error("Fehler beim Löschen der temporären Audio-Datei:", error);
  }
}

/**
 * Transkribiert eine Audio-Datei zu Text mithilfe der OpenAI Whisper API
 * @param audioFilePath Pfad zur Audio-Datei
 * @returns Transkribierter Text
 */
export async function transcribeAudio(audioFilePath: string): Promise<string> {
  try {
    const audioReadStream = createReadStream(audioFilePath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      language: "de",
      response_format: "text",
    });
    
    return transcription;
  } catch (error) {
    console.error("Fehler bei der Transkription:", error);
    throw new Error("Die Audiotranskription konnte nicht durchgeführt werden.");
  }
}

/**
 * Analysiert einen transkribierten Text und extrahiert strukturierte Informationen zum Straßenschaden
 * @param transcription Transkribierter Text
 * @returns Strukturierte Informationen zum Straßenschaden
 */
export async function analyzeDamageText(transcription: string): Promise<{
  damageType: RoadDamageType;
  severity: DamageSeverity;
  description: string;
  recommendedAction?: string;
}> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const prompt = `
    Analysiere die folgende Beschreibung eines Straßenschadens und extrahiere die folgenden strukturierten Informationen.
    Wenn keine Informationen vorhanden sind, nutze plausible Werte basierend auf der Beschreibung.
    
    Text: "${transcription}"
    
    Extrahiere die folgenden Informationen im JSON-Format:
    1. damageType (wähle einen aus): "riss", "schlagloch", "netzriss", "verformung", "ausbruch", "abplatzung", "kantenschaden", "fugenausbruch", "abnutzung", "sonstiges"
    2. severity (wähle einen aus): "leicht", "mittel", "schwer", "kritisch"
    3. description: Eine klare, zusammenfassende Beschreibung des Schadens
    4. recommendedAction: Eine empfohlene Maßnahme zur Behebung des Schadens
    
    Antworte ausschließlich mit einem JSON-Objekt, ohne zusätzlichen Text.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || "{}");
    
    return {
      damageType: response.damageType || "sonstiges",
      severity: response.severity || "mittel",
      description: response.description || transcription,
      recommendedAction: response.recommendedAction,
    };
  } catch (error) {
    console.error("Fehler bei der Analyse des Textes:", error);
    // Fallback zu Standardwerten, wenn die Analyse fehlschlägt
    return {
      damageType: "sonstiges",
      severity: "mittel",
      description: transcription,
    };
  }
}