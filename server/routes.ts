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
  insertBedarfKapaSchema,
  createInsertSchema, companies, customers, projects, 
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
      // Stelle sicher, dass numerische Felder korrekt konvertiert werden
      const formData = {
        ...req.body,
        customerId: typeof req.body.customerId === 'string' ? parseInt(req.body.customerId, 10) : req.body.customerId,
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
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/projects/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      res.json(project);
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
          filePath: req.file.path,
          fileSize: req.file.size,
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

  const httpServer = createServer(app);
  return httpServer;
}
