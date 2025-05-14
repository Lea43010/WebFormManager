/**
 * Document Storage Service
 * 
 * Ein dedizierter Service für die Speicherung und Bereitstellung von Dokumenten
 * mit optimierter Zuverlässigkeit und Fehlerbehandlung.
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../logger';
import { storage } from '../storage';
import { fileTypes, fileCategoryEnum } from '@shared/schema';

// Konfiguration 
const STORAGE_DIR = './document-storage';
const PUBLIC_STORAGE_DIR = './public/document-storage';
const LOG_PREFIX = '[DocumentStorage]';

// Stellen Sie sicher, dass die Verzeichnisse existieren
fs.ensureDirSync(STORAGE_DIR);
fs.ensureDirSync(PUBLIC_STORAGE_DIR);

logger.info(`${LOG_PREFIX} Dokumenten-Storage initialisiert in ${STORAGE_DIR} und ${PUBLIC_STORAGE_DIR}`);

/**
 * DocumentStorage Service
 * 
 * Bietet Funktionen für das zuverlässige Speichern und Abrufen von Dokumenten
 */
export class DocumentStorage {
  /**
   * Speichert eine Datei im sicheren Dokumentenspeicher
   */
  async storeFile(
    file: Express.Multer.File | { 
      buffer: Buffer, 
      originalname: string,
      mimetype: string
    },
    metadata: {
      projectId: number,
      userId?: number,
      description?: string,
      category?: string,
      isPublic?: boolean
    }
  ) {
    try {
      // Eindeutigen Dateinamen generieren
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const fileExtension = path.extname(file.originalname);
      const safeFileName = `${timestamp}-${randomString}${fileExtension}`;
      
      // Bestimme den Speicherort basierend auf dem "isPublic" Flag
      const storageDir = metadata.isPublic ? PUBLIC_STORAGE_DIR : STORAGE_DIR;
      const filePath = path.join(storageDir, safeFileName);
      
      // Datei speichern
      await fs.writeFile(filePath, file.buffer);
      
      logger.info(`${LOG_PREFIX} Datei erfolgreich gespeichert: ${filePath}`);
      
      // Metadaten in der Datenbank speichern
      const fileType = this.determineFileType(file.originalname);
      
      // Typdefinitionen für beide Enums (für bessere Lesbarkeit und zukünftige Verwendung)
      type FileType = typeof fileTypes.enumValues[number]; // 'pdf' | 'excel' | 'image' | 'other'
      type FileCategory = typeof fileCategoryEnum.enumValues[number]; // 'Verträge' | 'Rechnungen' | etc.
      
      // Konvertieren in einen gültigen fileType
      const validFileType: FileType = fileType as FileType;
      
      // Kategorie validieren und einen gültigen Wert aus dem pgEnum sicherstellen
      const allowedCategories: FileCategory[] = ['Verträge', 'Rechnungen', 'Pläne', 'Protokolle', 'Genehmigungen', 'Fotos', 'Analysen', 'Andere'];
      
      const validCategory: FileCategory = metadata.category && 
        allowedCategories.includes(metadata.category as FileCategory)
        ? metadata.category as FileCategory
        : 'Andere';
      
      const attachmentData = {
        projectId: metadata.projectId,
        fileName: path.basename(file.originalname),
        originalName: file.originalname,
        fileType: validFileType,
        fileCategory: validCategory,
        filePath,
        fileSize: file.buffer.length,
        description: metadata.description,
        fileStorage: 'document-storage', // Marker für den neuen Speicherort
        isPublic: metadata.isPublic || false,
        // Leere Werte für die Bildoptimierung
        originalSize: null,
        optimizedSize: null,
        optimizationSavings: null,
        isOptimized: false,
        originalFormat: null,
        webpPath: null,
        fileMissing: false
      };
      
      // Anhang in der Datenbank erstellen
      const attachment = await storage.createAttachment(attachmentData);
      
      return {
        success: true,
        attachment,
        path: filePath
      };
    } catch (error) {
      logger.error(`${LOG_PREFIX} Fehler beim Speichern der Datei: ${error}`);
      return {
        success: false,
        error: `Fehler beim Speichern der Datei: ${error}`
      };
    }
  }
  
