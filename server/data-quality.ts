import { db } from "./db";
import { sql } from "drizzle-orm";
import { Request, Response } from "express";

// Typen für die Datenqualitätsregeln und -probleme
export interface DataQualityRule {
  id: number;
  entityType: string;
  fieldName: string;
  ruleName: string;
  ruleDescription: string;
  severity: "low" | "medium" | "high";
  active: boolean;
}

export interface DataQualityIssue {
  id: number;
  entityType: string;
  entityId: number;
  entityName: string;
  fieldName: string;
  issueType: string;
  issueDescription: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
  resolvedAt: string | null;
}

export interface DataQualityMetric {
  entityType: string;
  totalRecords: number;
  completeRecords: number;
  incompleteRecords: number;
  qualityScore: number;
  lastChecked: string;
}

// Regeln für die verschiedenen Entitätstypen
export const rules: DataQualityRule[] = [
  {
    id: 1,
    entityType: "tblcustomer",
    fieldName: "first_name",
    ruleName: "required",
    ruleDescription: "Vorname darf nicht leer sein",
    severity: "medium",
    active: true
  },
  {
    id: 2,
    entityType: "tblcustomer",
    fieldName: "last_name",
    ruleName: "required",
    ruleDescription: "Nachname darf nicht leer sein",
    severity: "medium",
    active: true
  },
  {
    id: 3,
    entityType: "tblcustomer",
    fieldName: "customer_email",
    ruleName: "email_format",
    ruleDescription: "E-Mail muss gültiges Format haben",
    severity: "high",
    active: true
  },
  {
    id: 4,
    entityType: "tblcompany",
    fieldName: "company_name",
    ruleName: "required",
    ruleDescription: "Firmenname darf nicht leer sein",
    severity: "high",
    active: true
  },
  {
    id: 5,
    entityType: "tblproject",
    fieldName: "project_name",
    ruleName: "required",
    ruleDescription: "Projektname darf nicht leer sein",
    severity: "high",
    active: true
  },
  {
    id: 6,
    entityType: "tblproject",
    fieldName: "project_startdate",
    ruleName: "valid_date",
    ruleDescription: "Startdatum muss gültiges Datum sein",
    severity: "medium",
    active: true
  },
  {
    id: 7,
    entityType: "tblproject",
    fieldName: "project_enddate",
    ruleName: "date_after",
    ruleDescription: "Enddatum muss nach Startdatum liegen",
    severity: "medium",
    active: true
  }
];

// Datenbankabfragen für die Datenqualitätsmetriken
export async function getDataQualityMetrics(): Promise<DataQualityMetric[]> {
  const metrics: DataQualityMetric[] = [];

  try {
    // Kunden-Metriken
    const customersResult = await db.execute(sql`
      SELECT COUNT(*) as total_records,
             SUM(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND customer_email IS NOT NULL THEN 1 ELSE 0 END) as complete_records
      FROM tblcustomer
    `);
    
    const customersData = customersResult.rows[0];
    const totalCustomers = parseInt(customersData.total_records);
    const completeCustomers = parseInt(customersData.complete_records);
    
    metrics.push({
      entityType: "customers",
      totalRecords: totalCustomers,
      completeRecords: completeCustomers,
      incompleteRecords: totalCustomers - completeCustomers,
      qualityScore: totalCustomers > 0 ? Math.round((completeCustomers / totalCustomers) * 100) : 100,
      lastChecked: new Date().toISOString()
    });

    // Unternehmen-Metriken
    const companiesResult = await db.execute(sql`
      SELECT COUNT(*) as total_records,
             SUM(CASE WHEN company_name IS NOT NULL AND city IS NOT NULL THEN 1 ELSE 0 END) as complete_records
      FROM tblcompany
    `);
    
    const companiesData = companiesResult.rows[0];
    const totalCompanies = parseInt(companiesData.total_records);
    const completeCompanies = parseInt(companiesData.complete_records);
    
    metrics.push({
      entityType: "companies",
      totalRecords: totalCompanies,
      completeRecords: completeCompanies,
      incompleteRecords: totalCompanies - completeCompanies,
      qualityScore: totalCompanies > 0 ? Math.round((completeCompanies / totalCompanies) * 100) : 100,
      lastChecked: new Date().toISOString()
    });

    // Projekte-Metriken
    const projectsResult = await db.execute(sql`
      SELECT COUNT(*) as total_records,
             SUM(CASE WHEN project_name IS NOT NULL AND project_startdate IS NOT NULL THEN 1 ELSE 0 END) as complete_records
      FROM tblproject
    `);
    
    const projectsData = projectsResult.rows[0];
    const totalProjects = parseInt(projectsData.total_records);
    const completeProjects = parseInt(projectsData.complete_records);
    
    metrics.push({
      entityType: "projects",
      totalRecords: totalProjects,
      completeRecords: completeProjects,
      incompleteRecords: totalProjects - completeProjects,
      qualityScore: totalProjects > 0 ? Math.round((completeProjects / totalProjects) * 100) : 100,
      lastChecked: new Date().toISOString()
    });

    // Anhänge-Metriken
    const attachmentsResult = await db.execute(sql`
      SELECT COUNT(*) as total_records,
             SUM(CASE WHEN file_path IS NOT NULL AND file_name IS NOT NULL THEN 1 ELSE 0 END) as complete_records
      FROM tblattachment
    `);
    
    const attachmentsData = attachmentsResult.rows[0];
    const totalAttachments = parseInt(attachmentsData.total_records || '0');
    const completeAttachments = parseInt(attachmentsData.complete_records || '0');
    
    metrics.push({
      entityType: "attachments",
      totalRecords: totalAttachments,
      completeRecords: completeAttachments,
      incompleteRecords: totalAttachments - completeAttachments,
      qualityScore: totalAttachments > 0 ? Math.round((completeAttachments / totalAttachments) * 100) : 100,
      lastChecked: new Date().toISOString()
    });

    return metrics;
  } catch (error) {
    console.error("Error getting data quality metrics:", error);
    return [];
  }
}

