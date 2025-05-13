import path from 'path';
import { OptimizationResult } from './image-optimizer';
import { InsertAttachment } from '@shared/schema';
import logger from '../logger';

/**
 * Erweitert ein Attachment-Objekt mit den Optimierungsinformationen
 * 
 * @param attachment Das ursprüngliche Attachment-Objekt
 * @param optimizationResult Das Ergebnis der Bildoptimierung
 * @returns Das erweiterte Attachment-Objekt mit Optimierungsinformationen
 */
export function applyOptimizationToAttachment(
  attachment: InsertAttachment, 
  optimizationResult: OptimizationResult
): InsertAttachment {
  try {
    // Dateiendung aus dem Pfad extrahieren
    const originalExt = path.extname(attachment.filePath).replace('.', '').toLowerCase();
    
    // Debug-Ausgabe vor der Erstellung des erweiterten Attachments
    logger.debug(`Attachment vor der Optimierung:`, JSON.stringify(attachment, null, 2));
    logger.debug(`Optimierungsergebnis:`, JSON.stringify(optimizationResult, null, 2));
    
    // Erweitertes Attachment-Objekt erstellen
    const enhancedAttachment: InsertAttachment = {
      ...attachment,
      // Ursprüngliche Größe der Datei
      originalSize: optimizationResult.originalSize,
      // Größe nach der Optimierung
      optimizedSize: optimizationResult.optimizedSize,
      // Eingesparte Bytes in Prozent (als Zahl)
      optimizationSavings: Math.round(optimizationResult.savings * 100) / 100,
      // Ursprüngliches Format
      originalFormat: originalExt,
      // Pfad zur WebP-Version (wenn generiert)
      webpPath: optimizationResult.webpPath,
      // Flag, ob das Bild optimiert wurde
      isOptimized: true,
      // Optionale Felder, die null sein können (um Typensicherheit zu gewährleisten)
      thumbnailPath: optimizationResult.thumbnailPath || null,
      blurHash: optimizationResult.blurHash || null,
      originalWidth: optimizationResult.originalWidth || null,
      originalHeight: optimizationResult.originalHeight || null,
      width: optimizationResult.width || null,
      height: optimizationResult.height || null
    };

    logger.debug(`Anhang mit Optimierungsinformationen angereichert: ${optimizationResult.savings.toFixed(2)}% Einsparung`);
    logger.debug(`Erweitertes Attachment:`, JSON.stringify(enhancedAttachment, null, 2));
    
    return enhancedAttachment;
  } catch (error) {
    logger.error(`Fehler beim Anreichern des Anhangs mit Optimierungsdaten:`, error);
    
    // Bei Fehler: Gib das ursprüngliche Attachment mit minimalen Optimierungsdaten zurück
    return {
      ...attachment,
      isOptimized: false,
      originalSize: attachment.fileSize,
      optimizedSize: null,
      optimizationSavings: null,
      originalFormat: null,
      webpPath: null
    };
  }
}