  /**
   * Ruft eine Datei aus dem Dokumentenspeicher ab
   */
  async getFile(attachmentId: number): Promise<{
    success: boolean,
    filePath?: string,
    fileName?: string,
    mimeType?: string,
    error?: string
  }> {
    try {
      const attachment = await storage.getAttachment(attachmentId);
      
      if (!attachment) {
        return {
          success: false,
          error: 'Anhang nicht gefunden'
        };
      }
      
      // Prüfen, ob die Datei im neuen Speicher ist
      if (attachment.fileStorage === 'document-storage') {
        const filePath = attachment.filePath;
        
        // Prüfen, ob die Datei existiert
        if (await fs.pathExists(filePath)) {
          return {
            success: true,
            filePath,
            fileName: attachment.fileName,
            mimeType: this.getMimeType(attachment.fileName)
          };
        }
        
        // Wenn der neue Speicher verwendet wird, aber die Datei nicht gefunden wird
        logger.error(`${LOG_PREFIX} Datei für Anhang ${attachmentId} nicht im document-storage gefunden`);
        await storage.markAttachmentFileMissing(attachmentId);
        return {
          success: false,
          error: 'Datei nicht gefunden im document-storage'
        };
      }
      
      // Bei altem Speichersystem zunächst versuchen, die Datei zu finden
      const filePath = attachment.filePath;
      logger.info(`${LOG_PREFIX} Alte Datei angefordert mit Pfad: ${filePath}`);
      
      if (await fs.pathExists(filePath)) {
        return {
          success: true,
          filePath,
          fileName: attachment.fileName,
          mimeType: this.getMimeType(attachment.fileName)
        };
      }
      
      // Versuche verschiedene Verzeichnisse für ältere Dateien
      const fileBaseName = path.basename(filePath);
      const alternativeLocations = [
        './uploads/' + fileBaseName,
        './public/uploads/' + fileBaseName,
        '/home/runner/workspace/uploads/' + fileBaseName
      ];
      
      for (const location of alternativeLocations) {
        logger.info(`${LOG_PREFIX} Prüfe alternative Position: ${location}`);
        if (await fs.pathExists(location)) {
          logger.info(`${LOG_PREFIX} Datei gefunden an alternativer Position: ${location}`);
          return {
            success: true,
            filePath: location,
            fileName: attachment.fileName,
            mimeType: this.getMimeType(attachment.fileName)
          };
        }
      }
      
      // Wenn keine Datei gefunden wird, markiere den Anhang als fehlend
      logger.error(`${LOG_PREFIX} Datei für Anhang ${attachmentId} nicht gefunden`);
      await storage.markAttachmentFileMissing(attachmentId);
      
      return {
        success: false,
        error: 'Datei nicht gefunden'
      };
    } catch (error) {
      logger.error(`${LOG_PREFIX} Fehler beim Abrufen der Datei: ${error}`);
      return {
        success: false,
        error: `Fehler beim Abrufen der Datei: ${error}`
      };
    }
  }
  
  /**
   * Migriert eine vorhandene Datei in den neuen Dokumentenspeicher
   */
  async migrateFile(attachmentId: number): Promise<{
    success: boolean,
    message?: string,
    error?: string
  }> {
    try {
      const attachment = await storage.getAttachment(attachmentId);
      
      if (!attachment) {
        return {
          success: false,
          error: 'Anhang nicht gefunden'
        };
      }
      
      // Wenn die Datei bereits migriert wurde
      if (attachment.fileStorage === 'document-storage') {
        return {
          success: true,
          message: 'Datei bereits im document-storage'
        };
      }
      
      // Versuchen, die ursprüngliche Datei zu finden
      const originalPath = attachment.filePath;
      let sourceFilePath = '';
      
      if (await fs.pathExists(originalPath)) {
        sourceFilePath = originalPath;
      } else {
        // Versuche alternative Speicherorte
        const fileBaseName = path.basename(originalPath);
        const alternativeLocations = [
          './uploads/' + fileBaseName,
          './public/uploads/' + fileBaseName,
          '/home/runner/workspace/uploads/' + fileBaseName
        ];
        
        for (const location of alternativeLocations) {
          if (await fs.pathExists(location)) {
            sourceFilePath = location;
            break;
          }
        }
      }
      
      if (!sourceFilePath) {
        return {
          success: false,
          error: 'Quelldatei nicht gefunden'
        };
      }
      
      // Neue Datei im document-storage erstellen
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const fileExtension = path.extname(attachment.fileName);
      const safeFileName = `${timestamp}-${randomString}${fileExtension}`;
      
      // Bestimme, ob die Datei öffentlich oder privat ist
      // Standardmäßig privat
      const isPublic = false;
      const storageDir = isPublic ? PUBLIC_STORAGE_DIR : STORAGE_DIR;
      const newFilePath = path.join(storageDir, safeFileName);
      
      // Datei kopieren
      await fs.copy(sourceFilePath, newFilePath);
      
      // Anhang in der Datenbank aktualisieren
      await storage.updateAttachmentPath(attachmentId, {
        filePath: newFilePath,
        fileStorage: 'document-storage',
        isPublic,
        fileMissing: false
      });
      
      logger.info(`${LOG_PREFIX} Datei erfolgreich migriert: ${sourceFilePath} -> ${newFilePath}`);
      
      return {
        success: true,
        message: `Datei erfolgreich migriert: ${attachment.fileName}`
      };
    } catch (error) {
      logger.error(`${LOG_PREFIX} Fehler beim Migrieren der Datei: ${error}`);
      return {
        success: false,
        error: `Fehler beim Migrieren der Datei: ${error}`
      };
    }
  }
  
  /**
   * Bestimmt den Dateityp basierend auf der Dateiendung
   * Gibt einen der definierten Dateitypen aus dem pgEnum zurück
   */
  private determineFileType(filename: string) {
    const extension = path.extname(filename).toLowerCase();
    
    // Diese Werte entsprechen den in fileTypes-pgEnum definierten Werten
    if (['.pdf'].includes(extension)) {
      return 'pdf' as const;
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
      return 'image' as const;
    } else if (['.xls', '.xlsx', '.csv'].includes(extension)) {
      return 'excel' as const;
    } else {
      return 'other' as const;
    }
  }
  
  /**
   * Bestimmt den MIME-Typ basierend auf der Dateiendung
   */
  private getMimeType(filename: string): string {
    const extension = path.extname(filename).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }
}

// Singleton-Instanz exportieren
export const documentStorage = new DocumentStorage();