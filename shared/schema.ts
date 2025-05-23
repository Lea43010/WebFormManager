import { pgTable, text, serial, integer, boolean, varchar, date, numeric, timestamp, foreignKey, pgEnum, uniqueIndex, doublePrecision, jsonb, time, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";

// Re-export createInsertSchema für Verwendung in routes.ts
export { createInsertSchema };

// Define subscription-related enums
export const subscriptionStatusEnum = pgEnum('subscription_status', ['trial', 'active', 'expired', 'cancelled', 'past_due']);
export const subscriptionIntervalEnum = pgEnum('subscription_interval', ['month', 'year']);

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
  createdBy: integer("created_by"), // Die Referenz wird später über relations hinzugefügt
  gdprConsent: boolean("gdpr_consent").default(false),
  // Neue Felder für das Abonnement-System
  registrationDate: date("registration_date"),
  trialEndDate: date("trial_end_date"),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default('trial'),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  lastPaymentDate: date("last_payment_date"),
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
  postalCode: integer("postal_code"),
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
  customerId: integer("customer_id"),
  customerType: varchar("customer_type", { length: 50 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  street: varchar("street", { length: 255 }),
  houseNumber: varchar("house_number", { length: 10 }),
  addressLine2: varchar("address_line_2", { length: 255 }),
  postalCode: integer("postal_code"),
  city: varchar("city", { length: 100 }),
  cityPart: varchar("city_part", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  geodate: varchar("geodate", { length: 255 }),
  created_by: integer("created_by").references(() => users.id),
});

// Persons table
export const persons = pgTable("tblperson", {
  id: serial("id").primaryKey(),
  personId: integer("person_id"),
  projectId: integer("project_id"),
  companyId: integer("company_id"),
  professionalName: integer("professional_name"),
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
  projectText: integer("project_text"),
  projectStartdate: date("project_startdate"),
  projectEnddate: date("project_enddate"),
  projectStop: boolean("project_stop").default(false),
  projectStopstartdate: date("project_stopstartdate"),
  projectStopenddate: date("project_stopenddate"),
  projectNotes: text("project_notes"),
  // Geo-Informationen
  projectLatitude: numeric("project_latitude", { precision: 10, scale: 7 }),
  projectLongitude: numeric("project_longitude", { precision: 10, scale: 7 }),
  projectAddress: text("project_address"),
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
  materialName: integer("material_name"),
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
  // Neue Felder für Bildoptimierung
  originalSize: integer("original_size"),
  optimizedSize: integer("optimized_size"),
  optimizationSavings: integer("optimization_savings"),
  originalFormat: varchar("original_format", { length: 20 }),
  webpPath: varchar("webp_path", { length: 1000 }),
  isOptimized: boolean("is_optimized").default(false),
  // Status der Datei
  fileMissing: boolean("file_missing").default(false),
  // Neue Felder für den verbesserten Dokumentenspeicher
  fileStorage: varchar("file_storage", { length: 50 }),
  isPublic: boolean("is_public").default(false),
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

// Abonnementpläne-Tabelle - Speichert die verfügbaren Abonnementpläne
export const subscriptionPlans = pgTable("tblsubscription_plans", {
  id: serial("id").primaryKey(),
  planId: varchar("plan_id", { length: 100 }).notNull().unique(), // z.B. 'basic', 'professional', 'enterprise'
  name: varchar("name", { length: 100 }).notNull(), // z.B. 'Basis', 'Professional', 'Enterprise'
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  interval: subscriptionIntervalEnum("interval").default('month').notNull(),
  features: text("features").notNull(), // JSON-String mit Features-Array
  stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Benutzer-Abonnements-Tabelle - Verbindet Benutzer mit ihren Abonnements
export const userSubscriptions = pgTable("tbluser_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum("status").default('trial').notNull(),
  planId: varchar("plan_id", { length: 100 }), // Referenz auf subscriptionPlans.planId
  trialEndDate: timestamp("trial_end_date"),
  lastPaymentDate: timestamp("last_payment_date"),
  nextPaymentDate: timestamp("next_payment_date"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export const usersRelations = relations(users, ({ many, one }) => ({
  createdProjects: many(projects, { relationName: 'createdByUser' }),
  createdUsers: many(users, { relationName: 'createdByAdmin' }),
  loginEvents: many(loginLogs),
  verificationCodes: many(verificationCodes),
  subscription: one(userSubscriptions, {
    fields: [users.id],
    references: [userSubscriptions.userId],
  }),
}));

// Relations für SubscriptionPlans und UserSubscriptions
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  userSubscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.planId],
  }),
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
export const insertUserSchema = createInsertSchema(users)
  .extend({
    // Explicitly add gdprConsent field to schema with validation
    gdprConsent: z.boolean().refine(value => value === true, {
      message: "Sie müssen den Datenschutzbestimmungen zustimmen, um sich zu registrieren"
    }),
  })
  .transform(data => {
    // Setze das Ende der Testphase automatisch auf 4 Wochen ab jetzt
    const fourWeeksFromNow = new Date();
    fourWeeksFromNow.setDate(fourWeeksFromNow.getDate() + 28);
    
    return {
      ...data,
      trialEndDate: data.trialEndDate || fourWeeksFromNow,
      subscriptionStatus: data.subscriptionStatus || 'trial',
    };
  });

// Insert-Schema für Abonnementpläne
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).transform((data) => {
  return {
    ...data,
    features: data.features || '[]', // Leeres Features-Array als Standard
    isActive: data.isActive ?? true,
    sortOrder: data.sortOrder || 0,
  };
});

// Insert-Schema für Benutzer-Abonnements
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).transform((data) => {
  return {
    ...data,
    status: data.status || 'trial',
    cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
  };
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
    created_by: data.created_by !== undefined ? (typeof data.created_by === 'string' ? parseInt(data.created_by, 10) : data.created_by) : undefined,
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
export const insertAttachmentSchema = createInsertSchema(attachments).transform((data) => {
  return {
    ...data,
    // Umwandlung für die Bildoptimierungsfelder
    originalSize: data.originalSize !== undefined ? (typeof data.originalSize === 'string' ? parseInt(data.originalSize, 10) : data.originalSize) : undefined,
    optimizedSize: data.optimizedSize !== undefined ? (typeof data.optimizedSize === 'string' ? parseInt(data.optimizedSize, 10) : data.optimizedSize) : undefined,
    optimizationSavings: data.optimizationSavings !== undefined ? (typeof data.optimizationSavings === 'string' ? parseInt(data.optimizationSavings, 10) : data.optimizationSavings) : undefined,
    isOptimized: data.isOptimized !== undefined ? (typeof data.isOptimized === 'string' ? data.isOptimized === 'true' : data.isOptimized) : false
  };
});
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

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

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

// Dokumenten-Synchronisations Tabelle
// ==========================================

// Enum für externe Systeme
export const externalSystemEnum = pgEnum('external_system_type', ['bau_structura', 'google_drive', 'onedrive', 'dropbox', 'sharepoint', 'andere']);

// Enum für Synchronisationsstatus
export const syncStatusEnum = pgEnum('sync_status_type', ['synced', 'pending', 'conflict', 'error']);

// Synchronisierte Dokumente
export const syncedDocuments = pgTable("tblsynced_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  path: text("path"),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  lastModified: timestamp("last_modified").notNull(),
  lastSynced: timestamp("last_synced").notNull(),
  externalId: text("external_id"),
  externalSystem: externalSystemEnum("external_system").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  ownerId: varchar("owner_id").references(() => users.id),
  syncStatus: syncStatusEnum("sync_status").notNull().default('pending'),
  checksum: text("checksum"), // Für Änderungserkennung
  metadata: jsonb("metadata"), // Flexibles Feld für systemspezifische Metadaten
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    projectIdIdx: index("synced_docs_project_id_idx").on(table.projectId),
    externalSystemIdx: index("synced_docs_external_system_idx").on(table.externalSystem),
    syncStatusIdx: index("synced_docs_sync_status_idx").on(table.syncStatus),
  };
});

// Dokumentversionen
export const documentVersions = pgTable("tbldocument_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => syncedDocuments.id, { onDelete: 'cascade' }),
  versionNumber: integer("version_number").notNull(),
  size: integer("size").notNull(),
  checksum: text("checksum").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  comment: text("comment"),
}, (table) => {
  return {
    documentIdIdx: index("document_versions_doc_id_idx").on(table.documentId),
  };
});

// Synchronisations-Logs
export const syncLogs = pgTable("tblsync_logs", {
  id: serial("id").primaryKey(),
  documentId: uuid("document_id").references(() => syncedDocuments.id, { onDelete: 'cascade' }),
  operation: varchar("operation", { length: 50 }).notNull(), // pull, push, conflict
  status: varchar("status", { length: 50 }).notNull(), // success, error
  message: text("message"),
  timestamp: timestamp("timestamp").defaultNow(),
  userId: varchar("user_id").references(() => users.id),
});

// Universeller Suchindex
// ==========================================

// Tabelle für Suchindex (verwendet PostgreSQL TSVECTOR für Volltextsuche)
export const searchIndex = pgTable("tblsearch_index", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // project, document, user, etc.
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  title: text("title").notNull(),
  content: text("content"),
  metadata: jsonb("metadata"),
  tsVector: text("ts_vector"),
  permissions: text("permissions").array(), // Wer darf dieses Element sehen?
  source: varchar("source", { length: 50 }).notNull(), // bau-structura, google, slack, etc.
  lastIndexed: timestamp("last_indexed").defaultNow(),
}, (table) => {
  return {
    entityTypeIdIdx: index("search_idx_entity_type_id").on(table.entityType, table.entityId),
    tsVectorIdx: index("search_idx_tsvector").on(table.tsVector),
  };
});

// Relations für Dokumenten-Synchronisation
export const documentRelations = relations(syncedDocuments, ({ one, many }) => ({
  project: one(projects, {
    fields: [syncedDocuments.projectId],
    references: [projects.id],
  }),
  owner: one(users, {
    fields: [syncedDocuments.ownerId],
    references: [users.id],
  }),
  versions: many(documentVersions),
  syncLogs: many(syncLogs),
}));

export const documentVersionRelations = relations(documentVersions, ({ one }) => ({
  document: one(syncedDocuments, {
    fields: [documentVersions.documentId],
    references: [syncedDocuments.id],
  }),
  creator: one(users, {
    fields: [documentVersions.createdBy],
    references: [users.id],
  }),
}));

export const syncLogRelations = relations(syncLogs, ({ one }) => ({
  document: one(syncedDocuments, {
    fields: [syncLogs.documentId],
    references: [syncedDocuments.id],
  }),
  user: one(users, {
    fields: [syncLogs.userId],
    references: [users.id],
  }),
}));

// Insert-Schemas für die neuen Tabellen
export const insertSyncedDocumentSchema = createInsertSchema(syncedDocuments)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSyncedDocument = z.infer<typeof insertSyncedDocumentSchema>;
export type SyncedDocument = typeof syncedDocuments.$inferSelect;

export const insertDocumentVersionSchema = createInsertSchema(documentVersions)
  .omit({ id: true, createdAt: true });
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;

export const insertSyncLogSchema = createInsertSchema(syncLogs)
  .omit({ id: true, timestamp: true });
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
export type SyncLog = typeof syncLogs.$inferSelect;

export const insertSearchIndexSchema = createInsertSchema(searchIndex)
  .omit({ id: true, tsVector: true, lastIndexed: true });
export type InsertSearchIndex = z.infer<typeof insertSearchIndexSchema>;
export type SearchIndex = typeof searchIndex.$inferSelect;
