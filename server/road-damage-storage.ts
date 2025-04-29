import { db } from "./db";
import { 
  roadDamages, 
  RoadDamage,
  InsertRoadDamage,
  RoadDamageType, 
  DamageSeverity 
} from "@shared/schema-road-damage";
import { eq, and, desc } from "drizzle-orm";

/**
 * Funktionen zum Zugriff auf die Straßenschaden-Daten in der Datenbank
 */
export const roadDamageStorage = {
  /**
   * Erstellt einen neuen Straßenschaden in der Datenbank
   * @param data Daten für den neuen Straßenschaden
   * @returns Der erstellte Straßenschaden
   */
  async createRoadDamage(data: InsertRoadDamage): Promise<RoadDamage> {
    try {
      const [roadDamage] = await db
        .insert(roadDamages)
        .values({
          ...data,
          updatedAt: new Date(),
        })
        .returning();
      
      return roadDamage;
    } catch (error) {
      console.error("Fehler beim Erstellen des Straßenschadens:", error);
      throw new Error("Der Straßenschaden konnte nicht erstellt werden.");
    }
  },

  /**
   * Ruft einen Straßenschaden anhand seiner ID ab
   * @param id ID des Straßenschadens
   * @returns Der Straßenschaden oder undefined, wenn nicht gefunden
   */
  async getRoadDamageById(id: number): Promise<RoadDamage | undefined> {
    const [roadDamage] = await db
      .select()
      .from(roadDamages)
      .where(eq(roadDamages.id, id));
    
    return roadDamage;
  },

  /**
   * Ruft alle Straßenschäden für ein Projekt ab
   * @param projectId ID des Projekts
   * @returns Liste der Straßenschäden
   */
  async getRoadDamagesByProjectId(projectId: number): Promise<RoadDamage[]> {
    return db
      .select()
      .from(roadDamages)
      .where(eq(roadDamages.projectId, projectId))
      .orderBy(desc(roadDamages.createdAt));
  },

  /**
   * Aktualisiert einen bestehenden Straßenschaden
   * @param id ID des Straßenschadens
   * @param data Zu aktualisierende Daten
   * @returns Der aktualisierte Straßenschaden
   */
  async updateRoadDamage(id: number, data: Partial<InsertRoadDamage>): Promise<RoadDamage> {
    const [updatedRoadDamage] = await db
      .update(roadDamages)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(roadDamages.id, id))
      .returning();
    
    return updatedRoadDamage;
  },

  /**
   * Löscht einen Straßenschaden
   * @param id ID des Straßenschadens
   * @returns true, wenn erfolgreich gelöscht
   */
  async deleteRoadDamage(id: number): Promise<boolean> {
    const result = await db
      .delete(roadDamages)
      .where(eq(roadDamages.id, id));
    
    return true;
  },

  /**
   * Ruft Straßenschäden nach Typ und Schweregrad ab
   * @param projectId ID des Projekts
   * @param damageType Schadenstyp
   * @param severity Schweregrad
   * @returns Liste der Straßenschäden
   */
  async getRoadDamagesByTypeAndSeverity(
    projectId: number,
    damageType?: RoadDamageType,
    severity?: DamageSeverity
  ): Promise<RoadDamage[]> {
    let query = db
      .select()
      .from(roadDamages)
      .where(eq(roadDamages.projectId, projectId));
    
    if (damageType) {
      query = query.where(eq(roadDamages.damageType, damageType));
    }
    
    if (severity) {
      query = query.where(eq(roadDamages.severity, severity));
    }
    
    return query.orderBy(desc(roadDamages.createdAt));
  },

  /**
   * Zählt die Anzahl der Straßenschäden nach Typ
   * @param projectId ID des Projekts
   * @returns Eine Map mit der Anzahl der Schäden pro Typ
   */
  async countDamagesByType(projectId: number): Promise<Record<RoadDamageType, number>> {
    const result = await db.execute<{ damage_type: RoadDamageType, count: number }>`
      SELECT damage_type, COUNT(*) as count
      FROM ${roadDamages}
      WHERE project_id = ${projectId}
      GROUP BY damage_type
    `;
    
    // Initialisiere das Ergebnis mit 0 für alle Typen
    const counts: Record<RoadDamageType, number> = {
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
    };
    
    // Fülle mit den tatsächlichen Zahlen
    result.rows.forEach(row => {
      counts[row.damage_type] = Number(row.count);
    });
    
    return counts;
  },

  /**
   * Zählt die Anzahl der Straßenschäden nach Schweregrad
   * @param projectId ID des Projekts
   * @returns Eine Map mit der Anzahl der Schäden pro Schweregrad
   */
  async countDamagesBySeverity(projectId: number): Promise<Record<DamageSeverity, number>> {
    const result = await db.execute<{ severity: DamageSeverity, count: number }>`
      SELECT severity, COUNT(*) as count
      FROM ${roadDamages}
      WHERE project_id = ${projectId}
      GROUP BY severity
    `;
    
    // Initialisiere das Ergebnis mit 0 für alle Schweregrade
    const counts: Record<DamageSeverity, number> = {
      leicht: 0,
      mittel: 0,
      schwer: 0,
      kritisch: 0,
    };
    
    // Fülle mit den tatsächlichen Zahlen
    result.rows.forEach(row => {
      counts[row.severity] = Number(row.count);
    });
    
    return counts;
  }
};