import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertEmployeeSchema, insertActivitySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication endpoints
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Nicht autorisiert" });
  };

  // Employee endpoints
  app.get("/api/employees", isAuthenticated, async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      
      const result = await storage.getEmployees(page, limit, search);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/employees/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ungültige ID" });
      }
      
      const employee = await storage.getEmployeeById(id);
      if (!employee) {
        return res.status(404).json({ message: "Eintrag nicht gefunden" });
      }
      
      res.json(employee);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/employees", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      
      // Validate input data
      const employeeData = insertEmployeeSchema.parse({
        ...req.body,
        createdBy: userId
      });
      
      // Create employee
      const newEmployee = await storage.createEmployee(employeeData);
      
      // Log activity
      await storage.createActivity({
        userId,
        action: "add",
        entityId: newEmployee.id,
        entityType: "employee",
        details: `Neuer Eintrag: ${newEmployee.firstName} ${newEmployee.lastName}`
      });
      
      res.status(201).json(newEmployee);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.put("/api/employees/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ungültige ID" });
      }
      
      const userId = req.user!.id;
      
      // Check if employee exists
      const existingEmployee = await storage.getEmployeeById(id);
      if (!existingEmployee) {
        return res.status(404).json({ message: "Eintrag nicht gefunden" });
      }
      
      // Validate partial input data
      const { createdBy, ...updateData } = req.body;
      
      // Update employee
      const updatedEmployee = await storage.updateEmployee(id, updateData);
      
      // Log activity
      await storage.createActivity({
        userId,
        action: "edit",
        entityId: updatedEmployee.id,
        entityType: "employee",
        details: `Eintrag aktualisiert: ${updatedEmployee.firstName} ${updatedEmployee.lastName}`
      });
      
      res.json(updatedEmployee);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ungültige ID" });
      }
      
      const userId = req.user!.id;
      
      // Check if employee exists
      const existingEmployee = await storage.getEmployeeById(id);
      if (!existingEmployee) {
        return res.status(404).json({ message: "Eintrag nicht gefunden" });
      }
      
      // Delete employee
      await storage.deleteEmployee(id);
      
      // Log activity
      await storage.createActivity({
        userId,
        action: "delete",
        entityId: id,
        entityType: "employee",
        details: `Eintrag gelöscht: ${existingEmployee.firstName} ${existingEmployee.lastName}`
      });
      
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Activity endpoints
  app.get("/api/activities", isAuthenticated, async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  // Stats endpoint
  app.get("/api/stats", isAuthenticated, async (req, res, next) => {
    try {
      const stats = await storage.getEmployeeStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
