import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Straßenschaden-Typen als Enum
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
  "sonstiges"
]);

// Schadensschweregrad als Enum
export const damageSeverityEnum = pgEnum("damage_severity", [
  "leicht",
  "mittel",
  "schwer",
  "kritisch"
]);

// Tabellendefinition für Straßenschäden
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
  updatedAt: timestamp("updated_at").defaultNow()
});

// Schemas für Zod-Validierung
export const insertRoadDamageSchema = createInsertSchema(roadDamages, {
  projectId: z.number(),
  damageType: z.enum(["riss", "schlagloch", "netzriss", "verformung", "ausbruch", "abplatzung", "kantenschaden", "fugenausbruch", "abnutzung", "sonstiges"]),
  severity: z.enum(["leicht", "mittel", "schwer", "kritisch"]),
  position: z.string().optional(),
  description: z.string().min(1, "Beschreibung ist erforderlich"),
  recommendedAction: z.string().optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  audioTranscription: z.string().optional(),
  estimatedRepairCost: z.number().optional(),
  createdBy: z.number(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Typen
export type RoadDamage = typeof roadDamages.$inferSelect;
export type InsertRoadDamage = z.infer<typeof insertRoadDamageSchema>;
export type RoadDamageType = typeof roadDamageTypeEnum.enumValues[number];
export type DamageSeverity = typeof damageSeverityEnum.enumValues[number];