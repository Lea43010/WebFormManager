import { pgTable, serial, text, timestamp, pgEnum, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enumerationen für Straßenschäden
export const roadDamageTypeEnum = pgEnum("road_damage_type", [
  "riss",
  "schlagloch",
  "netzriss",
  "verformung",
  "ausbruch",
  "abplatzung",
  "kantenschaden",
  "fugenausbruch",
  "abnutzung",
  "sonstiges",
]);

export const damageSeverityEnum = pgEnum("damage_severity", [
  "leicht",
  "mittel",
  "schwer",
  "kritisch",
]);

// Exportiere die Typen für TypeScript
export type RoadDamageType = z.infer<typeof roadDamageTypeSchema>;
export type DamageSeverity = z.infer<typeof damageSeveritySchema>;

// Zod-Schemas für Typen-Validierung
export const roadDamageTypeSchema = z.enum([
  "riss",
  "schlagloch",
  "netzriss",
  "verformung",
  "ausbruch",
  "abplatzung",
  "kantenschaden",
  "fugenausbruch",
  "abnutzung",
  "sonstiges",
]);

export const damageSeveritySchema = z.enum([
  "leicht",
  "mittel",
  "schwer",
  "kritisch",
]);

// Straßenschaden-Tabelle
export const roadDamages = pgTable("tblroad_damages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  damageType: roadDamageTypeEnum("damage_type").notNull().default("sonstiges"),
  severity: damageSeverityEnum("severity").notNull().default("mittel"),
  position: text("position"),
  description: text("description").notNull(),
  recommendedAction: text("recommended_action"),
  imageUrl: text("image_url"),
  audioUrl: text("audio_url"),
  audioTranscription: text("audio_transcription"),
  estimatedRepairCost: integer("estimated_repair_cost"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas für API-Operationen
export const insertRoadDamageSchema = createInsertSchema(roadDamages, {
  projectId: z.number().int().positive(),
  damageType: roadDamageTypeSchema,
  severity: damageSeveritySchema,
  position: z.string().min(0).max(500).optional().nullable(),
  description: z.string().min(1).max(2000),
  recommendedAction: z.string().min(0).max(2000).optional().nullable(),
  imageUrl: z.string().min(0).max(500).optional().nullable(),
  audioUrl: z.string().min(0).max(500).optional().nullable(),
  audioTranscription: z.string().min(0).max(5000).optional().nullable(),
  estimatedRepairCost: z.number().int().nonnegative().optional().nullable(),
  createdBy: z.number().int().positive(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Typen für Frontend/Backend
export type RoadDamage = typeof roadDamages.$inferSelect;
export type InsertRoadDamage = z.infer<typeof insertRoadDamageSchema>;

// Typen für Statistik-Antworten
export type RoadDamageStats = {
  totalDamages: number;
  byType: Record<RoadDamageType, number>;
  bySeverity: Record<DamageSeverity, number>;
  totalEstimatedCost: number;
  averageDamagePerKm?: number;
};