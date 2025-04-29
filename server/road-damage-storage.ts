import { db } from "./db";
import { roadDamages } from "@shared/schema-road-damage";
import { eq } from "drizzle-orm";
import type { RoadDamage, InsertRoadDamage } from "@shared/schema-road-damage";

class RoadDamageStorage {
  async getAllRoadDamages(): Promise<RoadDamage[]> {
    return await db.select().from(roadDamages);
  }

  async getRoadDamagesByProject(projectId: number): Promise<RoadDamage[]> {
    return await db.select().from(roadDamages).where(eq(roadDamages.projectId, projectId));
  }

  async getRoadDamage(id: number): Promise<RoadDamage | undefined> {
    const [result] = await db.select().from(roadDamages).where(eq(roadDamages.id, id));
    return result;
  }

  async createRoadDamage(data: InsertRoadDamage): Promise<RoadDamage> {
    const [result] = await db.insert(roadDamages).values(data).returning();
    return result;
  }

  async updateRoadDamage(id: number, data: Partial<InsertRoadDamage>): Promise<RoadDamage | undefined> {
    const [result] = await db
      .update(roadDamages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(roadDamages.id, id))
      .returning();
    return result;
  }

  async deleteRoadDamage(id: number): Promise<boolean> {
    const [result] = await db.delete(roadDamages).where(eq(roadDamages.id, id)).returning();
    return !!result;
  }
}

export const roadDamageStorage = new RoadDamageStorage();