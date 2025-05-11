/**
 * Universal-Suchindexierer
 * 
 * Dieser Service indexiert verschiedene Entitäten (Projekte, Dokumente, Benutzer, etc.)
 * für die Volltextsuche in der gesamten Anwendung.
 */

import { db } from "../db";
import {
  searchIndex,
  projects,
  users,
  attachments,
  syncedDocuments,
  surfaceAnalyses,
  constructionDiaries,
  companies,
  customers,
  type InsertSearchIndex
} from "@shared/schema";
import { eq, inArray, sql, and } from "drizzle-orm";
import { logger } from "../logger";

export class SearchIndexer {
  
  /**
   * Indexiert ein Projekt und zugehörige Entitäten
   */
  async indexProject(projectId: number) {
    try {
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      
      if (!project) {
        throw new Error("Projekt nicht gefunden");
      }
      
      // Berechtigungen für dieses Projekt ermitteln
      const permissions = await this.getProjectPermissions(project);
      
      // Projekt indexieren
      await this.indexEntity({
        entityType: "project",
        entityId: project.id.toString(),
        title: project.projectName || "Unbenanntes Projekt",
        content: `${project.projectText || ""} ${project.projectNotes || ""} ${project.projectAddress || ""}`,
        metadata: {
          startDate: project.projectStartdate,
          endDate: project.projectEnddate,
          status: project.projectStop ? "pausiert" : "aktiv",
          art: project.projectArt,
          geo: project.projectLatitude && project.projectLongitude ? {
            lat: project.projectLatitude,
            lng: project.projectLongitude
          } : null
        },
        permissions,
        source: "bau_structura"
      });
      
      logger.info(`Projekt ${projectId} erfolgreich indexiert`);
      
      // Zugehörige Dokumente indexieren
      await this.indexProjectDocuments(projectId, permissions);
      
      // Zugehörige Oberflächenanalysen indexieren
      await this.indexProjectSurfaceAnalyses(projectId, permissions);
      
      // Zugehörige Bautagebücher indexieren
      await this.indexProjectConstructionDiaries(projectId, permissions);
      
      return true;
    } catch (error) {
      logger.error(`Fehler bei der Indexierung von Projekt ${projectId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Indexiert ein einzelnes Dokument
   */
  async indexDocument(documentId: string, type: "attachment" | "synced_document") {
    try {
      if (type === "attachment") {
        const [attachment] = await db.select().from(attachments).where(eq(attachments.id, parseInt(documentId)));
        
        if (!attachment) {
          throw new Error("Anhang nicht gefunden");
        }
        
        const [project] = await db.select().from(projects).where(eq(projects.id, attachment.projectId));
        const permissions = await this.getProjectPermissions(project);
        
        await this.indexEntity({
          entityType: "attachment",
          entityId: attachment.id.toString(),
          title: attachment.originalName,
          content: attachment.description || "",
          metadata: {
            fileType: attachment.fileType,
            fileCategory: attachment.fileCategory,
            fileSize: attachment.fileSize,
            tags: attachment.tags,
            projectId: attachment.projectId
          },
          permissions,
          source: "bau_structura"
        });
        
        logger.info(`Anhang ${documentId} erfolgreich indexiert`);
        
      } else if (type === "synced_document") {
        const [document] = await db.select().from(syncedDocuments).where(eq(syncedDocuments.id, documentId));
        
        if (!document) {
          throw new Error("Synchronisiertes Dokument nicht gefunden");
        }
        
        const [project] = document.projectId ? 
          await db.select().from(projects).where(eq(projects.id, document.projectId)) : 
          [null];
        
        const permissions = project ? 
          await this.getProjectPermissions(project) : 
          [document.ownerId];
        
        await this.indexEntity({
          entityType: "synced_document",
          entityId: document.id,
          title: document.name,
          content: "", // Inhalt würde in einem realen System aus dem Dokument extrahiert
          metadata: {
            mimeType: document.mimeType,
            size: document.size,
            externalSystem: document.externalSystem,
            syncStatus: document.syncStatus,
            projectId: document.projectId
          },
          permissions,
          source: document.externalSystem
        });
        
        logger.info(`Synchronisiertes Dokument ${documentId} erfolgreich indexiert`);
      }
      
      return true;
    } catch (error) {
      logger.error(`Fehler bei der Indexierung von Dokument ${documentId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Indexiert einen Benutzer
   */
  async indexUser(userId: number) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        throw new Error("Benutzer nicht gefunden");
      }
      
      // Benutzer indexieren
      await this.indexEntity({
        entityType: "user",
        entityId: user.id.toString(),
        title: user.name || user.username,
        content: `${user.username} ${user.email || ""}`,
        metadata: {
          role: user.role,
          email: user.email
        },
        permissions: [user.id.toString()], // Nur der Benutzer selbst und Administratoren
        source: "bau_structura"
      });
      
      logger.info(`Benutzer ${userId} erfolgreich indexiert`);
      
      return true;
    } catch (error) {
      logger.error(`Fehler bei der Indexierung von Benutzer ${userId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Indexiert ein Unternehmen
   */
  async indexCompany(companyId: number) {
    try {
      const [company] = await db.select().from(companies).where(eq(companies.id, companyId));
      
      if (!company) {
        throw new Error("Unternehmen nicht gefunden");
      }
      
      // Adresse zusammenstellen
      const address = [
        company.street,
        company.houseNumber,
        company.addressLine2,
        company.postalCode,
        company.city,
        company.cityPart,
        company.state,
        company.country
      ].filter(Boolean).join(", ");
      
      // Unternehmen indexieren
      await this.indexEntity({
        entityType: "company",
        entityId: company.id.toString(),
        title: company.companyName,
        content: `${company.companyArt || ""} ${address} ${company.companyPhone || ""} ${company.companyEmail || ""}`,
        metadata: {
          type: company.companyArt,
          projectId: company.projectId,
          phone: company.companyPhone,
          email: company.companyEmail
        },
        permissions: [], // Wird später basierend auf Projektberechtigungen gesetzt
        source: "bau_structura"
      });
      
      logger.info(`Unternehmen ${companyId} erfolgreich indexiert`);
      
      return true;
    } catch (error) {
      logger.error(`Fehler bei der Indexierung von Unternehmen ${companyId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Allgemeine Methode zum Indexieren einer Entität
   */
  private async indexEntity(data: Omit<InsertSearchIndex, "tsVector" | "lastIndexed">) {
    // Zuerst prüfen, ob die Entität bereits indexiert ist
    const [existingIndex] = await db.select({ id: searchIndex.id })
      .from(searchIndex)
      .where(
        and(
          eq(searchIndex.entityType, data.entityType),
          eq(searchIndex.entityId, data.entityId)
        )
      );
    
    if (existingIndex) {
      // Update
      await db.update(searchIndex)
        .set({
          title: data.title,
          content: data.content,
          metadata: data.metadata,
          permissions: data.permissions,
          source: data.source,
          lastIndexed: new Date()
        })
        .where(eq(searchIndex.id, existingIndex.id));
    } else {
      // Insert
      await db.insert(searchIndex).values({
        ...data,
        lastIndexed: new Date()
      });
    }
  }
  
  /**
   * Indexiert alle Dokumente für ein Projekt
   */
  private async indexProjectDocuments(projectId: number, permissions: string[]) {
    // Anhänge
    const attachmentsList = await db.select().from(attachments)
      .where(eq(attachments.projectId, projectId));
    
    for (const attachment of attachmentsList) {
      await this.indexEntity({
        entityType: "attachment",
        entityId: attachment.id.toString(),
        title: attachment.originalName,
        content: attachment.description || "",
        metadata: {
          fileType: attachment.fileType,
          fileCategory: attachment.fileCategory,
          fileSize: attachment.fileSize,
          tags: attachment.tags,
          projectId: attachment.projectId
        },
        permissions,
        source: "bau_structura"
      });
    }
    
    // Synchronisierte Dokumente
    const syncedDocsList = await db.select().from(syncedDocuments)
      .where(eq(syncedDocuments.projectId, projectId));
    
    for (const document of syncedDocsList) {
      await this.indexEntity({
        entityType: "synced_document",
        entityId: document.id,
        title: document.name,
        content: "", // Inhalt würde in einem realen System aus dem Dokument extrahiert
        metadata: {
          mimeType: document.mimeType,
          size: document.size,
          externalSystem: document.externalSystem,
          syncStatus: document.syncStatus,
          projectId: document.projectId
        },
        permissions,
        source: document.externalSystem
      });
    }
  }
  
  /**
   * Indexiert alle Oberflächenanalysen für ein Projekt
   */
  private async indexProjectSurfaceAnalyses(projectId: number, permissions: string[]) {
    const analyses = await db.select().from(surfaceAnalyses)
      .where(eq(surfaceAnalyses.projectId, projectId));
    
    for (const analysis of analyses) {
      // Adresse zusammenstellen
      const address = [
        analysis.street,
        analysis.houseNumber,
        analysis.postalCode,
        analysis.city
      ].filter(Boolean).join(", ");
      
      await this.indexEntity({
        entityType: "surface_analysis",
        entityId: analysis.id.toString(),
        title: analysis.locationName || `Analyse #${analysis.id}`,
        content: `${address} ${analysis.notes || ""} ${analysis.analysisType} ${analysis.belastungsklasse} ${analysis.bodenklasse || ""}`,
        metadata: {
          analysisType: analysis.analysisType,
          belastungsklasse: analysis.belastungsklasse,
          bodenklasse: analysis.bodenklasse,
          bodentragfaehigkeitsklasse: analysis.bodentragfaehigkeitsklasse,
          confidence: analysis.confidence,
          geo: {
            lat: analysis.latitude,
            lng: analysis.longitude
          },
          projectId
        },
        permissions,
        source: "bau_structura"
      });
    }
  }
  
  /**
   * Indexiert alle Bautagebücher für ein Projekt
   */
  private async indexProjectConstructionDiaries(projectId: number, permissions: string[]) {
    const diaries = await db.select().from(constructionDiaries)
      .where(eq(constructionDiaries.projectId, projectId));
    
    for (const diary of diaries) {
      await this.indexEntity({
        entityType: "construction_diary",
        entityId: diary.id.toString(),
        title: `Bautagebuch ${diary.date.toLocaleDateString('de-DE')}`,
        content: `${diary.activity} ${diary.materialUsage || ""} ${diary.remarks || ""} ${diary.incidentType || ""}`,
        metadata: {
          date: diary.date,
          employee: diary.employee,
          workHours: diary.workHours,
          incidentType: diary.incidentType,
          projectId
        },
        permissions,
        source: "bau_structura"
      });
    }
  }
  
  /**
   * Ermittelt die Berechtigungen für ein Projekt
   * In einer realen Anwendung würde dies auf dem Zugriffssteuerungsmodell basieren
   */
  private async getProjectPermissions(project: any): Promise<string[]> {
    if (!project) return [];
    
    // Hier würden wir alle Benutzer-IDs sammeln, die Zugriff haben sollen
    const permissions: string[] = [];
    
    // Projekteigentümer
    if (project.createdBy) {
      permissions.push(project.createdBy.toString());
    }
    
    // In einer echten Implementierung würden wir hier die Projektmitglieder,
    // Mitarbeiter der beteiligten Unternehmen, etc. hinzufügen
    
    // Temporär: Alle existierenden Benutzer haben Zugriff (nur für Demo-Zwecke)
    const allUsers = await db.select({ id: users.id }).from(users);
    allUsers.forEach(user => permissions.push(user.id.toString()));
    
    return [...new Set(permissions)]; // Duplikate entfernen
  }
  
  /**
   * Führt eine Volltextsuche durch
   */
  async search(query: string, options: {
    filters?: {
      entityTypes?: string[];
      sources?: string[];
    };
    pagination?: {
      page: number;
      pageSize: number;
    };
    userId: string;
  }) {
    const { filters, pagination, userId } = options;
    const pageSize = pagination?.pageSize || 20;
    const offset = pagination?.page ? (pagination.page - 1) * pageSize : 0;
    
    // Basisabfrage erstellen
    let dbQuery = db.select({
      id: searchIndex.id,
      entityType: searchIndex.entityType,
      entityId: searchIndex.entityId,
      title: searchIndex.title,
      snippet: sql<string>`ts_headline('german', ${searchIndex.content}, plainto_tsquery('german', ${query}))`,
      source: searchIndex.source,
      metadata: searchIndex.metadata,
      relevance: sql<number>`1.0`,
    })
    .from(searchIndex)
    .where(
      and(
        sql`to_tsvector('german', coalesce(${searchIndex.title}, '') || ' ' || coalesce(${searchIndex.content}, '')) @@ plainto_tsquery('german', ${query})`,
        searchIndex.title.isNotNull()
      )
    )
    .orderBy(sql`1.0 DESC`)
    .limit(pageSize)
    .offset(offset);
    
    // Filter nach Berechtigungen
    // In einer echten Anwendung würde hier eine komplexere Logik implementiert
    dbQuery = dbQuery.where(sql`${userId} = ANY(${searchIndex.permissions})`);
    
    // Nach Entitätstypen filtern
    if (filters?.entityTypes && filters.entityTypes.length > 0) {
      dbQuery = dbQuery.where(inArray(searchIndex.entityType, filters.entityTypes));
    }
    
    // Nach Quellen filtern
    if (filters?.sources && filters.sources.length > 0) {
      dbQuery = dbQuery.where(inArray(searchIndex.source, filters.sources));
    }
    
    // Ergebnisse abrufen
    const results = await dbQuery;
    
    // Gesamtzahl der Ergebnisse für Paginierung ermitteln
    const [{ count }] = await db.select({
      count: sql<number>`count(*)`
    })
    .from(searchIndex)
    .where(
      and(
        sql`to_tsvector('german', coalesce(${searchIndex.title}, '') || ' ' || coalesce(${searchIndex.content}, '')) @@ plainto_tsquery('german', ${query})`,
        sql`${userId} = ANY(${searchIndex.permissions})`)
    );
    
    return {
      results,
      pagination: {
        total: Number(count) || 0,
        page: pagination?.page || 1,
        pageSize,
        totalPages: Math.ceil((Number(count) || 0) / pageSize),
      }
    };
  }
}

// Singleton-Instanz
export const searchIndexer = new SearchIndexer();