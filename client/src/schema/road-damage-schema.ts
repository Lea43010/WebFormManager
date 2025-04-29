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

// Schema für das Erstellen/Bearbeiten eines Straßenschadens im Frontend
export const insertRoadDamageSchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().min(3, { message: "Titel muss mindestens 3 Zeichen lang sein" }).max(255),
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