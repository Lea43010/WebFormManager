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
  
  // Dateiendung aus dem Pfad extrahieren
  const originalExt = path.extname(attachment.filePath).replace('.', '').toLowerCase();
  
  // Erweitertes Attachment-Objekt erstellen
  const enhancedAttachment: InsertAttachment = {
    ...attachment,
    // Ursprüngliche Größe der Datei
    originalSize: optimizationResult.originalSize,
    // Größe nach der Optimierung
    optimizedSize: optimizationResult.optimizedSize,
    // Eingesparte Bytes
    optimizationSavings: optimizationResult.originalSize - optimizationResult.optimizedSize,
    // Ursprüngliches Format
    originalFormat: originalExt,
    // Pfad zur WebP-Version (wenn generiert)
    webpPath: optimizationResult.webpPath,
    // Flag, ob das Bild optimiert wurde
    isOptimized: true
  };

  logger.debug(`Anhang mit Optimierungsinformationen angereichert: ${optimizationResult.savings.toFixed(2)}% Einsparung`);
  
  return enhancedAttachment;
}