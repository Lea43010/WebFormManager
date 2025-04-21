import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import fs from "fs-extra";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupDownloadRoutes } from "./download";
import { setupImageAnalysisRoutes } from "./services/image-analysis-routes";
import { setupSurfaceAnalysisRoutes } from "./services/surface-analysis-routes";
import { setupSurfaceAnalysisRoutes as setupSurfaceAnalysisAPIRoutes } from "./services/surface-analysis-api";
import { setupFileOrganizationRoutes } from "./routes/file-organization-routes";
import { ZodError, z } from "zod";
import { 
  insertCompanySchema, insertCustomerSchema, insertProjectSchema, 
  insertMaterialSchema, insertComponentSchema, insertAttachmentSchema, insertSoilReferenceDataSchema,
  insertBedarfKapaSchema, insertPersonSchema, insertMilestoneSchema, insertMilestoneDetailSchema,
  insertUserSchema, insertPermissionSchema,
  createInsertSchema, companies, customers, projects, persons, milestones, milestoneDetails, permissions,
  bodenklassenEnum, bodentragfaehigkeitsklassenEnum
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { upload, getFileType, handleUploadErrors, cleanupOnError } from "./upload";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Serve uploaded files statically with no-cache headers
  app.use("/uploads", (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    express.static(path.join(process.cwd(), "uploads"))(req, res, next);
  });
  
  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validierungsfehler",
        errors: fromZodError(err).toString(),
      });
    }
    next(err);
  });

  // Company routes
  app.get("/api/companies", async (req, res, next) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/companies/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ message: "Unternehmen nicht gefunden" });
      }
      res.json(company);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/companies", async (req, res, next) => {
    try {
      // Stelle sicher, dass numerische Felder korrekt konvertiert werden
      // Telefonnummer muss explizit als String formatiert werden
      const formData = {
        ...req.body,
        postalCode: typeof req.body.postalCode === 'string' ? parseInt(req.body.postalCode, 10) : req.body.postalCode,
        companyPhone: req.body.companyPhone?.toString() || null
      };
      
      const validatedData = insertCompanySchema.parse(formData);
      const company = await storage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Company creation error:", error);
      next(error);
    }
  });

  app.put("/api/companies/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Stelle sicher, dass numerische Felder korrekt konvertiert werden
      // Telefonnummer muss explizit als String formatiert werden
      const formData = {
        ...req.body,
        postalCode: typeof req.body.postalCode === 'string' && req.body.postalCode ? parseInt(req.body.postalCode, 10) : req.body.postalCode,
        companyPhone: req.body.companyPhone?.toString() || null
      };
      
      // Verwende das Schema für die partielle Validierung
      // Zuerst das ursprüngliche Schema (ohne Transformationen) holen
      const baseSchema = createInsertSchema(companies);
      const validatedData = baseSchema.partial().parse(formData);
      
      const company = await storage.updateCompany(id, validatedData);
      if (!company) {
        return res.status(404).json({ message: "Unternehmen nicht gefunden" });
      }
      res.json(company);
    } catch (error) {
      console.error("Company update error:", error);
      next(error);
    }
  });

  app.delete("/api/companies/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCompany(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Customer routes
  app.get("/api/customers", async (req, res, next) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/customers/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Kunde nicht gefunden" });
      }
      res.json(customer);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/customers", async (req, res, next) => {
    try {
      // Wenn keine Kundennummer übergeben wurde oder diese leer ist, 
      // entfernen wir sie aus dem Request, damit sie automatisch generiert wird
      if (!req.body.customerId) {
        delete req.body.customerId;
      }
      
      // Stelle sicher, dass numerische Felder korrekt konvertiert werden
      const formData = {
        ...req.body,
        customerId: req.body.customerId ? (typeof req.body.customerId === 'string' ? parseInt(req.body.customerId, 10) : req.body.customerId) : undefined,
        postalCode: typeof req.body.postalCode === 'string' ? parseInt(req.body.postalCode, 10) : req.body.postalCode,
        customerPhone: req.body.customerPhone?.toString() || null,
      };
      
      const validatedData = insertCustomerSchema.parse(formData);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/customers/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Stelle sicher, dass numerische Felder korrekt konvertiert werden
      const formData = {
        ...req.body,
        customerId: typeof req.body.customerId === 'string' && req.body.customerId ? parseInt(req.body.customerId, 10) : req.body.customerId,
        postalCode: typeof req.body.postalCode === 'string' && req.body.postalCode ? parseInt(req.body.postalCode, 10) : req.body.postalCode,
        customerPhone: req.body.customerPhone?.toString() || null,
      };
      
      // Verwende das Schema ohne transform für partial
      const baseSchema = createInsertSchema(customers);
      const validatedData = baseSchema.partial().parse(formData);
      
      const customer = await storage.updateCustomer(id, validatedData);
      if (!customer) {
        return res.status(404).json({ message: "Kunde nicht gefunden" });
      }
      res.json(customer);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/customers/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomer(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Nur Administratoren oder Manager können alle Projekte sehen
      if (req.user.role === 'administrator' || req.user.role === 'manager') {
        const projects = await storage.getProjects();
        return res.json(projects);
      }
      
      // Normale Benutzer können nur ihre eigenen Projekte sehen
      const projects = await storage.getProjectsByUser(req.user.id);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      next(error);
    }
  });
  
  // Endpunkt speziell für Projekte des aktuellen Benutzers
  app.get("/api/user/projects", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Projekte des aktuellen Benutzers abrufen
      const projects = await storage.getProjectsByUser(req.user.id);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching user projects:", error);
      next(error);
    }
  });

  app.get("/api/projects/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Nur Administratoren, Manager oder der Ersteller können das Projekt sehen
      if (req.user.role === 'administrator' || req.user.role === 'manager' || project.createdBy === req.user.id) {
        return res.json(project);
      }
      
      // Anderen Benutzern wird der Zugriff verweigert
      res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf dieses Projekt" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/projects", async (req, res, next) => {
    try {
      // Stelle sicher, dass die Felder im richtigen Format sind (als Strings)
      // Da Zod die Konversion erwartet, schicken wir die Daten als Strings
      const formData = {
        ...req.body,
        projectWidth: req.body.projectWidth?.toString() || null,
        projectLength: req.body.projectLength?.toString() || null,
        projectHeight: req.body.projectHeight?.toString() || null,
        projectText: req.body.projectText?.toString() || null,
      };
      
      // Schema übernimmt die Konversion zu Zahlen
      const validatedData = insertProjectSchema.parse(formData);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      next(error);
    }
  });

  app.put("/api/projects/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Stelle sicher, dass die Felder im richtigen Format sind (als Strings)
      const formData = {
        ...req.body,
        projectWidth: req.body.projectWidth?.toString() || null,
        projectLength: req.body.projectLength?.toString() || null,
        projectHeight: req.body.projectHeight?.toString() || null,
        projectText: req.body.projectText?.toString() || null
      };
      
      // Aktualisiere die Daten direkt, ohne komplexe Schema-Manipulation
      const validatedData = formData;
      const project = await storage.updateProject(id, validatedData);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      res.json(project);
    } catch (error) {
      console.error("Project update error:", error);
      next(error);
    }
  });

  app.delete("/api/projects/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Permission routes
  app.get("/api/projects/:projectId/permissions", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const permissions = await storage.getPermissions(projectId);
      res.json(permissions);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/projects/:projectId/permissions", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Format data for insertion
      const formData = {
        ...req.body,
        projectId,
        permissionDate: req.body.permissionDate ? new Date(req.body.permissionDate) : null
      };
      
      // Create permission
      const permission = await storage.createPermission(formData);
      res.status(201).json(permission);
    } catch (error) {
      console.error("Permission creation error:", error);
      next(error);
    }
  });
  
  app.delete("/api/permissions/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePermission(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Material routes
  app.get("/api/materials", async (req, res, next) => {
    try {
      const materials = await storage.getMaterials();
      res.json(materials);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/materials/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Material nicht gefunden" });
      }
      res.json(material);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/materials", async (req, res, next) => {
    try {
      const validatedData = insertMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/materials/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMaterialSchema.partial().parse(req.body);
      const material = await storage.updateMaterial(id, validatedData);
      if (!material) {
        return res.status(404).json({ message: "Material nicht gefunden" });
      }
      res.json(material);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/materials/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMaterial(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Component routes
  app.get("/api/components", async (req, res, next) => {
    try {
      const components = await storage.getComponents();
      res.json(components);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/components/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const component = await storage.getComponent(id);
      if (!component) {
        return res.status(404).json({ message: "Komponente nicht gefunden" });
      }
      res.json(component);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/components", async (req, res, next) => {
    try {
      const validatedData = insertComponentSchema.parse(req.body);
      const component = await storage.createComponent(validatedData);
      res.status(201).json(component);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/components/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertComponentSchema.partial().parse(req.body);
      const component = await storage.updateComponent(id, validatedData);
      if (!component) {
        return res.status(404).json({ message: "Komponente nicht gefunden" });
      }
      res.json(component);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/components/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteComponent(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Person routes (Ansprechpartner)
  app.get("/api/persons", async (req, res, next) => {
    try {
      const persons = await storage.getPersons();
      res.json(persons);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/persons/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const person = await storage.getPerson(id);
      if (!person) {
        return res.status(404).json({ message: "Ansprechpartner nicht gefunden" });
      }
      res.json(person);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/persons", async (req, res, next) => {
    try {
      // Numerische Felder konvertieren
      const formData = {
        ...req.body,
        personId: typeof req.body.personId === 'string' ? parseInt(req.body.personId, 10) : req.body.personId,
        projectId: typeof req.body.projectId === 'string' ? parseInt(req.body.projectId, 10) : req.body.projectId,
        companyId: typeof req.body.companyId === 'string' ? parseInt(req.body.companyId, 10) : req.body.companyId,
        professionalName: typeof req.body.professionalName === 'string' ? parseInt(req.body.professionalName, 10) : req.body.professionalName,
      };
      
      const validatedData = insertPersonSchema.parse(formData);
      const person = await storage.createPerson(validatedData);
      res.status(201).json(person);
    } catch (error) {
      console.error("Person creation error:", error);
      next(error);
    }
  });

  app.put("/api/persons/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Numerische Felder konvertieren
      const formData = {
        ...req.body,
        personId: typeof req.body.personId === 'string' ? parseInt(req.body.personId, 10) : req.body.personId,
        projectId: typeof req.body.projectId === 'string' ? parseInt(req.body.projectId, 10) : req.body.projectId,
        companyId: typeof req.body.companyId === 'string' ? parseInt(req.body.companyId, 10) : req.body.companyId,
        professionalName: typeof req.body.professionalName === 'string' ? parseInt(req.body.professionalName, 10) : req.body.professionalName,
      };
      
      // Schema für die partielle Validierung
      const baseSchema = createInsertSchema(persons);
      const validatedData = baseSchema.partial().parse(formData);
      
      const person = await storage.updatePerson(id, validatedData);
      if (!person) {
        return res.status(404).json({ message: "Ansprechpartner nicht gefunden" });
      }
      res.json(person);
    } catch (error) {
      console.error("Person update error:", error);
      next(error);
    }
  });

  app.delete("/api/persons/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePerson(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Attachment routes
  app.get("/api/projects/:projectId/attachments", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const attachments = await storage.getProjectAttachments(projectId);
      res.json(attachments);
    } catch (error) {
      next(error);
    }
  });
  
  // Neue Route für alle Anhänge
  app.get("/api/attachments", async (req, res, next) => {
    try {
      const attachments = await storage.getAllAttachments();
      res.json(attachments);
    } catch (error) {
      next(error);
    }
  });
  
  app.post(
    "/api/projects/:projectId/attachments",
    upload.single("file"),
    handleUploadErrors,
    cleanupOnError,
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Keine Datei hochgeladen." });
        }
        
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          // Lösche die Datei, da das Projekt nicht existiert
          await fs.remove(req.file.path);
          return res.status(404).json({ message: "Projekt nicht gefunden" });
        }
        
        const attachmentData = {
          projectId,
          fileName: req.file.originalname,
          originalName: req.file.originalname,
          fileType: getFileType(req.file.mimetype),
          filePath: req.file.path,
          fileSize: req.file.size,
          // mimeType wurde aus der Tabelle entfernt
          description: req.body.description || null
        };
        
        const attachment = await storage.createAttachment(attachmentData);
        res.status(201).json(attachment);
      } catch (error) {
        console.error("Error uploading attachment:", error);
        
        // Bei einem Fehler die Datei löschen, falls sie existiert
        if (req.file) {
          await fs.remove(req.file.path).catch(() => {});
        }
        
        next(error);
      }
    }
  );
  
  app.get("/api/attachments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const attachment = await storage.getAttachment(id);
      
      if (!attachment) {
        return res.status(404).json({ message: "Anhang nicht gefunden" });
      }
      
      res.json(attachment);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/attachments/:id/download", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const attachment = await storage.getAttachment(id);
      
      if (!attachment) {
        return res.status(404).json({ message: "Anhang nicht gefunden" });
      }
      
      // Prüfen, ob die Datei existiert
      if (!await fs.pathExists(attachment.filePath)) {
        return res.status(404).json({ message: "Datei nicht gefunden" });
      }
      
      const fileName = encodeURIComponent(attachment.fileName);
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.sendFile(path.resolve(attachment.filePath));
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/attachments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const attachment = await storage.getAttachment(id);
      
      if (!attachment) {
        return res.status(404).json({ message: "Anhang nicht gefunden" });
      }
      
      // Lösche die Datei vom Dateisystem
      await fs.remove(attachment.filePath).catch(err => {
        console.error("Error deleting file:", err);
      });
      
      // Lösche den Eintrag aus der Datenbank
      await storage.deleteAttachment(id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Serve static files from the uploads directory
  app.use("/uploads", (req, res, next) => {
    // Authentifizierungsprüfung
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nicht autorisiert" });
    }
    next();
  }, express.static(path.join(process.cwd(), "uploads"), {
    // Deaktiviere Cache für Uploads - damit immer die aktuellste Version geladen wird
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
  }));
  
  // Serve static RStO visualizations
  app.use("/static/rsto_visualizations", express.static(path.join(process.cwd(), "public/static/rsto_visualizations")));
  
  // Placeholder-Bild für Fehleranzeige
  app.get("/static/image-placeholder.png", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public/static/image-placeholder.png"));
  });
  
  // Allgemeine Upload-Route für Anhänge (inkl. Kamera-Upload)
  app.post(
    "/api/attachments/upload",
    upload.single("file"),
    handleUploadErrors,
    cleanupOnError,
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Keine Datei hochgeladen." });
        }
        
        if (!req.body.projectId) {
          // Lösche die Datei, da kein Projekt angegeben wurde
          await fs.remove(req.file.path);
          return res.status(400).json({ message: "Projekt-ID ist erforderlich" });
        }
        
        const projectId = parseInt(req.body.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          // Lösche die Datei, da das Projekt nicht existiert
          await fs.remove(req.file.path);
          return res.status(404).json({ message: "Projekt nicht gefunden" });
        }
        
        const attachmentData = {
          projectId,
          fileName: req.file.originalname,
          originalName: req.file.originalname,
          fileType: getFileType(req.file.mimetype),
          fileCategory: req.body.fileCategory || "Andere",
          filePath: req.file.path,
          fileSize: req.file.size,
          description: req.body.description || null,
          tags: req.body.tags || null
        };
        
        const attachment = await storage.createAttachment(attachmentData);
        res.status(201).json(attachment);
      } catch (error) {
        console.error("Error uploading attachment:", error);
        
        // Bei einem Fehler die Datei löschen, falls sie existiert
        if (req.file) {
          await fs.remove(req.file.path).catch(() => {});
        }
        
        next(error);
      }
    }
  );
  
  // Boden-Referenzdaten-Routen
  app.get("/api/soil-reference-data", async (req, res, next) => {
    try {
      const data = await storage.getSoilReferenceData();
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/soil-reference-data/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const data = await storage.getSoilReferenceDataById(id);
      if (!data) {
        return res.status(404).json({ message: "Bodenreferenzdaten nicht gefunden" });
      }
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/soil-reference-data/bodenklasse/:bodenklasse", async (req, res, next) => {
    try {
      const bodenklasse = req.params.bodenklasse;
      const data = await storage.getSoilReferenceDataByBodenklasse(bodenklasse);
      if (!data) {
        return res.status(404).json({ message: "Bodenreferenzdaten für diese Bodenklasse nicht gefunden" });
      }
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/soil-reference-data", async (req, res, next) => {
    try {
      const validatedData = insertSoilReferenceDataSchema.parse(req.body);
      const data = await storage.createSoilReferenceData(validatedData);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/soil-reference-data/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSoilReferenceDataSchema.partial().parse(req.body);
      const data = await storage.updateSoilReferenceData(id, validatedData);
      if (!data) {
        return res.status(404).json({ message: "Bodenreferenzdaten nicht gefunden" });
      }
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/soil-reference-data/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSoilReferenceData(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Einrichten der Download-Routen für Datenbankmigrationen
  setupDownloadRoutes(app);
  
  // Smart File Organization Routen einrichten
  setupFileOrganizationRoutes(app);
  
  // Image Analyse und RStO-Routen einrichten
  setupImageAnalysisRoutes(app);
  setupSurfaceAnalysisRoutes(app);
  setupSurfaceAnalysisAPIRoutes(app);
  
  // BedarfKapa routes
  app.get("/api/projects/:projectId/bedarfkapa", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const bedarfKapas = await storage.getBedarfKapas(projectId);
      res.json(bedarfKapas);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/projects/:projectId/bedarfkapa", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Stelle sicher, dass numerische Felder korrekt konvertiert werden
      const formData = {
        ...req.body,
        projectId,
        bedarfKapaAnzahl: typeof req.body.bedarfKapaAnzahl === 'string' ? 
          parseInt(req.body.bedarfKapaAnzahl, 10) : req.body.bedarfKapaAnzahl,
      };
      
      const validatedData = insertBedarfKapaSchema.parse(formData);
      const bedarfKapa = await storage.createBedarfKapa(validatedData);
      res.status(201).json(bedarfKapa);
    } catch (error) {
      console.error("BedarfKapa creation error:", error);
      next(error);
    }
  });
  
  app.get("/api/projects/:projectId/bedarfkapa/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const bedarfKapa = await storage.getBedarfKapa(id);
      if (!bedarfKapa) {
        return res.status(404).json({ message: "Bedarf/Kapazität nicht gefunden" });
      }
      res.json(bedarfKapa);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/projects/:projectId/bedarfkapa/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBedarfKapa(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Milestone routes
  app.get("/api/projects/:projectId/milestones", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const milestones = await storage.getMilestones(projectId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      next(error);
    }
  });

  app.get("/api/projects/:projectId/milestones/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const milestone = await storage.getMilestone(id);
      if (!milestone) {
        return res.status(404).json({ message: "Meilenstein nicht gefunden" });
      }
      res.json(milestone);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/projects/:projectId/milestones", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Stelle sicher, dass numerische Felder korrekt konvertiert werden
      const formData = {
        ...req.body,
        projectId,
        startKW: typeof req.body.startKW === 'string' ? parseInt(req.body.startKW, 10) : req.body.startKW,
        endKW: typeof req.body.endKW === 'string' ? parseInt(req.body.endKW, 10) : req.body.endKW,
        jahr: typeof req.body.jahr === 'string' ? parseInt(req.body.jahr, 10) : req.body.jahr,
        sollMenge: req.body.sollMenge,
      };
      
      const validatedData = insertMilestoneSchema.parse(formData);
      const milestone = await storage.createMilestone(validatedData);
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Milestone creation error:", error);
      next(error);
    }
  });

  app.put("/api/projects/:projectId/milestones/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const projectId = parseInt(req.params.projectId);
      
      // Stelle sicher, dass numerische Felder korrekt konvertiert werden
      const formData = {
        ...req.body,
        projectId,
        startKW: typeof req.body.startKW === 'string' ? parseInt(req.body.startKW, 10) : req.body.startKW,
        endKW: typeof req.body.endKW === 'string' ? parseInt(req.body.endKW, 10) : req.body.endKW,
        jahr: typeof req.body.jahr === 'string' ? parseInt(req.body.jahr, 10) : req.body.jahr,
        sollMenge: req.body.sollMenge,
      };
      
      const baseSchema = createInsertSchema(milestones);
      const validatedData = baseSchema.partial().parse(formData);
      
      const milestone = await storage.updateMilestone(id, validatedData);
      if (!milestone) {
        return res.status(404).json({ message: "Meilenstein nicht gefunden" });
      }
      res.json(milestone);
    } catch (error) {
      console.error("Milestone update error:", error);
      next(error);
    }
  });

  app.delete("/api/projects/:projectId/milestones/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMilestone(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Milestone Detail routes
  app.get("/api/milestones/:milestoneId/details", async (req, res, next) => {
    try {
      const milestoneId = parseInt(req.params.milestoneId);
      const details = await storage.getMilestoneDetails(milestoneId);
      res.json(details);
    } catch (error) {
      console.error("Error fetching milestone details:", error);
      next(error);
    }
  });

  app.get("/api/milestones/:milestoneId/details/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const detail = await storage.getMilestoneDetail(id);
      if (!detail) {
        return res.status(404).json({ message: "Meilenstein-Detail nicht gefunden" });
      }
      res.json(detail);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/milestones/:milestoneId/details", async (req, res, next) => {
    try {
      const milestoneId = parseInt(req.params.milestoneId);
      
      // Stelle sicher, dass numerische Felder korrekt konvertiert werden
      const formData = {
        ...req.body,
        milestoneId,
        kalenderwoche: typeof req.body.kalenderwoche === 'string' ? 
          parseInt(req.body.kalenderwoche, 10) : req.body.kalenderwoche,
        jahr: typeof req.body.jahr === 'string' ? 
          parseInt(req.body.jahr, 10) : req.body.jahr,
        sollMenge: req.body.sollMenge,
      };
      
      const validatedData = insertMilestoneDetailSchema.parse(formData);
      const detail = await storage.createMilestoneDetail(validatedData);
      res.status(201).json(detail);
    } catch (error) {
      console.error("Milestone detail creation error:", error);
      next(error);
    }
  });

  app.put("/api/milestones/:milestoneId/details/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const milestoneId = parseInt(req.params.milestoneId);
      
      // Stelle sicher, dass numerische Felder korrekt konvertiert werden
      const formData = {
        ...req.body,
        milestoneId,
        kalenderwoche: typeof req.body.kalenderwoche === 'string' ? 
          parseInt(req.body.kalenderwoche, 10) : req.body.kalenderwoche,
        jahr: typeof req.body.jahr === 'string' ? 
          parseInt(req.body.jahr, 10) : req.body.jahr,
        sollMenge: req.body.sollMenge,
      };
      
      const baseSchema = createInsertSchema(milestoneDetails);
      const validatedData = baseSchema.partial().parse(formData);
      
      const detail = await storage.updateMilestoneDetail(id, validatedData);
      if (!detail) {
        return res.status(404).json({ message: "Meilenstein-Detail nicht gefunden" });
      }
      res.json(detail);
    } catch (error) {
      console.error("Milestone detail update error:", error);
      next(error);
    }
  });

  app.delete("/api/milestones/:milestoneId/details/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMilestoneDetail(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // =================== Permission Routen ===================
  app.get("/api/projects/:projectId/permissions", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const permissions = await storage.getPermissions(projectId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      next(error);
    }
  });

  // Berechtigungen für ein Projekt abrufen
  app.get("/api/projects/:projectId/permissions", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      console.log(`Fetching permissions for project ID: ${projectId}`);
      const permissions = await storage.getPermissions(projectId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      next(error);
    }
  });

  // Neue Berechtigung für ein Projekt erstellen
  app.post("/api/projects/:projectId/permissions", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Daten für die neue Genehmigung vorbereiten
      const permissionData = {
        projectId,
        permissionType: req.body.permissionType,
        permissionAuthority: req.body.permissionAuthority,
        permissionDate: req.body.permissionDate || null,
        permissionNotes: req.body.permissionNotes || null
      };

      console.log("Creating permission with data:", permissionData);
      const newPermission = await storage.createPermission(permissionData);
      res.status(201).json(newPermission);
    } catch (error) {
      console.error("Error creating permission:", error);
      next(error);
    }
  });

  app.delete("/api/permissions/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePermission(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting permission:", error);
      next(error);
    }
  });

  // =================== Admin Routen ===================
  // Middleware für Berechtigungsprüfung
  const checkAdminRole = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nicht authentifiziert" });
    }
    
    // Nur Administratoren oder Manager haben Zugriff
    if (req.user.role !== "administrator" && req.user.role !== "manager") {
      return res.status(403).json({ message: "Keine Berechtigung" });
    }
    
    next();
  };

  // Nur für Administratoren
  const checkAdminOnly = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nicht authentifiziert" });
    }
    
    // Nur Administratoren haben Zugriff
    if (req.user.role !== "administrator") {
      return res.status(403).json({ message: "Keine Berechtigung. Diese Funktion ist nur für Administratoren verfügbar." });
    }
    
    next();
  };

  // Benutzerliste für Admins
  app.get("/api/admin/users", checkAdminRole, async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  // Benutzer erstellen (nur Admin)
  app.post("/api/admin/users", checkAdminRole, async (req, res, next) => {
    try {
      // Nur Administratoren können andere Administratoren erstellen
      if (req.body.role === "administrator" && req.user.role !== "administrator") {
        return res.status(403).json({ 
          message: "Keine Berechtigung. Nur Administratoren können neue Administratoren erstellen." 
        });
      }

      // Passworthashing erfolgt in der storage.createUser Funktion
      const userData = {
        ...req.body,
        createdBy: req.user.id,
      };
      
      const validatedData = insertUserSchema.parse(userData);
      const newUser = await storage.createUser(validatedData);
      
      // Passwort aus der Antwort entfernen
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Benutzer löschen (nur Admin)
  app.delete("/api/admin/users/:id", checkAdminOnly, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verhindere, dass Administratoren sich selbst löschen
      if (userId === req.user.id) {
        return res.status(400).json({
          message: "Sie können Ihren eigenen Benutzer nicht löschen."
        });
      }
      
      // Prüfe, ob der zu löschende Benutzer existiert
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({
          message: "Benutzer nicht gefunden."
        });
      }
      
      await storage.deleteUser(userId);
      res.status(200).json({ message: "Benutzer erfolgreich gelöscht." });
    } catch (error) {
      if (error.message && error.message.includes("Benutzer hat noch Projekte")) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  });

  // Projekte des angemeldeten Benutzers
  app.get("/api/user/projects", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nicht authentifiziert" });
    }

    try {
      const projects = await storage.getProjectsByUser(req.user.id);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });
  
  // Projekte nach Benutzer filtern (für projekteigene Ansichten)
  app.get("/api/projects/by-user", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nicht authentifiziert" });
    }

    try {
      let projects;
      
      // Administrator und Manager sehen alle Projekte
      if (req.user.role === 'administrator' || req.user.role === 'manager') {
        projects = await storage.getProjects();
      } else {
        // Normale Benutzer sehen nur ihre eigenen Projekte
        projects = await storage.getProjectsByUser(req.user.id);
      }
      
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  // Bei Projekterstellung den aktuellen Benutzer als Ersteller speichern
  // Überschreibe die ursprüngliche POST /api/projects Route
  app.post("/api/projects", async (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }

      try {
        // Stelle sicher, dass die Felder im richtigen Format sind (als Strings)
        // Da Zod die Konversion erwartet, schicken wir die Daten als Strings
        const formData = {
          ...req.body,
          projectWidth: req.body.projectWidth?.toString() || null,
          projectLength: req.body.projectLength?.toString() || null,
          projectHeight: req.body.projectHeight?.toString() || null,
          projectText: req.body.projectText?.toString() || null,
          createdBy: req.user.id, // Aktueller Benutzer als Ersteller
        };
        
        // Schema übernimmt die Konversion zu Zahlen
        const validatedData = insertProjectSchema.parse(formData);
        const project = await storage.createProject(validatedData);
        res.status(201).json(project);
      } catch (error) {
        console.error("Project creation error:", error);
        next(error);
      }
  });
  
  // Login-Logs abfragen - nur für Administratoren
  app.get("/api/login-logs", async (req, res, next) => {
    // Prüfe, ob der Benutzer authentifiziert ist
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nicht authentifiziert" });
    }
    
    // Prüfe, ob der Benutzer Administrator ist
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ message: "Keine Berechtigung. Diese Funktion steht nur Administratoren zur Verfügung." });
    }

    try {
      const logs = await storage.getLoginLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching login logs:", error);
      next(error);
    }
  });
  
  // Login-Logs für einen bestimmten Benutzer abfragen - nur für Administratoren
  app.get("/api/login-logs/user/:userId", async (req, res, next) => {
    // Prüfe, ob der Benutzer authentifiziert ist
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nicht authentifiziert" });
    }
    
    // Prüfe, ob der Benutzer Administrator ist
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ message: "Keine Berechtigung. Diese Funktion steht nur Administratoren zur Verfügung." });
    }

    try {
      const userId = parseInt(req.params.userId, 10);
      const logs = await storage.getLoginLogsByUser(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching user login logs:", error);
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
