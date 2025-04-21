import { pgTable, text, serial, integer, boolean, varchar, date, numeric, timestamp, foreignKey, pgEnum, uniqueIndex, doublePrecision, jsonb, time, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Re-export createInsertSchema für Verwendung in routes.ts
export { createInsertSchema };

// Define enums if needed
export const companyTypes = pgEnum('company_types', ['Subunternehmen', 'Generalunternehmen']);
export const fileTypes = pgEnum('file_types', ['pdf', 'excel', 'image', 'other']);
export const belastungsklassenEnum = pgEnum('belastungsklassen', ['Bk100', 'Bk32', 'Bk10', 'Bk3.2', 'Bk1.8', 'Bk1.0', 'Bk0.3', 'unbekannt']);
export const bodenklassenEnum = pgEnum('bodenklassen', ['Kies', 'Sand', 'Lehm', 'Ton', 'Humus', 'Fels', 'Schotter', 'unbekannt']);
export const bodentragfaehigkeitsklassenEnum = pgEnum('bodentragfaehigkeitsklassen', ['F1', 'F2', 'F3', 'unbekannt']);
export const analysisTypeEnum = pgEnum('analysis_types', ['asphalt', 'ground']);
export const fileCategoryEnum = pgEnum('file_categories', ['Verträge', 'Rechnungen', 'Pläne', 'Protokolle', 'Genehmigungen', 'Fotos', 'Analysen', 'Andere']);
export const userRolesEnum = pgEnum('user_roles', ['administrator', 'manager', 'benutzer']);
export const loginEventTypesEnum = pgEnum('login_event_types', ['login', 'logout', 'register', 'failed_login']);
export const verificationTypeEnum = pgEnum('verification_types', ['login', 'password_reset']);
export const incidentTypeEnum = pgEnum('incident_types', ['Arbeitsunfälle', 'Sicherheitsvorkommnisse', 'Schäden', 'Verluste', 'Beschwerden', 'Sonstiges']);

// Users table
export const users = pgTable("tbluser", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("user_name", { length: 100 }),
  email: varchar("user_email", { length: 255 }),
  role: userRolesEnum("role").default('benutzer'),
  createdBy: integer("created_by").references(() => users.id),
  gdprConsent: boolean("gdpr_consent").default(false),
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
  companyPhone: varchar("company_phone", { length: 20 }),
  companyEmail: varchar("company_email", { length: 255 }),
});

