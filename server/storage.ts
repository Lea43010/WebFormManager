import { db } from "./db";
import { eq, desc, gte } from "drizzle-orm";
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
  verificationCodes, type VerificationCode, type InsertVerificationCode
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
  getProjectsByUser(userId: number): Promise<Project[]>;
  
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
  getAttachment(id: number): Promise<Attachment | undefined>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: number): Promise<void>;
  
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
  
  // Session store
  sessionStore: session.Store;
}

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
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<void> {
    // Erst prüfen, ob der Benutzer noch Projekte hat
    const userProjects = await this.getProjectsByUser(id);
    
    // Wenn der Benutzer noch Projekte hat, können wir ihn nicht löschen
    if (userProjects.length > 0) {
      throw new Error("Der Benutzer hat noch Projekte. Bitte löschen Sie zuerst diese Projekte oder weisen Sie sie einem anderen Benutzer zu.");
    }
    
    // Benutzer löschen
    await db.delete(users).where(eq(users.id, id));
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getProjectsByUser(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.createdBy, userId));
  }
  
  // Company operations
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }
  
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }
  
  async createCompany(company: InsertCompany): Promise<Company> {
    const [createdCompany] = await db.insert(companies).values(company).returning();
    return createdCompany;
  }
  
  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const [updatedCompany] = await db
      .update(companies)
      .set(company)
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }
  
  async deleteCompany(id: number): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }
  
  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [createdCustomer] = await db.insert(customers).values(customer).returning();
    return createdCustomer;
  }
  
  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }
  
  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const [createdProject] = await db.insert(projects).values(project).returning();
    return createdProject;
  }
  
  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<void> {
    // Zuerst alle Anhänge für dieses Projekt löschen
    await db.delete(attachments).where(eq(attachments.projectId, id));
    
    // Dann das Projekt selbst löschen
    await db.delete(projects).where(eq(projects.id, id));
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
    const [createdComponent] = await db.insert(components).values(component).returning();
    return createdComponent;
  }
  
  async updateComponent(id: number, component: Partial<InsertComponent>): Promise<Component | undefined> {
    const [updatedComponent] = await db
      .update(components)
      .set(component)
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
    const [createdPerson] = await db.insert(persons).values(person).returning();
    return createdPerson;
  }
  
  async updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined> {
    const [updatedPerson] = await db
      .update(persons)
      .set(person)
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
  
  async getAttachment(id: number): Promise<Attachment | undefined> {
    const [attachment] = await db.select().from(attachments).where(eq(attachments.id, id));
    return attachment;
  }
  
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const [createdAttachment] = await db.insert(attachments).values(attachment).returning();
    return createdAttachment;
  }
  
  async deleteAttachment(id: number): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
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
    const [createdAnalysis] = await db.insert(surfaceAnalyses).values(analysis).returning();
    return createdAnalysis;
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
    const [createdData] = await db.insert(soilReferenceData).values(data).returning();
    return createdData;
  }
  
  async updateSoilReferenceData(id: number, data: Partial<InsertSoilReferenceData>): Promise<SoilReferenceData | undefined> {
    const [updatedData] = await db
      .update(soilReferenceData)
      .set(data)
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
    const [createdData] = await db.insert(bedarfKapa).values(data).returning();
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
    const [createdMilestone] = await db.insert(milestones).values(milestone).returning();
    console.log('Created Milestone:', createdMilestone);
    return createdMilestone;
  }
  
  async updateMilestone(id: number, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    console.log(`Updating Milestone with ID: ${id}`, milestone);
    const [updatedMilestone] = await db
      .update(milestones)
      .set(milestone)
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
    const [createdDetail] = await db.insert(milestoneDetails).values(detail).returning();
    console.log('Created MilestoneDetail:', createdDetail);
    return createdDetail;
  }
  
  async updateMilestoneDetail(id: number, detail: Partial<InsertMilestoneDetail>): Promise<MilestoneDetail | undefined> {
    console.log(`Updating MilestoneDetail with ID: ${id}`, detail);
    const [updatedDetail] = await db
      .update(milestoneDetails)
      .set(detail)
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
    const [createdLog] = await db.insert(loginLogs).values(log).returning();
    return createdLog;
  }

  // Verification Codes operations
  async createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode> {
    const [createdCode] = await db.insert(verificationCodes).values(code).returning();
    return createdCode;
  }

  async getVerificationCode(code: string): Promise<VerificationCode | undefined> {
    // Hole nur gültige Codes, die noch nicht abgelaufen sind
    const [verificationCode] = await db
      .select()
      .from(verificationCodes)
      .where(eq(verificationCodes.code, code))
      .where(eq(verificationCodes.isValid, true))
      .where(
        // Nur Codes, die nach dem aktuellen Zeitpunkt ablaufen
        gte(verificationCodes.expiresAt, new Date())
      );
    return verificationCode;
  }

  async getActiveVerificationCodesByUser(userId: number): Promise<VerificationCode[]> {
    return await db
      .select()
      .from(verificationCodes)
      .where(eq(verificationCodes.userId, userId))
      .where(eq(verificationCodes.isValid, true))
      .where(
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
}

export const storage = new DatabaseStorage();