// Datenqualitätsprüfung durchführen
export async function runDataQualityCheck(): Promise<DataQualityIssue[]> {
  const issues: DataQualityIssue[] = [];
  const activeRules = rules.filter(rule => rule.active);

  try {
    // 1. Prüfe Kundenregeln
    const customerRules = activeRules.filter(rule => rule.entityType === "tblcustomer");
    if (customerRules.length > 0) {
      const customers = await db.execute(sql`SELECT * FROM tblcustomer`);
      
      for (const customer of customers.rows) {
        for (const rule of customerRules) {
          if (rule.ruleName === "required" && (!customer[rule.fieldName] || customer[rule.fieldName] === "")) {
            issues.push({
              id: issues.length + 1,
              entityType: "customers",
              entityId: customer.id,
              entityName: `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || `Kunde #${customer.id}`,
              fieldName: rule.fieldName,
              issueType: "missing_value",
              issueDescription: `${getFieldLabel(rule.fieldName)} fehlt`,
              severity: rule.severity,
              createdAt: new Date().toISOString(),
              resolvedAt: null
            });
          } else if (rule.ruleName === "email_format" && rule.fieldName === "customer_email" && customer.customer_email) {
            // Einfache E-Mail-Validierung
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customer.customer_email)) {
              issues.push({
                id: issues.length + 1,
                entityType: "customers",
                entityId: customer.id,
                entityName: `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || `Kunde #${customer.id}`,
                fieldName: rule.fieldName,
                issueType: "invalid_format",
                issueDescription: `E-Mail-Format ist ungültig: '${customer.customer_email}'`,
                severity: rule.severity,
                createdAt: new Date().toISOString(),
                resolvedAt: null
              });
            }
          }
        }
      }
    }

    // 2. Prüfe Unternehmensregeln
    const companyRules = activeRules.filter(rule => rule.entityType === "tblcompany");
    if (companyRules.length > 0) {
      const companies = await db.execute(sql`SELECT * FROM tblcompany`);
      
      for (const company of companies.rows) {
        for (const rule of companyRules) {
          if (rule.ruleName === "required" && (!company[rule.fieldName] || company[rule.fieldName] === "")) {
            issues.push({
              id: issues.length + 1,
              entityType: "companies",
              entityId: company.company_id,
              entityName: company.company_name || `Unternehmen #${company.company_id}`,
              fieldName: rule.fieldName,
              issueType: "missing_value",
              issueDescription: `${getFieldLabel(rule.fieldName)} fehlt`,
              severity: rule.severity,
              createdAt: new Date().toISOString(),
              resolvedAt: null
            });
          }
        }
      }
    }

    // 3. Prüfe Projektregeln
    const projectRules = activeRules.filter(rule => rule.entityType === "tblproject");
    if (projectRules.length > 0) {
      const projects = await db.execute(sql`SELECT * FROM tblproject`);
      
      for (const project of projects.rows) {
        for (const rule of projectRules) {
          if (rule.ruleName === "required" && (!project[rule.fieldName] || project[rule.fieldName] === "")) {
            issues.push({
              id: issues.length + 1,
              entityType: "projects",
              entityId: project.id,
              entityName: project.project_name || `Projekt #${project.id}`,
              fieldName: rule.fieldName,
              issueType: "missing_value",
              issueDescription: `${getFieldLabel(rule.fieldName)} fehlt`,
              severity: rule.severity,
              createdAt: new Date().toISOString(),
              resolvedAt: null
            });
          } else if (rule.ruleName === "valid_date" && rule.fieldName === "project_startdate") {
            if (project.project_startdate && !(project.project_startdate instanceof Date) && isNaN(Date.parse(project.project_startdate))) {
              issues.push({
                id: issues.length + 1,
                entityType: "projects",
                entityId: project.id,
                entityName: project.project_name || `Projekt #${project.id}`,
                fieldName: rule.fieldName,
                issueType: "invalid_date",
                issueDescription: `Startdatum ist kein gültiges Datum: '${project.project_startdate}'`,
                severity: rule.severity,
                createdAt: new Date().toISOString(),
                resolvedAt: null
              });
            }
          } else if (rule.ruleName === "date_after" && rule.fieldName === "project_enddate") {
            if (project.project_startdate && project.project_enddate) {
              const startDate = new Date(project.project_startdate);
              const endDate = new Date(project.project_enddate);
              
              if (endDate < startDate) {
                issues.push({
                  id: issues.length + 1,
                  entityType: "projects",
                  entityId: project.id,
                  entityName: project.project_name || `Projekt #${project.id}`,
                  fieldName: rule.fieldName,
                  issueType: "invalid_value",
                  issueDescription: `Enddatum liegt vor Startdatum`,
                  severity: rule.severity,
                  createdAt: new Date().toISOString(),
                  resolvedAt: null
                });
              }
            }
          }
        }
      }
    }

    return issues;
  } catch (error) {
    console.error("Error running data quality check:", error);
    return [];
  }
}