// Customers table
export const customers = pgTable("tblcustomer", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  customerId: integer("customer_id", { mode: "number" }),
  customerType: varchar("customer_type", { length: 50 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  street: varchar("street", { length: 255 }),
  houseNumber: varchar("house_number", { length: 10 }),
  addressLine2: varchar("address_line_2", { length: 255 }),
  postalCode: integer("postal_code", { mode: "number" }),
  city: varchar("city", { length: 100 }),
  cityPart: varchar("city_part", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  geodata: varchar("geodate", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
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
  customerContactId: integer("customer_contact_id"), // Neues Feld für den Kunden-Ansprechpartner
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
  projectNotes: text("project_notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Permissions table
export const permissions = pgTable("tblpermissions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  permissionType: varchar("permission_type", { length: 100 }).notNull(),
  permissionAuthority: varchar("permission_authority", { length: 100 }).notNull(),
  permissionDate: date("permission_date"),
  permissionNotes: text("permission_notes"),
  createdAt: timestamp("created_at").defaultNow(),
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
  fileCategory: fileCategoryEnum("file_category").default('Andere'),
  filePath: varchar("file_path", { length: 1000 }).notNull(),
  fileSize: integer("file_size").notNull(),
  // mimeType Spalte existiert nicht in der aktuellen Datenbank
  // mimeType: varchar("mime_type", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  description: text("description"),
  tags: varchar("tags", { length: 500 }),
});

// Bedarfs- und Kapazitätsplanung table
export const bedarfKapa = pgTable("tblBedarfKapa", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  bedarfKapaName: varchar("BedarfKapa_name", { length: 100 }).notNull(),
  bedarfKapaAnzahl: integer("BedarfKapa_Anzahl").notNull(),
  kalenderwoche: integer("kalenderwoche").notNull().default(0), // Kalenderwoche für die Planung (1-53)
  jahr: integer("jahr").notNull().default(new Date().getFullYear()), // Jahr für die Kalenderwoche
  createdAt: timestamp("created_at").defaultNow(),
});

// EWB/FÖB Enum für die Meilenstein-Details
export const ewbFoebEnum = pgEnum('ewb_foeb_type', ['EWB', 'FÖB', 'EWB,FÖB', 'keine']);

// Bauphasen Enum für Meilensteine
export const bauphaseEnum = pgEnum('bauphase_type', [
  'Baustart Tiefbau FÖB',
  'Baustart Tiefbau EWB',
  'Tiefbau EWB',
  'Tiefbau FÖB',
  'Montage NE3 EWB',
  'Montage NE3 FÖB',
  'Endmontage NE4 EWB',
  'Endmontage NE4 FÖB',
  'Sonstiges'
]);

// Meilensteine-Tabelle
export const milestones = pgTable("tblmilestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  startKW: integer("start_kw").notNull(),
  endKW: integer("end_kw").notNull(),
  jahr: integer("jahr").notNull(),
  color: varchar("color", { length: 50 }),
  type: varchar("type", { length: 100 }),
  ewbFoeb: ewbFoebEnum("ewb_foeb").default('keine'),
  bauphase: bauphaseEnum("bauphase").default('Sonstiges'),
  sollMenge: varchar("soll_menge", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meilenstein-Details-Tabelle
export const milestoneDetails = pgTable("tblmilestonedetails", {
  id: serial("id").primaryKey(),
  milestoneId: integer("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
  kalenderwoche: integer("kalenderwoche").notNull(),
  jahr: integer("jahr").notNull(),
  text: varchar("text", { length: 255 }),
  supplementaryInfo: text("supplementary_info"),
  ewbFoeb: ewbFoebEnum("ewb_foeb").default('keine'),
  sollMenge: varchar("soll_menge", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Oberflächenanalyse table
export const surfaceAnalyses = pgTable("tblsurface_analysis", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  locationName: varchar("location_name", { length: 255 }),
  street: varchar("street", { length: 255 }),
  houseNumber: varchar("house_number", { length: 10 }),
  postalCode: varchar("postal_code", { length: 10 }),
  city: varchar("city", { length: 100 }),
  notes: text("notes"),
  imageFilePath: varchar("image_file_path", { length: 1000 }).notNull(),
  visualizationFilePath: varchar("visualization_file_path", { length: 1000 }),
  belastungsklasse: belastungsklassenEnum("belastungsklasse").notNull(),
  asphalttyp: varchar("asphalttyp", { length: 100 }),
  confidence: doublePrecision("confidence"),
  analyseDetails: text("analyse_details"),
  createdAt: timestamp("created_at").defaultNow(),
  // Analyseart (Asphalt oder Boden)
  analysisType: analysisTypeEnum("analysis_type").default('asphalt'),
  // Felder für Bodenanalyse
  bodenklasse: bodenklassenEnum("bodenklasse"),
  bodentragfaehigkeitsklasse: bodentragfaehigkeitsklassenEnum("bodentragfaehigkeitsklasse"),
});

// Bodenreferenztabelle für erweiterte Bodendetails
export const soilReferenceData = pgTable("tblsoil_reference_data", {
  id: serial("id").primaryKey(),
  bodenklasse: bodenklassenEnum("bodenklasse").notNull(),
  bezeichnung: varchar("bezeichnung", { length: 255 }).notNull(),
  beschreibung: text("beschreibung"),
  korngroesse: varchar("korngroesse", { length: 100 }),
  durchlaessigkeit: varchar("durchlaessigkeit", { length: 100 }),
  tragfaehigkeit: bodentragfaehigkeitsklassenEnum("tragfaehigkeit"),
  empfohleneVerdichtung: varchar("empfohlene_verdichtung", { length: 255 }),
  empfohleneBelastungsklasse: belastungsklassenEnum("empfohlene_belastungsklasse"),
  eigenschaften: text("eigenschaften"),
  referenzbildPath: varchar("referenzbild_path", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// File Organization Suggestions table
export const fileOrganizationSuggestions = pgTable("tblfile_organization_suggestion", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  fileIds: text("file_ids"), // Komma-getrennte Liste von Attachment-IDs
  suggestedCategory: fileCategoryEnum("suggested_category"),
  suggestedTags: varchar("suggested_tags", { length: 500 }),
  reason: text("reason"),
  confidence: doublePrecision("confidence"),
  isApplied: boolean("is_applied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  appliedAt: timestamp("applied_at"),
});

// Bautagebuch (Konstruktionstagebuch) table
export const constructionDiaries = pgTable("tblconstruction_diary", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  date: date("date").notNull(),
  employee: varchar("employee", { length: 255 }).notNull(),
  activity: varchar("activity", { length: 500 }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  workHours: numeric("work_hours", { precision: 5, scale: 2 }).notNull(),
  materialUsage: varchar("material_usage", { length: 500 }),
  remarks: text("remarks"),
  incidentType: incidentTypeEnum("incident_type"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
}, (table) => {
  return {
    projectIdIdx: index("construction_diary_project_id_idx").on(table.projectId),
    dateIdx: index("construction_diary_date_idx").on(table.date),
    employeeIdx: index("construction_diary_employee_idx").on(table.employee),
  };
});

// Bautagebuch-Mitarbeiter table
export const constructionDiaryEmployees = pgTable("tblconstruction_diary_employees", {
  id: serial("id").primaryKey(),
  constructionDiaryId: integer("construction_diary_id").notNull().references(() => constructionDiaries.id, { onDelete: 'cascade' }),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
}, (table) => {
  return {
    diaryIdIdx: index("idx_construction_diary_employees_diary_id").on(table.constructionDiaryId),
  };
});

// Login-Logs table - Für die Nachverfolgung aller Anmeldungen und Registrierungen
export const loginLogs = pgTable("tbllogin_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  username: varchar("username", { length: 255 }).notNull(), // Für gescheiterte Anmeldeversuche mit nicht existierenden Benutzern
  eventType: loginEventTypesEnum("event_type").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 kann bis zu 45 Zeichen haben
  userAgent: varchar("user_agent", { length: 500 }),
  timestamp: timestamp("timestamp").defaultNow(),
  success: boolean("success").default(true),
  failReason: text("fail_reason"),
});

// Verification Codes table - Für die Zwei-Faktor-Authentifizierung
export const verificationCodes = pgTable("tblverification_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  code: varchar("code", { length: 10 }).notNull(),
  type: verificationTypeEnum("type").default('login'),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  isValid: boolean("is_valid").default(true),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  createdProjects: many(projects, { relationName: 'createdByUser' }),
  createdUsers: many(users, { relationName: 'createdByAdmin' }),
  loginEvents: many(loginLogs),
  verificationCodes: many(verificationCodes),
}));

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
  customerContact: one(customers, {
    fields: [projects.customerContactId],
    references: [customers.id],
  }),
  createdByUser: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
    relationName: 'createdByUser',
  }),
  components: many(components),
  attachments: many(attachments),
  surfaceAnalyses: many(surfaceAnalyses),
  bedarfKapas: many(bedarfKapa),
  milestones: many(milestones),
  fileOrganizationSuggestions: many(fileOrganizationSuggestions),
  permissions: many(permissions),
  constructionDiaries: many(constructionDiaries),
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

export const surfaceAnalysesRelations = relations(surfaceAnalyses, ({ one }) => ({
  project: one(projects, {
    fields: [surfaceAnalyses.projectId],
    references: [projects.id],
  }),
}));

export const bedarfKapaRelations = relations(bedarfKapa, ({ one }) => ({
  project: one(projects, {
    fields: [bedarfKapa.projectId],
    references: [projects.id],
  }),
}));

export const soilReferenceDataRelations = relations(soilReferenceData, ({}) => ({}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  project: one(projects, {
    fields: [permissions.projectId],
    references: [projects.id],
  }),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  project: one(projects, {
    fields: [milestones.projectId],
    references: [projects.id],
  }),
  details: many(milestoneDetails),
}));

export const milestoneDetailsRelations = relations(milestoneDetails, ({ one }) => ({
  milestone: one(milestones, {
    fields: [milestoneDetails.milestoneId],
    references: [milestones.id],
  }),
}));

export const fileOrganizationSuggestionsRelations = relations(fileOrganizationSuggestions, ({ one }) => ({
  project: one(projects, {
    fields: [fileOrganizationSuggestions.projectId],
    references: [projects.id],
  }),
}));

export const loginLogsRelations = relations(loginLogs, ({ one }) => ({
  user: one(users, {
    fields: [loginLogs.userId],
    references: [users.id],
  }),
}));

export const verificationCodesRelations = relations(verificationCodes, ({ one }) => ({
  user: one(users, {
    fields: [verificationCodes.userId],
    references: [users.id],
  }),
}));

export const constructionDiariesRelations = relations(constructionDiaries, ({ one, many }) => ({
  project: one(projects, {
    fields: [constructionDiaries.projectId],
    references: [projects.id],
  }),
  creator: one(users, {
    fields: [constructionDiaries.createdBy],
    references: [users.id],
  }),
  employees: many(constructionDiaryEmployees)
}));

export const constructionDiaryEmployeesRelations = relations(constructionDiaryEmployees, ({ one }) => ({
  constructionDiary: one(constructionDiaries, {
    fields: [constructionDiaryEmployees.constructionDiaryId],
    references: [constructionDiaries.id],
  }),
  creator: one(users, {
    fields: [constructionDiaryEmployees.createdBy],
    references: [users.id],
  })
}));

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  createdBy: true,
  gdprConsent: true,
});

export const insertCompanySchema = createInsertSchema(companies).transform((data) => {
  return {
    ...data,
    postalCode: typeof data.postalCode === 'string' ? parseInt(data.postalCode, 10) : data.postalCode,
    // Telefonnummer wird jetzt als String gespeichert, keine Umwandlung nötig
  };
});
export const insertCustomerSchema = createInsertSchema(customers).transform((data) => {
  return {
    ...data,
    // customerId kann weggelassen werden, wird vom Server automatisch generiert
    customerId: data.customerId !== undefined ? (typeof data.customerId === 'string' ? parseInt(data.customerId, 10) : data.customerId) : undefined,
    postalCode: typeof data.postalCode === 'string' ? parseInt(data.postalCode, 10) : data.postalCode,
    // Telefonnummer wird jetzt als String gespeichert, keine Umwandlung nötig
  };
});
export const insertPersonSchema = createInsertSchema(persons);
export const insertProjectSchema = createInsertSchema(projects).transform((data) => {
  return {
    ...data,
    projectWidth: typeof data.projectWidth === 'string' ? parseFloat(data.projectWidth) : data.projectWidth,
    projectLength: typeof data.projectLength === 'string' ? parseFloat(data.projectLength) : data.projectLength,
    projectHeight: typeof data.projectHeight === 'string' ? parseFloat(data.projectHeight) : data.projectHeight,
    projectText: typeof data.projectText === 'string' ? parseInt(data.projectText, 10) : data.projectText,
  };
});
export const insertMaterialSchema = createInsertSchema(materials);
export const insertComponentSchema = createInsertSchema(components);
export const insertAttachmentSchema = createInsertSchema(attachments);
export const insertSurfaceAnalysisSchema = createInsertSchema(surfaceAnalyses).transform((data) => {
  return {
    ...data,
    latitude: typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude,
    longitude: typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude,
    confidence: typeof data.confidence === 'string' ? parseFloat(data.confidence) : data.confidence,
  };
});

export const insertBedarfKapaSchema = createInsertSchema(bedarfKapa).transform((data) => {
  return {
    ...data,
    bedarfKapaAnzahl: typeof data.bedarfKapaAnzahl === 'string' ? parseInt(data.bedarfKapaAnzahl, 10) : data.bedarfKapaAnzahl,
    kalenderwoche: typeof data.kalenderwoche === 'string' ? parseInt(data.kalenderwoche, 10) : data.kalenderwoche,
    jahr: typeof data.jahr === 'string' ? parseInt(data.jahr, 10) : data.jahr,
  };
});

export const insertSoilReferenceDataSchema = createInsertSchema(soilReferenceData);

export const insertFileOrganizationSuggestionSchema = createInsertSchema(fileOrganizationSuggestions).transform((data) => {
  return {
    ...data,
    confidence: typeof data.confidence === 'string' ? parseFloat(data.confidence) : data.confidence,
  };
});

export const insertMilestoneSchema = createInsertSchema(milestones, {
  sollMenge: z.string().nullable().optional()
}).transform((data) => {
  return {
    ...data,
    startKW: typeof data.startKW === 'string' ? parseInt(data.startKW, 10) : data.startKW,
    endKW: typeof data.endKW === 'string' ? parseInt(data.endKW, 10) : data.endKW,
    jahr: typeof data.jahr === 'string' ? parseInt(data.jahr, 10) : data.jahr,
  };
});

export const insertMilestoneDetailSchema = createInsertSchema(milestoneDetails, {
  sollMenge: z.string().nullable().optional()
}).transform((data) => {
  return {
    ...data,
    kalenderwoche: typeof data.kalenderwoche === 'string' ? parseInt(data.kalenderwoche, 10) : data.kalenderwoche,
    jahr: typeof data.jahr === 'string' ? parseInt(data.jahr, 10) : data.jahr,
  };
});

export const insertLoginLogSchema = createInsertSchema(loginLogs, {
  failReason: z.string().nullable().optional()
});

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes);

export const insertConstructionDiarySchema = createInsertSchema(constructionDiaries).transform((data) => {
  return {
    ...data,
    workHours: typeof data.workHours === 'string' ? parseFloat(data.workHours) : data.workHours,
    projectId: typeof data.projectId === 'string' ? parseInt(data.projectId, 10) : data.projectId,
  };
});

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

export type InsertSurfaceAnalysis = z.infer<typeof insertSurfaceAnalysisSchema>;
export type SurfaceAnalysis = typeof surfaceAnalyses.$inferSelect;

export type InsertSoilReferenceData = z.infer<typeof insertSoilReferenceDataSchema>;
export type SoilReferenceData = typeof soilReferenceData.$inferSelect;

export type InsertBedarfKapa = z.infer<typeof insertBedarfKapaSchema>;
export type BedarfKapa = typeof bedarfKapa.$inferSelect;

export type InsertFileOrganizationSuggestion = z.infer<typeof insertFileOrganizationSuggestionSchema>;
export type FileOrganizationSuggestion = typeof fileOrganizationSuggestions.$inferSelect;

export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;

export type InsertMilestoneDetail = z.infer<typeof insertMilestoneDetailSchema>;
export type MilestoneDetail = typeof milestoneDetails.$inferSelect;

export type InsertLoginLog = z.infer<typeof insertLoginLogSchema>;
export type LoginLog = typeof loginLogs.$inferSelect;

export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;
export type VerificationCode = typeof verificationCodes.$inferSelect;

export const insertPermissionSchema = createInsertSchema(permissions).transform((data) => {
  return {
    ...data,
    projectId: typeof data.projectId === 'string' ? parseInt(data.projectId, 10) : data.projectId,
  };
});
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

export type InsertConstructionDiary = z.infer<typeof insertConstructionDiarySchema>;
export type ConstructionDiary = typeof constructionDiaries.$inferSelect;

// Erweitertes Zod-Schema für Bautagebuch-Mitarbeiter mit verbesserten Validierungsregeln
export const insertConstructionDiaryEmployeeSchema = createInsertSchema(constructionDiaryEmployees)
  .extend({
    firstName: z.string()
      .min(2, { message: 'Vorname muss mindestens 2 Zeichen lang sein' })
      .max(255, { message: 'Vorname darf maximal 255 Zeichen lang sein' })
      .trim()
      .refine(name => /^[A-Za-zÄäÖöÜüß\s\-']+$/.test(name), { 
        message: 'Vorname enthält ungültige Zeichen. Erlaubt sind nur Buchstaben, Leerzeichen, Bindestriche und Apostrophe.'
      }),
    lastName: z.string()
      .min(2, { message: 'Nachname muss mindestens 2 Zeichen lang sein' })
      .max(255, { message: 'Nachname darf maximal 255 Zeichen lang sein' })
      .trim()
      .refine(name => /^[A-Za-zÄäÖöÜüß\s\-']+$/.test(name), { 
        message: 'Nachname enthält ungültige Zeichen. Erlaubt sind nur Buchstaben, Leerzeichen, Bindestriche und Apostrophe.'
      }),
    position: z.string()
      .max(255, { message: 'Position darf maximal 255 Zeichen lang sein' })
      .optional()
      .transform(val => val === '' ? undefined : val)
  });

export type InsertConstructionDiaryEmployee = z.infer<typeof insertConstructionDiaryEmployeeSchema>;
export type ConstructionDiaryEmployee = typeof constructionDiaryEmployees.$inferSelect;
