import path from 'path';
import fs from 'fs-extra';
import { execFile } from 'child_process';
import { promisify } from 'util';
import EPub from 'epub-gen';
import logger from '../logger';

const execFileAsync = promisify(execFile);

// Temporäres Verzeichnis für Konvertierungen sicherstellen
const tempDir = path.join(process.cwd(), 'temp', 'conversions');
fs.ensureDirSync(tempDir);

/**
 * Konvertiert Markdown zu DOCX mit Pandoc
 */
export async function convertMarkdownToDocx(
  markdownPath: string,
  outputPath: string = path.join(tempDir, `${path.basename(markdownPath, '.md')}.docx`)
): Promise<string> {
  try {
    // Pfad zu Pandoc-Binary, die mit pandoc-binary-Paket installiert wurde
    const pandocPath = require('pandoc-binary').path;
    
    // Sichere temporäres Ausgabeverzeichnis
    await fs.ensureDir(path.dirname(outputPath));

    // Führe Pandoc aus mit Argumenten für DOCX-Konvertierung
    await execFileAsync(pandocPath, [
      '-f', 'markdown',
      '-t', 'docx',
      '-o', outputPath,
      markdownPath
    ]);

    logger.info(`Markdown erfolgreich in DOCX konvertiert: ${outputPath}`);
    return outputPath;
  } catch (error: any) {
    logger.error('Fehler bei der Konvertierung von Markdown zu DOCX:', error);
    throw new Error(`Konvertierungsfehler: ${error.message}`);
  }
}

/**
 * Konvertiert Markdown zu ePub mit epub-gen
 */
export async function convertMarkdownToEpub(
  markdownPath: string,
  title: string,
  author: string = 'Bau-Structura',
  outputPath: string = path.join(tempDir, `${path.basename(markdownPath, '.md')}.epub`)
): Promise<string> {
  try {
    // Lese Markdown-Datei
    const content = await fs.readFile(markdownPath, 'utf8');
    
    // Sichere temporäres Ausgabeverzeichnis
    await fs.ensureDir(path.dirname(outputPath));

    // Erstelle ePub-Datei
    const options = {
      title: title,
      author: author,
      content: [
        {
          title: 'Benutzerhandbuch',
          data: content
        }
      ],
      cover: path.join(process.cwd(), 'public', 'favicon.ico'), // Falls vorhanden, sonst anpassen
      tempDir: tempDir
    };

    await new Promise<void>((resolve, reject) => {
      new EPub(options, outputPath)
        .promise
        .then(() => {
          logger.info(`Markdown erfolgreich in ePub konvertiert: ${outputPath}`);
          resolve();
        })
        .catch((err: any) => {
          logger.error('Fehler bei der Konvertierung von Markdown zu ePub:', err);
          reject(err);
        });
    });

    return outputPath;
  } catch (error: any) {
    logger.error('Fehler bei der Konvertierung von Markdown zu ePub:', error);
    throw new Error(`Konvertierungsfehler: ${error.message}`);
  }
}

/**
 * Bereinigt temporäre Konvertierungsdateien
 */
export async function cleanupConversionFiles(filePath: string): Promise<void> {
  try {
    await fs.remove(filePath);
    logger.debug(`Temporäre Konvertierungsdatei bereinigt: ${filePath}`);
  } catch (error: any) {
    // Fehler beim Löschen nur loggen, aber keinen Fehler werfen
    logger.warn(`Fehler beim Bereinigen temporärer Konvertierungsdatei: ${error.message}`);
  }
}