// Resolving Issues
export async function resolveIssue(issueId: number): Promise<boolean> {
  // In einer vollständigen Implementierung würden wir hier die Datenbank aktualisieren
  // Für den Prototyp geben wir einfach true zurück
  return true;
}

// Toggle Rule Active State
export async function toggleRuleActive(ruleId: number): Promise<boolean> {
  // In einer vollständigen Implementierung würden wir hier die Datenbank aktualisieren
  // Für den Prototyp geben wir einfach true zurück
  return true;
}

// Handler für die API-Routen
export async function getDataQualityMetricsHandler(req: Request, res: Response) {
  try {
    const metrics = await getDataQualityMetrics();
    res.json(metrics);
  } catch (error) {
    console.error("Error in getDataQualityMetricsHandler:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Datenqualitätsmetriken" });
  }
}

export async function runDataQualityCheckHandler(req: Request, res: Response) {
  try {
    const issues = await runDataQualityCheck();
    res.json(issues);
  } catch (error) {
    console.error("Error in runDataQualityCheckHandler:", error);
    res.status(500).json({ error: "Fehler beim Ausführen der Datenqualitätsprüfung" });
  }
}

export async function resolveIssueHandler(req: Request, res: Response) {
  try {
    const { issueId } = req.body;
    const success = await resolveIssue(issueId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Problem konnte nicht als gelöst markiert werden" });
    }
  } catch (error) {
    console.error("Error in resolveIssueHandler:", error);
    res.status(500).json({ error: "Fehler beim Markieren des Problems als gelöst" });
  }
}

export async function toggleRuleActiveHandler(req: Request, res: Response) {
  try {
    const { ruleId } = req.body;
    const success = await toggleRuleActive(ruleId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Regel konnte nicht umgeschaltet werden" });
    }
  } catch (error) {
    console.error("Error in toggleRuleActiveHandler:", error);
    res.status(500).json({ error: "Fehler beim Umschalten des Regelstatus" });
  }
}

// Helper-Funktion für Feldbezeichnungen
function getFieldLabel(fieldName: string): string {
  switch (fieldName) {
    case "first_name": return "Vorname";
    case "last_name": return "Nachname";
    case "customer_email": return "E-Mail";
    case "company_name": return "Firmenname";
    case "project_name": return "Projektname";
    case "project_startdate": return "Startdatum";
    case "project_enddate": return "Enddatum";
    default: return fieldName;
  }
}