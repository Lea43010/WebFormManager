import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pgTable, serial, text, timestamp, integer, varchar, pgEnum, json } from "drizzle-orm/pg-core";
import { z } from "zod";

// Enum-Definition für die verschiedenen Schadenstypen
export const roadDamageTypeEnum = pgEnum('road_damage_type', [
  'riss',                  // Risse
  'schlagloch',            // Schlaglöcher
  'netzriss',              // Netzrisse
  'verformung',            // Verformungen
  'ausbruch',              // Ausbrüche
  'abplatzung',            // Abplatzungen
  'kantenschaden',         // Kantenschäden
  'fugenausbruch',         // Fugenausbrüche
  'abnutzung',             // Abnutzung
  'sonstiges',             // Sonstige
]);

// Enum-Definition für die Schadensschwere
export const damageSeverityEnum = pgEnum('damage_severity', [
  'leicht',                // Leicht - visuell erkennbar, aber keine sofortige Gefahr
  'mittel',                // Mittel - deutliche Beeinträchtigung, mittelfristig zu reparieren
  'schwer',                // Schwer - erhebliche Beeinträchtigung, zeitnah zu reparieren
  'kritisch',              // Kritisch - unmittelbare Gefahr, sofortige Maßnahmen erforderlich
]);

// Tabelle zur Speicherung von Straßenschäden
export const roadDamages = pgTable('tblroad_damages', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id),
  damageType: roadDamageTypeEnum('damage_type').notNull(),
  severity: damageSeverityEnum('severity').notNull(),
  position: text('position'),  // Beschreibung der Position
  coordinates: json('coordinates'),  // Geo-Koordinaten (Lat, Lng)
  imageUrl: text('image_url'),  // URL zum Bild des Schadens
  description: text('description').notNull(),  // Beschreibung des Schadens
  audioTranscription: text('audio_transcription'),  // Transkribierte Sprachaufnahme
  recommendedAction: text('recommended_action'),  // Empfohlene Maßnahme
  estimatedCost: integer('estimated_cost'),  // Geschätzte Kosten in Euro
  createdBy: integer('created_by').notNull(),  // Benutzer-ID
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

// Referenz auf die Projekttabelle (muss bereits existieren)
import { projects } from "./schema";

// Insert-Schema für die Schadenserfassung
export const insertRoadDamageSchema = createInsertSchema(roadDamages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Select-Schema für die Schadenserfassung
export const selectRoadDamageSchema = createSelectSchema(roadDamages);

// Typen-Definitionen
export type RoadDamage = typeof roadDamages.$inferSelect;
export type InsertRoadDamage = z.infer<typeof insertRoadDamageSchema>;
export type RoadDamageType = typeof roadDamageTypeEnum.enumValues[number];
export type DamageSeverity = typeof damageSeverityEnum.enumValues[number];

// Validierungsschema für die Schadenserfassung mit Spracherkennung
export const roadDamageWithSpeechSchema = insertRoadDamageSchema.extend({
  audioFile: z.any().optional(),  // Enthält die Audio-Datei für die Spracherkennung
});

// Typ für die Schadenserfassung mit Spracherkennung
export type RoadDamageWithSpeech = z.infer<typeof roadDamageWithSpeechSchema>;