import { db } from "./db";
import { eq, desc, gte, sql, asc, inArray } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// Definieren eines Typs für die SessionStore-Klasse
const PostgresSessionStore = connectPgSimple(session);
import { 
  users, type User, type InsertUser,
  companies, type Company, type InsertCompany,
  customers, type Customer, type InsertCustomer,
  persons, type Person, type InsertPerson,
  projects, type Project, type InsertProject,
  materials, type Material, type InsertMaterial,
  components, type Component, type InsertComponent,
  attachments, type Attachment, type InsertAttachment,
  surfaceAnalyses, type SurfaceAnalysis, type InsertSurfaceAnalysis,
  soilReferenceData, type SoilReferenceData, type InsertSoilReferenceData,
  bedarfKapa, type BedarfKapa, type InsertBedarfKapa,
  milestones, type Milestone, type InsertMilestone,
  milestoneDetails, type MilestoneDetail, type InsertMilestoneDetail,
  loginLogs, type LoginLog, type InsertLoginLog,
  verificationCodes, type VerificationCode, type InsertVerificationCode,
  permissions, type Permission, type InsertPermission,
  constructionDiaries, type ConstructionDiary, type InsertConstructionDiary,
  constructionDiaryEmployees, type ConstructionDiaryEmployee, type InsertConstructionDiaryEmployee,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  userSubscriptions, type UserSubscription, type InsertUserSubscription
} from "@shared/schema";

// PostgresSessionStore wurde oben definiert

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getRecentUsers(limit: number): Promise<User[]>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  invalidateUserCache(userId: number): void;
  
  // Subscription Plan operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(planId: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(planId: string): Promise<void>;
  
  // User Subscription operations
  getUserSubscription(userId: number): Promise<UserSubscription | undefined>;
  getUserSubscriptionByStripeId(stripeSubscriptionId: string): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: number, subscription: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined>;
  deleteUserSubscription(id: number): Promise<void>;

  // Company operations
  getCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<void>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<void>;

  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  // Permission operations
  getPermissions(projectId: number): Promise<Permission[]>;
  getPermission(id: number): Promise<Permission | undefined>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  deletePermission(id: number): Promise<void>;

  // Material operations
  getMaterials(): Promise<Material[]>;
  getMaterial(id: number): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: number): Promise<void>;

  // Component operations
  getComponents(): Promise<Component[]>;
  getComponent(id: number): Promise<Component | undefined>;
  createComponent(component: InsertComponent): Promise<Component>;
  updateComponent(id: number, component: Partial<InsertComponent>): Promise<Component | undefined>;
  deleteComponent(id: number): Promise<void>;

  // Person operations
  getPersons(): Promise<Person[]>;
  getPerson(id: number): Promise<Person | undefined>;
  createPerson(person: InsertPerson): Promise<Person>;
  updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined>;
  deletePerson(id: number): Promise<void>;

  // Attachment operations
  getProjectAttachments(projectId: number): Promise<Attachment[]>;
  getAllAttachments(): Promise<Attachment[]>;
  getAttachmentsByProjects(projectIds: number[]): Promise<Attachment[]>;
  getAttachment(id: number): Promise<Attachment | undefined>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: number): Promise<void>;
  markAttachmentFileMissing(id: number): Promise<Attachment | undefined>;
  resetAttachmentFileMissing(id: number): Promise<Attachment | undefined>;
  getAllAttachments(): Promise<Attachment[]>;
  markAttachmentAsMissing(id: number): Promise<void>;
  updateAttachmentPath(id: number, data: {
    filePath: string,
    fileStorage?: string,
    isPublic?: boolean,
    fileMissing?: boolean
  }): Promise<Attachment | undefined>;

  // Surface Analysis operations
  getSurfaceAnalyses(projectId: number): Promise<SurfaceAnalysis[]>;
  getSurfaceAnalysisByLocation(latitude: number, longitude: number): Promise<SurfaceAnalysis | undefined>;
  getSurfaceAnalysis(id: number): Promise<SurfaceAnalysis | undefined>;
  createSurfaceAnalysis(analysis: InsertSurfaceAnalysis): Promise<SurfaceAnalysis>;
  deleteSurfaceAnalysis(id: number): Promise<void>;

  // Soil Reference Data operations
  getSoilReferenceData(): Promise<SoilReferenceData[]>;
  getSoilReferenceDataByBodenklasse(bodenklasse: string): Promise<SoilReferenceData | undefined>;
  getSoilReferenceDataById(id: number): Promise<SoilReferenceData | undefined>;
  createSoilReferenceData(data: InsertSoilReferenceData): Promise<SoilReferenceData>;
  updateSoilReferenceData(id: number, data: Partial<InsertSoilReferenceData>): Promise<SoilReferenceData | undefined>;
  deleteSoilReferenceData(id: number): Promise<void>;

  // Projekt Analysis Overview
  getProjectAnalyses(projectId: number): Promise<SurfaceAnalysis[]>;

  // BedarfKapa operations
  getBedarfKapas(projectId: number): Promise<BedarfKapa[]>;
  getBedarfKapa(id: number): Promise<BedarfKapa | undefined>;
  createBedarfKapa(data: InsertBedarfKapa): Promise<BedarfKapa>;
  deleteBedarfKapa(id: number): Promise<void>;

  // Milestone operations
  getMilestones(projectId: number): Promise<Milestone[]>;
  getMilestone(id: number): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: number): Promise<void>;

  // Milestone Detail operations
  getMilestoneDetails(milestoneId: number): Promise<MilestoneDetail[]>;
  getMilestoneDetail(id: number): Promise<MilestoneDetail | undefined>;
  createMilestoneDetail(detail: InsertMilestoneDetail): Promise<MilestoneDetail>;
  updateMilestoneDetail(id: number, detail: Partial<InsertMilestoneDetail>): Promise<MilestoneDetail | undefined>;
  deleteMilestoneDetail(id: number): Promise<void>;

  // Login Logs operations
  getLoginLogs(): Promise<LoginLog[]>;
  getLoginLogsByUser(userId: number): Promise<LoginLog[]>;
  createLoginLog(log: InsertLoginLog): Promise<LoginLog>;

  // Verification Codes operations
  createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode>;
  getVerificationCode(code: string): Promise<VerificationCode | undefined>;
  getActiveVerificationCodesByUser(userId: number): Promise<VerificationCode[]>;
  invalidateVerificationCode(id: number): Promise<void>;
  markVerificationCodeAsUsed(id: number): Promise<void>;

  // Construction Diary operations
  getConstructionDiaries(projectId: number): Promise<ConstructionDiary[]>;
  getConstructionDiary(id: number): Promise<ConstructionDiary | undefined>;
  createConstructionDiary(diary: InsertConstructionDiary): Promise<ConstructionDiary>;
  updateConstructionDiary(id: number, diary: Partial<InsertConstructionDiary>): Promise<ConstructionDiary | undefined>;
  deleteConstructionDiary(id: number): Promise<void>;

  // Construction Diary Employees operations
  getConstructionDiaryEmployees(diaryId: number): Promise<ConstructionDiaryEmployee[]>;
  findSimilarEmployees(params: { firstName: string, lastName: string, constructionDiaryId: number }): Promise<ConstructionDiaryEmployee[]>;
  createConstructionDiaryEmployee(employee: InsertConstructionDiaryEmployee): Promise<ConstructionDiaryEmployee>;
  updateConstructionDiaryEmployee(id: number, employee: Partial<InsertConstructionDiaryEmployee>): Promise<ConstructionDiaryEmployee | undefined>;
  deleteConstructionDiaryEmployee(id: number): Promise<void>;

  // Session store
  sessionStore: session.Store;
}

