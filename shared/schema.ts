import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User authentication schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Department enum
export const departmentEnum = pgEnum("department", [
  "it",
  "vertrieb",
  "marketing",
  "personal",
  "finanzen",
  "other"
]);

// Contract type enum
export const contractTypeEnum = pgEnum("contract_type", [
  "vollzeit",
  "teilzeit",
  "befristet",
  "praktikum"
]);

// Gender enum
export const genderEnum = pgEnum("gender", [
  "männlich",
  "weiblich",
  "divers"
]);

// Employee entries schema
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthDate: text("birth_date"),
  gender: text("gender"),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  department: text("department"),
  position: text("position"),
  startDate: text("start_date"),
  contractType: text("contract_type"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  employees: many(employees),
  activities: many(activities),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  creator: one(users, {
    fields: [employees.createdBy],
    references: [users.id],
  }),
}));

// Activities schema for tracking recent actions
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // "add", "edit", "delete"
  entityId: integer("entity_id"), // References an employee ID or other entity
  entityType: text("entity_type").notNull(), // "employee", etc.
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// Schema for data insertion
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Extended validation schema for user registration
export const registerUserSchema = insertUserSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Exported types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
