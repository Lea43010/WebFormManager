import sharp from 'sharp';
import path from 'path';
import fs from 'fs-extra';
import logger from '../logger';

/**
 * Bildoptimierungskonfiguration
 */
export interface ImageOptimizationOptions {
  /** Qualität für JPEG und WebP Formate (1-100) */
  quality?: number;
  /** Ob WebP-Format generiert werden soll */
  generateWebP?: boolean;
  /** Ob Thumbnail generiert werden soll */
  generateThumbnail?: boolean;
  /** Ob Blurry-Placeholder generiert werden soll */
  generateBlurHash?: boolean;
  /** Ob Originaldatei behalten werden soll */
  keepOriginal?: boolean;
  /** Maximale Breite für Hauptbild in Pixeln */
  maxWidth?: number;
  /** Maximale Höhe für Hauptbild in Pixeln */
  maxHeight?: number;
  /** Breite für Thumbnails in Pixeln */
  thumbnailWidth?: number;
  /** Höhe für Thumbnails in Pixeln */
  thumbnailHeight?: number;
}

/**
 * Standardkonfiguration für die Bildoptimierung
 */
const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  quality: 85,
  generateWebP: true,
  generateThumbnail: true,
  generateBlurHash: true,
  keepOriginal: false,
  maxWidth: 1920,
  maxHeight: 1080,
  thumbnailWidth: 320,
  thumbnailHeight: 240
};

/**
 * Ergebnis der Bildoptimierung
 */
export interface OptimizationResult {
  /** Pfad zur optimierten Hauptdatei */
  optimizedPath: string;
  /** Pfad zur WebP-Version (falls generiert) */
  webpPath?: string;
  /** Pfad zum Thumbnail (falls generiert) */
  thumbnailPath?: string;
  /** Pfad zum WebP-Thumbnail (falls generiert) */
  thumbnailWebpPath?: string;
  /** Base64-kodierter Blur-Hash für Placeholder */
  blurHash?: string;
  /** Ursprüngliche Breite des Bildes */
  originalWidth: number;
  /** Ursprüngliche Höhe des Bildes */
  originalHeight: number;
  /** Neue Breite des optimierten Bildes */
  width: number;
  /** Neue Höhe des optimierten Bildes */
  height: number;
  /** Größeneinsparung in Prozent */
  savings: number;
  /** Dateigröße vor Optimierung in Bytes */
  originalSize: number;
  /** Dateigröße nach Optimierung in Bytes */
  optimizedSize: number;
}

/**
 * Überprüft, ob ein Dateiformat von sharp unterstützt wird
 */
export function isSupportedImageFormat(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.avif'].includes(ext);
}

/**
 * Generiert einen Base64-kodierten Blur-Hash für ein Bild
 * @param inputPath Pfad zum Eingabebild
 * @returns Base64-String des Blur-Placeholders
 */
async function generateBlurPlaceholder(inputPath: string): Promise<string> {
  try {
    // Erstelle ein sehr kleines, stark komprimiertes Bild für Blur-Effekt
    const tinyImageBuffer = await sharp(inputPath)
      .resize(20, 20, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 30 })
      .toBuffer();
      
    // Konvertiere zu Base64
    return `data:image/jpeg;base64,${tinyImageBuffer.toString('base64')}`;
  } catch (error) {
    logger.error(`Fehler beim Erstellen des Blur-Placeholders: ${error}`);
    return '';
  }
}

/**
 * Optimiert ein Bild mit verschiedenen Optimierungsoptionen
 * 
 * @param inputPath Pfad zur Originaldatei
 * @param options Optimierungsoptionen
 * @returns Ergebnis der Optimierung
 */
