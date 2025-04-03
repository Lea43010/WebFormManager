import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { 
  users, type User, type InsertUser,
  companies, type Company, type InsertCompany,
  customers, type Customer, type InsertCustomer,
  persons, type Person, type InsertPerson,
  projects, type Project, type InsertProject,
  materials, type Material, type InsertMaterial,
  components, type Component, type InsertComponent,
  attachments, type Attachment, type InsertAttachment,
  surfaceAnalyses, type SurfaceAnalysis, type InsertSurfaceAnalysis
} from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
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
}

export const storage = new DatabaseStorage();
