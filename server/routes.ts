import type { Express } from "express";
import { createServer as createHttpServer, type Server } from "http";
import { createServer as createHttpsServer } from "https";
import express from "express";
import path from "path";
import fs from "fs-extra";
import { findFile, ensureUploadDirectories } from "./file-utils";
import { storage } from "./storage";
import { sql } from "./db";
import { setupAuth } from "./auth";
import { setupDownloadRoutes } from "./download";
import { setupEnhancedDownloadRoutes } from "./routes/download-routes";
import { setupHealthRoutes } from "./health";
import { setupImageAnalysisRoutes } from "./services/image-analysis-routes";
import { setupSurfaceAnalysisRoutes } from "./services/surface-analysis-routes";
import { setupSurfaceAnalysisRoutes as setupSurfaceAnalysisAPIRoutes } from "./services/surface-analysis-api";
import { setupFileOrganizationRoutes } from "./routes/file-organization-routes";
import { setupBackupRoutes } from "./backup";
import { setupStripeRoutes } from "./stripe-routes";
import { registerEmailRoutes } from "./routes/email-routes";
import { setupActivityLogRoutes } from "./routes/activity-log-routes";
import { setupLoginLogsRoutes } from "./routes/login-logs-routes";
import { setupDebugRoutes } from "./debug-routes"; // Neue Debug-Routes
import directDownloadRouter from "./routes/direct-download"; // Direkte Download-Route ohne Token
import { default as attachmentDebugRoutes } from "./routes/attachment-debug-routes"; // Debug-Routen für Anhänge
import { setupImageRoutes } from "./routes/image-routes"; // Bildoptimierungs-Routes
// Import von Upload-Funktionen erfolgt bereits in Zeile 70
import dataQualityApiRouter from "./data-quality-api"; // Datenqualitäts-API
import { registerRoadDamageRoutes } from "./road-damage-api"; // Straßenschaden-API
import { setupSpeechToTextRoute } from "./services/speech-to-text"; // Speech-to-Text-Service
import documentRoutes from "./routes/document-routes"; // Neues Dokumentenspeichersystem
import { registerBackupApiRoutes } from "./routes/backup-routes"; // Neue Backup-API
import documentSyncRouter from "./routes/document-sync-routes"; // Dokumenten-Synchronisation
import searchRouter from "./routes/search-routes"; // Universelle Suche
import queryAnalyticsRouter from "./routes/query-analytics-routes"; // SQL-Query-Analytics
import subscriptionRouter from "./routes/subscription-routes"; // Abonnement-Verwaltung
import bodenanalyseRoutes from "./routes/bodenanalyse-routes"; // Bodenanalyse-API
import { logActivity, ActionType, getIpAddress } from "./activity-logger";
import { trialEmailService } from "./trial-email-service";
import logger from "./logger";
import { generateDownloadToken, verifyDownloadToken, invalidateToken } from "./services/token-service";
import { 
  getDataQualityMetricsHandler, 
  runDataQualityCheckHandler, 
  resolveIssueHandler, 
  toggleRuleActiveHandler 
} from "./data-quality";
import { checkDatabaseStructureHandler, checkDatabaseStructure } from "./db-structure-quality";
import { dataQualityChecker } from "./data-quality-checker";
import { requireManagerOrAbove } from "./middleware/role-check"; // Rollenprüfung für Manager und Administratoren
import { checkSubscriptionStatus, verifySubscriptionStatus } from "./middleware/auth"; // Abonnementstatus-Prüfung
import { z } from "zod";
import soilAnalysisRoutes from "./routes/soil-analysis-routes"; // Bodenanalyse-Modul