export async function optimizeImage(
  inputPath: string,
  customOptions: Partial<ImageOptimizationOptions> = {}
): Promise<OptimizationResult> {
  // Optionen mit Standardwerten kombinieren
  const options: ImageOptimizationOptions = { ...DEFAULT_OPTIONS, ...customOptions };
  
  // Überprüfen, ob der Dateityp unterstützt wird
  if (!isSupportedImageFormat(inputPath)) {
    throw new Error(`Nicht unterstütztes Bildformat: ${path.extname(inputPath)}`);
  }

  // Originaldateigröße ermitteln
  const originalFileStats = await fs.stat(inputPath);
  const originalSize = originalFileStats.size;

  // Basispfade für optimierte Dateien festlegen
  const dir = path.dirname(inputPath);
  const filename = path.basename(inputPath, path.extname(inputPath));
  const ext = path.extname(inputPath);
  
  // Pfad für optimierte Hauptdatei
  const optimizedPath = path.join(dir, `${filename}-optimized${ext}`);
  // Pfad für WebP-Version
  const webpPath = path.join(dir, `${filename}-optimized.webp`);
  // Pfade für Thumbnails
  const thumbnailPath = path.join(dir, `${filename}-thumb${ext}`);
  const thumbnailWebpPath = path.join(dir, `${filename}-thumb.webp`);

  // Bildmetadaten auslesen
  const metadata = await sharp(inputPath).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  // Bestimme neue Abmessungen entsprechend der maximalen Dimensionen
  let width = originalWidth;
  let height = originalHeight;
  
  // Sichere Defaults für maxWidth und maxHeight
  const maxWidth = options.maxWidth ?? DEFAULT_OPTIONS.maxWidth ?? 1920;
  const maxHeight = options.maxHeight ?? DEFAULT_OPTIONS.maxHeight ?? 1080;
  
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = Math.round(width / aspectRatio);
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = Math.round(height * aspectRatio);
    }
  }

  // Bild verarbeiten
  try {
    const mainPromises = [];
    const thumbnailPromises = [];
    let blurHash = '';
    
    // Blur-Hash generieren wenn gewünscht
    if (options.generateBlurHash) {
      blurHash = await generateBlurPlaceholder(inputPath);
    }

    // Hauptbild optimieren
    mainPromises.push(
      sharp(inputPath)
        .resize({
          width,
          height,
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: options.quality })
        .toFile(optimizedPath)
    );

    // WebP-Version erstellen wenn gewünscht
    if (options.generateWebP) {
      mainPromises.push(
        sharp(inputPath)
          .resize({
            width,
            height,
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: options.quality })
          .toFile(webpPath)
      );
    }

    // Thumbnail erstellen wenn gewünscht
    if (options.generateThumbnail) {
      // Sichere Defaults für Thumbnail-Größen
      const thumbnailWidth = options.thumbnailWidth ?? DEFAULT_OPTIONS.thumbnailWidth ?? 320;
      const thumbnailHeight = options.thumbnailHeight ?? DEFAULT_OPTIONS.thumbnailHeight ?? 240;
      
      thumbnailPromises.push(
        sharp(inputPath)
          .resize({
            width: thumbnailWidth,
            height: thumbnailHeight,
            fit: 'cover'
          })
          .jpeg({ quality: options.quality })
          .toFile(thumbnailPath)
      );

      // WebP-Thumbnail erstellen wenn gewünscht
      if (options.generateWebP) {
        thumbnailPromises.push(
          sharp(inputPath)
            .resize({
              width: thumbnailWidth,
              height: thumbnailHeight,
              fit: 'cover'
            })
            .webp({ quality: options.quality })
            .toFile(thumbnailWebpPath)
          );
      }
    }
    
    // Alle Optimierungen ausführen
    await Promise.all([...mainPromises, ...thumbnailPromises]);
    
    // Optimierte Dateigröße ermitteln
    const optimizedStats = await fs.stat(optimizedPath);
    const optimizedSize = optimizedStats.size;
    
    // Speichereinsparung berechnen
    const savings = ((originalSize - optimizedSize) / originalSize) * 100;
    
    // Ursprüngliche Datei löschen wenn nicht behalten werden soll
    if (!options.keepOriginal) {
      await fs.unlink(inputPath);
    }
    
    // Optimierungsergebnis zusammenstellen
    const result: OptimizationResult = {
      optimizedPath,
      originalWidth,
      originalHeight,
      width,
      height,
      savings,
      originalSize,
      optimizedSize,
      blurHash: blurHash || undefined
    };
    
    // Optionale Pfade hinzufügen
    if (options.generateWebP) {
      result.webpPath = webpPath;
    }
    
    if (options.generateThumbnail) {
      result.thumbnailPath = thumbnailPath;
      
      if (options.generateWebP) {
        result.thumbnailWebpPath = thumbnailWebpPath;
      }
    }
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Fehler bei der Bildoptimierung: ${errorMessage}`);
    throw new Error(`Bildoptimierung fehlgeschlagen: ${errorMessage}`);
  }
}

/**
 * Prüft, ob der Browser WebP unterstützt basierend auf dem Accept-Header
 */
export function browserSupportsWebP(acceptHeader: string): boolean {
  return Boolean(acceptHeader && acceptHeader.includes('image/webp'));
}