// Import des Benutzer-Cache-Service
import { userCache } from './user-cache';

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }
  
  // Hilfsmethode zur sicheren Umwandlung von Objekten für Drizzle-Inserts
  private prepareDataForInsert<T extends Record<string, any>>(data: T): any[] {
    // Erstelle ein neues Objekt für die Typkonvertierung
    const preparedData: Record<string, any> = {};
    
    // Wandle Daten sicher für Drizzle um
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        preparedData[key] = value.toISOString();
      } else if (typeof value === 'number') {
        if (['workHours'].includes(key)) {
          // Numerische Felder, die Strings sein sollten
          preparedData[key] = value.toString();
        } else if (['latitude', 'longitude', 'confidence'].includes(key)) {
          // Numerische Felder, die numerisch bleiben sollen
          preparedData[key] = value;
        } else {
          // Standardverhalten für andere numerische Felder
          preparedData[key] = value;
        }
      } else {
        preparedData[key] = value;
      }
    }
    
    // Zusätzliche Prüfungen für erforderliche Felder je nach Objekttyp
    if ('latitude' in data && 'longitude' in data && !('imageFilePath' in preparedData)) {
      // Wenn erforderliche Felder für SurfaceAnalysis fehlen, füge Standardwerte hinzu
      preparedData.imageFilePath = preparedData.imageFilePath || '';
    } else if ('date' in data && 'employee' in data && !('activity' in preparedData)) {
      // Wenn erforderliche Felder für ConstructionDiary fehlen, füge Standardwerte hinzu
      preparedData.activity = preparedData.activity || '';
    }
    
    // Zurückgeben als Array mit einem Element
    return [preparedData];
  }

  // Neue Cache-Invalidierungs-Methode
  invalidateUserCache(userId: number): void {
    userCache.invalidate(userId);
  }

  // Optimierte User operations mit Cache
  async getUser(id: number): Promise<User | undefined> {
    // Erst im Cache nachsehen
    const cachedUser = userCache.get(id);
    if (cachedUser) {
      return cachedUser;
    }

    // Falls nicht im Cache, aus der Datenbank holen
    const [user] = await db.select().from(users).where(eq(users.id, id)) as User[];
    
    // Im Cache speichern, falls gefunden
    if (user) {
      userCache.set(user);
    }
    
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Kein Cache für die Benutzersuche nach Benutzername, da dies hauptsächlich bei der Anmeldung verwendet wird
    // und es wichtig ist, die aktuellsten Daten zu haben
    const [user] = await db.select().from(users).where(eq(users.username, username)) as User[];
    
    // Wenn ein Benutzer gefunden wurde, speichern wir ihn im Cache für zukünftige ID-Lookups
    if (user) {
      userCache.set(user);
    }
    
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    // Sicherstellen, dass alle Benutzerfelder, auch die neuen Spalten, ausgewählt werden
    return await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      name: users.name,
      email: users.email,
      role: users.role,
      createdBy: users.createdBy,
      gdprConsent: users.gdprConsent,
      registrationDate: users.registrationDate,
      trialEndDate: users.trialEndDate,
      subscriptionStatus: users.subscriptionStatus,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      lastPaymentDate: users.lastPaymentDate
    }).from(users);
  }
  
  async getRecentUsers(limit: number): Promise<User[]> {
    // Neueste Benutzer basierend auf Registrierungsdatum holen
    const result = await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      name: users.name,
      email: users.email,
      role: users.role,
      createdBy: users.createdBy,
      gdprConsent: users.gdprConsent,
      registrationDate: users.registrationDate,
      trialEndDate: users.trialEndDate,
      subscriptionStatus: users.subscriptionStatus,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      lastPaymentDate: users.lastPaymentDate
    })
    .from(users)
    .orderBy(desc(users.registrationDate))
    .limit(limit);
    
    return result as User[];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Verwende die generische Methode zur Typkonvertierung und Formatierung
    const userDataArray = this.prepareDataForInsert(insertUser);
    
    // Führe die Datenbankoperation aus
    const result = await db.insert(users).values(userDataArray).returning();
    const [user] = result;
    return user as User;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    // Verwende die generische Methode zur Typkonvertierung und extrahiere das Objekt aus dem Array
    const [userToUpdate] = this.prepareDataForInsert(user);
    
    const result = await db
      .update(users)
      .set(userToUpdate)
      .where(eq(users.id, id))
      .returning();
    
    const [updatedUser] = result;
    
    // Benutzer aus dem Cache invalidieren, wenn ein Update durchgeführt wurde
    if (updatedUser) {
      this.invalidateUserCache(id);
    }
    
    return updatedUser as User | undefined;
  }

  async deleteUser(id: number): Promise<void> {
    // Erst prüfen, ob der Benutzer noch Projekte hat
    const userProjects = await this.getProjectsByUser(id);

    // Wenn der Benutzer noch Projekte hat, können wir ihn nicht löschen
    if (userProjects.length > 0) {
      // Eine detaillierte Fehlermeldung erstellen, die die Projektnamen enthält
      const projectNames = userProjects.map(project => `"${project.projectName}" (ID: ${project.id})`).join(", ");
      throw new Error(`Der Benutzer hat noch folgende Projekte: ${projectNames}. Bitte löschen Sie zuerst diese Projekte oder weisen Sie sie einem anderen Benutzer zu.`);
    }

    try {
      // Abhängigkeiten prüfen
      const dependencies = await this.getUserDependencies(id);

      // Zuerst alle abhängigen Einträge löschen
      // Login-Logs löschen
      if (dependencies.loginLogs > 0) {
        await db.delete(loginLogs).where(eq(loginLogs.userId, id));
      }

      // Verification Codes löschen
      if (dependencies.verificationCodes > 0) {
        await db.delete(verificationCodes).where(eq(verificationCodes.userId, id));
      }

      // Construction Diaries können nicht automatisch gelöscht werden, da sie wichtige Geschäftsdaten enthalten
      if (dependencies.constructionDiaries > 0) {
        throw new Error(`Der Benutzer hat noch ${dependencies.constructionDiaries} Bautagebücher. Bitte weisen Sie diese einem anderen Benutzer zu, bevor Sie diesen Benutzer löschen.`);
      }

      // Benutzer aus dem Cache entfernen, bevor er gelöscht wird
      this.invalidateUserCache(id);

      // Dann den Benutzer löschen
      await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      console.error("Fehler beim Löschen des Benutzers:", error);
      throw new Error(`Fehler beim Löschen des Benutzers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    // Projekte finden, bei denen der Benutzer der Ersteller ist
    return await db.select().from(projects).where(eq(projects.createdBy, userId)) as Project[];
  }

  // Prüft, ob noch Verknüpfungen zu einem Benutzer bestehen
  async getUserDependencies(userId: number): Promise<{
    loginLogs: number;
    verificationCodes: number;
    constructionDiaries: number;
  }> {
    // Login-Logs zählen
    const loginLogsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(loginLogs)
      .where(eq(loginLogs.userId, userId));

    // Verification Codes zählen
    const verificationCodesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(verificationCodes)
      .where(eq(verificationCodes.userId, userId));

    // Construction Diaries zählen
    const constructionDiariesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(constructionDiaries)
      .where(eq(constructionDiaries.createdBy, userId));

    return {
      loginLogs: Number(loginLogsCount[0]?.count || 0),
      verificationCodes: Number(verificationCodesCount[0]?.count || 0),
      constructionDiaries: Number(constructionDiariesCount[0]?.count || 0)
    };
  }

  // Company operations
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies) as Company[];
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id)) as Company[];
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    // Wenn keine Firmennummer angegeben wurde, automatisch eine generieren
    if (!company.id) {
      company.id = await this.getNextCompanyId();
    }

    const [createdCompany] = await db.insert(companies).values(company).returning() as Company[];
    return createdCompany;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const [updatedCompany] = await db
      .update(companies)
      .set(company)
      .where(eq(companies.id, id))
      .returning() as Company[];
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }

  // Funktion zum Ermitteln der nächsten verfügbaren Firmennummer
  async getNextCompanyId(): Promise<number> {
    // Verwenden einer SQL-Abfrage mit MAX-Funktion
    const result = await db.execute<{maxId: number | null}>(
      sql`SELECT MAX(company_id) as "maxId" FROM tblcompany`
    );
    const maxId = result.rows[0]?.maxId || 0;
    return maxId + 1;
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    // Verwenden einer direkten SQL-Abfrage, um Probleme mit Spaltenreferenzen zu vermeiden
    const result = await db.execute(
      sql`SELECT 
        id, 
        project_id as "projectId", 
        customer_id as "customerId", 
        customer_type as "customerType", 
        first_name as "firstName", 
        last_name as "lastName", 
        street, 
        house_number as "houseNumber", 
        address_line_2 as "addressLine2", 
        postal_code as "postalCode", 
        city, 
        city_part as "cityPart", 
        state, 
        country, 
        customer_phone as "customerPhone", 
        customer_email as "customerEmail", 
        geodate, 
        created_by 
      FROM tblcustomer`
    );

    return result.rows as Customer[];
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    // Verwenden einer direkten SQL-Abfrage, um Probleme mit Spaltenreferenzen zu vermeiden
    const result = await db.execute(
      sql`SELECT 
        id, 
        project_id as "projectId", 
        customer_id as "customerId", 
        customer_type as "customerType", 
        first_name as "firstName", 
        last_name as "lastName", 
        street, 
        house_number as "houseNumber", 
        address_line_2 as "addressLine2", 
        postal_code as "postalCode", 
        city, 
        city_part as "cityPart", 
        state, 
        country, 
        customer_phone as "customerPhone", 
        customer_email as "customerEmail", 
        geodate, 
        created_by 
      FROM tblcustomer 
      WHERE id = ${id}`
    );

    return result.rows[0] as Customer;
  }

  // Funktion zum Ermitteln der nächsten verfügbaren Kundennummer
  async getNextCustomerId(): Promise<number> {
    // Verwenden einer SQL-Abfrage mit MAX-Funktion, da db.fn nicht verfügbar ist
    const result = await db.execute<{maxId: number | null}>(
      sql`SELECT MAX(customer_id) as "maxId" FROM tblcustomer`
    );
    const maxId = result.rows[0]?.maxId || 0;
    return maxId + 1;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    // Wenn keine Kundennummer angegeben wurde, automatisch eine generieren
    if (!customer.customerId) {
      customer.customerId = await this.getNextCustomerId();
    }

    // Explizite Auswahl der Felder mit korrektem geodate-Feld
    const customerData = {
      projectId: customer.projectId,
      customerId: customer.customerId,
      customerType: customer.customerType,
      firstName: customer.firstName,
      lastName: customer.lastName,
      street: customer.street,
      houseNumber: customer.houseNumber,
      addressLine2: customer.addressLine2,
      postalCode: customer.postalCode,
      city: customer.city,
      cityPart: customer.cityPart,
      state: customer.state,
      country: customer.country,
      customerPhone: customer.customerPhone,
      customerEmail: customer.customerEmail,
      geodate: customer.geodate,
      created_by: customer.created_by
    };

    const [createdCustomer] = await db.insert(customers).values(customerData).returning({
      id: customers.id,
      projectId: customers.projectId,
      customerId: customers.customerId,
      customerType: customers.customerType,
      firstName: customers.firstName,
      lastName: customers.lastName,
      street: customers.street,
      houseNumber: customers.houseNumber,
      addressLine2: customers.addressLine2,
      postalCode: customers.postalCode,
      city: customers.city,
      cityPart: customers.cityPart,
      state: customers.state,
      country: customers.country,
      customerPhone: customers.customerPhone,
      customerEmail: customers.customerEmail,
      geodate: customers.geodate,
      created_by: customers.created_by
    }) as Customer[];

    return createdCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    // Explizite Auswahl der Felder mit korrektem geodate-Feld
    const customerData: any = {};

    if (customer.projectId !== undefined) customerData.projectId = customer.projectId;
    if (customer.customerId !== undefined) customerData.customerId = customer.customerId;
    if (customer.customerType !== undefined) customerData.customerType = customer.customerType;
    if (customer.firstName !== undefined) customerData.firstName = customer.firstName;
    if (customer.lastName !== undefined) customerData.lastName = customer.lastName;
    if (customer.street !== undefined) customerData.street = customer.street;
    if (customer.houseNumber !== undefined) customerData.houseNumber = customer.houseNumber;
    if (customer.addressLine2 !== undefined) customerData.addressLine2 = customer.addressLine2;
    if (customer.postalCode !== undefined) customerData.postalCode = customer.postalCode;
    if (customer.city !== undefined) customerData.city = customer.city;
    if (customer.cityPart !== undefined) customerData.cityPart = customer.cityPart;
    if (customer.state !== undefined) customerData.state = customer.state;
    if (customer.country !== undefined) customerData.country = customer.country;
    if (customer.customerPhone !== undefined) customerData.customerPhone = customer.customerPhone;
    if (customer.customerEmail !== undefined) customerData.customerEmail = customer.customerEmail;
    if (customer.geodate !== undefined) customerData.geodate = customer.geodate;
    if (customer.created_by !== undefined) customerData.created_by = customer.created_by;

    const [updatedCustomer] = await db
      .update(customers)
      .set(customerData)
      .where(eq(customers.id, id))
      .returning({
        id: customers.id,
        projectId: customers.projectId,
        customerId: customers.customerId,
        customerType: customers.customerType,
        firstName: customers.firstName,
        lastName: customers.lastName,
        street: customers.street,
        houseNumber: customers.houseNumber,
        addressLine2: customers.addressLine2,
        postalCode: customers.postalCode,
        city: customers.city,
        cityPart: customers.cityPart,
        state: customers.state,
        country: customers.country,
        customerPhone: customers.customerPhone,
        customerEmail: customers.customerEmail,
        geodate: customers.geodate,
        created_by: customers.created_by
      }) as Customer[];
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects) as Project[];
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id)) as Project[];
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    // Datentypen sicherstellen (z.B. für numerische Felder)
    const projectData: Record<string, any> = {};
    
    // Manuelles Mapping für sichere Typkonvertierung
    for (const [key, value] of Object.entries(project)) {
      // Behandle numerische Felder spezifisch
      if (['projectWidth', 'projectLength', 'projectHeight', 'projectText'].includes(key) && typeof value === 'number') {
        projectData[key] = value;
      } else if (value instanceof Date) {
        projectData[key] = value.toISOString();
      } else {
        projectData[key] = value;
      }
    }
    
    const result = await db.insert(projects).values(projectData).returning();
    const [createdProject] = result;
    return createdProject as Project;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    // Datentypen sicherstellen (z.B. für numerische Felder)
    const projectData: Record<string, any> = {};
    
    // Manuelles Mapping für sichere Typkonvertierung
    for (const [key, value] of Object.entries(project)) {
      // Behandle numerische Felder spezifisch
      if (['projectWidth', 'projectLength', 'projectHeight', 'projectText'].includes(key) && typeof value === 'number') {
        projectData[key] = value;
      } else if (value instanceof Date) {
        projectData[key] = value.toISOString();
      } else {
        projectData[key] = value;
      }
    }
    
    const result = await db
      .update(projects)
      .set(projectData)
      .where(eq(projects.id, id))
      .returning();
    
    const [updatedProject] = result;
    return updatedProject as Project | undefined;
  }

  async deleteProject(id: number): Promise<void> {
    // Zuerst alle Anhänge für dieses Projekt löschen
    await db.delete(attachments).where(eq(attachments.projectId, id));

    // Dann das Projekt selbst löschen
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Permission operations
  async getPermissions(projectId: number): Promise<Permission[]> {
    console.log(`Fetching permissions for project ID: ${projectId}`);
    const result = await db.select().from(permissions).where(eq(permissions.projectId, projectId));
    console.log(`Found ${result.length} permissions`);
    return result;
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    console.log(`Fetching permission with ID: ${id}`);
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
    return permission;
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    console.log('Creating new permission with data:', permission);
    const [createdPermission] = await db.insert(permissions).values(permission).returning();
    console.log('Created permission:', createdPermission);
    return createdPermission;
  }

  async deletePermission(id: number): Promise<void> {
    console.log(`Deleting permission with ID: ${id}`);
    await db.delete(permissions).where(eq(permissions.id, id));
    console.log(`Permission with ID ${id} deleted`);
  }

  // Material operations
  async getMaterials(): Promise<Material[]> {
    return await db.select().from(materials);
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material;
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [createdMaterial] = await db.insert(materials).values(material).returning();
    return createdMaterial;
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    const [updatedMaterial] = await db
      .update(materials)
      .set(material)
      .where(eq(materials.id, id))
      .returning();
    return updatedMaterial;
  }

  async deleteMaterial(id: number): Promise<void> {
    await db.delete(materials).where(eq(materials.id, id));
  }

  // Component operations
  async getComponents(): Promise<Component[]> {
    return await db.select().from(components);
  }

  async getComponent(id: number): Promise<Component | undefined> {
    const [component] = await db.select().from(components).where(eq(components.id, id));
    return component;
  }

  async createComponent(component: InsertComponent): Promise<Component> {
    // Verwende die generische Methode zur Typkonvertierung
    const componentDataArray = this.prepareDataForInsert(component);
    
    const [createdComponent] = await db.insert(components).values(componentDataArray).returning();
    return createdComponent;
  }

  async updateComponent(id: number, component: Partial<InsertComponent>): Promise<Component | undefined> {
    // Verwende die generische Methode zur Typkonvertierung und extrahiere das Objekt aus dem Array
    const [componentData] = this.prepareDataForInsert(component);
    
    const [updatedComponent] = await db
      .update(components)
      .set(componentData)
      .where(eq(components.id, id))
      .returning();
    return updatedComponent;
  }

  async deleteComponent(id: number): Promise<void> {
    await db.delete(components).where(eq(components.id, id));
  }

  // Person operations
  async getPersons(): Promise<Person[]> {
    return await db.select().from(persons);
  }

  async getPerson(id: number): Promise<Person | undefined> {
    const [person] = await db.select().from(persons).where(eq(persons.id, id));
    return person;
  }

  async createPerson(person: InsertPerson): Promise<Person> {
    // Verwende die generische Methode zur Typkonvertierung
    const personDataArray = this.prepareDataForInsert(person);
    
    const [createdPerson] = await db.insert(persons).values(personDataArray).returning();
    return createdPerson;
  }

  async updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined> {
    // Verwende die generische Methode zur Typkonvertierung und extrahiere das Objekt aus dem Array
    const [personData] = this.prepareDataForInsert(person);
    
    const [updatedPerson] = await db
      .update(persons)
      .set(personData)
      .where(eq(persons.id, id))
      .returning();
    return updatedPerson;
  }

  async deletePerson(id: number): Promise<void> {
    await db.delete(persons).where(eq(persons.id, id));
  }

  // Attachment operations
  async getProjectAttachments(projectId: number): Promise<Attachment[]> {
    return await db.select().from(attachments).where(eq(attachments.projectId, projectId));
  }

  async getAllAttachments(): Promise<Attachment[]> {
    return await db.select().from(attachments);
  }

  // Anhänge für mehrere Projekte abrufen
  async getAttachmentsByProjects(projectIds: number[]): Promise<Attachment[]> {
    if (projectIds.length === 0) {
      return [];
    }
    return await db.select().from(attachments).where(inArray(attachments.projectId, projectIds));
  }

  async getAttachment(id: number): Promise<Attachment | undefined> {
    const [attachment] = await db.select().from(attachments).where(eq(attachments.id, id));
    return attachment;
  }

  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    // Verwende die generische Methode zur Typkonvertierung
    const attachmentDataArray = this.prepareDataForInsert(attachment);
    
    const [createdAttachment] = await db.insert(attachments).values(attachmentDataArray).returning();
    return createdAttachment;
  }

  async deleteAttachment(id: number): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }
  
  async markAttachmentFileMissing(id: number): Promise<Attachment | undefined> {
    try {
      // Markiere den Anhang als fehlend, setze zusätzlich einen Status in der Beschreibung
      const [updatedAttachment] = await db
        .update(attachments)
        .set({ 
          fileMissing: true,
          description: sql`CASE 
                          WHEN "description" IS NULL OR "description" = '' 
                          THEN '⚠️ Datei nicht mehr verfügbar' 
                          ELSE CONCAT("description", ' | ⚠️ Datei nicht mehr verfügbar') 
                        END`
        })
        .where(eq(attachments.id, id))
        .returning();
        
      return updatedAttachment;
    } catch (error) {
      console.error(`Fehler beim Markieren des Anhangs als fehlend: ${error}`);
      return undefined;
    }
  }
  
  // Neuer Methode zum Aktualisieren des Speicherpfads eines Anhangs
  async updateAttachmentPath(id: number, data: {
    filePath: string,
    fileStorage?: string,
    isPublic?: boolean,
    fileMissing?: boolean
  }): Promise<Attachment | undefined> {
    try {
      const updateData: any = { filePath: data.filePath };
      
      // Nur nicht-undefined Felder hinzufügen
      if (data.fileStorage !== undefined) updateData.fileStorage = data.fileStorage;
      if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
      if (data.fileMissing !== undefined) updateData.fileMissing = data.fileMissing;
      
      const [updatedAttachment] = await db
        .update(attachments)
        .set(updateData)
        .where(eq(attachments.id, id))
        .returning();
        
      return updatedAttachment;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Dateipfads: ${error}`);
      return undefined;
    }
  }
  
  async markAttachmentAsMissing(id: number): Promise<void> {
    try {
      // Markiert den Anhang als fehlend (Alias-Methode für markAttachmentFileMissing)
      await this.markAttachmentFileMissing(id);
    } catch (error) {
      console.error(`Fehler beim Markieren des Anhangs als fehlend: ${error}`);
    }
  }

  async resetAttachmentFileMissing(id: number): Promise<Attachment | undefined> {
    try {
      // Setze den "fehlend"-Status zurück, wenn die Datei wiedergefunden wurde
      const [updatedAttachment] = await db
        .update(attachments)
        .set({ 
          fileMissing: false,
          description: sql`REPLACE("description", ' | ⚠️ Datei nicht mehr verfügbar', '')`
        })
        .where(eq(attachments.id, id))
        .returning();
        
      return updatedAttachment;
    } catch (error) {
      console.error(`Fehler beim Zurücksetzen des fehlenden Status des Anhangs: ${error}`);
      return undefined;
    }
  }
  
  async verifyAllAttachments(): Promise<{ total: number, missing: number, available: number, details: Array<{id: number, fileName: string, status: string}> }> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Alle Anhänge laden
      const allAttachments = await db.select().from(attachments);
      let missing = 0;
      let available = 0;
      const details: Array<{id: number, fileName: string, status: string}> = [];
      
      console.log(`Überprüfe ${allAttachments.length} Anhänge...`);
      
      // Alle Anhänge überprüfen
      for (const attachment of allAttachments) {
        let found = false;
        
        // Überspringe Anhänge ohne Dateipfad
        if (!attachment.filePath) {
          console.log(`Anhang ${attachment.id} hat keinen Dateipfad, überspringe...`);
          continue;
        }
        
        // Mögliche Dateipfade (abhängig von der Umgebung)
        const possiblePaths = [
          attachment.filePath, // Standard-Pfad
          path.join('uploads', path.basename(attachment.filePath || '')), // Uploads-Verzeichnis
          path.join('public', 'uploads', path.basename(attachment.filePath || '')), // Public-Uploads
          path.join('.', 'uploads', path.basename(attachment.filePath || '')), // Relative Uploads
          path.join('..', attachment.filePath || ''), // Ein Verzeichnis höher
          path.join('..', 'uploads', path.basename(attachment.filePath || '')), // Höher + Uploads
          path.join(process.cwd(), attachment.filePath || ''), // Vollständiger Pfad
          path.join(process.cwd(), 'uploads', path.basename(attachment.filePath || '')), // Vollständiger Uploads-Pfad
          // Weitere Backup-Pfade
          path.join('temp', path.basename(attachment.filePath || '')),
          path.join('attachments', path.basename(attachment.filePath || '')),
          path.join('uploads', 'attachments', path.basename(attachment.filePath || '')),
        ];
        
        // Alle möglichen Pfade prüfen
        for (const filePath of possiblePaths) {
          try {
            if (filePath && fs.existsSync(filePath)) {
              found = true;
              console.log(`Datei für Anhang ${attachment.id} gefunden unter: ${filePath}`);
              break;
            }
          } catch (error) {
            console.warn(`Fehler beim Prüfen des Pfads ${filePath}: ${error}`);
            // Weiter zum nächsten Pfad, wenn ein Fehler auftritt
            continue;
          }
        }
        
        // Status aktualisieren, wenn der aktuelle Status nicht stimmt
        if (found && attachment.fileMissing) {
          try {
            // Datei als verfügbar markieren
            await this.resetAttachmentFileMissing(attachment.id);
            available++;
            details.push({
              id: attachment.id,
              fileName: attachment.fileName || `unbenannt_${attachment.id}`,
              status: "wiederhergestellt"
            });
            console.log(`Anhang ${attachment.id} als verfügbar markiert`);
          } catch (error) {
            console.error(`Fehler beim Zurücksetzen des Status für Anhang ${attachment.id}: ${error}`);
          }
        } else if (!found && !attachment.fileMissing) {
          try {
            // Datei als fehlend markieren
            await this.markAttachmentFileMissing(attachment.id);
            missing++;
            details.push({
              id: attachment.id,
              fileName: attachment.fileName || `unbenannt_${attachment.id}`,
              status: "fehlend markiert"
            });
            console.log(`Anhang ${attachment.id} als fehlend markiert`);
          } catch (error) {
            console.error(`Fehler beim Markieren des Anhangs ${attachment.id} als fehlend: ${error}`);
          }
        } else if (found) {
          available++;
        } else {
          missing++;
        }
      }
      
      console.log(`Überprüfung abgeschlossen: ${allAttachments.length} gesamt, ${available} verfügbar, ${missing} fehlend, ${details.length} Änderungen`);
      
      return {
        total: allAttachments.length,
        missing,
        available,
        details
      };
    } catch (error) {
      console.error(`Fehler bei der Überprüfung aller Anhänge: ${error}`);
      throw new Error(`Fehler bei der Überprüfung: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Surface Analysis operations
  async getSurfaceAnalyses(projectId: number): Promise<SurfaceAnalysis[]> {
    return await db.select().from(surfaceAnalyses).where(eq(surfaceAnalyses.projectId, projectId));
  }

  async getSurfaceAnalysisByLocation(latitude: number, longitude: number): Promise<SurfaceAnalysis | undefined> {
    // Exakte Übereinstimmung ist unwahrscheinlich bei Fließkommazahlen, daher verwenden wir eine Näherung
    const results = await db.select().from(surfaceAnalyses);
    // Wir suchen nach Punkten im Umkreis von ca. 10 Metern (ungefähr 0.0001 Grad)
    const nearbyPoints = results.filter(point => 
      Math.abs(point.latitude - latitude) < 0.0001 && 
      Math.abs(point.longitude - longitude) < 0.0001
    );

    return nearbyPoints[0]; // Return den ersten Treffer oder undefined
  }

  async getSurfaceAnalysis(id: number): Promise<SurfaceAnalysis | undefined> {
    const [analysis] = await db.select().from(surfaceAnalyses).where(eq(surfaceAnalyses.id, id));
    return analysis;
  }

  async createSurfaceAnalysis(analysis: InsertSurfaceAnalysis): Promise<SurfaceAnalysis> {
    // Verwende die generische Methode zur Typkonvertierung
    const analysisDataArray = this.prepareDataForInsert(analysis);
    
    const result = await db.insert(surfaceAnalyses).values(analysisDataArray).returning();
    const [createdAnalysis] = result;
    return createdAnalysis as SurfaceAnalysis;
  }

  async deleteSurfaceAnalysis(id: number): Promise<void> {
    await db.delete(surfaceAnalyses).where(eq(surfaceAnalyses.id, id));
  }

  // Soil Reference Data operations
  async getSoilReferenceData(): Promise<SoilReferenceData[]> {
    return await db.select().from(soilReferenceData);
  }

  async getSoilReferenceDataByBodenklasse(bodenklasse: string): Promise<SoilReferenceData | undefined> {
    const [data] = await db.select().from(soilReferenceData).where(eq(soilReferenceData.bodenklasse, bodenklasse as any));
    return data;
  }

  async getSoilReferenceDataById(id: number): Promise<SoilReferenceData | undefined> {
    const [data] = await db.select().from(soilReferenceData).where(eq(soilReferenceData.id, id));
    return data;
  }

  async createSoilReferenceData(data: InsertSoilReferenceData): Promise<SoilReferenceData> {
    // Verwende die generische Methode zur Typkonvertierung
    const dataArray = this.prepareDataForInsert(data);
    
    const [createdData] = await db.insert(soilReferenceData).values(dataArray).returning();
    return createdData;
  }

  async updateSoilReferenceData(id: number, data: Partial<InsertSoilReferenceData>): Promise<SoilReferenceData | undefined> {
    // Verwende die generische Methode zur Typkonvertierung und extrahiere das Objekt aus dem Array
    const [preparedData] = this.prepareDataForInsert(data);
    
    const [updatedData] = await db
      .update(soilReferenceData)
      .set(preparedData)
      .where(eq(soilReferenceData.id, id))
      .returning();
    return updatedData;
  }

  async deleteSoilReferenceData(id: number): Promise<void> {
    await db.delete(soilReferenceData).where(eq(soilReferenceData.id, id));
  }

  // Projektanalysenübersicht
  async getProjectAnalyses(projectId: number): Promise<SurfaceAnalysis[]> {
    return await db.select().from(surfaceAnalyses).where(eq(surfaceAnalyses.projectId, projectId));
  }

  // BedarfKapa operations
  async getBedarfKapas(projectId: number): Promise<BedarfKapa[]> {
    console.log(`Fetching BedarfKapas for project ID: ${projectId}`);
    const result = await db.select().from(bedarfKapa).where(eq(bedarfKapa.projectId, projectId));
    console.log(`Found ${result.length} BedarfKapas:`, result);
    return result;
  }

  async getBedarfKapa(id: number): Promise<BedarfKapa | undefined> {
    const [data] = await db.select().from(bedarfKapa).where(eq(bedarfKapa.id, id));
    return data;
  }

  async createBedarfKapa(data: InsertBedarfKapa): Promise<BedarfKapa> {
    console.log('Creating new BedarfKapa with data:', data);
    // Verwende die generische Methode zur Typkonvertierung
    const dataArray = this.prepareDataForInsert(data);
    
    const [createdData] = await db.insert(bedarfKapa).values(dataArray).returning();
    console.log('Created BedarfKapa:', createdData);
    return createdData;
  }

  async deleteBedarfKapa(id: number): Promise<void> {
    await db.delete(bedarfKapa).where(eq(bedarfKapa.id, id));
  }

  // Milestone operations
  async getMilestones(projectId: number): Promise<Milestone[]> {
    console.log(`Fetching Milestones for project ID: ${projectId}`);
    const result = await db.select().from(milestones).where(eq(milestones.projectId, projectId));
    console.log(`Found ${result.length} Milestones`);
    return result;
  }

  async getMilestone(id: number): Promise<Milestone | undefined> {
    const [milestone] = await db.select().from(milestones).where(eq(milestones.id, id));
    return milestone;
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    console.log('Creating new Milestone with data:', milestone);
    // Verwende die generische Methode zur Typkonvertierung
    const milestoneDataArray = this.prepareDataForInsert(milestone);
    
    const [createdMilestone] = await db.insert(milestones).values(milestoneDataArray).returning();
    console.log('Created Milestone:', createdMilestone);
    return createdMilestone;
  }

  async updateMilestone(id: number, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    console.log(`Updating Milestone with ID: ${id}`, milestone);
    // Verwende die generische Methode zur Typkonvertierung und extrahiere das Objekt aus dem Array
    const [milestoneData] = this.prepareDataForInsert(milestone);
    
    const [updatedMilestone] = await db
      .update(milestones)
      .set(milestoneData)
      .where(eq(milestones.id, id))
      .returning();
    console.log('Updated Milestone:', updatedMilestone);
    return updatedMilestone;
  }

  async deleteMilestone(id: number): Promise<void> {
    console.log(`Deleting Milestone with ID: ${id}`);
    // Zuerst alle Details für diesen Meilenstein löschen
    await db.delete(milestoneDetails).where(eq(milestoneDetails.milestoneId, id));
    // Dann den Meilenstein selbst löschen
    await db.delete(milestones).where(eq(milestones.id, id));
    console.log('Milestone and associated details deleted');
  }

  // Milestone Detail operations
  async getMilestoneDetails(milestoneId: number): Promise<MilestoneDetail[]> {
    console.log(`Fetching MilestoneDetails for milestone ID: ${milestoneId}`);
    const result = await db.select().from(milestoneDetails).where(eq(milestoneDetails.milestoneId, milestoneId));
    console.log(`Found ${result.length} MilestoneDetails`);
    return result;
  }

  async getMilestoneDetail(id: number): Promise<MilestoneDetail | undefined> {
    const [detail] = await db.select().from(milestoneDetails).where(eq(milestoneDetails.id, id));
    return detail;
  }

  async createMilestoneDetail(detail: InsertMilestoneDetail): Promise<MilestoneDetail> {
    console.log('Creating new MilestoneDetail with data:', detail);
    // Verwende die generische Methode zur Typkonvertierung
    const detailDataArray = this.prepareDataForInsert(detail);
    
    const [createdDetail] = await db.insert(milestoneDetails).values(detailDataArray).returning();
    console.log('Created MilestoneDetail:', createdDetail);
    return createdDetail;
  }

  async updateMilestoneDetail(id: number, detail: Partial<InsertMilestoneDetail>): Promise<MilestoneDetail | undefined> {
    console.log(`Updating MilestoneDetail with ID: ${id}`, detail);
    // Verwende die generische Methode zur Typkonvertierung und extrahiere das Objekt aus dem Array
    const [detailData] = this.prepareDataForInsert(detail);
    
    const [updatedDetail] = await db
      .update(milestoneDetails)
      .set(detailData)
      .where(eq(milestoneDetails.id, id))
      .returning();
    console.log('Updated MilestoneDetail:', updatedDetail);
    return updatedDetail;
  }

  async deleteMilestoneDetail(id: number): Promise<void> {
    console.log(`Deleting MilestoneDetail with ID: ${id}`);
    await db.delete(milestoneDetails).where(eq(milestoneDetails.id, id));
    console.log('MilestoneDetail deleted');
  }

  // Login Logs operations
  async getLoginLogs(): Promise<LoginLog[]> {
    return await db.select().from(loginLogs).orderBy(desc(loginLogs.timestamp));
  }

  async getLoginLogsByUser(userId: number): Promise<LoginLog[]> {
    return await db.select().from(loginLogs)
      .where(eq(loginLogs.userId, userId))
      .orderBy(desc(loginLogs.timestamp));
  }

  async createLoginLog(log: InsertLoginLog): Promise<LoginLog> {
    // Verwende die generische Methode zur Typkonvertierung
    const logDataArray = this.prepareDataForInsert(log);
    
    const [createdLog] = await db.insert(loginLogs).values(logDataArray).returning();
    return createdLog;
  }

  // Verification Codes operations
  async createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode> {
    // Verwende die generische Methode zur Typkonvertierung
    const codeDataArray = this.prepareDataForInsert(code);
    
    const [createdCode] = await db.insert(verificationCodes).values(codeDataArray).returning();
    return createdCode;
  }

  async getVerificationCode(code: string): Promise<VerificationCode | undefined> {
    // Hole nur gültige Codes, die noch nicht abgelaufen sind
    const [verificationCode] = await db
      .select()
      .from(verificationCodes)
      .where(
        eq(verificationCodes.code, code) &&
        eq(verificationCodes.isValid, true) &&
        // Nur Codes, die nach dem aktuellen Zeitpunkt ablaufen
        gte(verificationCodes.expiresAt, new Date())
      );
    return verificationCode;
  }

  async getActiveVerificationCodesByUser(userId: number): Promise<VerificationCode[]> {
    return await db
      .select()
      .from(verificationCodes)
      .where(
        eq(verificationCodes.userId, userId) &&
        eq(verificationCodes.isValid, true) &&
        // Nur Codes, die nach dem aktuellen Zeitpunkt ablaufen
        gte(verificationCodes.expiresAt, new Date())
      );
  }

  async invalidateVerificationCode(id: number): Promise<void> {
    await db
      .update(verificationCodes)
      .set({ isValid: false })
      .where(eq(verificationCodes.id, id));
  }

  async markVerificationCodeAsUsed(id: number): Promise<void> {
    await db
      .update(verificationCodes)
      .set({ 
        isValid: false,
        usedAt: new Date() 
      })
      .where(eq(verificationCodes.id, id));
  }

  // Construction Diary operations
  async getConstructionDiaries(projectId: number): Promise<ConstructionDiary[]> {
    return await db
      .select()
      .from(constructionDiaries)
      .where(eq(constructionDiaries.projectId, projectId))
      .orderBy(desc(constructionDiaries.date));
  }

  async getConstructionDiary(id: number): Promise<ConstructionDiary | undefined> {
    const [diary] = await db
      .select()
      .from(constructionDiaries)
      .where(eq(constructionDiaries.id, id));
    return diary;
  }

  async createConstructionDiary(diary: InsertConstructionDiary): Promise<ConstructionDiary> {
    // Verwende die generische Methode zur Typkonvertierung
    const diaryDataArray = this.prepareDataForInsert(diary);
    
    const result = await db
      .insert(constructionDiaries)
      .values(diaryDataArray)
      .returning();
    
    const [createdDiary] = result;
    return createdDiary as ConstructionDiary;
  }

  async updateConstructionDiary(id: number, diary: Partial<InsertConstructionDiary>): Promise<ConstructionDiary | undefined> {
    // Verwende die generische Methode zur Typkonvertierung und extrahiere das Objekt aus dem Array
    const [diaryData] = this.prepareDataForInsert(diary);
    
    const result = await db
      .update(constructionDiaries)
      .set(diaryData)
      .where(eq(constructionDiaries.id, id))
      .returning();
    
    const [updatedDiary] = result;
    return updatedDiary as ConstructionDiary | undefined;
  }

  async deleteConstructionDiary(id: number): Promise<void> {
    await db
      .delete(constructionDiaries)
      .where(eq(constructionDiaries.id, id));
  }

  // Construction Diary Employees operations
  async getConstructionDiaryEmployees(diaryId: number): Promise<ConstructionDiaryEmployee[]> {
    return await db
      .select()
      .from(constructionDiaryEmployees)
      .where(eq(constructionDiaryEmployees.constructionDiaryId, diaryId))
      .orderBy(asc(constructionDiaryEmployees.lastName));
  }

  // Hilfsfunktion, um mögliche Duplikate zu finden basierend auf Namen
  async findSimilarEmployees(employee: {
    firstName: string;
    lastName: string;
    constructionDiaryId: number;
  }): Promise<ConstructionDiaryEmployee[]> {
    const { firstName, lastName, constructionDiaryId } = employee;

    // Normalisiere Namen für den Vergleich
    const normalizedFirstName = firstName.trim().toLowerCase();
    const normalizedLastName = lastName.trim().toLowerCase();

    // Hole alle Mitarbeiter für diesen Bautagebuch-Eintrag
    const allEmployees = await this.getConstructionDiaryEmployees(constructionDiaryId);

    // Filtere nach ähnlichen Namen
    return allEmployees.filter(emp => {
      const empFirstName = emp.firstName.trim().toLowerCase();
      const empLastName = emp.lastName.trim().toLowerCase();

      // Exakte Übereinstimmung (normalisiert)
      if (empFirstName === normalizedFirstName && empLastName === normalizedLastName) {
        return true;
      }

      // Levenshtein-Ähnlichkeit (vereinfachte Version)
      // Prüft, ob die Namen sehr ähnlich sind (z.B. Tippfehler)
      return (
        (empFirstName.includes(normalizedFirstName) || normalizedFirstName.includes(empFirstName)) &&
        (empLastName.includes(normalizedLastName) || normalizedLastName.includes(empLastName))
      );
    });
  }

  async createConstructionDiaryEmployee(employee: InsertConstructionDiaryEmployee): Promise<ConstructionDiaryEmployee> {
    // Prüfe auf mögliche Duplikate vor dem Erstellen
    const similarEmployees = await this.findSimilarEmployees({
      firstName: employee.firstName,
      lastName: employee.lastName,
      constructionDiaryId: employee.constructionDiaryId
    });

    // Wenn exakte Duplikate gefunden wurden, gib das erste zurück anstatt ein neues zu erstellen
    const exactDuplicate = similarEmployees.find(emp => 
      emp.firstName.trim().toLowerCase() === employee.firstName.trim().toLowerCase() &&
      emp.lastName.trim().toLowerCase() === employee.lastName.trim().toLowerCase()
    );

    if (exactDuplicate) {
      console.log(`Verhinderte Duplikat-Erstellung: ${employee.firstName} ${employee.lastName}`);
      return exactDuplicate;
    }

    // Wenn kein exaktes Duplikat gefunden wurde, erstelle einen neuen Eintrag
    const [createdEmployee] = await db
      .insert(constructionDiaryEmployees)
      .values(employee)
      .returning();
    return createdEmployee;
  }

  async updateConstructionDiaryEmployee(id: number, employee: Partial<InsertConstructionDiaryEmployee>): Promise<ConstructionDiaryEmployee | undefined> {
    // Wenn der Name aktualisiert wird, prüfe auf mögliche Duplikate
    if (employee.firstName && employee.lastName && employee.constructionDiaryId) {
      const similarEmployees = await this.findSimilarEmployees({
        firstName: employee.firstName,
        lastName: employee.lastName,
        constructionDiaryId: employee.constructionDiaryId
      });

      // Wenn exakte Duplikate gefunden wurden, die nicht dieser Mitarbeiter sind
      const exactDuplicate = similarEmployees.find(emp => 
        emp.id !== id &&
        emp.firstName.trim().toLowerCase() === employee.firstName!.trim().toLowerCase() &&
        emp.lastName.trim().toLowerCase() === employee.lastName!.trim().toLowerCase()
      );

      if (exactDuplicate) {
        console.log(`Verhinderte Duplikat-Aktualisierung: ${employee.firstName} ${employee.lastName}`);
        throw new Error(`Es existiert bereits ein Mitarbeiter mit dem Namen ${employee.firstName} ${employee.lastName} in diesem Bautagebuch-Eintrag.`);
      }
    }

    // Wenn kein Duplikat gefunden wurde, aktualisiere den Eintrag
    const [updatedEmployee] = await db
      .update(constructionDiaryEmployees)
      .set(employee)
      .where(eq(constructionDiaryEmployees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteConstructionDiaryEmployee(id: number): Promise<void> {
    await db
      .delete(constructionDiaryEmployees)
      .where(eq(constructionDiaryEmployees.id, id));
  }

  // Subscription Plan operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).orderBy(asc(subscriptionPlans.sortOrder)) as SubscriptionPlan[];
  }

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.planId, planId)) as SubscriptionPlan[];
    return plan;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [createdPlan] = await db.insert(subscriptionPlans).values(plan).returning() as SubscriptionPlan[];
    return createdPlan;
  }

  async updateSubscriptionPlan(planId: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set(plan)
      .where(eq(subscriptionPlans.planId, planId))
      .returning() as SubscriptionPlan[];
    return updatedPlan;
  }

  async deleteSubscriptionPlan(planId: string): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.planId, planId));
  }

  // User Subscription operations
  async getUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)) as UserSubscription[];
    return subscription;
  }

  async getUserSubscriptionByStripeId(stripeSubscriptionId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId)) as UserSubscription[];
    return subscription;
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [createdSubscription] = await db.insert(userSubscriptions).values(subscription).returning() as UserSubscription[];
    
    // Auch den Benutzerstatus aktualisieren
    if (createdSubscription) {
      await db
        .update(users)
        .set({ 
          subscriptionStatus: subscription.status, 
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId 
        })
        .where(eq(users.id, subscription.userId));
        
      // Benutzer-Cache invalidieren
      this.invalidateUserCache(subscription.userId);
    }
    
    return createdSubscription;
  }

  async updateUserSubscription(id: number, subscription: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined> {
    const [updatedSubscription] = await db
      .update(userSubscriptions)
      .set(subscription)
      .where(eq(userSubscriptions.id, id))
      .returning() as UserSubscription[];
    
    // Auch den Benutzerstatus aktualisieren, wenn notwendig
    if (updatedSubscription && subscription.status) {
      await db
        .update(users)
        .set({ 
          subscriptionStatus: subscription.status,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId
        })
        .where(eq(users.id, updatedSubscription.userId));
        
      // Benutzer-Cache invalidieren
      this.invalidateUserCache(updatedSubscription.userId);
    }
    
    return updatedSubscription;
  }

  async deleteUserSubscription(id: number): Promise<void> {
    // Bevor wir das Abonnement löschen, finden wir den zugehörigen Benutzer
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.id, id)) as UserSubscription[];
    
    if (subscription) {
      // Benutzer auf Trial zurücksetzen
      await db
        .update(users)
        .set({ 
          subscriptionStatus: 'trial',
          stripeCustomerId: null,
          stripeSubscriptionId: null
        })
        .where(eq(users.id, subscription.userId));
        
      // Benutzer-Cache invalidieren
      this.invalidateUserCache(subscription.userId);
    }
    
    // Abonnement löschen
    await db.delete(userSubscriptions).where(eq(userSubscriptions.id, id));
  }
}

export const storage = new DatabaseStorage();