// Import für den verbesserten Download-Debugger
import { setupDownloadDebugger } from "./direct-download-debugger"; // Neuer Download-Debugger
import { setupAdvancedDirectDownload } from "./routes/advanced-direct-download"; // Verbesserte Download-Funktionalität
import { errorHandler } from "./error-handler"; // Zentrale Fehlerbehandlung
import geoProjectsRouter from "./routes/geo-projects"; // Geo-Projekte-API
import elevationRouter from "./routes/elevation"; // Google Elevation API
import bodenArtenRouter from "./routes/bodenarten"; // Bodenarten API
import maschinenRouter from "./routes/maschinen"; // Maschinen API
import adminRouter from "./routes/admin-routes"; // Admin-API
import cacheRoutes from "./routes/cache-routes"; // Cache-Verwaltungs-API
// Hier kein Import für die Tiefbau-PDF-Route, wir implementieren sie direkt
import cacheManager from "./cache-manager"; // Cache-Manager für Cache-Funktionalitäten
import { 
  insertCompanySchema, insertCustomerSchema, insertProjectSchema, 
  insertMaterialSchema, insertComponentSchema, insertAttachmentSchema, insertSoilReferenceDataSchema,
  insertBedarfKapaSchema, insertPersonSchema, insertMilestoneSchema, insertMilestoneDetailSchema,
  insertUserSchema, insertPermissionSchema, insertConstructionDiarySchema, insertConstructionDiaryEmployeeSchema,
  createInsertSchema, companies, customers, projects, persons, milestones, milestoneDetails, permissions,
  bodenklassenEnum, bodentragfaehigkeitsklassenEnum
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { upload, getFileType, handleUploadErrors, cleanupOnError, optimizedUpload } from "./upload";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dokumentations-PDFs mit korrektem Content-Type bereitstellen
  app.get('/docs/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'public', 'docs', filename);
    
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return res.status(404).send('Dokument nicht gefunden');
      }
      
      // Setze den korrekten Content-Type für PDFs
      if (filename.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
      }
      
      // Sende die Datei
      res.sendFile(filePath);
    } catch (error) {
      console.error("Fehler beim Dateizugriff:", error);
      res.status(500).send('Interner Serverfehler');
    }
  });

  // Set up authentication routes
  setupAuth(app);
  
  // Set up health check routes
  setupHealthRoutes(app);
  
  // Debug-Routen einrichten (ohne Authentifizierung)
  setupDebugRoutes(app);
  
  // Verbesserten Download-Debugger aktivieren
  setupDownloadDebugger(app);
  
  // Verbesserte Download-Funktionalität aktivieren
  setupAdvancedDirectDownload(app);
  
  // Backup-Routen einrichten
  setupBackupRoutes(app);
  
  // Stripe-Zahlungsrouten einrichten
  setupStripeRoutes(app);
  
  // E-Mail-Routen einrichten
  registerEmailRoutes(app);
  
  // Aktivitätsprotokoll-Routen einrichten
  setupActivityLogRoutes(app);
  
  // Login-Protokoll-Routen einrichten
  setupLoginLogsRoutes(app);
  
  // Dokumentenspeicher-Routen einrichten
  app.use('/api/documents', documentRoutes);
  
  // Datenqualitäts-API-Routen einrichten
  app.use('/api', dataQualityApiRouter);
  
  // Straßenschaden-API-Routen einrichten
  registerRoadDamageRoutes(app);
  
  // Speech-to-Text-Route einrichten
  setupSpeechToTextRoute(app);
  
  // Neue Backup-API-Routen einrichten
  registerBackupApiRoutes(app);
  
  // Geo-Projekte-API-Routen einrichten
  app.use(geoProjectsRouter);
  
  // Google Elevation API-Routen einrichten
  app.use(elevationRouter);
  
  // Bodenarten-API-Routen einrichten
  app.use(bodenArtenRouter);
  
  // Maschinen-API-Routen einrichten
  app.use(maschinenRouter);
  
  // Bodenanalyse-API-Routen einrichten
  app.use('/api/soil-analysis', bodenanalyseRoutes);
  
  // Tiefbau-Routen - PDF wird jetzt clientseitig generiert
  
  // Admin-API-Routen (wieder aktiviert mit optimierten SQL-Abfragen)
  app.use('/api/admin', adminRouter);
  
  // SQL-Query-Analytics-Routen (nur für Administratoren)
  app.use('/api/admin/query-analytics', queryAnalyticsRouter);
  
  // Cache-Verwaltungs-Routen (nur für Administratoren)
  app.use('/api/cache', cacheRoutes);
  
  // Dokumenten-Synchronisations-Routen
  app.use(documentSyncRouter);
  
  // Universelle Such-Routen
  app.use(searchRouter);
  
  // Serve uploaded files statically with no-cache headers
  app.use("/uploads", (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    express.static(path.join(process.cwd(), "uploads"))(req, res, next);
  });
  
  // Verwende die zentrale Fehlerbehandlung aus error-handler.ts
  // Alle speziellen Fehlertypen wie ZodError werden dort behandelt
  app.use(errorHandler);

  // Endpoint zum Abrufen der nächsten Firmennummer
  app.get("/api/companies/next-id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const nextId = await storage.getNextCompanyId();
      return res.json({ nextId });
    } catch (error) {
      console.error("Error getting next company ID:", error);
      next(error);
    }
  });
  
  // Company routes
  app.get("/api/companies", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Nur Administratoren können alle Firmen sehen
      if (req.user.role === 'administrator') {
        const companies = await storage.getCompanies();
        return res.json(companies);
      }
      
      // Alle Firmen holen
      const allCompanies = await storage.getCompanies();
      
      if (req.user.role === 'manager') {
        // Manager können nur ihre eigenen Firmen sehen
        // @ts-ignore - Das Feld created_by ist in der Datenbank vorhanden
        const companies = allCompanies.filter(company => company.created_by === req.user.id);
        return res.json(companies);
      }
      
      // Normale Benutzer können nur Firmen sehen, die mit ihren Projekten verbunden sind
      // Holen der Projekte des Benutzers
      const userProjects = await storage.getProjectsByUser(req.user.id);
      
      // Wenn keine Projekte, leeres Array zurückgeben
      if (userProjects.length === 0) {
        return res.json([]);
      }
      
      // Firmen filtern, die mit Projekten des Benutzers verbunden sind
      const companies = allCompanies.filter(company => 
        userProjects.some(project => project.companyId === company.id)
      );
      
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      next(error);
    }
  });

  app.get("/api/companies/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      
      if (!company) {
        return res.status(404).json({ message: "Unternehmen nicht gefunden" });
      }
      
      // Administratoren können alle Firmen sehen
      if (req.user.role === 'administrator') {
        return res.json(company);
      }
      
      // Manager können nur ihre eigenen Firmen sehen (die sie erstellt haben)
      if (req.user.role === 'manager') {
        // @ts-ignore - Das Feld created_by ist in der Datenbank vorhanden
        if (company.created_by === req.user.id) {
          return res.json(company);
        } else {
          return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf dieses Unternehmen. Manager können nur ihre eigenen Unternehmen sehen." });
        }
      }
      
      // Für normale Benutzer: Prüfen, ob die Firma mit einem ihrer Projekte verbunden ist
      const userProjects = await storage.getProjectsByUser(req.user.id);
      const hasAccess = userProjects.some(project => project.companyId === company.id);
      
      if (hasAccess) {
        return res.json(company);
      }
      
      // Keine Berechtigung
      return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf diese Firma" });
    } catch (error) {
      console.error("Error fetching company:", error);
      next(error);
    }
  });

  app.post("/api/companies", requireManagerOrAbove(), async (req, res, next) => {
    try {
      // Authentifizierungsprüfung ist bereits durch die requireManagerOrAbove-Middleware erfolgt
      // Nullable-Check für TypeScript
      if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' });
      }
      
      console.log(`Benutzer mit Rolle ${req.user.role} erstellt eine neue Firma`);
      
      // Stelle sicher, dass numerische Felder korrekt konvertiert werden
      // Telefonnummer muss explizit als String formatiert werden
      const formData = {
        ...req.body,
        postalCode: typeof req.body.postalCode === 'string' ? parseInt(req.body.postalCode, 10) : req.body.postalCode,
        companyPhone: req.body.companyPhone?.toString() || null,
        created_by: req.user.id // Speichert den erstellenden Benutzer
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const id = parseInt(req.params.id);
      const existingCompany = await storage.getCompany(id);
      
      if (!existingCompany) {
        return res.status(404).json({ message: "Unternehmen nicht gefunden" });
      }
      
      // Berechtigungsprüfung für nicht-Administratoren
      if (req.user.role !== 'administrator') {
        // Manager können nur ihre eigenen Unternehmen bearbeiten (die sie erstellt haben)
        if (req.user.role === 'manager') {
          // @ts-ignore - Das Feld created_by ist in der Datenbank vorhanden
          if (existingCompany.created_by !== req.user.id) {
            return res.status(403).json({ message: "Keine Berechtigung für die Bearbeitung dieses Unternehmens. Manager können nur ihre eigenen Unternehmen bearbeiten." });
          }
        } else {
          // Prüfen, ob die Firma mit einem Projekt des Benutzers verbunden ist
          const userProjects = await storage.getProjectsByUser(req.user.id);
          const hasAccess = userProjects.some(project => project.companyId === existingCompany.id);
          
          if (!hasAccess) {
            return res.status(403).json({ message: "Keine Berechtigung für die Bearbeitung dieser Firma" });
          }
        }
      }
      
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const id = parseInt(req.params.id);
      const existingCompany = await storage.getCompany(id);
      
      if (!existingCompany) {
        return res.status(404).json({ message: "Unternehmen nicht gefunden" });
      }
      
      // Nur Administrator darf Firmen löschen
      if (req.user.role !== 'administrator') {
        return res.status(403).json({ message: "Keine Berechtigung zum Löschen von Firmen. Diese Operation erfordert Administrator-Rechte." });
      }
      
      // Protokolliere die Löschung eines Unternehmens
      try {
        await logActivity({
          userId: req.user.id,
          ipAddress: getIpAddress(req),
          component: 'Unternehmen',
          actionType: ActionType.DELETE,
          entityType: 'company',
          entityId: id,
          details: { 
            description: `Unternehmen "${existingCompany.companyName}" (ID: ${id}) gelöscht`,
            companyId: id,
            companyName: existingCompany.companyName,
            deletedBy: req.user.id,
            deletedByUsername: req.user.username
          }
        });
      } catch (logError) {
        console.error("Fehler beim Protokollieren der Unternehmenslöschung:", logError);
        // Wir werfen den Fehler nicht weiter, um den eigentlichen Löschvorgang nicht zu blockieren
      }
      
      await storage.deleteCompany(id);
      res.status(204).send();
    } catch (error) {
      console.error("Company delete error:", error);
      next(error);
    }
  });

  // Endpoint zum Abrufen der nächsten Kundennummer
  app.get("/api/customers/next-id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const nextId = await storage.getNextCustomerId();
      return res.json({ nextId });
    } catch (error) {
      console.error("Error getting next customer ID:", error);
      next(error);
    }
  });
  
  // Endpoint zum Abrufen der nächsten Kundennummer
  app.get("/api/customers/next-id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const nextId = await storage.getNextCustomerId();
      return res.json({ nextId });
    } catch (error) {
      console.error("Error getting next customer ID:", error);
      next(error);
    }
  });
  
  // Customer routes
  app.get("/api/customers", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      console.log("Benutzerrolle:", req.user.role);
      console.log("Benutzer-ID:", req.user.id);
      
      // Alle Kunden holen
      const allCustomers = await storage.getCustomers();
      console.log("Gefundene Kunden:", allCustomers.length);
      
      // Debug-Ausgabe für die ersten Kunden
      if (allCustomers.length > 0) {
        console.log("Erster Kunde:", JSON.stringify(allCustomers[0]));
      }
      
      // Nur Administratoren können alle Kunden sehen
      if (req.user.role === 'administrator') {
        console.log("Administrator-Rolle erkannt, sende alle Kunden zurück");
        return res.json(allCustomers);
      }
      
      // Manager können nur ihre eigenen Kunden sehen (die sie erstellt haben)
      if (req.user.role === 'manager') {
        console.log("Manager-Rolle erkannt, filtere Kunden nach created_by");
        // Umwandlung der Benutzer-ID in eine Zahl für den Vergleich, falls sie als String vorliegt
        const userId = Number(req.user.id);
        
        // Filtere Kunden basierend auf dem created_by-Feld
        const customers = allCustomers.filter(customer => {
          const customerCreatedBy = Number(customer.created_by);
          console.log(`Kunde ${customer.id}: created_by=${customerCreatedBy}, Benutzer-ID=${userId}`);
          return customerCreatedBy === userId;
        });
        
        console.log(`${customers.length} Kunden gefunden für Manager`);
        return res.json(customers);
      }
      
      // Normale Benutzer können nur Kunden sehen, die mit ihren Projekten verbunden sind oder von ihnen erstellt wurden
      // Holen der Projekte des Benutzers
      const userProjects = await storage.getProjectsByUser(req.user.id);
      console.log(`${userProjects.length} Projekte gefunden für normalen Benutzer`);
      
      // Kunden filtern, die mit Projekten des Benutzers verbunden sind oder von ihnen erstellt wurden
      const userId = Number(req.user.id);
      const customers = allCustomers.filter(customer => {
        const projectMatch = userProjects.some(project => project.customerId === customer.id);
        const createdByMatch = Number(customer.created_by) === userId;
        
        if (projectMatch) console.log(`Kunde ${customer.id} ist mit einem Projekt des Benutzers verbunden`);
        if (createdByMatch) console.log(`Kunde ${customer.id} wurde vom Benutzer erstellt`);
        
        return projectMatch || createdByMatch;
      });
      
      console.log(`${customers.length} Kunden gefunden für normalen Benutzer`);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      next(error);
    }
  });

  app.get("/api/customers/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      console.log("Benutzerrolle:", req.user.role);
      console.log("Benutzer-ID:", req.user.id);
      
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Kunde nicht gefunden" });
      }
      
      console.log("Gefundener Kunde:", JSON.stringify(customer));
      
      // Administratoren können alle Kunden sehen
      if (req.user.role === 'administrator') {
        console.log("Administrator-Rolle erkannt, sende Kunde zurück");
        return res.json(customer);
      }
      
      // Manager können nur ihre eigenen Kunden sehen (die sie erstellt haben)
      if (req.user.role === 'manager') {
        const userId = Number(req.user.id);
        const customerCreatedBy = Number(customer.created_by);
        console.log(`Kunde ${customer.id}: created_by=${customerCreatedBy}, Benutzer-ID=${userId}`);
        
        if (customerCreatedBy === userId) {
          console.log("Manager hat Zugriff auf Kunde (selbst erstellt)");
          return res.json(customer);
        } else {
          console.log("Manager hat KEINEN Zugriff auf Kunde (nicht selbst erstellt)");
          return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf diesen Kunden. Manager können nur ihre eigenen Kunden sehen." });
        }
      }
      
      // Für normale Benutzer: Prüfen, ob der Kunde mit einem ihrer Projekte verbunden ist oder von ihnen erstellt wurde
      const userProjects = await storage.getProjectsByUser(req.user.id);
      console.log(`${userProjects.length} Projekte gefunden für normalen Benutzer`);
      
      const userId = Number(req.user.id);
      const customerCreatedBy = Number(customer.created_by);
      
      const projectMatch = userProjects.some(project => project.customerId === customer.id);
      const createdByMatch = customerCreatedBy === userId;
      
      if (projectMatch) console.log(`Kunde ${customer.id} ist mit einem Projekt des Benutzers verbunden`);
      if (createdByMatch) console.log(`Kunde ${customer.id} wurde vom Benutzer erstellt`);
      
      if (projectMatch || createdByMatch) {
        console.log("Benutzer hat Zugriff auf Kunde");
        return res.json(customer);
      }
      
      // Keine Berechtigung
      console.log("Benutzer hat KEINEN Zugriff auf Kunde");
      return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf diesen Kunden" });
    } catch (error) {
      console.error("Error fetching customer:", error);
      next(error);
    }
  });

  app.post("/api/customers", requireManagerOrAbove(), async (req, res, next) => {
    try {
      // Authentifizierungsprüfung ist bereits durch die requireManagerOrAbove-Middleware erfolgt
      if (!req.user) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      console.log(`Benutzer mit Rolle ${req.user.role} erstellt einen neuen Kunden`);
      
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
        created_by: req.user?.id || null // Speichert den erstellenden Benutzer
      };
      
      const validatedData = insertCustomerSchema.parse(formData);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Customer creation error:", error);
      next(error);
    }
  });

  app.put("/api/customers/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      console.log("Benutzerrolle:", req.user.role);
      console.log("Benutzer-ID:", req.user.id);
      
      const id = parseInt(req.params.id);
      const existingCustomer = await storage.getCustomer(id);
      
      if (!existingCustomer) {
        return res.status(404).json({ message: "Kunde nicht gefunden" });
      }
      
      console.log("Vorhandener Kunde:", JSON.stringify(existingCustomer));
      
      // Berechtigungsprüfung
      // Administratoren können jeden Kunden bearbeiten
      if (req.user.role !== 'administrator') {
        // Manager können nur ihre eigenen Kunden bearbeiten (die sie erstellt haben)
        if (req.user.role === 'manager') {
          const userId = Number(req.user.id);
          const customerCreatedBy = Number(existingCustomer.created_by);
          console.log(`Kunde ${existingCustomer.id}: created_by=${customerCreatedBy}, Benutzer-ID=${userId}`);
          
          if (customerCreatedBy !== userId) {
            console.log("Manager hat KEINEN Zugriff auf Kunde (nicht selbst erstellt)");
            return res.status(403).json({ message: "Keine Berechtigung für die Bearbeitung dieses Kunden. Manager können nur ihre eigenen Kunden bearbeiten." });
          }
        } else {
          // Für normale Benutzer: Prüfen, ob der Kunde mit einem ihrer Projekte verbunden ist oder von ihnen erstellt wurde
          const userProjects = await storage.getProjectsByUser(req.user.id);
          console.log(`${userProjects.length} Projekte gefunden für normalen Benutzer`);
          
          const userId = Number(req.user.id);
          const customerCreatedBy = Number(existingCustomer.created_by);
          
          const projectMatch = userProjects.some(project => project.customerId === existingCustomer.id);
          const createdByMatch = customerCreatedBy === userId;
          
          if (projectMatch) console.log(`Kunde ${existingCustomer.id} ist mit einem Projekt des Benutzers verbunden`);
          if (createdByMatch) console.log(`Kunde ${existingCustomer.id} wurde vom Benutzer erstellt`);
          
          if (!projectMatch && !createdByMatch) {
            console.log("Benutzer hat KEINEN Zugriff auf Kunde");
            return res.status(403).json({ message: "Keine Berechtigung für die Bearbeitung dieses Kunden" });
          }
        }
      }
      
      // Stelle sicher, dass numerische Felder korrekt konvertiert werden
      const formData = {
        ...req.body,
        customerId: typeof req.body.customerId === 'string' && req.body.customerId ? parseInt(req.body.customerId, 10) : req.body.customerId,
        postalCode: typeof req.body.postalCode === 'string' && req.body.postalCode ? parseInt(req.body.postalCode, 10) : req.body.postalCode,
        customerPhone: req.body.customerPhone?.toString() || null,
      };
      
      console.log("Aktualisierungsdaten:", formData);
      
      // Verwende das Schema ohne transform für partial
      const baseSchema = createInsertSchema(customers);
      const validatedData = baseSchema.partial().parse(formData);
      
      console.log("Validierte Daten:", validatedData);
      
      const customer = await storage.updateCustomer(id, validatedData);
      console.log("Kunde aktualisiert:", customer);
      res.json(customer);
    } catch (error) {
      console.error("Customer update error:", error);
      next(error);
    }
  });

  app.delete("/api/customers/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      const id = parseInt(req.params.id);
      const existingCustomer = await storage.getCustomer(id);
      
      if (!existingCustomer) {
        return res.status(404).json({ message: "Kunde nicht gefunden" });
      }
      
      // Berechtigungsprüfung
      // Nur Administratoren dürfen Kunden löschen
      if (req.user.role !== 'administrator') {
        return res.status(403).json({ message: "Keine Berechtigung zum Löschen von Kunden. Diese Operation erfordert Administrator-Rechte." });
      }
      
      await storage.deleteCustomer(id);
      res.status(204).send();
    } catch (error) {
      console.error("Customer deletion error:", error);
      next(error);
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus mit der verifySubscriptionStatus-Funktion
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      // Nur Administratoren können alle Projekte sehen
      if (req.user.role === 'administrator') {
        const projects = await storage.getProjects();
        return res.json(projects);
      }
      
      // Manager und normale Benutzer können nur ihre eigenen Projekte sehen
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
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
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
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Nur Administratoren oder der Ersteller können das Projekt sehen
      if (req.user.role === 'administrator' || project.createdBy === req.user.id) {
        return res.json(project);
      }
      
      // Anderen Benutzern wird der Zugriff verweigert
      res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf dieses Projekt" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/projects", requireManagerOrAbove(), async (req, res, next) => {
    try {
      // Authentifizierungsprüfung ist bereits durch die requireManagerOrAbove-Middleware erfolgt
      if (!req.user) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      console.log(`Benutzer mit Rolle ${req.user.role} erstellt ein neues Projekt`);
      
      // Stelle sicher, dass die Felder im richtigen Format sind (als Strings)
      // Da Zod die Konversion erwartet, schicken wir die Daten als Strings
      // Verbesserter Fehler-Handler für null/undefined/leere Werte
      const formData = {
        ...req.body,
        projectWidth: req.body.projectWidth ? req.body.projectWidth.toString() : null,
        projectLength: req.body.projectLength ? req.body.projectLength.toString() : null,
        projectHeight: req.body.projectHeight ? req.body.projectHeight.toString() : null,
        projectText: req.body.projectText ? req.body.projectText.toString() : null,
        createdBy: req.user?.id || null // Speichern des Erstellers (aktuelle Benutzer-ID)
      };
      
      console.log("Projekt-Daten vor der Validierung:", formData);
      
      try {
        // Schema übernimmt die Konversion zu Zahlen
        const validatedData = insertProjectSchema.parse(formData);
        const project = await storage.createProject(validatedData);
        res.status(201).json(project);
      } catch (error) {
        console.error("Validierungsfehler:", error);
        return res.status(400).json({ 
          message: "Fehler bei der Projektvalidierung", 
          details: (error as any)?.errors || "Unbekannter Validierungsfehler" 
        });
      }
    } catch (error) {
      console.error("Project creation error:", error);
      next(error);
    }
  });

  app.put("/api/projects/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      const id = parseInt(req.params.id);
      const existingProject = await storage.getProject(id);
      
      if (!existingProject) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer das Projekt bearbeiten darf
      // Nur Administratoren oder der Ersteller dürfen das Projekt bearbeiten
      if (req.user.role !== 'administrator' && existingProject.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für die Bearbeitung dieses Projekts" });
      }
      
      // Stelle sicher, dass die Felder im richtigen Format sind (als Strings)
      // Verbesserte Fehlerbehandlung für null/undefined/leere Werte
      const formData = {
        ...req.body,
        projectWidth: req.body.projectWidth ? req.body.projectWidth.toString() : null,
        projectLength: req.body.projectLength ? req.body.projectLength.toString() : null,
        projectHeight: req.body.projectHeight ? req.body.projectHeight.toString() : null,
        projectText: req.body.projectText ? req.body.projectText.toString() : null
      };
      
      console.log("Projekt-Update-Daten:", formData);
      
      try {
        // Aktualisiere die Daten direkt, ohne komplexe Schema-Manipulation
        const validatedData = formData;
        const project = await storage.updateProject(id, validatedData);
        res.json(project);
      } catch (error) {
        console.error("Fehler beim Aktualisieren des Projekts:", error);
        return res.status(400).json({ 
          message: "Fehler beim Aktualisieren des Projekts", 
          details: (error as any)?.message || "Unbekannter Fehler" 
        });
      }
    } catch (error) {
      console.error("Project update error:", error);
      next(error);
    }
  });

  app.delete("/api/projects/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      const id = parseInt(req.params.id);
      const existingProject = await storage.getProject(id);
      
      if (!existingProject) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer das Projekt löschen darf
      // Nur Administratoren oder der Ersteller dürfen das Projekt löschen
      if (req.user.role !== 'administrator' && existingProject.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für das Löschen dieses Projekts" });
      }
      
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Project delete error:", error);
      next(error);
    }
  });
  
  // Permission routes
  app.get("/api/projects/:projectId/permissions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer Berechtigungen für dieses Projekt sehen darf
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um die Berechtigungen dieses Projekts zu sehen" });
      }
      
      const permissions = await storage.getPermissions(projectId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      next(error);
    }
  });
  
  app.post("/api/projects/:projectId/permissions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer Berechtigungen für dieses Projekt erstellen darf
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um Berechtigungen für dieses Projekt zu erstellen" });
      }
      
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      const id = parseInt(req.params.id);
      const permission = await storage.getPermission(id);
      
      if (!permission) {
        return res.status(404).json({ message: "Berechtigung nicht gefunden" });
      }
      
      // Hole das zugehörige Projekt, um den Ersteller zu überprüfen
      const project = await storage.getProject(permission.projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Zugehöriges Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer die Berechtigung löschen darf
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung zum Löschen dieser Berechtigung" });
      }
      
      await storage.deletePermission(id);
      res.status(204).send();
    } catch (error) {
      console.error("Permission deletion error:", error);
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      // Nur Administratoren können alle Ansprechpartner sehen
      if (req.user.role === 'administrator') {
        const persons = await storage.getPersons();
        return res.json(persons);
      }
      
      // Für andere Benutzer: Nur Ansprechpartner für zugehörige Projekte, Kunden und Firmen
      const userProjects = await storage.getProjectsByUser(req.user.id);
      
      // Wenn keine Projekte, leeres Array zurückgeben
      if (userProjects.length === 0) {
        return res.json([]);
      }
      
      // Relevante Projektids, Kundenids und Firmenids sammeln
      const projectIds = userProjects.map(project => project.id);
      const customerIds = userProjects.map(project => project.customerId).filter(id => id !== null);
      const companyIds = userProjects.map(project => project.companyId).filter(id => id !== null);
      
      // Alle Ansprechpartner holen
      const allPersons = await storage.getPersons();
      
      // Filtern für Ansprechpartner, die mit Projekten oder Firmen des Benutzers verbunden sind
      const persons = allPersons.filter(person => 
        (person.projectId !== null && projectIds.includes(person.projectId)) ||
        (person.companyId !== null && companyIds.includes(person.companyId))
      );
      
      res.json(persons);
    } catch (error) {
      console.error("Error fetching persons:", error);
      next(error);
    }
  });

  app.get("/api/persons/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      const id = parseInt(req.params.id);
      const person = await storage.getPerson(id);
      
      if (!person) {
        return res.status(404).json({ message: "Ansprechpartner nicht gefunden" });
      }
      
      // Administratoren können alle Ansprechpartner sehen
      if (req.user.role === 'administrator') {
        return res.json(person);
      }
      
      // Bei anderen Benutzern: Erst prüfen, ob der Ansprechpartner zu einem ihrer Projekte, Kunden oder Firmen gehört
      const userProjects = await storage.getProjectsByUser(req.user.id);
      
      // Wenn keine Projekte, keine Berechtigung
      if (userProjects.length === 0) {
        return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf diesen Ansprechpartner" });
      }
      
      // Relevante Projektids, Kundenids und Firmenids sammeln
      const projectIds = userProjects.map(project => project.id);
      const customerIds = userProjects.map(project => project.customerId).filter(id => id !== null);
      const companyIds = userProjects.map(project => project.companyId).filter(id => id !== null);
      
      // Prüfen, ob der Ansprechpartner zu einem dieser Projekte oder Firmen gehört
      const hasAccess = 
        (person.projectId !== null && projectIds.includes(person.projectId)) ||
        (person.companyId !== null && companyIds.includes(person.companyId));
      
      if (hasAccess) {
        return res.json(person);
      }
      
      // Keine Berechtigung
      return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf diesen Ansprechpartner" });
    } catch (error) {
      console.error("Error fetching person:", error);
      next(error);
    }
  });

  app.post("/api/persons", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      // Numerische Felder konvertieren
      const formData = {
        ...req.body,
        personId: typeof req.body.personId === 'string' ? parseInt(req.body.personId, 10) : req.body.personId,
        projectId: typeof req.body.projectId === 'string' ? parseInt(req.body.projectId, 10) : req.body.projectId,
        companyId: typeof req.body.companyId === 'string' ? parseInt(req.body.companyId, 10) : req.body.companyId,
        professionalName: typeof req.body.professionalName === 'string' ? parseInt(req.body.professionalName, 10) : req.body.professionalName,
      };
      
      // Berechtigungsprüfung: Administrator kann immer Ansprechpartner erstellen
      if (req.user.role !== 'administrator') {
        // Für Projekte und Firmen: Prüfen, ob der Benutzer Zugriff auf diese hat
        if (formData.projectId) {
          const project = await storage.getProject(formData.projectId);
          if (!project || (project.createdBy !== req.user.id && req.user.role !== 'manager')) {
            return res.status(403).json({ message: "Keine Berechtigung für dieses Projekt" });
          }
        }
        
        if (formData.companyId) {
          // Prüfen, ob der Benutzer Zugriff auf diese Firma hat
          const userProjects = await storage.getProjectsByUser(req.user.id);
          const companyIds = userProjects.map(p => p.companyId).filter(id => id !== null);
          
          if (!companyIds.includes(formData.companyId)) {
            return res.status(403).json({ message: "Keine Berechtigung für diese Firma" });
          }
        }
      }
      
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      const id = parseInt(req.params.id);
      
      // Den existierenden Ansprechpartner abrufen
      const existingPerson = await storage.getPerson(id);
      if (!existingPerson) {
        return res.status(404).json({ message: "Ansprechpartner nicht gefunden" });
      }
      
      // Berechtigungsprüfung
      if (req.user.role !== 'administrator') {
        // Bei Nicht-Administratoren: Prüfen, ob Zugriff auf den Ansprechpartner erlaubt ist
        const userProjects = await storage.getProjectsByUser(req.user.id);
        
        if (userProjects.length === 0) {
          return res.status(403).json({ message: "Keine Berechtigung, um diesen Ansprechpartner zu bearbeiten" });
        }
        
        const projectIds = userProjects.map(project => project.id);
        const companyIds = userProjects.map(project => project.companyId).filter(id => id !== null);
        
        const hasAccess = 
          (existingPerson.projectId !== null && projectIds.includes(existingPerson.projectId)) ||
          (existingPerson.companyId !== null && companyIds.includes(existingPerson.companyId));
        
        if (!hasAccess) {
          return res.status(403).json({ message: "Keine Berechtigung, um diesen Ansprechpartner zu bearbeiten" });
        }
        
        // Wenn Projekt oder Firma geändert werden, prüfen, ob der Benutzer Zugriff auf die neue Zuordnung hat
        if (req.body.projectId && req.body.projectId !== existingPerson.projectId) {
          const project = await storage.getProject(parseInt(req.body.projectId));
          if (!project || (project.createdBy !== req.user.id && req.user.role !== 'manager')) {
            return res.status(403).json({ message: "Keine Berechtigung für das angegebene Projekt" });
          }
        }
        
        if (req.body.companyId && req.body.companyId !== existingPerson.companyId) {
          const newCompanyId = parseInt(req.body.companyId);
          if (!companyIds.includes(newCompanyId)) {
            return res.status(403).json({ message: "Keine Berechtigung für die angegebene Firma" });
          }
        }
      }
      
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Überprüfung des Abonnementstatus
      const subscriptionCheck = verifySubscriptionStatus(req);
      if (!subscriptionCheck.isValid) {
        return res.status(403).json({ 
          message: "Abonnement abgelaufen", 
          subscriptionExpired: true,
          errorDetails: subscriptionCheck.errorMessage 
        });
      }
      
      const id = parseInt(req.params.id);
      
      // Den existierenden Ansprechpartner abrufen
      const existingPerson = await storage.getPerson(id);
      if (!existingPerson) {
        return res.status(404).json({ message: "Ansprechpartner nicht gefunden" });
      }
      
      // Berechtigungsprüfung
      if (req.user.role !== 'administrator') {
        // Bei Nicht-Administratoren: Prüfen, ob Zugriff auf den Ansprechpartner erlaubt ist
        const userProjects = await storage.getProjectsByUser(req.user.id);
        
        if (userProjects.length === 0) {
          return res.status(403).json({ message: "Keine Berechtigung, um diesen Ansprechpartner zu löschen" });
        }
        
        const projectIds = userProjects.map(project => project.id);
        const companyIds = userProjects.map(project => project.companyId).filter(id => id !== null);
        
        const hasAccess = 
          (existingPerson.projectId !== null && projectIds.includes(existingPerson.projectId)) ||
          (existingPerson.companyId !== null && companyIds.includes(existingPerson.companyId));
        
        if (!hasAccess) {
          return res.status(403).json({ message: "Keine Berechtigung, um diesen Ansprechpartner zu löschen" });
        }
      }
      
      // Ansprechpartner löschen, wenn alle Berechtigungen vorhanden sind
      await storage.deletePerson(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting person:", error);
      next(error);
    }
  });
  
  // Attachment routes
  app.get("/api/projects/:projectId/attachments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer Anhänge für dieses Projekt sehen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um Anhänge dieses Projekts zu sehen" });
      }
      
      const attachments = await storage.getProjectAttachments(projectId);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching project attachments:", error);
      next(error);
    }
  });
  
  // Route für alle Anhänge 
  app.get("/api/attachments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Administrator sieht alle Anhänge
      if (req.user.role === 'administrator') {
        const attachments = await storage.getAllAttachments();
        return res.json(attachments);
      }
      
      // Manager sieht alle Projekte und deren Anhänge
      if (req.user.role === 'manager') {
        // Für Manager geben wir alle Anhänge zurück
        // Dies ist Teil der Umstellung auf das vereinfachte Rollenmodell
        const attachments = await storage.getAllAttachments();
        return res.json(attachments);
      }
      
      // Fallback, sollte eigentlich nie erreicht werden, da wir nur zwei Rollenarten haben
      return res.json([]);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      next(error);
    }
  });
  
  // Überprüft alle Anhänge auf fehlende Dateien (nur für Administratoren)
  app.post("/api/attachments/verify-all", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Administrator-Rechte erforderlich
      if (req.user.role !== 'administrator') {
        return res.status(403).json({ message: "Administrator-Rechte erforderlich" });
      }
      
      // Optimierte Methode in Storage verwenden
      const results = await storage.verifyAllAttachments();
      
      res.json(results);
    } catch (error) {
      console.error("Fehler bei der Überprüfung aller Anhänge:", error);
      next(error);
    }
  });
  
  // Allgemeiner Anhang-Upload-Endpunkt (ohne Projektbindung)
  app.post(
    "/api/attachments",
    ...optimizedUpload.single("file"),
    handleUploadErrors,
    cleanupOnError,
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }
        
        if (!req.file) {
          return res.status(400).json({ message: "Keine Datei hochgeladen." });
        }
        
        console.log("Allgemeiner Anhang-Upload: Datei erhalten", req.file.originalname);
        
        // Prüfen, ob optimierte Anhangsdaten vorhanden sind
        let attachmentData: any;
        
        // Für Bilder: optimierte Daten aus dem Request verwenden
        if ((req as any).attachmentData && (req as any).attachmentData.file) {
          attachmentData = (req as any).attachmentData.file;
          console.log('Verwende optimierte Bildanhangsdaten:', attachmentData.isOptimized ? 'Optimiert' : 'Nicht optimiert');
        } else {
          // Für andere Dateitypen: Standardanhangsdaten erstellen
          attachmentData = {
            // Verwende Projekt ID 5 als "Standard"-Projekt, wenn kein Projekt ausgewählt wurde
            projectId: req.body.projectId && req.body.projectId !== "none" ? parseInt(req.body.projectId) : 5,
            fileName: req.file.originalname,
            originalName: req.file.originalname,
            fileType: getFileType(req.file.mimetype),
            filePath: req.file.path,
            fileSize: req.file.size,
            fileCategory: req.body.fileCategory || "Andere",
            description: req.body.description || null,
            isOptimized: false,
            originalSize: req.file.size,
            optimizedSize: null,
            optimizationSavings: null,
            originalFormat: null,
            webpPath: null
          };
        }
        
        console.log("Erstelle Anhang mit Daten:", JSON.stringify(attachmentData));
        
        const attachment = await storage.createAttachment(attachmentData);
        res.status(201).json(attachment);
      } catch (error) {
        console.error("Error uploading attachment:", error);
        
        // Bei einem Fehler die Datei löschen, falls sie existiert
        if (req.file) {
          await fs.remove(req.file.path).catch(() => {});
          
          // Auch optimierte Dateien löschen falls vorhanden
          if ((req as any).optimizedFiles && (req as any).optimizedFiles.length > 0) {
            for (const optimizedFile of (req as any).optimizedFiles) {
              if (optimizedFile.optimization && optimizedFile.optimization.optimizedPath) {
                await fs.remove(optimizedFile.optimization.optimizedPath).catch(() => {});
              }
              if (optimizedFile.optimization && optimizedFile.optimization.webpPath) {
                await fs.remove(optimizedFile.optimization.webpPath).catch(() => {});
              }
              if (optimizedFile.optimization && optimizedFile.optimization.thumbnailPath) {
                await fs.remove(optimizedFile.optimization.thumbnailPath).catch(() => {});
              }
            }
          }
        }
        
        next(error);
      }
    }
  );
  
  app.post(
    "/api/projects/:projectId/attachments",
    ...optimizedUpload.single("file"),
    handleUploadErrors,
    cleanupOnError,
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }
        
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
        
        // Prüfen, ob der Benutzer berechtigt ist, Anhänge zu diesem Projekt hinzuzufügen
        if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
          // Lösche die Datei, da der Benutzer nicht berechtigt ist
          await fs.remove(req.file.path);
          return res.status(403).json({ message: "Keine Berechtigung, um Anhänge zu diesem Projekt hinzuzufügen" });
        }
        
        // Prüfen, ob optimierte Anhangsdaten vorhanden sind
        let attachmentData: any;
        
        // Für Bilder: optimierte Daten aus dem Request verwenden
        if ((req as any).attachmentData && (req as any).attachmentData.file) {
          attachmentData = (req as any).attachmentData.file;
          console.log('Verwende optimierte Bildanhangsdaten:', attachmentData.isOptimized ? 'Optimiert' : 'Nicht optimiert');
        } else {
          // Für andere Dateitypen: Standardanhangsdaten erstellen
          attachmentData = {
            projectId,
            fileName: req.file.originalname,
            originalName: req.file.originalname,
            fileType: getFileType(req.file.mimetype),
            filePath: req.file.path,
            fileSize: req.file.size,
            description: req.body.description || null,
            isOptimized: false,
            originalSize: req.file.size,
            optimizedSize: null,
            optimizationSavings: null,
            originalFormat: null,
            webpPath: null
          };
        }
        
        const attachment = await storage.createAttachment(attachmentData);
        res.status(201).json(attachment);
      } catch (error) {
        console.error("Error uploading attachment:", error);
        
        // Bei einem Fehler die Datei löschen, falls sie existiert
        if (req.file) {
          await fs.remove(req.file.path).catch(() => {});
          
          // Auch optimierte Dateien löschen falls vorhanden
          if ((req as any).optimizedFiles && (req as any).optimizedFiles.length > 0) {
            for (const optimizedFile of (req as any).optimizedFiles) {
              if (optimizedFile.optimization && optimizedFile.optimization.optimizedPath) {
                await fs.remove(optimizedFile.optimization.optimizedPath).catch(() => {});
              }
              if (optimizedFile.optimization && optimizedFile.optimization.webpPath) {
                await fs.remove(optimizedFile.optimization.webpPath).catch(() => {});
              }
              if (optimizedFile.optimization && optimizedFile.optimization.thumbnailPath) {
                await fs.remove(optimizedFile.optimization.thumbnailPath).catch(() => {});
              }
            }
          }
        }
        
        next(error);
      }
    }
  );
  
  app.get("/api/attachments/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const id = parseInt(req.params.id);
      const attachment = await storage.getAttachment(id);
      
      if (!attachment) {
        return res.status(404).json({ message: "Anhang nicht gefunden" });
      }
      
      // Projekt des Anhangs abrufen, um die Berechtigung zu prüfen
      const project = await storage.getProject(attachment.projectId);
      if (!project) {
        return res.status(404).json({ message: "Zugehöriges Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer diesen Anhang sehen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um diesen Anhang zu sehen" });
      }
      
      res.json(attachment);
    } catch (error) {
      console.error("Error getting attachment:", error);
      next(error);
    }
  });
  
  // Erstellt ein Token für den Download einer Datei
  app.get("/api/attachments/:id/token", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const id = parseInt(req.params.id);
      const attachment = await storage.getAttachment(id);
      
      if (!attachment) {
        return res.status(404).json({ message: "Anhang nicht gefunden" });
      }
      
      // Projekt des Anhangs abrufen, um die Berechtigung zu prüfen
      const project = await storage.getProject(attachment.projectId);
      if (!project) {
        return res.status(404).json({ message: "Zugehöriges Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer diesen Anhang herunterladen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um diesen Anhang herunterzuladen" });
      }
      
      // Token generieren
      const token = generateDownloadToken(id, req.user);
      
      // Token zurückgeben
      res.json({ token });
    } catch (error) {
      console.error("Error generating download token:", error);
      next(error);
    }
  });
  
  // Download einer Datei mit Token
  app.get("/api/attachments/:id/download", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const token = req.query.token as string;
      
      // Wenn kein Token angegeben, Benutzer zur Token-Anforderung umleiten
      if (!token) {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }
        
        // Umleitung zur Token-Anforderung
        return res.status(403).json({ 
          message: "Token erforderlich für den Dateizugriff", 
          tokenUrl: `/api/attachments/${id}/token` 
        });
      }
      
      // Prüfen, ob der Benutzer authentifiziert ist (für die Token-Validierung)
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Token validieren
      if (!verifyDownloadToken(token, id, req.user.id)) {
        return res.status(403).json({ message: "Ungültiges oder abgelaufenes Token" });
      }
      
      const attachment = await storage.getAttachment(id);
      
      if (!attachment) {
        return res.status(404).json({ message: "Anhang nicht gefunden" });
      }
      
      // Korrekten Dateipfad bestimmen - originalen UND alternativen Pfad prüfen
      let filePath = attachment.filePath;
      const fileExists = await fs.pathExists(filePath);
      
      if (!fileExists) {
        // Alternative Pfade versuchen
        console.log(`Datei nicht an originalem Pfad gefunden: ${filePath}`);
        
        // Variante 1: Relativer Pfad im aktuellen Arbeitsverzeichnis
        const fileName = path.basename(filePath);
        const alternativePath1 = path.join(process.cwd(), "uploads", fileName);
        
        // Variante 2: Relativer Pfad falls der komplette Runner-Pfad in der Datenbank gespeichert ist
        const alternativePath2 = path.join("uploads", fileName);
        
        console.log(`Versuche alternative Pfade: ${alternativePath1} oder ${alternativePath2}`);
        
        if (await fs.pathExists(alternativePath1)) {
          console.log(`Datei gefunden unter: ${alternativePath1}`);
          filePath = alternativePath1;
        } else if (await fs.pathExists(alternativePath2)) {
          console.log(`Datei gefunden unter: ${alternativePath2}`);
          filePath = alternativePath2;
        } else {
          console.error(`Datei konnte unter keinem Pfad gefunden werden.`);
          return res.status(404).json({ message: "Datei nicht gefunden" });
        }
      }
      
      // Nach erfolgreicher Validierung das Token invalidieren
      invalidateToken(token);
      
      // Absoluten Pfad sicherstellen und überprüfen
      const absoluteFilePath = path.resolve(filePath);
      console.log(`Sende Datei mit absolutem Pfad: ${absoluteFilePath}`);
      
      // Zusätzliche Überprüfung, ob die Datei existiert
      if (!await fs.pathExists(absoluteFilePath)) {
        console.error(`Datei existiert nicht am absoluten Pfad: ${absoluteFilePath}`);
        
        // Markiere den Anhang als "Datei fehlt" in der Datenbank
        try {
          await storage.markAttachmentFileMissing(id);
          console.log(`Anhang mit ID ${id} wurde als fehlend markiert`);
        } catch (markingError) {
          console.error(`Fehler beim Markieren des Anhangs als fehlend: ${markingError}`);
        }
        
        return res.status(404).json({ 
          message: "Datei konnte nicht gefunden werden",
          details: "Die Datei existiert nicht mehr auf dem Server. Der Anhang wurde als fehlend markiert."
        });
      }
      
      // Korrekte Header für den Download setzen
      const fileName = encodeURIComponent(attachment.fileName);
      res.setHeader("Content-Type", attachment.fileType === "pdf" ? "application/pdf" : 
                                   attachment.fileType === "excel" ? "application/vnd.ms-excel" : 
                                   attachment.fileType === "image" ? "image/jpeg" : "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      
      // Versuchen, die Datei mit explizitem Error-Handling zu senden
      try {
        // Zuerst den normalen sendFile-Mechanismus versuchen mit umfassenderem Error-Handling
        const handleSendFileResult = (err) => {
          if (err) {
            console.error(`Fehler beim Senden der Datei mit sendFile: ${err.message}`);
            
            // Wenn ein Fehler auftritt, versuchen wir es mit dem Stream-Ansatz
            try {
              if (!res.headersSent) {
                // Fallback auf Stream-basierten Download
                console.log(`Versuche Stream-basierten Download für: ${absoluteFilePath}`);
                
                // Dateistatistik abrufen
                const stat = fs.statSync(absoluteFilePath);
                
                // Content-Length setzen
                res.setHeader("Content-Length", stat.size);
                
                // Datei-Stream erstellen und an die Response pipen
                const fileStream = fs.createReadStream(absoluteFilePath);
                
                // Error-Handler für den Stream
                fileStream.on('error', (streamError) => {
                  console.error(`Stream-Fehler: ${streamError.message}`);
                  if (!res.headersSent) {
                    res.status(500).json({ message: "Fehler beim Streamen der Datei" });
                  } else {
                    res.end();
                  }
                });
                
                // Stream an die Response anhängen
                fileStream.pipe(res);
                
                console.log(`Stream-basierter Download gestartet: ${absoluteFilePath}`);
                return;
              }
            } catch (streamError) {
              console.error(`Fehler beim Stream-basierten Download: ${streamError.message}`);
              if (!res.headersSent) {
                return res.status(500).json({ message: "Datei konnte nicht bereitgestellt werden" });
              }
            }
          } else {
            console.log(`Datei erfolgreich gesendet mit sendFile: ${absoluteFilePath}`);
          }
        };
        
        // sendFile mit Callback verwenden
        res.sendFile(absoluteFilePath, handleSendFileResult);
      } catch (sendFileError) {
        console.error(`Kritischer Fehler bei sendFile: ${sendFileError.message}`);
        if (!res.headersSent) {
          return res.status(500).json({ message: "Datei konnte nicht bereitgestellt werden" });
        }
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      next(error);
    }
  });
  
  app.delete("/api/attachments/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const id = parseInt(req.params.id);
      const attachment = await storage.getAttachment(id);
      
      if (!attachment) {
        return res.status(404).json({ message: "Anhang nicht gefunden" });
      }
      
      // Projekt des Anhangs abrufen, um die Berechtigung zu prüfen
      const project = await storage.getProject(attachment.projectId);
      if (!project) {
        return res.status(404).json({ message: "Zugehöriges Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer diesen Anhang löschen darf
      // Nur der Projektersteller, Administratoren und Manager dürfen Anhänge löschen
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um diesen Anhang zu löschen" });
      }
      
      // Lösche die Datei vom Dateisystem
      await fs.remove(attachment.filePath).catch(err => {
        console.error("Error deleting file:", err);
      });
      
      // Lösche den Eintrag aus der Datenbank
      await storage.deleteAttachment(id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting attachment:", error);
      next(error);
    }
  });
  
  // Proxy-Route für Bilder, die Authentifizierung erfordert - Base64-kodierte Antwort
  app.get("/secure-image/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const id = parseInt(req.params.id);
      const attachment = await storage.getAttachment(id);
      
      if (!attachment) {
        return res.status(404).json({ message: "Anhang nicht gefunden" });
      }
      
      // Projekt des Anhangs abrufen, um die Berechtigung zu prüfen
      const project = await storage.getProject(attachment.projectId);
      if (!project) {
        return res.status(404).json({ message: "Zugehöriges Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer diesen Anhang ansehen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um diesen Anhang anzusehen" });
      }
      
      // Korrekten Dateipfad bestimmen - originalen UND alternativen Pfad prüfen
      let filePath = attachment.filePath;
      const fileExists = await fs.pathExists(filePath);
      
      if (!fileExists) {
        // Alternative Pfade versuchen
        console.log(`Datei nicht an originalem Pfad gefunden: ${filePath}`);
        
        // Variante 1: Relativer Pfad im aktuellen Arbeitsverzeichnis
        const fileName = path.basename(filePath);
        const alternativePath1 = path.join(process.cwd(), "uploads", fileName);
        
        // Variante 2: Relativer Pfad falls der komplette Runner-Pfad in der Datenbank gespeichert ist
        const alternativePath2 = path.join("uploads", fileName);
        
        console.log(`Versuche alternative Pfade: ${alternativePath1} oder ${alternativePath2}`);
        
        if (await fs.pathExists(alternativePath1)) {
          console.log(`Datei gefunden unter: ${alternativePath1}`);
          filePath = alternativePath1;
        } else if (await fs.pathExists(alternativePath2)) {
          console.log(`Datei gefunden unter: ${alternativePath2}`);
          filePath = alternativePath2;
        } else {
          console.error(`Datei konnte unter keinem Pfad gefunden werden.`);
          return res.status(404).json({ message: "Datei nicht gefunden" });
        }
      }
      
      // Datei als Base64 kodieren und zurückgeben
      const imageBuffer = await fs.readFile(filePath);
      const base64Image = imageBuffer.toString('base64');
      
      // MIME-Typ ermitteln
      let contentType = 'application/octet-stream'; // Standardtyp
      if (attachment.fileType === 'image') {
        // Bestimme den spezifischen Bildtyp basierend auf der Dateiendung
        const ext = path.extname(attachment.fileName).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') {
          contentType = 'image/jpeg';
        } else if (ext === '.png') {
          contentType = 'image/png';
        } else if (ext === '.gif') {
          contentType = 'image/gif';
        } else if (ext === '.webp') {
          contentType = 'image/webp';
        }
      }
      
      // Base64-kodiertes Bild mit MIME-Typ zurückgeben
      res.json({
        contentType,
        base64Data: base64Image
      });
    } catch (error) {
      console.error("Error serving image:", error);
      next(error);
    }
  });
  
  // Serve static RStO visualizations
  app.use("/static/rsto_visualizations", express.static(path.join(process.cwd(), "public/static/rsto_visualizations")));
  
  // Placeholder-Bild für Fehleranzeige
  app.get("/static/image-placeholder.png", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public/static/image-placeholder.png"));
  });
  
  // Statische Dateien für öffentliche Assets
  app.use('/static', express.static(path.join(process.cwd(), 'public/static')));
  
  // Statische Dateien für uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
  
  // Alle HTML-Dateien im public-Verzeichnis zugänglich machen
  app.use(express.static(path.join(process.cwd(), 'public'), {
    extensions: ['html'],
    index: false
  }));
  
  // Expliziter Zugriff auf test-upload.html
  app.get('/test-upload', (req, res) => {
    console.log('Test-Upload-Seite angefordert');
    // Direktes Senden der Datei ohne Umleitung
    const filePath = path.join(process.cwd(), 'public/test-upload.html');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Fehler beim Senden der Test-Upload-Seite:', err);
        res.status(500).send(`
          <html><body>
            <h1>Fehler beim Laden der Test-Seite</h1>
            <p>${err.message}</p>
            <p>Pfad: ${filePath}</p>
            <p><a href="/">Zurück zur Startseite</a></p>
          </body></html>
        `);
      }
    });
  });
  
  // Allgemeine Upload-Route für Anhänge (inkl. Kamera-Upload)
  app.post(
    "/api/attachments/upload",
    (req, res, next) => {
      // Debug vor dem Multer-Upload
      console.log('Upload-Anfrage erhalten:', {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        body: req.body // Wird minimal sein, da der Body noch nicht geparst wurde
      });
      next();
    },
    ...optimizedUpload.single("file"),
    handleUploadErrors,
    cleanupOnError,
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        console.log('Upload-Handler nach Multer:', {
          isAuthenticated: req.isAuthenticated(),
          fileReceived: !!req.file,
          body: req.body,
          user: req.user ? { id: req.user.id, role: req.user.role } : null,
          file: req.file ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
          } : null
        });
        
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }
        
        if (!req.file) {
          console.error('Keine Datei im Request gefunden');
          return res.status(400).json({ message: "Keine Datei hochgeladen." });
        }
        
        if (!req.body.projectId) {
          console.error('Keine Projekt-ID im Request gefunden');
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
        
        // Prüfen, ob der Benutzer berechtigt ist, Anhänge zu diesem Projekt hinzuzufügen
        if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
          // Lösche die Datei, da der Benutzer nicht berechtigt ist
          await fs.remove(req.file.path);
          return res.status(403).json({ message: "Keine Berechtigung, um Anhänge zu diesem Projekt hinzuzufügen" });
        }
        
        // Prüfen, ob optimierte Anhangsdaten vorhanden sind
        let attachmentData: any;
        
        // Für Bilder: optimierte Daten aus dem Request verwenden
        if ((req as any).attachmentData && (req as any).attachmentData.file) {
          attachmentData = (req as any).attachmentData.file;
          console.log('Verwende optimierte Bildanhangsdaten:', attachmentData.isOptimized ? 'Optimiert' : 'Nicht optimiert');
        } else {
          // Für andere Dateitypen: Standardanhangsdaten erstellen
          attachmentData = {
            projectId,
            fileName: req.file.originalname,
            originalName: req.file.originalname,
            fileType: getFileType(req.file.mimetype),
            fileCategory: req.body.fileCategory || "Andere",
            filePath: req.file.path,
            fileSize: req.file.size,
            description: req.body.description || null,
            tags: req.body.tags || null,
            isOptimized: false,
            originalSize: req.file.size,
            optimizedSize: null,
            optimizationSavings: null,
            originalFormat: null,
            webpPath: null
          };
        }
        
        const attachment = await storage.createAttachment(attachmentData);
        res.status(201).json(attachment);
      } catch (error) {
        console.error("Error uploading attachment:", error);
        
        // Bei einem Fehler die Datei löschen, falls sie existiert
        if (req.file) {
          await fs.remove(req.file.path).catch(() => {});
          
          // Auch optimierte Dateien löschen falls vorhanden
          if ((req as any).optimizedFiles && (req as any).optimizedFiles.length > 0) {
            for (const optimizedFile of (req as any).optimizedFiles) {
              if (optimizedFile.optimization && optimizedFile.optimization.optimizedPath) {
                await fs.remove(optimizedFile.optimization.optimizedPath).catch(() => {});
              }
              if (optimizedFile.optimization && optimizedFile.optimization.webpPath) {
                await fs.remove(optimizedFile.optimization.webpPath).catch(() => {});
              }
              if (optimizedFile.optimization && optimizedFile.optimization.thumbnailPath) {
                await fs.remove(optimizedFile.optimization.thumbnailPath).catch(() => {});
              }
            }
          }
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
  // Standard-Download-Routen
  setupDownloadRoutes(app);
  
  // Verbesserte Download-Routen mit zuverlässigerem Datei-Handling
  setupEnhancedDownloadRoutes(app);
  
  // Smart File Organization Routen einrichten
  setupFileOrganizationRoutes(app);
  
  // Image Analyse und RStO-Routen einrichten
  setupImageAnalysisRoutes(app);
  setupSurfaceAnalysisRoutes(app);
  setupSurfaceAnalysisAPIRoutes(app);
  
  // BedarfKapa routes
  app.get("/api/projects/:projectId/bedarfkapa", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer BedarfKapa für dieses Projekt sehen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um Bedarf/Kapazität dieses Projekts zu sehen" });
      }
      
      const bedarfKapas = await storage.getBedarfKapas(projectId);
      res.json(bedarfKapas);
    } catch (error) {
      console.error("Error fetching bedarfKapas:", error);
      next(error);
    }
  });
  
  app.post("/api/projects/:projectId/bedarfkapa", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer BedarfKapa für dieses Projekt erstellen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um Bedarf/Kapazität zu diesem Projekt hinzuzufügen" });
      }
      
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer BedarfKapa für dieses Projekt sehen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um Bedarf/Kapazität dieses Projekts zu sehen" });
      }
      
      const id = parseInt(req.params.id);
      const bedarfKapa = await storage.getBedarfKapa(id);
      if (!bedarfKapa) {
        return res.status(404).json({ message: "Bedarf/Kapazität nicht gefunden" });
      }
      
      // Prüfen, ob der BedarfKapa tatsächlich zu diesem Projekt gehört
      if (bedarfKapa.projectId !== projectId) {
        return res.status(403).json({ message: "Dieser Bedarf/Kapazität gehört nicht zum angegebenen Projekt" });
      }
      
      res.json(bedarfKapa);
    } catch (error) {
      console.error("Error fetching bedarfKapa:", error);
      next(error);
    }
  });
  
  app.delete("/api/projects/:projectId/bedarfkapa/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer BedarfKapa für dieses Projekt löschen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um Bedarf/Kapazität dieses Projekts zu löschen" });
      }
      
      const id = parseInt(req.params.id);
      const bedarfKapa = await storage.getBedarfKapa(id);
      
      if (!bedarfKapa) {
        return res.status(404).json({ message: "Bedarf/Kapazität nicht gefunden" });
      }
      
      // Prüfen, ob der BedarfKapa tatsächlich zu diesem Projekt gehört
      if (bedarfKapa.projectId !== projectId) {
        return res.status(403).json({ message: "Dieser Bedarf/Kapazität gehört nicht zum angegebenen Projekt" });
      }
      
      await storage.deleteBedarfKapa(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bedarfKapa:", error);
      next(error);
    }
  });

  // Milestone routes
  app.get("/api/projects/:projectId/milestones", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer Meilensteine für dieses Projekt sehen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um Meilensteine dieses Projekts zu sehen" });
      }
      
      const milestones = await storage.getMilestones(projectId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      next(error);
    }
  });

  app.get("/api/projects/:projectId/milestones/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer Meilensteine für dieses Projekt sehen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um Meilensteine dieses Projekts zu sehen" });
      }
      
      const id = parseInt(req.params.id);
      const milestone = await storage.getMilestone(id);
      
      if (!milestone) {
        return res.status(404).json({ message: "Meilenstein nicht gefunden" });
      }
      
      // Prüfen, ob der Meilenstein tatsächlich zu diesem Projekt gehört
      if (milestone.projectId !== projectId) {
        return res.status(403).json({ message: "Dieser Meilenstein gehört nicht zum angegebenen Projekt" });
      }
      
      res.json(milestone);
    } catch (error) {
      console.error("Error fetching milestone:", error);
      next(error);
    }
  });

  app.post("/api/projects/:projectId/milestones", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer Meilensteine für dieses Projekt erstellen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um Meilensteine zu diesem Projekt hinzuzufügen" });
      }
      
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer Meilensteine für dieses Projekt bearbeiten darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um Meilensteine dieses Projekts zu bearbeiten" });
      }
      
      const id = parseInt(req.params.id);
      const existingMilestone = await storage.getMilestone(id);
      
      if (!existingMilestone) {
        return res.status(404).json({ message: "Meilenstein nicht gefunden" });
      }
      
      // Prüfen, ob der Meilenstein tatsächlich zu diesem Projekt gehört
      if (existingMilestone.projectId !== projectId) {
        return res.status(403).json({ message: "Dieser Meilenstein gehört nicht zum angegebenen Projekt" });
      }
      
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer Meilensteine für dieses Projekt löschen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um Meilensteine dieses Projekts zu löschen" });
      }
      
      const id = parseInt(req.params.id);
      const milestone = await storage.getMilestone(id);
      
      if (!milestone) {
        return res.status(404).json({ message: "Meilenstein nicht gefunden" });
      }
      
      // Prüfen, ob der Meilenstein tatsächlich zu diesem Projekt gehört
      if (milestone.projectId !== projectId) {
        return res.status(403).json({ message: "Dieser Meilenstein gehört nicht zum angegebenen Projekt" });
      }
      
      await storage.deleteMilestone(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting milestone:", error);
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
  // HINWEIS: Diese Route ist temporär reaktiviert, bis der Server stabil läuft
  app.get("/api/admin/users", checkAdminRole, async (req, res, next) => {
    try {
      // Direkte SQL-Abfrage verwenden, da storage.getUsers() nicht existiert
      const users = await sql`
        SELECT 
          id, 
          username, 
          user_name, 
          user_email, 
          role, 
          created_by, 
          gdpr_consent, 
          registration_date, 
          trial_end_date, 
          subscription_status,
          stripe_customer_id,
          stripe_subscription_id,
          last_payment_date,
          subscription_plan
        FROM tbluser 
        ORDER BY id ASC
      `;
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  // Benutzer erstellen (nur Admin)
  // HINWEIS: Diese Route ist temporär reaktiviert, bis der Server stabil läuft
  app.post("/api/admin/users", checkAdminRole, async (req, res, next) => {
    try {
      // Nur Administratoren können andere Administratoren erstellen
      if (req.body.role === "administrator" && req.user.role !== "administrator") {
        return res.status(403).json({ 
          message: "Keine Berechtigung. Nur Administratoren können neue Administratoren erstellen." 
        });
      }

      // Aktuelle Zeit für Registrierungsdatum
      const now = new Date();
      
      // Ablaufdatum der Testphase auf 14 Tage nach Erstellung setzen (von 28 Tage auf 14 Tage reduziert)
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + 14); // 2 Wochen (14 Tage)

      // Passworthashing erfolgt in der storage.createUser Funktion
      const userData = {
        ...req.body,
        createdBy: req.user.id,
        registrationDate: now, // Registrierungsdatum hinzufügen
        trialEndDate, // Ablaufdatum der Testphase hinzufügen
        subscriptionStatus: 'trial', // Status auf "trial" setzen
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
  // HINWEIS: Diese Route ist temporär reaktiviert, bis der Server stabil läuft
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
  
  // Construction Diary Routes (Bautagebuch)
  
  // Alle Bautagebuch-Einträge für ein Projekt abrufen
  app.get("/api/projects/:projectId/construction-diary", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId, 10);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Berechtigungsprüfung - nur Administratoren oder der Ersteller des Projekts haben Zugriff
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf dieses Projekt" });
      }
      
      const diaryEntries = await storage.getConstructionDiaries(projectId);
      res.json(diaryEntries);
    } catch (error) {
      console.error("Error fetching construction diary entries:", error);
      next(error);
    }
  });
  
  // Einen einzelnen Bautagebuch-Eintrag abrufen
  app.get("/api/projects/:projectId/construction-diary/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId, 10);
      const diaryId = parseInt(req.params.id, 10);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Berechtigungsprüfung
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf dieses Projekt" });
      }
      
      const diaryEntry = await storage.getConstructionDiary(diaryId);
      if (!diaryEntry) {
        return res.status(404).json({ message: "Bautagebuch-Eintrag nicht gefunden" });
      }
      
      if (diaryEntry.projectId !== projectId) {
        return res.status(403).json({ message: "Der Bautagebuch-Eintrag gehört nicht zum angegebenen Projekt" });
      }
      
      res.json(diaryEntry);
    } catch (error) {
      console.error("Error fetching construction diary entry:", error);
      next(error);
    }
  });
  
  // Einen neuen Bautagebuch-Eintrag erstellen
  app.post("/api/projects/:projectId/construction-diary", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId, 10);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Berechtigungsprüfung
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für das Hinzufügen eines Eintrags zu diesem Projekt" });
      }
      
      // Numerische Felder als Strings übergeben für Zod-Validierung
      const formData = {
        ...req.body,
        projectId,
        workHours: req.body.workHours?.toString() || "0",
        createdBy: req.user.id
      };
      
      // Daten validieren
      const validatedData = insertConstructionDiarySchema.parse(formData);
      const createdDiary = await storage.createConstructionDiary(validatedData);
      
      res.status(201).json(createdDiary);
    } catch (error) {
      console.error("Error creating construction diary entry:", error);
      next(error);
    }
  });
  
  // Einen Bautagebuch-Eintrag aktualisieren
  app.put("/api/projects/:projectId/construction-diary/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId, 10);
      const diaryId = parseInt(req.params.id, 10);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Berechtigungsprüfung
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf dieses Projekt" });
      }
      
      const diaryEntry = await storage.getConstructionDiary(diaryId);
      if (!diaryEntry) {
        return res.status(404).json({ message: "Bautagebuch-Eintrag nicht gefunden" });
      }
      
      if (diaryEntry.projectId !== projectId) {
        return res.status(403).json({ message: "Der Bautagebuch-Eintrag gehört nicht zum angegebenen Projekt" });
      }
      
      // Numerische Felder als Strings für Zod-Validierung
      const formData = {
        ...req.body,
        projectId, // Stellen sicher, dass das Projekt nicht geändert wird
        workHours: req.body.workHours?.toString() || diaryEntry.workHours.toString()
      };
      
      // Daten validieren und aktualisieren
      const validatedData = insertConstructionDiarySchema.partial().parse(formData);
      const updatedDiary = await storage.updateConstructionDiary(diaryId, validatedData);
      
      res.json(updatedDiary);
    } catch (error) {
      console.error("Error updating construction diary entry:", error);
      next(error);
    }
  });
  
  // Einen Bautagebuch-Eintrag löschen
  app.delete("/api/projects/:projectId/construction-diary/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const projectId = parseInt(req.params.projectId, 10);
      const diaryId = parseInt(req.params.id, 10);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Berechtigungsprüfung
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf dieses Projekt" });
      }
      
      const diaryEntry = await storage.getConstructionDiary(diaryId);
      if (!diaryEntry) {
        return res.status(404).json({ message: "Bautagebuch-Eintrag nicht gefunden" });
      }
      
      if (diaryEntry.projectId !== projectId) {
        return res.status(403).json({ message: "Der Bautagebuch-Eintrag gehört nicht zum angegebenen Projekt" });
      }
      
      await storage.deleteConstructionDiary(diaryId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting construction diary entry:", error);
      next(error);
    }
  });
  
  // --- Construction Diary Employees Endpoints ---
  
  // Mitarbeiter eines Bautagebuch-Eintrags abrufen
  app.get("/api/construction-diary/:diaryId/employees", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const diaryId = parseInt(req.params.diaryId, 10);
      
      // Holen des Bautagebuch-Eintrags, um Projekt-ID zu ermitteln
      const diaryEntry = await storage.getConstructionDiary(diaryId);
      if (!diaryEntry) {
        return res.status(404).json({ message: "Bautagebuch-Eintrag nicht gefunden" });
      }
      
      const project = await storage.getProject(diaryEntry.projectId);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Berechtigungsprüfung
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf dieses Projekt" });
      }
      
      const employees = await storage.getConstructionDiaryEmployees(diaryId);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching construction diary employees:", error);
      next(error);
    }
  });
  
  // Einen neuen Mitarbeiter zu einem Bautagebuch-Eintrag hinzufügen
  app.post("/api/construction-diary/:diaryId/employees", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const diaryId = parseInt(req.params.diaryId, 10);
      
      // Holen des Bautagebuch-Eintrags, um Projekt-ID zu ermitteln
      const diaryEntry = await storage.getConstructionDiary(diaryId);
      if (!diaryEntry) {
        return res.status(404).json({ message: "Bautagebuch-Eintrag nicht gefunden" });
      }
      
      const project = await storage.getProject(diaryEntry.projectId);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Berechtigungsprüfung
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf dieses Projekt" });
      }
      
      const formData = {
        ...req.body,
        constructionDiaryId: diaryId,
        createdBy: req.user.id
      };
      
      // Daten validieren
      const validatedData = insertConstructionDiaryEmployeeSchema.parse(formData);
      const createdEmployee = await storage.createConstructionDiaryEmployee(validatedData);
      
      res.status(201).json(createdEmployee);
    } catch (error) {
      console.error("Error creating construction diary employee:", error);
      next(error);
    }
  });
  
  // Einen Mitarbeiter aktualisieren
  app.put("/api/construction-diary/:diaryId/employees/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const diaryId = parseInt(req.params.diaryId, 10);
      const employeeId = parseInt(req.params.id, 10);
      
      // Holen des Bautagebuch-Eintrags, um Projekt-ID zu ermitteln
      const diaryEntry = await storage.getConstructionDiary(diaryId);
      if (!diaryEntry) {
        return res.status(404).json({ message: "Bautagebuch-Eintrag nicht gefunden" });
      }
      
      const project = await storage.getProject(diaryEntry.projectId);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Berechtigungsprüfung
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf dieses Projekt" });
      }
      
      // Sicherstellen, dass der Mitarbeiter zum angegebenen Bautagebuch-Eintrag gehört
      const employees = await storage.getConstructionDiaryEmployees(diaryId);
      const employee = employees.find(e => e.id === employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Mitarbeiter nicht gefunden oder gehört nicht zu diesem Bautagebuch-Eintrag" });
      }
      
      const formData = {
        ...req.body,
        constructionDiaryId: diaryId // Stellen sicher, dass die Zuordnung nicht geändert wird
      };
      
      // Daten validieren und aktualisieren
      const validatedData = insertConstructionDiaryEmployeeSchema.partial().parse(formData);
      const updatedEmployee = await storage.updateConstructionDiaryEmployee(employeeId, validatedData);
      
      res.json(updatedEmployee);
    } catch (error) {
      console.error("Error updating construction diary employee:", error);
      next(error);
    }
  });
  
  // Einen Mitarbeiter löschen
  app.delete("/api/construction-diary/:diaryId/employees/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const diaryId = parseInt(req.params.diaryId, 10);
      const employeeId = parseInt(req.params.id, 10);
      
      // Holen des Bautagebuch-Eintrags, um Projekt-ID zu ermitteln
      const diaryEntry = await storage.getConstructionDiary(diaryId);
      if (!diaryEntry) {
        return res.status(404).json({ message: "Bautagebuch-Eintrag nicht gefunden" });
      }
      
      const project = await storage.getProject(diaryEntry.projectId);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Berechtigungsprüfung
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf dieses Projekt" });
      }
      
      // Sicherstellen, dass der Mitarbeiter zum angegebenen Bautagebuch-Eintrag gehört
      const employees = await storage.getConstructionDiaryEmployees(diaryId);
      const employee = employees.find(e => e.id === employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Mitarbeiter nicht gefunden oder gehört nicht zu diesem Bautagebuch-Eintrag" });
      }
      
      await storage.deleteConstructionDiaryEmployee(employeeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting construction diary employee:", error);
      next(error);
    }
  });
  
  // Ähnliche Mitarbeiter suchen (für Deduplizierung)
  app.post("/api/construction-diary/:diaryId/employees/find-similar", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const diaryId = parseInt(req.params.diaryId, 10);
      const { firstName, lastName } = req.body;
      
      if (!firstName || !lastName) {
        return res.status(400).json({ message: "Vorname und Nachname sind erforderlich" });
      }
      
      // Holen des Bautagebuch-Eintrags, um Projekt-ID zu ermitteln
      const diaryEntry = await storage.getConstructionDiary(diaryId);
      if (!diaryEntry) {
        return res.status(404).json({ message: "Bautagebuch-Eintrag nicht gefunden" });
      }
      
      const project = await storage.getProject(diaryEntry.projectId);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      
      // Berechtigungsprüfung
      if (req.user.role !== 'administrator' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für den Zugriff auf dieses Projekt" });
      }
      
      const similarEmployees = await storage.findSimilarEmployees({
        firstName,
        lastName,
        constructionDiaryId: diaryId
      });
      
      res.json(similarEmployees);
    } catch (error) {
      console.error("Error finding similar employees:", error);
      next(error);
    }
  });

  // Datenqualitätsmanagement-Routen
  // Diese Routen sollten nur für Administratoren zugänglich sein
  app.get("/api/admin/data-quality/report", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Nur Administratoren können auf Datenqualitätsberichte zugreifen
      if (req.user.role !== 'administrator') {
        return res.status(403).json({ message: "Keine Berechtigung. Diese Operation erfordert Administrator-Rechte." });
      }
      
      // Importiere den DataQualityChecker
      const { dataQualityChecker } = require('./data-quality-checker');
      
      // Führe alle Checks aus
      const issues = await dataQualityChecker.runChecks();
      
      // Generiere einen HTML-Bericht (optional)
      await dataQualityChecker.generateHtmlReport();
      
      // Sende die gefundenen Probleme zurück
      res.json(issues);
    } catch (error) {
      console.error("Error generating data quality report:", error);
      next(error);
    }
  });
  
  // HTML-Bericht für die Datenbankstrukturqualität
  app.get("/api/admin/data-quality/db-structure-report", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Nur Administratoren können Datenbankstrukturprüfungen durchführen
      if (req.user.role !== 'administrator') {
        return res.status(403).json({ message: "Keine Berechtigung. Diese Operation erfordert Administrator-Rechte." });
      }
      
      // Importiere den DataQualityChecker
      const { dataQualityChecker } = require('./data-quality-checker');
      
      // Führe alle Checks aus
      await dataQualityChecker.runChecks();
      
      // Generiere einen HTML-Bericht und sende ihn zurück
      const htmlReport = await dataQualityChecker.generateHtmlReport();
      
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlReport);
    } catch (error) {
      console.error("Error generating data quality HTML report:", error);
      next(error);
    }
  });

  app.get("/api/admin/data-quality/issues", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Nur Administratoren können auf Datenqualitätsprobleme zugreifen
      if (req.user.role !== 'administrator') {
        return res.status(403).json({ message: "Keine Berechtigung. Diese Operation erfordert Administrator-Rechte." });
      }
      
      // Importiere den DataQualityChecker
      const { dataQualityChecker } = require('./data-quality-checker');
      
      // Führe alle Checks aus
      const issues = await dataQualityChecker.runChecks();
      
      res.json(issues);
    } catch (error) {
      console.error("Error fetching data quality issues:", error);
      next(error);
    }
  });

  app.post("/api/admin/data-quality/issues/:id/resolve", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Nur Administratoren können Datenqualitätsprobleme als gelöst markieren
      if (req.user.role !== 'administrator') {
        return res.status(403).json({ message: "Keine Berechtigung. Diese Operation erfordert Administrator-Rechte." });
      }
      
      // In einer vollständigen Implementierung würde hier die Datenbank aktualisiert
      // Das Issue als gelöst markieren
      // Für jetzt geben wir einfach eine Erfolgsmeldung zurück
      res.status(200).json({ message: "Problem wurde als gelöst markiert" });
    } catch (error) {
      console.error("Error resolving data quality issue:", error);
      next(error);
    }
  });

  app.post("/api/admin/data-quality/notifications/enable", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Nur Administratoren können Benachrichtigungen konfigurieren
      if (req.user.role !== 'administrator') {
        return res.status(403).json({ message: "Keine Berechtigung. Diese Operation erfordert Administrator-Rechte." });
      }
      
      // In einer vollständigen Implementierung würde hier die Benachrichtigungskonfiguration gespeichert
      // Für jetzt geben wir einfach eine Erfolgsmeldung zurück
      res.status(200).json({ message: "Benachrichtigungen aktiviert" });
    } catch (error) {
      console.error("Error enabling notifications:", error);
      next(error);
    }
  });

  // Datenqualitätsmanagement-Routen
  app.get("/api/data-quality/metrics", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Nur Administratoren und Manager können auf Datenqualitätsmetriken zugreifen
      if (req.user.role !== 'administrator' && req.user.role !== 'manager') {
        return res.status(403).json({ message: "Keine Berechtigung für Datenqualitätsmanagement" });
      }
      
      // Handler aufrufen
      await getDataQualityMetricsHandler(req, res);
    } catch (error) {
      console.error("Error fetching data quality metrics:", error);
      next(error);
    }
  });
  
  app.post("/api/data-quality/check", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Nur Administratoren und Manager können Datenqualitätsprüfungen durchführen
      if (req.user.role !== 'administrator' && req.user.role !== 'manager') {
        return res.status(403).json({ message: "Keine Berechtigung für Datenqualitätsmanagement" });
      }
      
      // Handler aufrufen
      await runDataQualityCheckHandler(req, res);
    } catch (error) {
      console.error("Error running data quality check:", error);
      next(error);
    }
  });
  
  app.post("/api/data-quality/resolve-issue", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Nur Administratoren und Manager können Datenqualitätsprobleme lösen
      if (req.user.role !== 'administrator' && req.user.role !== 'manager') {
        return res.status(403).json({ message: "Keine Berechtigung für Datenqualitätsmanagement" });
      }
      
      // Handler aufrufen
      await resolveIssueHandler(req, res);
    } catch (error) {
      console.error("Error resolving data quality issue:", error);
      next(error);
    }
  });
  
  app.post("/api/data-quality/toggle-rule", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Nur Administratoren und Manager können Datenqualitätsregeln verwalten
      if (req.user.role !== 'administrator' && req.user.role !== 'manager') {
        return res.status(403).json({ message: "Keine Berechtigung für Datenqualitätsmanagement" });
      }
      
      // Handler aufrufen
      await toggleRuleActiveHandler(req, res);
    } catch (error) {
      console.error("Error toggling data quality rule:", error);
      next(error);
    }
  });
  
  // Datenbankstruktur-Qualitätsprüfung
  app.get("/api/data-quality/db-structure", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Nur Administratoren können Datenbankstrukturprüfungen durchführen
      if (req.user.role !== 'administrator') {
        return res.status(403).json({ message: "Keine Berechtigung für Datenbankstrukturprüfung. Diese Operation erfordert Administrator-Rechte." });
      }
      
      // Handler aufrufen
      await checkDatabaseStructureHandler(req, res, next);
    } catch (error) {
      console.error("Error checking database structure:", error);
      next(error);
    }
  });
  
  // Datenbankstruktur-Qualitätsbericht (JSON)
  app.get("/api/admin/data-quality/report", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Importiere den DataQualityChecker
      const { dataQualityChecker } = require('./data-quality-checker');
      
      // Führe alle Checks aus
      const issues = await dataQualityChecker.runChecks();
      
      res.json(issues);
    } catch (error) {
      console.error("Error fetching data quality issues:", error);
      next(error);
    }
  });
  
  // HTML-Bericht für die Datenbankstrukturqualität
  app.get("/api/admin/data-quality/db-structure-report", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Importiere den DataQualityChecker
      const { dataQualityChecker } = require('./data-quality-checker');
      
      // Führe alle Checks aus und generiere einen HTML-Bericht
      await dataQualityChecker.runChecks();
      const htmlReport = await dataQualityChecker.generateHtmlReport();
      
      // Als HTML-Dokument senden
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlReport);
    } catch (error) {
      console.error("Error generating HTML report:", error);
      next(error);
    }
  });
  
  // Spezielle Debug-Endpunkte ohne Authentifizierung
  // Diese Endpunkte sind immer verfügbar, für Entwicklungs- und Testzwecke
  app.get("/api/debug/db-structure/report", async (req, res, next) => {
      try {
        // Direkte Verwendung von checkDatabaseStructure ohne Authentifizierungsprüfung
        const dbStructureReport = await checkDatabaseStructure();
        res.json(dbStructureReport);
      } catch (error) {
        console.error("Error in debug DB structure report:", error);
        next(error);
      }
    });


    
  // Datenqualitäts-API-Routen einbinden
  app.use('/api', dataQualityApiRouter);
  
  // Importiere separat den DataQualityChecker, falls er noch nicht verfügbar ist
  let dataQualityCheckerInstance: any;
  try {
    // Dynamischer Import, um Probleme mit Modulabhängigkeiten zu vermeiden
    import('./data-quality-checker').then(module => {
      dataQualityCheckerInstance = module.dataQualityChecker;
      console.log("DataQualityChecker erfolgreich importiert");
    }).catch(err => {
      console.error("Fehler beim Import von DataQualityChecker:", err);
    });
  } catch (error) {
    console.error("Fehler beim dynamischen Import des DataQualityChecker:", error);
  }
    
  app.get("/api/debug/data-quality/report", async (req, res, next) => {
    try {
      if (!dataQualityCheckerInstance) {
        return res.status(500).json({ error: "DataQualityChecker nicht verfügbar" });
      }
      
      const issues = await dataQualityCheckerInstance.runChecks();
      res.json(issues);
    } catch (error) {
      console.error("Error in debug data quality report:", error);
      next(error);
    }
    });
    
  app.get("/api/debug/data-quality/html-report", async (req, res, next) => {
    try {
      if (!dataQualityCheckerInstance) {
        return res.status(500).json({ error: "DataQualityChecker nicht verfügbar" });
      }
      
      await dataQualityCheckerInstance.runChecks();
      const htmlReport = await dataQualityCheckerInstance.generateHtmlReport();
      
      // Als HTML-Dokument senden
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlReport);
    } catch (error) {
      console.error("Error in debug HTML report:", error);
      next(error);
    }
  });
    
  // JSON-Bericht-Endpunkt
  app.get("/api/debug/data-quality/json-report", async (req, res, next) => {
    try {
      if (!dataQualityCheckerInstance) {
        return res.status(500).json({ error: "DataQualityChecker nicht verfügbar" });
      }
      
      await dataQualityCheckerInstance.runChecks();
      const jsonReport = await dataQualityCheckerInstance.generateJsonReport();
      
      // Als JSON senden
      res.json(jsonReport);
    } catch (error) {
      console.error("Error in debug JSON report:", error);
      next(error);
    }
  });

  // Endpunkt zur automatischen Behebung von Datenbankstrukturproblemen
  app.post("/api/debug/db-structure/fix", async (req, res, next) => {
    try {
      logger.info("API-Aufruf zum Beheben der Datenbankstrukturprobleme");
      
      // Importiere die Funktion zur Behebung der Datenbankstrukturprobleme
      const { fixDatabaseStructureIssues } = await import('./db-structure-fix');
      
      // Führe die Funktion aus
      const result = await fixDatabaseStructureIssues();
      
      // Rückgabe der Ergebnisse
      res.json(result);
    } catch (error) {
      logger.error("Fehler bei der Behebung der Datenbankstrukturprobleme:", error);
      next(error);
    }
  });
    
  console.log('[DEBUG] Debug-API-Endpunkte für Datenbankstrukturprüfung aktiviert.');
  
  // Statische HTML-Dateien im public-Verzeichnis zuerst prüfen (vor allen anderen Routen)
  // Dies MUSS am Anfang der Funktion stehen, damit es andere Routen überschreiben kann
  app.use('/public', express.static('public', {
    // Dateien mit .html-Endung als Content-Type text/html bedienen
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      }
    }
  }));
  
  // Upload-Verzeichnis statisch verfügbar machen (für Bildoptimierungs-Demo)
  app.use('/uploads', express.static('uploads', {
    // Cache-Kontrolle für bessere Leistung
    setHeaders: (res, path) => {
      // Bilder können gecached werden
      if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 Tag
      }
    }
  }));
  
  // Debug-Hilfsrouten direkt zu den HTML-Dateien
  app.get('/construction-diary-debug', (req, res) => {
    res.sendFile(path.resolve('public/construction-diary-debug.html'));
  });
  
  app.get('/db-structure-quality-debug', (req, res) => {
    res.sendFile(path.resolve('public/db-structure-quality-debug.html'));
  });

  // API-Routen für Testphasen-Benachrichtigungen
  app.post("/api/admin/trial/send-ending-notifications", checkAdminRole, async (req, res) => {
    try {
      const daysBeforeExpiry = parseInt(req.body.daysBeforeExpiry || "3", 10);
      logger.info(`Manuelle Anforderung zum Senden von Testphasen-Ablauf-Benachrichtigungen (${daysBeforeExpiry} Tage vor Ablauf)`);
      
      const sentCount = await trialEmailService.sendTrialEndingNotifications(daysBeforeExpiry);
      
      res.json({
        success: true,
        message: `${sentCount} Benachrichtigungen zu auslaufenden Testphasen wurden gesendet`,
        count: sentCount
      });
    } catch (error) {
      logger.error("Fehler beim Senden von Testphasen-Ablauf-Benachrichtigungen:", error);
      res.status(500).json({
        success: false,
        message: "Fehler beim Senden von Testphasen-Benachrichtigungen"
      });
    }
  });

  app.post("/api/admin/trial/send-ended-notifications", checkAdminRole, async (req, res) => {
    try {
      const daysAfterExpiry = parseInt(req.body.daysAfterExpiry || "1", 10);
      logger.info(`Manuelle Anforderung zum Senden von abgelaufenen Testphasen-Benachrichtigungen (${daysAfterExpiry} Tage nach Ablauf)`);
      
      const sentCount = await trialEmailService.sendTrialEndedNotifications(daysAfterExpiry);
      
      res.json({
        success: true,
        message: `${sentCount} Benachrichtigungen zu abgelaufenen Testphasen wurden gesendet`,
        count: sentCount
      });
    } catch (error) {
      logger.error("Fehler beim Senden von Benachrichtigungen zu abgelaufenen Testphasen:", error);
      res.status(500).json({
        success: false,
        message: "Fehler beim Senden von Benachrichtigungen zu abgelaufenen Testphasen"
      });
    }
  });

  // Endpoint zum Überprüfen des Trial-Status aller Benutzer
  app.get("/api/admin/trial/status", checkAdminRole, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Analysiere den Trial-Status für alle Benutzer
      const now = new Date();
      const trialStatus = users.map(user => {
        const trialEndDate = user.trialEndDate ? new Date(user.trialEndDate) : null;
        let status = "unbekannt";
        let daysRemaining = null;
        
        if (trialEndDate) {
          if (trialEndDate > now) {
            status = "aktiv";
            const diffTime = trialEndDate.getTime() - now.getTime();
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else {
            status = "abgelaufen";
            const diffTime = now.getTime() - trialEndDate.getTime();
            daysRemaining = -Math.floor(diffTime / (1000 * 60 * 60 * 24));
          }
        }
        
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          registrationDate: user.registrationDate,
          trialEndDate: user.trialEndDate,
          status,
          daysRemaining,
          subscriptionStatus: user.subscriptionStatus || "keine"
        };
      });
      
      res.json({
        success: true,
        data: trialStatus
      });
    } catch (error) {
      logger.error("Fehler beim Abrufen der Testphasen-Status:", error);
      res.status(500).json({
        success: false,
        message: "Fehler beim Abrufen der Testphasen-Status"
      });
    }
  });
  
  // API-Endpunkte für Kostenkalkulation
  
  // Bodenarten abrufen
  app.get('/api/bodenarten', async (req, res) => {
    try {
      // Für die erste Implementierung verwenden wir statische Daten
      // Später sollten diese aus der Datenbank geladen werden
      const bodenarten = [
        { id: 1, name: "Sand", belastungsklasse: "Gering", material_kosten_pro_m2: 12.50, dichte: 1800 },
        { id: 2, name: "Lehm", belastungsklasse: "Mittel", material_kosten_pro_m2: 14.75, dichte: 1950 },
        { id: 3, name: "Fels", belastungsklasse: "Hoch", material_kosten_pro_m2: 22.80, dichte: 2400 },
        { id: 4, name: "Asphalt (bestehend)", belastungsklasse: "Mittel", material_kosten_pro_m2: 18.20, dichte: 2300 },
        { id: 5, name: "Kies", belastungsklasse: "Gering", material_kosten_pro_m2: 10.75, dichte: 1750 }
      ];
      
      res.json(bodenarten);
    } catch (error) {
      console.error('Fehler beim Abrufen der Bodenarten:', error);
      res.status(500).json({ error: 'Fehler beim Abrufen der Bodenarten' });
    }
  });
  
  // Einzelne Bodenart abrufen
  app.get('/api/bodenarten/:id', async (req, res) => {
    try {
      const bodenartId = parseInt(req.params.id);
      
      // Mock-Daten für die erste Implementierung
      const bodenarten = [
        { id: 1, name: "Sand", belastungsklasse: "Gering", material_kosten_pro_m2: 12.50, dichte: 1800 },
        { id: 2, name: "Lehm", belastungsklasse: "Mittel", material_kosten_pro_m2: 14.75, dichte: 1950 },
        { id: 3, name: "Fels", belastungsklasse: "Hoch", material_kosten_pro_m2: 22.80, dichte: 2400 },
        { id: 4, name: "Asphalt (bestehend)", belastungsklasse: "Mittel", material_kosten_pro_m2: 18.20, dichte: 2300 },
        { id: 5, name: "Kies", belastungsklasse: "Gering", material_kosten_pro_m2: 10.75, dichte: 1750 }
      ];
      
      const bodenart = bodenarten.find(b => b.id === bodenartId);
      
      if (bodenart) {
        res.json(bodenart);
      } else {
        res.status(404).json({ error: 'Bodenart nicht gefunden' });
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Bodenart:', error);
      res.status(500).json({ error: 'Fehler beim Abrufen der Bodenart' });
    }
  });
  
  // Maschinen abrufen
  app.get('/api/maschinen', async (req, res) => {
    try {
      // Für die erste Implementierung verwenden wir statische Daten
      // Später sollten diese aus der Datenbank geladen werden
      const maschinen = [
        { id: 1, name: "CAT 320 Bagger", typ: "Bagger", kosten_pro_tag: 650, kraftstoffverbrauch: 15 },
        { id: 2, name: "BOMAG BW213 Walze", typ: "Walze", kosten_pro_tag: 480, kraftstoffverbrauch: 8 },
        { id: 3, name: "Wirtgen W200 Fräse", typ: "Fräse", kosten_pro_tag: 1200, kraftstoffverbrauch: 40 },
        { id: 4, name: "Caterpillar D6 Planierraupe", typ: "Planierraupe", kosten_pro_tag: 850, kraftstoffverbrauch: 25 },
        { id: 5, name: "JCB 3CX Baggerlader", typ: "Baggerlader", kosten_pro_tag: 420, kraftstoffverbrauch: 12 }
      ];
      
      res.json(maschinen);
    } catch (error) {
      console.error('Fehler beim Abrufen der Maschinen:', error);
      res.status(500).json({ error: 'Fehler beim Abrufen der Maschinen' });
    }
  });
  
  // Einzelne Maschine abrufen
  app.get('/api/maschinen/:id', async (req, res) => {
    try {
      const maschinenId = parseInt(req.params.id);
      
      // Mock-Daten für die erste Implementierung
      const maschinen = [
        { id: 1, name: "CAT 320 Bagger", typ: "Bagger", kosten_pro_tag: 650, kraftstoffverbrauch: 15 },
        { id: 2, name: "BOMAG BW213 Walze", typ: "Walze", kosten_pro_tag: 480, kraftstoffverbrauch: 8 },
        { id: 3, name: "Wirtgen W200 Fräse", typ: "Fräse", kosten_pro_tag: 1200, kraftstoffverbrauch: 40 },
        { id: 4, name: "Caterpillar D6 Planierraupe", typ: "Planierraupe", kosten_pro_tag: 850, kraftstoffverbrauch: 25 },
        { id: 5, name: "JCB 3CX Baggerlader", typ: "Baggerlader", kosten_pro_tag: 420, kraftstoffverbrauch: 12 }
      ];
      
      const maschine = maschinen.find(m => m.id === maschinenId);
      
      if (maschine) {
        res.json(maschine);
      } else {
        res.status(404).json({ error: 'Maschine nicht gefunden' });
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Maschine:', error);
      res.status(500).json({ error: 'Fehler beim Abrufen der Maschine' });
    }
  });
  
  // Routen aus der Datenbank abrufen
  app.get('/api/routes', async (req, res) => {
    try {
      // Mock-Routen zunächst als Fallback
      const mockRouten = [
        { 
          id: 1, 
          name: "Hauptstraße Sanierung", 
          start_address: "Bergstraße 1, Berlin", 
          end_address: "Bergstraße 50, Berlin", 
          distance: 1245,
          created_at: "2025-03-15T10:23:45Z"
        },
        { 
          id: 2, 
          name: "Kanalarbeiten Müllerweg", 
          start_address: "Müllerweg 12, München", 
          end_address: "Schulstraße 8, München", 
          distance: 820,
          created_at: "2025-04-02T09:15:12Z"
        },
        { 
          id: 3, 
          name: "Neubaugebiet Erschließung", 
          start_address: "Am Waldrand 1, Frankfurt", 
          end_address: "Feldweg 22, Frankfurt", 
          distance: 1750,
          created_at: "2025-04-25T14:05:33Z"
        }
      ];
      
      // Versuchen, die Routen aus der Datenbank abzurufen
      try {
        const result = await sql`SELECT * FROM routes ORDER BY created_at DESC`;
        
        // Wenn Routen gefunden wurden, diese zurückgeben
        if (result.length > 0) {
          return res.json(result);
        }
        
        // Sonst: Tabelle erstellen und Mock-Daten einfügen
        await sql`
          CREATE TABLE IF NOT EXISTS routes (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            start_address VARCHAR(255) NOT NULL,
            end_address VARCHAR(255) NOT NULL,
            distance INTEGER NOT NULL,
            route_data JSONB,
            created_by INTEGER REFERENCES tbluser(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        
        // Mock-Daten einfügen
        for (const route of mockRouten) {
          await sql`
            INSERT INTO routes (name, start_address, end_address, distance, created_at)
            VALUES (${route.name}, ${route.start_address}, ${route.end_address}, ${route.distance}, ${route.created_at})
          `;
        }
        
        // Daten erneut abrufen
        const newResult = await sql`SELECT * FROM routes ORDER BY created_at DESC`;
        return res.json(newResult);
      } catch (error) {
        // Bei Datenbankfehlern die Mock-Daten zurückgeben
        console.error('Datenbankfehler beim Abrufen der Routen:', error);
        return res.json(mockRouten);
      }
    } catch (error) {
      console.error('Allgemeiner Fehler beim Abrufen der Routen:', error);
      res.status(500).json({ error: 'Fehler beim Abrufen der Routen' });
    }
  });
  
  // Test-Endpunkt für Route-Daten (Debug)
  app.post('/api/routes/debug', (req, res) => {
    console.log('========== DEBUGGING ROUTE ==========');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    // Einfach die Daten zurückgeben, die empfangen wurden
    return res.status(200).json({
      message: 'Daten empfangen (Debug)',
      receivedData: req.body,
      timestamp: new Date().toISOString()
    });
  });

  // Route löschen
  app.delete('/api/routes/:id', async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      
      if (isNaN(routeId)) {
        return res.status(400).json({ error: 'Ungültige Routen-ID' });
      }
      
      // Route in der Datenbank löschen
      try {
        await sql`DELETE FROM routes WHERE id = ${routeId}`;
        return res.status(204).send(); // Erfolgreiche Löschung, kein Inhalt zurückgeben
      } catch (error) {
        console.error('Fehler beim Löschen der Route:', error);
        return res.status(500).json({ error: 'Fehler beim Löschen der Route' });
      }
    } catch (error) {
      console.error('Allgemeiner Fehler beim Löschen der Route:', error);
      res.status(500).json({ error: 'Fehler beim Löschen der Route' });
    }
  });

  // Neue Route speichern
  app.post('/api/routes', async (req, res) => {
    try {
      // Authentifizierungsprüfung temporär deaktiviert für Tests
      // if (!req.isAuthenticated()) {
      //   return res.status(401).json({ error: 'Nicht authentifiziert' });
      // }
      
      const { name, start_address, end_address, distance, route_data } = req.body;
      
      // Debug-Ausgabe zur Fehlersuche
      console.log('========== Routendaten-Anfrage Start ==========');
      console.log('Body der Anfrage:', req.body);
      console.log('Content-Type der Anfrage:', req.headers['content-type']);
      console.log('Extrahierte Felder:');
      console.log('- name:', name);
      console.log('- start_address:', start_address);
      console.log('- end_address:', end_address); 
      console.log('- distance:', distance);
      console.log('- route_data:', route_data ? `Array mit ${route_data.length} Elementen` : 'undefined oder null');
      console.log('========== Routendaten-Anfrage Ende ==========');
      
      // Validieren der erforderlichen Felder - mit Standardwerten wenn nötig
      const effectiveName = name || `Route ${new Date().toLocaleString('de-DE')}`;
      const effectiveStartAddress = start_address || 'Startpunkt';
      const effectiveEndAddress = end_address || 'Endpunkt';
      const effectiveDistance = distance || 100; // Fallback zu 100m
      
      console.log('Bereinigte Daten für Route:', {
        name: effectiveName,
        start_address: effectiveStartAddress,
        end_address: effectiveEndAddress,
        distance: effectiveDistance,
        route_data: route_data ? 'Vorhanden' : 'Fehlt'
      });
      
      try {
        // Stellen sicher, dass die Tabelle existiert
        await sql`
          CREATE TABLE IF NOT EXISTS routes (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            start_address VARCHAR(255) NOT NULL,
            end_address VARCHAR(255) NOT NULL,
            distance INTEGER NOT NULL,
            route_data JSONB,
            created_by INTEGER REFERENCES tbluser(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        
        // Route in der Datenbank speichern
        const userId = req.user?.id || null;
        
        // Werte mit Fallbacks definieren für den Fall, dass sie fehlen
        const effectiveName = name || `Route vom ${new Date().toLocaleString('de-DE')}`;
        const effectiveStartAddress = start_address || 'Unbekannter Startpunkt';
        const effectiveEndAddress = end_address || 'Unbekannter Endpunkt';
        const effectiveDistance = distance || 100;
        
        let finalRouteData;
        try {
          // Versuche die route_data in ein gültiges JSON zu parsen, falls es als String übergeben wurde
          if (typeof route_data === 'string') {
            finalRouteData = JSON.stringify(JSON.parse(route_data));
          } else if (Array.isArray(route_data)) {
            // Wenn es bereits ein Array ist, einfach als JSON-String serialisieren
            finalRouteData = JSON.stringify(route_data);
          } else {
            // Fallback: leeres Array
            finalRouteData = '[]';
          }
        } catch (error) {
          console.error('Fehler beim Verarbeiten der Route-Daten:', error);
          finalRouteData = '[]'; // Fallback: leeres Array
        }
        
        console.log('Verwende folgende Werte für SQL-Insert:', {
          name: effectiveName,
          start_address: effectiveStartAddress,
          end_address: effectiveEndAddress,
          distance: effectiveDistance,
          route_data_type: typeof route_data,
          route_data_preview: Array.isArray(route_data) 
            ? `Array mit ${route_data.length} Elementen` 
            : 'Keine gültigen Koordinaten'
        });
        
        // Die finale SQL-Anfrage mit Typecast als JSONB
        const result = await sql`
          INSERT INTO routes (name, start_address, end_address, distance, route_data, created_by)
          VALUES (${effectiveName}, ${effectiveStartAddress}, ${effectiveEndAddress}, ${effectiveDistance}, ${finalRouteData}::jsonb, ${userId})
          RETURNING *
        `;
        
        // Das eingefügte Ergebnis zurückgeben
        if (result && result.length > 0) {
          return res.status(201).json(result[0]);
        } else {
          throw new Error('Keine Daten nach dem Einfügen zurückgegeben');
        }
      } catch (error) {
        console.error('Datenbankfehler beim Speichern der Route:', error);
        throw error;
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Route:', error);
      res.status(500).json({ error: 'Fehler beim Speichern der Route' });
    }
  });
  
  // Kostenkalkulation durchführen
  app.post('/api/kalkulation', async (req, res) => {
    try {
      const { route_id, bodenart_id, maschine_id, parameter } = req.body;
      
      // Mit den IDs die entsprechenden Objekte finden
      const bodenarten = [
        { id: 1, name: "Sand", belastungsklasse: "Gering", material_kosten_pro_m2: 12.50, dichte: 1800 },
        { id: 2, name: "Lehm", belastungsklasse: "Mittel", material_kosten_pro_m2: 14.75, dichte: 1950 },
        { id: 3, name: "Fels", belastungsklasse: "Hoch", material_kosten_pro_m2: 22.80, dichte: 2400 },
        { id: 4, name: "Asphalt (bestehend)", belastungsklasse: "Mittel", material_kosten_pro_m2: 18.20, dichte: 2300 },
        { id: 5, name: "Kies", belastungsklasse: "Gering", material_kosten_pro_m2: 10.75, dichte: 1750 }
      ];
      
      const maschinen = [
        { id: 1, name: "CAT 320 Bagger", typ: "Bagger", kosten_pro_tag: 650, kraftstoffverbrauch: 15 },
        { id: 2, name: "BOMAG BW213 Walze", typ: "Walze", kosten_pro_tag: 480, kraftstoffverbrauch: 8 },
        { id: 3, name: "Wirtgen W200 Fräse", typ: "Fräse", kosten_pro_tag: 1200, kraftstoffverbrauch: 40 },
        { id: 4, name: "Caterpillar D6 Planierraupe", typ: "Planierraupe", kosten_pro_tag: 850, kraftstoffverbrauch: 25 },
        { id: 5, name: "JCB 3CX Baggerlader", typ: "Baggerlader", kosten_pro_tag: 420, kraftstoffverbrauch: 12 }
      ];
      
      // Route aus der Datenbank abrufen
      let selectedRoute;
      
      try {
        // Versuchen, die Route aus der Datenbank abzurufen
        const routeResult = await sql`SELECT * FROM routes WHERE id = ${parseInt(route_id)}`;
        
        if (routeResult && routeResult.length > 0) {
          selectedRoute = routeResult[0];
        }
      } catch (error) {
        console.error('Fehler beim Abrufen der Route:', error);
      }
      
      // Wenn keine Route gefunden wurde, Mock-Daten verwenden
      if (!selectedRoute) {
        const mockRouten = [
          { 
            id: 1, 
            name: "Hauptstraße Sanierung", 
            start_address: "Bergstraße 1, Berlin", 
            end_address: "Bergstraße 50, Berlin", 
            distance: 1245,
            created_at: "2025-03-15T10:23:45Z"
          },
          { 
            id: 2, 
            name: "Kanalarbeiten Müllerweg", 
            start_address: "Müllerweg 12, München", 
            end_address: "Schulstraße 8, München", 
            distance: 820,
            created_at: "2025-04-02T09:15:12Z"
          },
          { 
            id: 3, 
            name: "Neubaugebiet Erschließung", 
            start_address: "Am Waldrand 1, Frankfurt", 
            end_address: "Feldweg 22, Frankfurt", 
            distance: 1750,
            created_at: "2025-04-25T14:05:33Z"
          }
        ];
        selectedRoute = mockRouten.find(r => r.id === parseInt(route_id));
      }
      
      const selectedBodenart = bodenarten.find(b => b.id === bodenart_id);
      const selectedMaschine = maschinen.find(m => m.id === maschine_id);
      
      if (!selectedRoute || !selectedBodenart || !selectedMaschine) {
        return res.status(400).json({
          error: 'Ein oder mehrere der ausgewählten Elemente wurden nicht gefunden'
        });
      }
      
      const strecke = selectedRoute.distance; // in Metern
      const breite = parameter.breite;
      const tiefe = parameter.tiefe;
      const volumen = strecke * breite * tiefe;
      const flaeche = strecke * breite;
      
      // Materialkosten
      const materialkosten = flaeche * selectedBodenart.material_kosten_pro_m2;
      
      // Effizienzfaktor simulieren
      let effizienzFaktor = 1.0;
      let bearbeitungszeit = 0.1; // Standardwert in Minuten pro m²
      
      if (selectedMaschine.typ === 'Bagger' && selectedBodenart.name.includes('Sand')) {
        effizienzFaktor = 1.2;
        bearbeitungszeit = 0.08;
      } else if (selectedMaschine.typ === 'Walze' && selectedBodenart.name.includes('Asphalt')) {
        effizienzFaktor = 1.25;
        bearbeitungszeit = 0.06;
      } else if (selectedMaschine.typ === 'Fräse' && selectedBodenart.name.includes('Asphalt')) {
        effizienzFaktor = 1.5;
        bearbeitungszeit = 0.05;
      }
      
      // Gesamte Bearbeitungszeit in Stunden
      const gesamtzeit_minuten = flaeche * bearbeitungszeit / effizienzFaktor;
      const gesamtzeit_stunden = gesamtzeit_minuten / 60;
      
      // Anzahl der Arbeitstage
      const arbeitsstunden_pro_tag = parameter.arbeitsstunden_pro_tag;
      const benoetigte_tage = Math.ceil(gesamtzeit_stunden / arbeitsstunden_pro_tag);
      
      // Maschinenkosten
      const maschinenkosten = benoetigte_tage * selectedMaschine.kosten_pro_tag;
      
      // Personalkosten
      const personalkosten = gesamtzeit_stunden * parameter.personalkosten_pro_stunde * parameter.anzahl_personal;
      
      // Kraftstoffkosten
      const kraftstoffkosten = gesamtzeit_stunden * selectedMaschine.kraftstoffverbrauch * 1.50; // 1.50€ pro Liter
      
      // Gesamtkosten vor Zusatzkosten
      const zwischensumme = materialkosten + maschinenkosten + personalkosten + kraftstoffkosten;
      
      // Zusatzkosten (Unvorhergesehenes, Verwaltung, etc.)
      const zusatzkosten = zwischensumme * (parameter.zusatzkosten_prozent / 100);
      
      // Gesamtkosten
      const gesamtkosten = zwischensumme + zusatzkosten;
      
      // Kosten pro Meter
      const kosten_pro_meter = gesamtkosten / strecke;
      
      // Ergebnis zurückgeben
      res.json({
        strecke,
        breite,
        tiefe,
        flaeche,
        volumen,
        materialkosten,
        maschinenkosten,
        personalkosten,
        kraftstoffkosten,
        zusatzkosten,
        gesamtkosten,
        kosten_pro_meter,
        gesamtzeit_stunden,
        benoetigte_tage
      });
      
    } catch (error) {
      console.error('Fehler bei der Kostenkalkulation:', error);
      res.status(500).json({ error: 'Fehler bei der Kostenkalkulation' });
    }
  });
  
  // Bildoptimierungsrouten einrichten
  setupImageRoutes(app);
  
  // Setup image analysis routes
  setupImageAnalysisRoutes(app);
  
  // Setup surface analysis routes
  setupSurfaceAnalysisRoutes(app);
  setupSurfaceAnalysisAPIRoutes(app);
  
  // Setup subscription routes
  app.use('/api/subscription', subscriptionRouter);
  
  // DEBUG-Routen werden später implementiert
  app.use('/api/debug/attachments', (req, res) => {
    res.status(200).json({
      message: "Die Debug-Funktionen werden bald verfügbar sein",
      userFriendly: true
    });
  });

  // Direkte Download-Route ohne Token-Anforderung mit benutzerfreundlicher Fehlerbehandlung
  app.use('/api/direct-download', (req, res, next) => {
    try {
      directDownloadRouter(req, res, next);
    } catch (error) {
      console.error("Fehler beim direkten Download:", error);
      res.status(500).json({
        message: "Die Datei konnte nicht gefunden oder heruntergeladen werden. Bitte versuchen Sie es später erneut oder wenden Sie sich an den Administrator.",
        userFriendly: true
      });
    }
  });

  const httpServer = createHttpServer(app);
  return httpServer;
}
