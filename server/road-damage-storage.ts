import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { roadDamages, InsertRoadDamage, RoadDamage, RoadDamageStats } from "../shared/schema-road-damage";

/**
 * Storage-Klasse für Straßenschäden
 */
export class RoadDamageStorage {
  /**
   * Einen neuen Straßenschaden erstellen
   */
  async createRoadDamage(data: InsertRoadDamage): Promise<RoadDamage> {
    try {
      const [roadDamage] = await db
        .insert(roadDamages)
        .values(data)
        .returning();
      
      return roadDamage;
    } catch (error) {
      console.error("Fehler beim Erstellen eines Straßenschadens:", error);
      throw new Error("Straßenschaden konnte nicht erstellt werden");
    }
  }
  
  /**
   * Alle Straßenschäden für ein Projekt abrufen
   */
  async getRoadDamagesByProject(projectId: number): Promise<RoadDamage[]> {
    try {
      const result = await db
        .select()
        .from(roadDamages)
        .where(eq(roadDamages.projectId, projectId))
        .orderBy(roadDamages.createdAt);
      
      return result;
    } catch (error) {
      console.error("Fehler beim Abrufen der Straßenschäden für Projekt:", error);
      throw new Error("Straßenschäden konnten nicht abgerufen werden");
    }
  }
  
  /**
   * Einen bestimmten Straßenschaden abrufen
   */
  async getRoadDamage(id: number): Promise<RoadDamage | undefined> {
    try {
      const [result] = await db
        .select()
        .from(roadDamages)
        .where(eq(roadDamages.id, id));
      
      return result;
    } catch (error) {
      console.error("Fehler beim Abrufen eines Straßenschadens:", error);
      throw new Error("Straßenschaden konnte nicht abgerufen werden");
    }
  }
  
  /**
   * Einen Straßenschaden aktualisieren
   */
  async updateRoadDamage(id: number, data: Partial<InsertRoadDamage>): Promise<RoadDamage | undefined> {
    try {
      const [updated] = await db
        .update(roadDamages)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(roadDamages.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error("Fehler beim Aktualisieren eines Straßenschadens:", error);
      throw new Error("Straßenschaden konnte nicht aktualisiert werden");
    }
  }
  
  /**
   * Ein Bild zu einem Straßenschaden hinzufügen
   */
  async addImageToRoadDamage(id: number, imageUrl: string): Promise<RoadDamage | undefined> {
    return this.updateRoadDamage(id, { imageUrl });
  }
  
  /**
   * Eine Audiodatei zu einem Straßenschaden hinzufügen
   */
  async addAudioToRoadDamage(
    id: number, 
    audioUrl: string, 
    audioTranscription?: string
  ): Promise<RoadDamage | undefined> {
    return this.updateRoadDamage(id, { 
      audioUrl,
      audioTranscription: audioTranscription || null
    });
  }
  
  /**
   * Einen Straßenschaden löschen
   */
  async deleteRoadDamage(id: number): Promise<void> {
    try {
      await db
        .delete(roadDamages)
        .where(eq(roadDamages.id, id));
    } catch (error) {
      console.error("Fehler beim Löschen eines Straßenschadens:", error);
      throw new Error("Straßenschaden konnte nicht gelöscht werden");
    }
  }
  
  /**
   * Statistiken zu Straßenschäden für ein Projekt abrufen
   */
  async getRoadDamageStatsByProject(projectId: number): Promise<RoadDamageStats> {
    try {
      const damages = await this.getRoadDamagesByProject(projectId);
      
      // Initiale Werte für die Statistiken
      const stats: RoadDamageStats = {
        totalDamages: damages.length,
        byType: {
          riss: 0,
          schlagloch: 0,
          netzriss: 0,
          verformung: 0,
          ausbruch: 0,
          abplatzung: 0,
          kantenschaden: 0,
          fugenausbruch: 0,
          abnutzung: 0,
          sonstiges: 0,
        },
        bySeverity: {
          leicht: 0,
          mittel: 0,
          schwer: 0,
          kritisch: 0,
        },
        totalEstimatedCost: 0,
      };
      
      // Statistiken berechnen
      damages.forEach((damage) => {
        // Nach Typ zählen
        stats.byType[damage.damageType]++;
        
        // Nach Schweregrad zählen
        stats.bySeverity[damage.severity]++;
        
        // Geschätzte Kosten summieren
        if (damage.estimatedRepairCost) {
          stats.totalEstimatedCost += damage.estimatedRepairCost;
        }
      });
      
      return stats;
    } catch (error) {
      console.error("Fehler beim Abrufen der Straßenschaden-Statistiken:", error);
      throw new Error("Straßenschaden-Statistiken konnten nicht abgerufen werden");
    }
  }
}

export const roadDamageStorage = new RoadDamageStorage();