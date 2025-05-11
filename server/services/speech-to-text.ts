import { Express, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import util from "util";
import logger from "../logger";

// Promisify exec
const execAsync = util.promisify(exec);

// Konfiguration für die Spracherkennung
const tempDir = path.join(process.cwd(), "temp");

// Stellen Sie sicher, dass das temporäre Verzeichnis existiert
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Multer-Konfiguration für den Audioempfang
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `speech-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
}).single('audio');

// Funktion zum Konvertieren der Audio-Datei von WebM zu WAV
async function convertWebmToWav(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(path.extname(inputPath), '.wav');
  
  try {
    logger.info(`Versuche Audiokonvertierung von ${inputPath} zu ${outputPath}`);
    
    // Prüfen, ob ffmpeg installiert ist, ohne es auszuführen
    try {
      await execAsync(`which ffmpeg`);
    } catch (error: unknown) {
      logger.warn(`ffmpeg wurde nicht gefunden: ${error}`);
      // Wenn ffmpeg nicht gefunden wird, geben wir den ursprünglichen Pfad zurück
      return inputPath;
    }
    
    // ffmpeg ist installiert, Konvertierung versuchen
    await execAsync(`ffmpeg -i ${inputPath} -acodec pcm_s16le -ar 16000 -ac 1 ${outputPath}`);
    logger.info(`Audiokonvertierung erfolgreich: ${outputPath}`);
    return outputPath;
  } catch (error: unknown) {
    logger.error(`Fehler bei der Audiokonvertierung: ${error}`);
    logger.info(`Verwende original Datei statt Konvertierung: ${inputPath}`);
    // Bei Fehlern geben wir den ursprünglichen Pfad zurück statt einen Fehler zu werfen
    return inputPath;
  }
}

// Funktion zur Spracherkennung (hier mit Whisper-Modell über die OpenAI API)
async function transcribeAudio(audioPath: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY ist nicht gesetzt');
  }

  try {
    // Wir verwenden die OpenAI API, um die Audiodatei zu transkribieren
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const audioFile = fs.createReadStream(audioPath);
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "de", // Deutsch als Sprache festlegen
      response_format: "json"
    });

    return response.text;
  } catch (error: unknown) {
    logger.error(`Fehler bei der Spracherkennung: ${error}`);
    throw new Error('Fehler bei der Spracherkennung');
  }
}

// Bereinigen der temporären Dateien
function cleanupTempFiles(files: string[]) {
  files.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (error) {
      logger.warn(`Fehler beim Bereinigen temporärer Dateien: ${error}`);
    }
  });
}

// API-Route für Spracherkennung
export function setupSpeechToTextRoute(app: Express) {
  app.post('/api/speech-to-text', (req: Request, res: Response) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'Fehler beim Hochladen der Audiodatei', details: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Keine Audiodatei gefunden' });
      }

      const filesToCleanup: string[] = [req.file.path];

      try {
        let audioPath = req.file.path;
        
        // Wenn es sich um eine webm-Datei handelt, konvertieren wir sie zu WAV
        if (req.file.mimetype === 'audio/webm' || path.extname(req.file.path) === '.webm') {
          const wavPath = await convertWebmToWav(req.file.path);
          filesToCleanup.push(wavPath);
          audioPath = wavPath;
        }

        // Spracherkennung durchführen
        const text = await transcribeAudio(audioPath);

        // Erfolgreiche Antwort
        res.json({ text });
      } catch (error: any) {
        logger.error(`Fehler bei der Sprachverarbeitung: ${error}`);
        res.status(500).json({ 
          error: 'Fehler bei der Sprachverarbeitung', 
          details: error.message 
        });
      } finally {
        // Temporäre Dateien bereinigen
        cleanupTempFiles(filesToCleanup);
      }
    });
  });
}