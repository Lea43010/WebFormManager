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
  
  // Alternative 3: Uploads direkt im Root-Verzeichnis
  (filename: string) => path.join("/", "uploads", filename),
  
  // Alternative 4: Aufsteigen im Verzeichnisbaum
  (filename: string) => path.join("..", "uploads", filename),
  
  // Alternative 5: Nur der Dateiname ohne Pfad
  (filename: string) => filename,
  
  // Alternative 6: Datei im thumbnail oder optimized Unterverzeichnis
  (filename: string) => path.join("uploads", "thumbnails", filename),
  (filename: string) => path.join("uploads", "optimized", filename),
  
  // Alternative 7: Berücksichtige Namenskonventionen für optimierte Dateien
  (filename: string) => {
    // Versuche mit suffix "-optimized" falls es sich um eine normale Datei handelt
    const baseName = path.basename(filename, path.extname(filename));
    const ext = path.extname(filename);
    return path.join("uploads", `${baseName}-optimized${ext}`);
  },
  
  // Alternative 8: Berücksichtige WebP-Konvertierungen
  (filename: string) => {
    // Versuche mit Änderung der Dateiendung zu .webp
    const baseName = path.basename(filename, path.extname(filename));
    return path.join("uploads", `${baseName}.webp`);
  },
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
  
  // Extrahiere verschiedene Teile des Dateinamens für erweiterte Suche
  const basenameWithExt = path.basename(originalPath);
  const basenameWithoutExt = path.basename(originalPath, path.extname(originalPath));
  const ext = path.extname(originalPath);
  
  console.log(`Suche nach Datei mit Name: ${basenameWithExt}, Basis: ${basenameWithoutExt}, Endung: ${ext}`);
  
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
  
  // 3.1 Versuche Dateien direkt im uploads-Verzeichnis zu finden
  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (await fs.pathExists(uploadsDir)) {
      const files = await fs.readdir(uploadsDir);
      console.log(`Durchsuche ${files.length} Dateien im uploads-Verzeichnis...`);
      
      // Suche nach Dateien, die den Basisnamen enthalten
      for (const file of files) {
        if (file.includes(basenameWithoutExt) || 
            (basenameWithoutExt.length > 8 && file.includes(basenameWithoutExt.substring(0, 8)))) {
          const matchedPath = path.join(uploadsDir, file);
          console.log(`Ähnliche Datei gefunden: ${matchedPath}`);
          return matchedPath;
        }
      }
    }
  } catch (error) {
    console.error(`Fehler bei der direkten Suche im uploads-Verzeichnis: ${error}`);
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