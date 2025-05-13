/**
 * Dienstprogramm für erweiterte Dateioperationen
 * Insbesondere für die Suche nach Dateien in verschiedenen Pfaden
 */

import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Sucht eine Datei in verschiedenen möglichen Pfaden
 * @param originalPath Der ursprüngliche Dateipfad
 * @param webpPath Optional: WebP-Pfad als Alternative
 * @returns Der gefundene Dateipfad oder null wenn keine Datei gefunden wurde
 */
export async function findFile(originalPath: string, webpPath?: string | null): Promise<string | null> {
  // Versuche zuerst den ursprünglichen Pfad
  try {
    const exists = await fs.pathExists(originalPath);
    if (exists) {
      console.log(`Datei am Original-Pfad gefunden: ${originalPath}`);
      return originalPath;
    }
  } catch (error) {
    console.error(`Fehler beim Prüfen des originalen Pfads (${originalPath}):`, error);
  }

  // Extrahiere den Dateinamen aus dem Pfad
  const fileName = path.basename(originalPath);
  
  // Array aller möglichen Pfadvarianten
  const alternativePaths = [
    path.join(process.cwd(), "uploads", fileName),       // Absoluter Pfad im aktuellen Arbeitsverzeichnis
    path.join("uploads", fileName),                      // Relativer Pfad zum Arbeitsverzeichnis
    path.join("./uploads", fileName),                    // Expliziter relativer Pfad
    path.join(__dirname, "../uploads", fileName),        // Relativer Pfad zum routes.ts-Verzeichnis
    path.join("public/uploads", fileName),               // Für den Fall, dass es im öffentlichen Verzeichnis liegt
    fileName                                             // Nur der Dateiname selbst
  ];
  
  // Systematisch alle Pfade durchprobieren
  for (const altPath of alternativePaths) {
    try {
      const exists = await fs.pathExists(altPath);
      if (exists) {
        console.log(`Datei an alternativem Pfad gefunden: ${altPath}`);
        return altPath;
      }
    } catch (error) {
      console.error(`Fehler beim Prüfen des alternativen Pfads (${altPath}):`, error);
    }
  }
  
  // Wenn die Originalversion nicht gefunden wurde und ein WebP-Pfad existiert, auch diesen prüfen
  if (webpPath) {
    try {
      const exists = await fs.pathExists(webpPath);
      if (exists) {
        console.log(`Original nicht gefunden, aber WebP-Version existiert: ${webpPath}`);
        return webpPath;
      }
    } catch (error) {
      console.error(`Fehler beim Prüfen des WebP-Pfads (${webpPath}):`, error);
    }
    
    // Auch für WebP alle alternativen Pfade prüfen
    const webpFileName = path.basename(webpPath);
    for (const altPath of alternativePaths.map(p => p.replace(fileName, webpFileName))) {
      try {
        const exists = await fs.pathExists(altPath);
        if (exists) {
          console.log(`WebP-Version an alternativem Pfad gefunden: ${altPath}`);
          return altPath;
        }
      } catch (error) {
        console.error(`Fehler beim Prüfen des WebP-Alternativen Pfads (${altPath}):`, error);
      }
    }
  }
  
  // Keine Datei gefunden
  console.error(`Datei konnte unter keinem Pfad gefunden werden.`);
  return null;
}

/**
 * Erstellt die Verzeichnisstruktur für eine neue Datei
 * @param filePath Der Pfad, in dem die Datei gespeichert werden soll
 */
export async function ensureUploadDirectories(filePath: string): Promise<void> {
  const dirPath = path.dirname(filePath);
  await fs.ensureDir(dirPath);
  
  // Stelle sicher, dass auch Unterverzeichnisse wie 'thumbnails' und 'optimized' existieren
  if (dirPath.includes('uploads')) {
    await fs.ensureDir(path.join(dirPath, 'thumbnails'));
    await fs.ensureDir(path.join(dirPath, 'optimized'));
  }
}