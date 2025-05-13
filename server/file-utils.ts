/**
 * Dienstprogramm für erweiterte Dateioperationen
 * Insbesondere für die Suche nach Dateien in verschiedenen Pfaden
 */

import * as fs from "fs-extra";
import * as path from "path";

// Bekannte alternative Pfad-Patterns, die in der Bau-Structura-App auftreten können
// Dies ist eine Liste von Pfad-Transformationen, die versucht werden, wenn der Originalpfad nicht gefunden wird
const ALTERNATIVE_PATH_PATTERNS = [
  // Standard-Pattern: direkt im Uploads-Ordner
  (filename: string) => path.join("uploads", filename),
  
  // Alternative 1: absoluter Pfad im aktuellen Arbeitsverzeichnis
  (filename: string) => path.join(process.cwd(), "uploads", filename),
  
  // Alternative 2: "public" Verzeichnis (für Produktions-Deployments)
  (filename: string) => path.join("public", "uploads", filename),
  
  // Alternative 3: Aufsteigen im Verzeichnisbaum
  (filename: string) => path.join("..", "uploads", filename),
  
  // Alternative 4: Vollständiger Pfad ohne Verzeichnisstruktur
  (filename: string) => filename,
];

/**
 * Sucht eine Datei in verschiedenen möglichen Pfaden
 * @param originalPath Der ursprüngliche Dateipfad
 * @param webpPath Optional: WebP-Pfad als Alternative
 * @returns Der gefundene Dateipfad oder null wenn keine Datei gefunden wurde
 */
export async function findFile(originalPath: string, webpPath?: string | null): Promise<string | null> {
  // 1. Zuerst den Original-Pfad prüfen
  try {
    const exists = await fs.pathExists(originalPath);
    if (exists) {
      console.log(`Datei am Originalpfad gefunden: ${originalPath}`);
      return originalPath;
    }
  } catch (error) {
    console.error(`Fehler beim Prüfen des Originalpfads: ${error}`);
  }
  
  // 2. Wenn WebP-Pfad angegeben ist, diesen als nächstes prüfen
  if (webpPath) {
    try {
      const exists = await fs.pathExists(webpPath);
      if (exists) {
        console.log(`Datei am WebP-Pfad gefunden: ${webpPath}`);
        return webpPath;
      }
    } catch (error) {
      console.error(`Fehler beim Prüfen des WebP-Pfads: ${error}`);
    }
  }
  
  // 3. Alternative Pfade für Originaldatei prüfen
  const filename = path.basename(originalPath);
  for (const patternFn of ALTERNATIVE_PATH_PATTERNS) {
    const alternativePath = patternFn(filename);
    try {
      const exists = await fs.pathExists(alternativePath);
      if (exists) {
        console.log(`Datei an alternativer Stelle gefunden: ${alternativePath}`);
        return alternativePath;
      }
    } catch (error) {
      console.error(`Fehler beim Prüfen des alternativen Pfads ${alternativePath}: ${error}`);
    }
  }
  
  // 4. Wenn WebP-Pfad vorhanden, auch alternative Pfade für WebP-Datei prüfen
  if (webpPath) {
    const webpFilename = path.basename(webpPath);
    for (const patternFn of ALTERNATIVE_PATH_PATTERNS) {
      const alternativeWebPPath = patternFn(webpFilename);
      try {
        const exists = await fs.pathExists(alternativeWebPPath);
        if (exists) {
          console.log(`WebP-Datei an alternativer Stelle gefunden: ${alternativeWebPPath}`);
          return alternativeWebPPath;
        }
      } catch (error) {
        console.error(`Fehler beim Prüfen des alternativen WebP-Pfads ${alternativeWebPPath}: ${error}`);
      }
    }
  }
  
  // Keine Datei gefunden
  console.error(`Keine Datei gefunden für Original: ${originalPath}, WebP: ${webpPath || 'nicht definiert'}`);
  return null;
}

/**
 * Erstellt die Verzeichnisstruktur für eine neue Datei
 * @param filePath Der Pfad, in dem die Datei gespeichert werden soll
 */
export async function ensureUploadDirectories(filePath: string): Promise<void> {
  const directory = path.dirname(filePath);
  
  try {
    await fs.ensureDir(directory);
    console.log(`Verzeichnis sichergestellt: ${directory}`);
  } catch (error) {
    console.error(`Fehler beim Erstellen des Verzeichnisses ${directory}:`, error);
    throw new Error(`Verzeichnis konnte nicht erstellt werden: ${directory}`);
  }
}