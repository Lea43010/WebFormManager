import { db } from "./db";
import { sql } from "drizzle-orm";
import { Request, Response } from "express";

// Interface für die Datenbank-Strukturprüfung
export interface DbStructureIssue {
  category: string;
  issue: string;
  details: string[];
  severity: "low" | "medium" | "high";
}

// Interface für die Datenbank-Strukturprüfungs-Regeln
export interface DbStructureRule {
  check: string;
  description: string;
  enabled: boolean;
  severity: "low" | "medium" | "high";
}

// Definierte Regeln für die Datenbankstrukturprüfung
export const dbStructureRules: DbStructureRule[] = [
  {
    check: "lowercase_tablenames",
    description: "Tabellennamen sollten kleingeschrieben sein",
    enabled: true,
    severity: "medium"
  },
  {
    check: "snake_case_columns",
    description: "Spaltennamen sollten in snake_case formatiert sein",
    enabled: true,
    severity: "medium"
  },
  {
    check: "non_nullable_ids",
    description: "ID-Spalten sollten nicht NULL sein",
    enabled: true,
    severity: "high"
  }
];

/**
 * Führt die Datenbankstrukturprüfung durch
 */
export async function checkDatabaseStructure(): Promise<DbStructureIssue[]> {
  const issues: DbStructureIssue[] = [];
  const enabledRules = dbStructureRules.filter(rule => rule.enabled);

  try {
    // Hole alle Tabellen aus dem public Schema
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const tables = tablesResult.rows.map(row => row.table_name);

    // Regel 1: Prüfe Tabellennamen (lowercase_tablenames)
    if (enabledRules.some(rule => rule.check === "lowercase_tablenames")) {
      const ruleDetails = enabledRules.find(rule => rule.check === "lowercase_tablenames");
      const invalidTables = tables
        .filter(tableName => typeof tableName === 'string')
        .filter(tableName => {
          // Prüfe, ob der Tabellenname Großbuchstaben oder Leerzeichen enthält
          return !/^[a-z0-9_]+$/.test(tableName as string);
        });

      if (invalidTables.length > 0) {
        issues.push({
          category: "Tabellennamenskonvention",
          issue: "Tabellennamen sollten kleingeschrieben sein und keine Sonderzeichen enthalten",
          details: invalidTables as string[],
          severity: ruleDetails?.severity || "medium"
        });
      }
    }

    // Regel 2: Prüfe Spaltennamen (snake_case_columns)
    if (enabledRules.some(rule => rule.check === "snake_case_columns")) {
      const ruleDetails = enabledRules.find(rule => rule.check === "snake_case_columns");
      const invalidColumnResults: string[] = [];

      for (const tableName of tables) {
        if (typeof tableName !== 'string') continue;
        
        const columnsResult = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = ${tableName}
        `);

        const columns = columnsResult.rows.map(row => row.column_name);
        const invalidColumns = columns
          .filter(columnName => typeof columnName === 'string')
          .filter(columnName => {
            // Prüfe, ob der Spaltenname Großbuchstaben oder Leerzeichen enthält
            return !/^[a-z0-9_]+$/.test(columnName as string);
          });

        if (invalidColumns.length > 0) {
          invalidColumnResults.push(`Tabelle '${tableName}': ${invalidColumns.join(', ')}`);
        }
      }

      if (invalidColumnResults.length > 0) {
        issues.push({
          category: "Spaltennamenskonvention",
          issue: "Spaltennamen sollten in snake_case formatiert sein (kleingeschrieben mit Unterstrichen)",
          details: invalidColumnResults,
          severity: ruleDetails?.severity || "medium"
        });
      }
    }

    // Regel 3: Prüfe Nullable-IDs (non_nullable_ids)
    if (enabledRules.some(rule => rule.check === "non_nullable_ids")) {
      const ruleDetails = enabledRules.find(rule => rule.check === "non_nullable_ids");
      const nullableIdResults: string[] = [];

      for (const tableName of tables) {
        if (typeof tableName !== 'string') continue;
        
        const idColumnsResult = await db.execute(sql`
          SELECT column_name, is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
          AND (column_name LIKE '%id' OR column_name LIKE '%_id')
        `);

        const nullableIds = idColumnsResult.rows
          .filter(col => col.is_nullable === 'YES')
          .map(col => col.column_name as string);

        if (nullableIds.length > 0) {
          nullableIdResults.push(`Tabelle '${tableName}': ${nullableIds.join(', ')}`);
        }
      }

      if (nullableIdResults.length > 0) {
        issues.push({
          category: "ID-Feldkonfiguration",
          issue: "ID-Spalten sollten nicht NULL sein",
          details: nullableIdResults,
          severity: ruleDetails?.severity || "high"
        });
      }
    }

    return issues;
  } catch (error) {
    console.error("Fehler bei der Datenbankstrukturprüfung:", error);
    throw error;
  }
}

/**
 * Express-Handler für die Datenbankstrukturprüfung
 */
export async function checkDatabaseStructureHandler(req: Request, res: Response) {
  try {
    const issues = await checkDatabaseStructure();
    res.json({
      timestamp: new Date().toISOString(),
      rules: dbStructureRules,
      issues: issues,
      totalIssues: issues.length,
      status: issues.length > 0 ? "issues_found" : "passed"
    });
  } catch (error) {
    console.error("Fehler im checkDatabaseStructureHandler:", error);
    res.status(500).json({ 
      error: "Fehler bei der Datenbankstrukturprüfung",
      message: error instanceof Error ? error.message : "Unbekannter Fehler"
    });
  }
}