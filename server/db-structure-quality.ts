import { db } from "./db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

// Schnittstelle für DB-Strukturprobleme
export interface DbIssue {
  category: string;
  issue_type: string;
  message: string;
  table_name?: string;
  column_name?: string;
  recommended_action?: string;
  severity: "high" | "medium" | "low";
}

// Schnittstelle für DB-Strukturprüfungsergebnis
export interface DbStructureQualityResult {
  issues: DbIssue[];
  summary: {
    total_issues: number;
    high_severity_issues: number;
    medium_severity_issues: number;
    low_severity_issues: number;
    tables_checked: number;
    columns_checked: number;
  };
  status: string;
}

// Hilfsfunktion zum Abrufen von Tabellen aus der PostgreSQL-Datenbank
async function getTables(): Promise<{tableName: string, tableSchema: string}[]> {
  try {
    const query = sql`
      SELECT table_name as "tableName", table_schema as "tableSchema"
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    return await db.execute(query);
  } catch (error) {
    logger.error("Fehler beim Abrufen von Tabellen:", error);
    throw new Error("Fehler beim Abrufen von Tabellen aus der Datenbank");
  }
}

// Hilfsfunktion zum Abrufen von Spalten einer Tabelle
async function getColumns(tableName: string): Promise<{columnName: string, dataType: string, isNullable: string, columnDefault: string | null}[]> {
  try {
    const query = sql`
      SELECT 
        column_name as "columnName", 
        data_type as "dataType", 
        is_nullable as "isNullable",
        column_default as "columnDefault"
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
      ORDER BY ordinal_position;
    `;
    
    return await db.execute(query);
  } catch (error) {
    logger.error(`Fehler beim Abrufen von Spalten für Tabelle ${tableName}:`, error);
    throw new Error(`Fehler beim Abrufen von Spalten für Tabelle ${tableName}`);
  }
}

// Funktion zur Prüfung der Datenbankstruktur
// Handler für die Express-Route
export async function checkDatabaseStructureHandler(req: any, res: any, next: any) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nicht authentifiziert" });
    }
    
    // Nur Administratoren können auf die Datenbankstrukturprüfung zugreifen
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ 
        message: "Keine Berechtigung. Diese Operation erfordert Administrator-Rechte." 
      });
    }
    
    const dbStructureReport = await checkDatabaseStructure();
    res.json(dbStructureReport);
  } catch (error) {
    console.error("Fehler bei der Datenbankstrukturprüfung:", error);
    next(error);
  }
}

export async function checkDatabaseStructure(): Promise<DbStructureQualityResult> {
  const issues: DbIssue[] = [];
  let tablesChecked = 0;
  let columnsChecked = 0;
  
  try {
    // Holen Sie alle Tabellen
    const tables = await getTables();
    tablesChecked = tables.length;
    
    // Für jede Tabelle die Struktur prüfen
    for (const table of tables) {
      const tableName = table.tableName;
      
      // Prüfen Sie die Tabellennamenkonvention (sollte mit 'tbl' beginnen)
      if (!tableName.startsWith('tbl')) {
        issues.push({
          category: "Namenskonventionen",
          issue_type: "table_naming",
          message: `Tabellenname beginnt nicht mit 'tbl'`,
          table_name: tableName,
          recommended_action: "Tabellennamen sollten mit 'tbl' beginnen für Konsistenz",
          severity: "medium",
        });
      }
      
      // Prüfen Sie die Spalten dieser Tabelle
      const columns = await getColumns(tableName);
      columnsChecked += columns.length;
      
      // Prüfen Sie, ob die ID-Spalte vorhanden ist und NOT NULL ist
      const idColumn = columns.find(col => col.columnName === 'id');
      if (!idColumn) {
        issues.push({
          category: "Strukturkonsistenz",
          issue_type: "missing_id",
          message: `Tabelle hat keine 'id'-Spalte`,
          table_name: tableName,
          recommended_action: "Jede Tabelle sollte eine eindeutige ID-Spalte haben",
          severity: "high",
        });
      } else if (idColumn.isNullable === 'YES') {
        issues.push({
          category: "Datenintegrität",
          issue_type: "nullable_id",
          message: `Die 'id'-Spalte erlaubt NULL-Werte`,
          table_name: tableName,
          column_name: 'id',
          recommended_action: "Die ID-Spalte sollte NOT NULL sein",
          severity: "high",
        });
      }
      
      // Prüfen auf Snake-Case in Spaltennamen
      for (const column of columns) {
        if (column.columnName.includes('_')) {
          // Snake Case erkannt (gewünscht in der Datenbank)
        } else if (column.columnName !== column.columnName.toLowerCase()) {
          // Wenn nicht Snake Case und enthält Großbuchstaben, könnte es CamelCase sein
          issues.push({
            category: "Namenskonventionen",
            issue_type: "column_naming",
            message: `Spaltenname verwendet nicht Snake-Case (mit Unterstrichen)`,
            table_name: tableName,
            column_name: column.columnName,
            recommended_action: "Spaltennamen sollten in Snake-Case formatiert sein (z.B. 'user_name' statt 'userName')",
            severity: "medium",
          });
        }
      }
      
      // Prüfen Sie, ob eine created_at-Spalte vorhanden ist
      if (!columns.some(col => col.columnName === 'created_at')) {
        issues.push({
          category: "Audit-Trail",
          issue_type: "missing_created_at",
          message: `Tabelle hat keine 'created_at'-Spalte`,
          table_name: tableName,
          recommended_action: "Jede Tabelle sollte eine created_at-Spalte für Audit-Zwecke haben",
          severity: "low",
        });
      }
      
      // Prüfen Sie auf TEXT-Felder ohne Längenbegrenzung (potenzielles Leistungsproblem)
      const textColumns = columns.filter(col => col.dataType === 'text');
      if (textColumns.length > 3) {
        issues.push({
          category: "Leistungsoptimierung",
          issue_type: "too_many_text_fields",
          message: `Tabelle hat mehr als 3 TEXT-Felder ohne Längenbegrenzung`,
          table_name: tableName,
          recommended_action: "Erwägen Sie, TEXT-Felder durch VARCHAR mit angemessener Längenbegrenzung zu ersetzen",
          severity: "low",
        });
      }
    }
    
    // Zusammenfassung erstellen
    const summary = {
      total_issues: issues.length,
      high_severity_issues: issues.filter(i => i.severity === 'high').length,
      medium_severity_issues: issues.filter(i => i.severity === 'medium').length,
      low_severity_issues: issues.filter(i => i.severity === 'low').length,
      tables_checked: tablesChecked,
      columns_checked: columnsChecked,
    };
    
    return {
      issues,
      summary,
      status: "success",
    };
    
  } catch (error) {
    logger.error("Fehler bei der Datenbankstrukturprüfung:", error);
    throw new Error("Fehler bei der Prüfung der Datenbankstruktur");
  }
}