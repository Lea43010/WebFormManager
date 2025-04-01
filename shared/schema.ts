import { pgTable, text, serial, integer, boolean, varchar, date, numeric, timestamp, foreignKey, pgEnum, uniqueIndex, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define enums if needed
export const companyTypes = pgEnum('company_types', ['Dienstleistung', 'Produktion', 'Handel', 'Sonstige']);
export const fileTypes = pgEnum('file_types', ['pdf', 'excel', 'image', 'other']);

// Users table
export const users = pgTable("tbluser", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("user_name", { length: 100 }),
  email: varchar("user_email", { length: 255 }),
});

// Companies table
export const companies = pgTable("tblcompany", {
  id: serial("company_id").primaryKey(),
  projectId: integer("project_id"),
  companyArt: varchar("company_art", { length: 100 }),
  companyName: varchar("company_name", { length: 255 }),
  street: varchar("street", { length: 255 }),
  houseNumber: varchar("house_number", { length: 10 }),
  addressLine2: varchar("address_line_2", { length: 255 }),
  postalCode: integer("postal_code", { mode: "number" }),
  city: varchar("city", { length: 100 }),
  cityPart: varchar("city_part", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  companyPhone: integer("company_phone", { mode: "number" }),
  companyEmail: varchar("company_email", { length: 255 }),
});

// Customers table
export const customers = pgTable("tblcustomer", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  customerId: integer("customer_id", { mode: "number" }),
  street: varchar("street", { length: 255 }),
  houseNumber: varchar("house_number", { length: 10 }),
  addressLine2: varchar("address_line_2", { length: 255 }),
  postalCode: integer("postal_code", { mode: "number" }),
  city: varchar("city", { length: 100 }),
  cityPart: varchar("city_part", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  geodata: varchar("geodate", { length: 255 }),
  customerPhone: integer("customer_phone", { mode: "number" }),
  customerEmail: varchar("customer_email", { length: 255 }),
});

// Persons table
export const persons = pgTable("tblperson", {
  id: serial("id").primaryKey(),
  personId: integer("person_id", { mode: "number" }),
  projectId: integer("project_id"),
  companyId: integer("company_id"),
  professionalName: integer("professional_name", { mode: "number" }),
  firstname: varchar("firstname", { length: 100 }),
  lastname: varchar("lastname", { length: 100 }),
});

// Projects table
export const projects = pgTable("tblproject", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  customerId: integer("customer_id"),
  companyId: integer("company_id"),
  personId: integer("person_id"),
  permission: boolean("permission").default(false),
  permissionName: varchar("permission_name", { length: 100 }),
  projectCluster: varchar("project_cluster", { length: 255 }),
  projectName: varchar("project_name", { length: 255 }),
  projectArt: varchar("project_art", { length: 50 }),
  projectWidth: numeric("project_width", { precision: 10, scale: 2 }),
  projectLength: numeric("project_length", { precision: 10, scale: 2 }),
  projectHeight: numeric("project_height", { precision: 10, scale: 2 }),
  projectText: integer("project_text", { mode: "number" }),
  projectStartdate: date("project_startdate"),
  projectEnddate: date("project_enddate"),
  projectStop: boolean("project_stop").default(false),
  projectStopstartdate: date("project_stopstartdate"),
  projectStopenddate: date("project_stopenddate"),
});

// Materials table
export const materials = pgTable("tblmaterial", {
  id: serial("id").primaryKey(),
  materialId: varchar("material_id", { length: 1000 }),
  materialName: integer("material_name", { mode: "number" }),
  materialAmount: doublePrecision("material_amount"),
  materialPrice: doublePrecision("material_price"),
  materialTotal: doublePrecision("material_total"),
});

// Components table
export const components = pgTable("tblcomponent", {
  id: serial("id").primaryKey(),
  componentId: varchar("component_id", { length: 1000 }),
  projectId: integer("project_id"),
  componentName: varchar("component_name", { length: 1000 }),
});

// Attachments table
export const attachments = pgTable("tblattachment", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileType: fileTypes("file_type").notNull(),
  filePath: varchar("file_path", { length: 1000 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull(),
  uploadDate: timestamp("upload_date").defaultNow(),
  description: varchar("description", { length: 1000 }),
});

// Define relations
export const companiesRelations = relations(companies, ({ many, one }) => ({
  projects: many(projects),
  persons: many(persons),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  projects: many(projects),
}));

export const personsRelations = relations(persons, ({ one }) => ({
  company: one(companies, {
    fields: [persons.companyId],
    references: [companies.id],
  }),
  project: one(projects, {
    fields: [persons.projectId],
    references: [projects.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  customer: one(customers, {
    fields: [projects.customerId],
    references: [customers.id],
  }),
  company: one(companies, {
    fields: [projects.companyId],
    references: [companies.id],
  }),
  person: one(persons, {
    fields: [projects.personId],
    references: [persons.id],
  }),
  components: many(components),
  attachments: many(attachments),
}));

export const componentsRelations = relations(components, ({ one }) => ({
  project: one(projects, {
    fields: [components.projectId],
    references: [projects.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  project: one(projects, {
    fields: [attachments.projectId],
    references: [projects.id],
  }),
}));

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

export const insertCompanySchema = createInsertSchema(companies);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertPersonSchema = createInsertSchema(persons);
export const insertProjectSchema = createInsertSchema(projects);
export const insertMaterialSchema = createInsertSchema(materials);
export const insertComponentSchema = createInsertSchema(components);
export const insertAttachmentSchema = createInsertSchema(attachments);

// Create types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof persons.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type Component = typeof components.$inferSelect;

export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;
