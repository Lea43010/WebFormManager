import { 
  users, 
  employees, 
  activities, 
  type User, 
  type InsertUser, 
  type Employee, 
  type InsertEmployee,
  type Activity,
  type InsertActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, or } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employee operations
  getEmployees(page: number, limit: number, search?: string): Promise<{ data: Employee[], total: number }>;
  getEmployeeById(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<boolean>;
  
  // Activity operations
  getRecentActivities(limit: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Statistics
  getEmployeeStats(): Promise<{
    total: number;
    todayAdded: number;
    pendingReview: number;
  }>;

  // Session store
  sessionStore: session.SessionStore;
}

class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    // In production, use PostgreSQL for session storage
    if (process.env.NODE_ENV === "production") {
      this.sessionStore = new PostgresSessionStore({
        conObject: {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        },
        createTableIfMissing: true,
      });
    } else {
      // In development, use memory store
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Employee methods
  async getEmployees(page: number = 1, limit: number = 10, search?: string): Promise<{ data: Employee[], total: number }> {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(employees);
    let countQuery = db.select({ count: db.count() }).from(employees);
    
    // Add search filter if provided
    if (search) {
      const searchFilter = or(
        like(employees.firstName, `%${search}%`),
        like(employees.lastName, `%${search}%`),
        like(employees.email, `%${search}%`),
        like(employees.department, `%${search}%`),
        like(employees.position, `%${search}%`)
      );
      
      query = query.where(searchFilter);
      countQuery = countQuery.where(searchFilter);
    }
    
    // Execute queries
    const data = await query.orderBy(desc(employees.id)).limit(limit).offset(offset);
    const [{ count }] = await countQuery;
    
    return {
      data,
      total: Number(count)
    };
  }

  async getEmployeeById(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({
        ...employee,
        updatedAt: new Date()
      })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return true;
  }

  // Activity methods
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  // Statistics
  async getEmployeeStats(): Promise<{ total: number; todayAdded: number; pendingReview: number; }> {
    // Get total count
    const [{ count: total }] = await db
      .select({ count: db.count() })
      .from(employees);
    
    // Get today's additions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [{ count: todayAdded }] = await db
      .select({ count: db.count() })
      .from(employees)
      .where(
        and(
          db.gte(employees.createdAt, today),
          eq(employees.isActive, true)
        )
      );
    
    // Get pending review (employees with isActive = false)
    const [{ count: pendingReview }] = await db
      .select({ count: db.count() })
      .from(employees)
      .where(eq(employees.isActive, false));
    
    return {
      total: Number(total),
      todayAdded: Number(todayAdded),
      pendingReview: Number(pendingReview)
    };
  }
}

export const storage = new DatabaseStorage();
