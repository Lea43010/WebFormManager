/**
 * Dokumenten-Synchronisations-Service
 * 
 * Dieser Service verwaltet die Synchronisation von Dokumenten zwischen Bau-Structura
 * und externen Speicherdiensten wie Google Drive, OneDrive, etc.
 */

import { db } from "../db";
import { 
  syncedDocuments, 
  documentVersions, 
  syncLogs,
  externalSystemEnum,
  type InsertSyncedDocument,
  type InsertDocumentVersion,
  type InsertSyncLog
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import * as crypto from "crypto";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { logger } from "../logger";

// Prüfen Sie, ob das Verzeichnis existiert
const documentsDir = path.join(process.cwd(), "uploads", "synced_documents");
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Promisify-Funktionen für fs
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Interface für externe Synchronisationsprovider
export interface SyncProvider {
  name: externalSystemEnum;
  fetchDocument(externalId: string): Promise<Buffer>;
  uploadDocument(docId: string, content: Buffer, metadata: any): Promise<string>; // externalId
  listChanges(since: Date): Promise<ExternalChange[]>;
}

export interface ExternalChange {
  externalId: string;
  name: string;
  path?: string;
  mimeType: string;
  lastModified: Date;
  size: number;
}

export class DocumentSyncService {
  private providers: Map<string, SyncProvider> = new Map();

  /**
   * Registriert einen Sync-Provider für ein externes System
   */
  registerProvider(provider: SyncProvider) {
    this.providers.set(provider.name, provider);
    logger.info(`Synchronisations-Provider für ${provider.name} registriert`);
  }

  /**
   * Prüft, ob ein Provider für das angegebene System registriert ist
   */
  hasProvider(system: externalSystemEnum): boolean {
    return this.providers.has(system);
  }

  /**
   * Synchronisiert ein Dokument mit dem externen System
   */
  async syncDocument(docId: string, userId: string): Promise<any> {
    const [document] = await db.select().from(syncedDocuments).where(eq(syncedDocuments.id, docId));
    
    if (!document) {
      throw new Error("Dokument nicht gefunden");
    }
    
    const provider = this.providers.get(document.externalSystem);
    if (!provider) {
      await this.logSync(docId, "pull", "error", "Kein Provider für dieses externe System registriert", userId);
      throw new Error(`Provider ${document.externalSystem} nicht registriert`);
    }
    
    try {
      // Datei vom externen System holen
      const content = await provider.fetchDocument(document.externalId);
      
      // Checksumme berechnen
      const checksum = this.calculateChecksum(content);
      
      // Prüfen, ob sich das Dokument geändert hat
      if (checksum !== document.checksum) {
        // Lokale Kopie speichern
        const localPath = path.join(documentsDir, `${docId}-${Date.now()}`);
        await writeFile(localPath, content);
        
        // Neue Version erstellen
        const versions = await db.select().from(documentVersions)
          .where(eq(documentVersions.documentId, docId))
          .orderBy(desc(documentVersions.versionNumber));
        
        const newVersionNumber = versions.length > 0 ? versions[0].versionNumber + 1 : 1;
        
        await db.insert(documentVersions).values({
          documentId: docId,
          versionNumber: newVersionNumber,
          size: content.length,
          checksum,
          createdBy: userId,
          comment: "Automatisch synchronisiert von " + document.externalSystem,
        });
        
        // Dokument-Metadaten aktualisieren
        await db.update(syncedDocuments)
          .set({
            checksum,
            size: content.length,
            path: localPath,
            lastSynced: new Date(),
            syncStatus: "synced",
            updatedAt: new Date(),
          })
          .where(eq(syncedDocuments.id, docId));
        
        await this.logSync(docId, "pull", "success", `Dokument erfolgreich synchronisiert (Version ${newVersionNumber})`, userId);
        
        return {
          ...document,
          checksum,
          size: content.length,
          path: localPath,
          lastSynced: new Date(),
          syncStatus: "synced",
          updatedAt: new Date(),
          versionNumber: newVersionNumber
        };
      } else {
        // Keine Änderung
        await db.update(syncedDocuments)
          .set({
            lastSynced: new Date(),
            syncStatus: "synced",
            updatedAt: new Date(),
          })
          .where(eq(syncedDocuments.id, docId));
        
        await this.logSync(docId, "pull", "success", "Dokument ist bereits aktuell", userId);
        
        return {
          ...document,
          lastSynced: new Date(),
          syncStatus: "synced",
          updatedAt: new Date()
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.logSync(docId, "pull", "error", errorMessage, userId);
      
      // Dokument-Status auf Fehler setzen
      await db.update(syncedDocuments)
        .set({
          syncStatus: "error",
          updatedAt: new Date(),
        })
        .where(eq(syncedDocuments.id, docId));
      
      throw error;
    }
  }

  /**
   * Lädt ein Dokument hoch und synchronisiert es mit einem externen System
   */
  async uploadAndSync(
    file: Buffer,
    fileName: string,
    mimeType: string,
    projectId: number,
    userId: string,
    externalSystem: externalSystemEnum
  ): Promise<any> {
    const provider = this.providers.get(externalSystem);
    if (!provider) {
      throw new Error(`Provider ${externalSystem} nicht registriert`);
    }
    
    // Dokument lokal speichern
    const docId = crypto.randomUUID ? crypto.randomUUID() : require('crypto').randomUUID();
    const localPath = path.join(documentsDir, `${docId}-${Date.now()}`);
    await writeFile(localPath, file);
    
    // Checksumme berechnen
    const checksum = this.calculateChecksum(file);
    
    try {
      // Zum externen System hochladen
      const externalId = await provider.uploadDocument(docId, file, {
        name: fileName,
        mimeType
      });
      
      // In der Datenbank speichern
      const [document] = await db.insert(syncedDocuments).values({
        id: docId,
        name: fileName,
        path: localPath,
        mimeType,
        size: file.length,
        lastModified: new Date(),
        lastSynced: new Date(),
        externalId,
        externalSystem,
        projectId,
        ownerId: userId,
        syncStatus: "synced",
        checksum,
        metadata: {},
      }).returning();
      
      // Erste Version erstellen
      await db.insert(documentVersions).values({
        documentId: docId,
        versionNumber: 1,
        size: file.length,
        checksum,
        createdBy: userId,
        comment: "Erstellt und mit " + externalSystem + " synchronisiert",
      });
      
      await this.logSync(docId, "push", "success", "Dokument erstellt und synchronisiert", userId);
      
      return document;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Fehler protokollieren, aber Dokument trotzdem lokal speichern
      const [document] = await db.insert(syncedDocuments).values({
        id: docId,
        name: fileName,
        path: localPath,
        mimeType,
        size: file.length,
        lastModified: new Date(),
        lastSynced: new Date(),
        externalSystem,
        projectId,
        ownerId: userId,
        syncStatus: "error",
        checksum,
        metadata: {},
      }).returning();
      
      await db.insert(documentVersions).values({
        documentId: docId,
        versionNumber: 1,
        size: file.length,
        checksum,
        createdBy: userId,
        comment: "Erstellt (Synchronisation fehlgeschlagen)",
      });
      
      await this.logSync(docId, "push", "error", errorMessage, userId);
      
      throw new Error(`Dokument lokal gespeichert, aber Synchronisation fehlgeschlagen: ${errorMessage}`);
    }
  }

  /**
   * Berechnet eine SHA-256 Checksumme für Daten
   */
  private calculateChecksum(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Protokolliert Synchronisationsaktivitäten
   */
  private async logSync(
    documentId: string,
    operation: string,
    status: string,
    message: string,
    userId: string
  ): Promise<void> {
    await db.insert(syncLogs).values({
      documentId,
      operation,
      status,
      message,
      userId
    });
  }

  /**
   * Holt ein synchronisiertes Dokument nach ID
   */
  async getDocument(docId: string): Promise<any> {
    const [document] = await db.select().from(syncedDocuments).where(eq(syncedDocuments.id, docId));
    
    if (!document) {
      throw new Error("Dokument nicht gefunden");
    }
    
    return document;
  }

  /**
   * Listet alle Versionen eines Dokuments
   */
  async getDocumentVersions(docId: string): Promise<any[]> {
    const versions = await db.select().from(documentVersions)
      .where(eq(documentVersions.documentId, docId))
      .orderBy(desc(documentVersions.versionNumber));
    
    return versions;
  }

  /**
   * Listet alle synchronisierten Dokumente für ein Projekt
   */
  async getDocumentsByProject(projectId: number): Promise<any[]> {
    const documents = await db.select().from(syncedDocuments)
      .where(eq(syncedDocuments.projectId, projectId))
      .orderBy(desc(syncedDocuments.updatedAt));
    
    return documents;
  }
}

// Singleton-Instanz
export const documentSyncService = new DocumentSyncService();

// Mockup-Provider für lokale Tests
export class LocalSyncProvider implements SyncProvider {
  name = "bau_structura" as externalSystemEnum;
  
  async fetchDocument(externalId: string): Promise<Buffer> {
    try {
      return await readFile(externalId);
    } catch (error) {
      throw new Error(`Fehler beim Lesen der Datei: ${error.message}`);
    }
  }
  
  async uploadDocument(docId: string, content: Buffer, metadata: any): Promise<string> {
    const filePath = path.join(documentsDir, `${docId}-${Date.now()}`);
    await writeFile(filePath, content);
    return filePath; // Wir verwenden den Dateipfad als externalId
  }
  
  async listChanges(since: Date): Promise<ExternalChange[]> {
    // In einer echten Implementierung würden wir hier das Dateisystem scannen
    return [];
  }
}

// Lokalen Provider registrieren
documentSyncService.registerProvider(new LocalSyncProvider());