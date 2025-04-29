import { 
  pgTable, serial, text, varchar, timestamp, integer, 
  boolean, real, uuid, json, date
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Road damage severity enum
export const roadDamageSeverityEnum = ["gering", "mittel", "hoch", "kritisch"] as const;

// Road damage type enum
export const roadDamageTypeEnum = [
  "riss", 
  "schlagloch", 
  "abplatzung", 
  "spurrinne", 
  "absenkung", 
  "aufbruch", 
  "frostschaden", 
  "sonstiges"
] as const;

// Road damage repair status enum
export const repairStatusEnum = [
  "offen", 
  "geplant", 
  "in_bearbeitung", 
  "abgeschlossen"
] as const;

// Define the road damages table
export const roadDamages = pgTable("tblroad_damages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  severity: varchar("severity", { length: 50 }).$type<typeof roadDamageSeverityEnum[number]>(),
  damageType: varchar("damage_type", { length: 50 }).$type<typeof roadDamageTypeEnum[number]>(),
  location: varchar("location", { length: 255 }),
  coordinates: json("coordinates").$type<{ lat: number, lng: number }>(),
  imageUrl: varchar("image_url", { length: 1024 }),
  voiceNoteUrl: varchar("voice_note_url", { length: 1024 }),
  areaSize: real("area_size"), // in square meters
  repairStatus: varchar("repair_status", { length: 50 }).$type<typeof repairStatusEnum[number]>().default("offen"),
  estimatedRepairCost: real("estimated_repair_cost"),
  repairDueDate: date("repair_due_date"),
  repairPriority: integer("repair_priority"), // from 1 (low) to 10 (high)
  createdBy: integer("created_by"),
  assignedTo: integer("assigned_to"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  additionalData: json("additional_data")
});

// Create schemas
const insertBaseSchema = createInsertSchema(roadDamages, {
  projectId: z.number().int().positive(),
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  severity: z.enum(roadDamageSeverityEnum).optional(),
  damageType: z.enum(roadDamageTypeEnum).optional(),
  location: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  imageUrl: z.string().optional(),
  voiceNoteUrl: z.string().optional(),
  areaSize: z.number().positive().optional(),
  repairStatus: z.enum(repairStatusEnum).optional(),
  estimatedRepairCost: z.number().positive().optional(),
  repairDueDate: z.coerce.date().optional(),
  repairPriority: z.number().int().min(1).max(10).optional(),
  createdBy: z.number().optional(),
  assignedTo: z.number().optional(),
  additionalData: z.any().optional()
});

// Omit auto-generated fields from insert schema
export const insertRoadDamageSchema = insertBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type RoadDamage = typeof roadDamages.$inferSelect;
export type InsertRoadDamage = z.infer<typeof insertRoadDamageSchema>;