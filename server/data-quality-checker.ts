/**
 * DataQualityChecker
 * 
 * Eine Klasse zur Überprüfung der Datenbankstruktur auf Qualitätsprobleme.
 * Basierend auf dem bereitgestellten Python-Code, angepasst für Node.js/TypeScript.
 */

import { db, sql, executeWithRetry } from './db';
import { format } from 'date-fns';
import fs from 'fs-extra';
import path from 'path';

// Regeln definieren
const RULES = [
  { check: "lowercase_tablenames", description: "Tabellennamen sollten kleingeschrieben sein" },
  { check: "snake_case_columns", description: "Spaltennamen sollten im snake_case-Format sein" },
  { check: "non_nullable_ids", description: "ID-Spalten sollten nicht NULL sein" },
  { check: "prefix_tbl", description: "Tabellennamen sollten mit 'tbl' beginnen" },
  { check: "foreign_keys_indexed", description: "Fremdschlüssel sollten indiziert sein" },
  { check: "primary_key_exists", description: "Jede Tabelle sollte einen Primärschlüssel haben" }
];

interface Issue {
  category: string;
  issue_type: string; // 'error', 'warning', 'info'
  message: string;
  details?: string;
  table?: string;
  column?: string;
}

export class DataQualityChecker {
  private issues: Issue[] = [];

  /**
   * Führt alle Qualitätsprüfungen für die Datenbankstruktur durch
   */
  async runChecks(): Promise<Issue[]> {
    this.issues = [];
    
    // Alle Tabellennamen aus der Datenbank abrufen
    const tables = await this.getAllTables();
    
    // Regel 1: Überprüfen, ob alle Tabellennamen kleingeschrieben sind
    await this.checkLowercaseTables(tables);
    
    // Regel 2: Überprüfen, ob alle Tabellennamen mit "tbl" beginnen
    await this.checkTablePrefix(tables);
    
    // Für jede Tabelle die Spalten überprüfen
    for (const table of tables) {
      // Spalteninformationen für diese Tabelle abrufen
      const columns = await this.getColumnsForTable(table.tableName);
      
      // Primärschlüssel für diese Tabelle abrufen
      const primaryKey = await this.getPrimaryKeyForTable(table.tableName);
      
      // Regel 3: Überprüfen, ob alle Spaltennamen im snake_case-Format sind
      await this.checkSnakeCaseColumns(table.tableName, columns);
      
      // Regel 4: Überprüfen, ob ID-Spalten NOT NULL sind
      await this.checkNonNullableIds(table.tableName, columns);
      
      // Regel 5: Überprüfen, ob die Tabelle einen Primärschlüssel hat
      await this.checkPrimaryKeyExists(table.tableName, primaryKey);
      
      // Regel 6: Überprüfen, ob Fremdschlüssel indiziert sind
      await this.checkForeignKeysIndexed(table.tableName);
    }
    
    return this.issues;
  }

  /**
   * Holt alle Tabellennamen aus der Datenbank
   */
  private async getAllTables(): Promise<{ tableName: string; tableSchema: string }[]> {
    const query = `
      SELECT table_name as "tableName", table_schema as "tableSchema"
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const result = await executeWithRetry(() => sql(query));
    // SQL-Ergebnis manuell auf das erwartete Format konvertieren
    return result as unknown as { tableName: string; tableSchema: string }[];
  }

  /**
   * Holt alle Spalteninformationen für eine bestimmte Tabelle
   */
  private async getColumnsForTable(tableName: string): Promise<{ 
    columnName: string; 
    dataType: string;
    isNullable: string;
    columnDefault: string | null;
  }[]> {
    const query = `
      SELECT 
        column_name as "columnName", 
        data_type as "dataType", 
        is_nullable as "isNullable",
        column_default as "columnDefault"
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position
    `;
    
    const result = await executeWithRetry(() => sql(query, [tableName]));
    // SQL-Ergebnis manuell auf das erwartete Format konvertieren
    return result as unknown as { 
      columnName: string; 
      dataType: string;
      isNullable: string;
      columnDefault: string | null;
    }[];
  }

  /**
   * Holt Primärschlüsselinformationen für eine bestimmte Tabelle
   */
  private async getPrimaryKeyForTable(tableName: string): Promise<string[]> {
    try {
      const query = `
        SELECT a.attname as column_name
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass
        AND i.indisprimary
      `;
      
      const result = await executeWithRetry(() => sql(query, [tableName]));
      // SQL-Ergebnis manuell konvertieren
      const typedResult = result as unknown as Array<{column_name: string}>;
      return typedResult.map((row: {column_name: string}) => row.column_name);
    } catch (error) {
      // Wenn die Tabelle nicht existiert, geben wir ein leeres Array zurück
      // und fügen eine Meldung zu den Issues hinzu
      if (error instanceof Error && 
          (error.message.includes('does not exist') || 
           error.message.includes('relation') || 
           error.message.includes('regclass'))) {
        this.issues.push({
          category: 'Tabellenverfügbarkeit',
          issue_type: 'error',
          message: `Tabelle "${tableName}" existiert nicht oder ist nicht zugänglich`,
          table: tableName,
          details: `Die Tabelle konnte nicht gefunden werden. Details: ${error.message}`
        });
      } else {
        // Andere Fehler loggen
        console.error(`Fehler beim Abrufen des Primärschlüssels für Tabelle ${tableName}:`, error);
      }
      return [];
    }
  }

  /**
   * Überprüft, ob die Fremdschlüssel einer Tabelle indiziert sind
   */
  private async checkForeignKeysIndexed(tableName: string): Promise<void> {
    try {
      // Alle Fremdschlüssel für eine Tabelle abrufen
      const fkQuery = `
        SELECT
          kcu.column_name as "foreignKeyColumn",
          ccu.table_name as "referencedTable",
          ccu.column_name as "referencedColumn"
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = $1
      `;
      
      const fkResult = await executeWithRetry(() => sql(fkQuery, [tableName]));
      // SQL-Ergebnis manuell konvertieren
      const foreignKeys = fkResult as unknown as Array<{
        foreignKeyColumn: string;
        referencedTable: string;
        referencedColumn: string;
      }>;
      
      if (foreignKeys.length === 0) return;
      
      // Alle Indizes für diese Tabelle abrufen
      const indexQuery = `
        SELECT
          a.attname as "columnName"
        FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a
        WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
          AND t.relname = $1
      `;
      
      const indexResult = await executeWithRetry(() => sql(indexQuery, [tableName]));
      // SQL-Ergebnis manuell konvertieren
      const typedIndexResult = indexResult as unknown as Array<{columnName: string}>;
      const indexedColumns = typedIndexResult.map((row: {columnName: string}) => row.columnName);
      
      // Überprüfen, ob jeder Fremdschlüssel indiziert ist
      for (const fk of foreignKeys) {
        if (!indexedColumns.includes(fk.foreignKeyColumn)) {
          this.issues.push({
            category: "Indizierung",
            issue_type: "warning",
            message: `Fremdschlüssel ${fk.foreignKeyColumn} in Tabelle ${tableName} ist nicht indiziert`,
            details: `Referenziert ${fk.referencedTable}.${fk.referencedColumn}`,
            table: tableName,
            column: fk.foreignKeyColumn
          });
        }
      }
    } catch (error) {
      // Fehler abfangen und als Issue melden
      if (error instanceof Error && 
          (error.message.includes('does not exist') || 
           error.message.includes('relation'))) {
        // Dieser Fehler wurde bereits bei getPrimaryKeyForTable behandelt
        return;
      } else {
        // Andere Fehler loggen
        console.error(`Fehler bei der Fremdschlüsselüberprüfung für Tabelle ${tableName}:`, error);
        this.issues.push({
          category: "Systemfehler",
          issue_type: "error",
          message: `Fehler bei der Prüfung von Fremdschlüsseln für Tabelle ${tableName}`,
          table: tableName,
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Überprüft, ob alle Tabellennamen kleingeschrieben sind
   */
  private async checkLowercaseTables(tables: { tableName: string; tableSchema: string }[]): Promise<void> {
    for (const table of tables) {
      if (table.tableName !== table.tableName.toLowerCase()) {
        this.issues.push({
          category: "Namenskonventionen",
          issue_type: "error",
          message: `Tabellenname '${table.tableName}' ist nicht vollständig kleingeschrieben`,
          table: table.tableName
        });
      }
    }
  }

  /**
   * Überprüft, ob alle Tabellennamen mit "tbl" beginnen
   */
  private async checkTablePrefix(tables: { tableName: string; tableSchema: string }[]): Promise<void> {
    for (const table of tables) {
      if (!table.tableName.startsWith("tbl")) {
        this.issues.push({
          category: "Namenskonventionen",
          issue_type: "warning",
          message: `Tabellenname '${table.tableName}' beginnt nicht mit 'tbl'`,
          table: table.tableName
        });
      }
    }
  }

  /**
   * Überprüft, ob alle Spaltennamen im snake_case-Format sind
   */
  private async checkSnakeCaseColumns(tableName: string, columns: { columnName: string; dataType: string; isNullable: string; columnDefault: string | null }[]): Promise<void> {
    const snakeCaseRegex = /^[a-z][a-z0-9_]*$/;
    
    for (const column of columns) {
      if (!snakeCaseRegex.test(column.columnName)) {
        this.issues.push({
          category: "Namenskonventionen",
          issue_type: "error",
          message: `Spaltenname '${column.columnName}' in Tabelle '${tableName}' ist nicht im snake_case-Format`,
          table: tableName,
          column: column.columnName
        });
      }
    }
  }

  /**
   * Überprüft, ob ID-Spalten NOT NULL sind
   */
  private async checkNonNullableIds(tableName: string, columns: { columnName: string; dataType: string; isNullable: string; columnDefault: string | null }[]): Promise<void> {
    for (const column of columns) {
      if (column.columnName.endsWith('_id') && column.isNullable === 'YES') {
        this.issues.push({
          category: "Datenintegrität",
          issue_type: "error",
          message: `ID-Spalte '${column.columnName}' in Tabelle '${tableName}' erlaubt NULL-Werte`,
          table: tableName,
          column: column.columnName
        });
      }
    }
  }

  /**
   * Überprüft, ob die Tabelle einen Primärschlüssel hat
   */
  private async checkPrimaryKeyExists(tableName: string, primaryKey: string[]): Promise<void> {
    if (primaryKey.length === 0) {
      this.issues.push({
        category: "Datenintegrität",
        issue_type: "error",
        message: `Tabelle '${tableName}' hat keinen Primärschlüssel`,
        table: tableName
      });
    }
  }

  /**
   * Generiert einen HTML-Bericht der gefundenen Probleme
   */
  async generateHtmlReport(): Promise<string> {
    const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Datenbankstruktur-Qualitätsbericht</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #2563eb;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        h2 {
          color: #374151;
          margin-top: 30px;
        }
        .timestamp {
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 30px;
        }
        .success {
          color: #10b981;
          font-weight: bold;
        }
        .category {
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .category-name {
          font-weight: bold;
          font-size: 1.1rem;
          color: #1f2937;
        }
        .badges {
          display: flex;
          gap: 10px;
        }
        .badge {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .badge-error {
          background-color: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }
        .badge-warning {
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fcd34d;
        }
        .badge-info {
          background-color: #dbeafe;
          color: #1e40af;
          border: 1px solid #93c5fd;
        }
        .issue-list {
          list-style-type: none;
          padding: 0;
        }
        .issue {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        .issue:last-child {
          border-bottom: none;
        }
        .error {
          border-left: 4px solid #ef4444;
          padding-left: 15px;
        }
        .warning {
          border-left: 4px solid #f59e0b;
          padding-left: 15px;
        }
        .info {
          border-left: 4px solid #3b82f6;
          padding-left: 15px;
        }
        .issue-message {
          font-weight: 500;
        }
        .issue-details {
          color: #6b7280;
          margin-top: 5px;
          font-size: 0.9rem;
        }
        .table-column {
          font-family: monospace;
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .summary {
          background-color: #ecfdf5;
          border: 1px solid #d1fae5;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 30px;
        }
        .summary h2 {
          color: #065f46;
          margin-top: 0;
        }
        .summary-count {
          font-weight: bold;
        }
        .rules-list {
          list-style-type: none;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 10px;
        }
        .rule-item {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
        }
        .rule-name {
          font-weight: 500;
          color: #4b5563;
        }
        .rule-desc {
          color: #6b7280;
          font-size: 0.9rem;
          margin-top: 5px;
        }
      </style>
    </head>
    <body>
      <h1>Datenbankstruktur-Qualitätsbericht</h1>
      <div class="timestamp">Erstellt am ${now}</div>
      
      <div class="summary">
        <h2>Zusammenfassung der Prüfung</h2>
    `;

    const totalIssues = this.issues.length;
    const errorCount = this.issues.filter(issue => issue.issue_type === 'error').length;
    const warningCount = this.issues.filter(issue => issue.issue_type === 'warning').length;
    const infoCount = this.issues.filter(issue => issue.issue_type === 'info').length;

    if (totalIssues === 0) {
      htmlContent += `
        <p class="success">✅ Alle Qualitätsprüfungen wurden bestanden!</p>
        <p>Die Datenbankstruktur entspricht allen definierten Regeln.</p>
      `;
    } else {
      htmlContent += `
        <p><span class="summary-count">${totalIssues}</span> Probleme gefunden:</p>
        <ul>
      `;
      
      if (errorCount > 0) {
        htmlContent += `<li><span class="summary-count">${errorCount}</span> Fehler</li>`;
      }
      
      if (warningCount > 0) {
        htmlContent += `<li><span class="summary-count">${warningCount}</span> Warnungen</li>`;
      }
      
      if (infoCount > 0) {
        htmlContent += `<li><span class="summary-count">${infoCount}</span> Hinweise</li>`;
      }
      
      htmlContent += `</ul>`;
    }

    // Angewandte Regeln anzeigen
    htmlContent += `
      <h3>Angewandte Qualitätsregeln</h3>
      <ul class="rules-list">
    `;
    
    for (const rule of RULES) {
      htmlContent += `
        <li class="rule-item">
          <div class="rule-name">${rule.check}</div>
          <div class="rule-desc">${rule.description}</div>
        </li>
      `;
    }
    
    htmlContent += `
      </ul>
      </div>
    `;

    if (totalIssues > 0) {
      // Gruppieren nach Kategorie
      const issuesByCategory: { [key: string]: Issue[] } = {};
      
      for (const issue of this.issues) {
        if (!issuesByCategory[issue.category]) {
          issuesByCategory[issue.category] = [];
        }
        issuesByCategory[issue.category].push(issue);
      }
      
      // Für jede Kategorie einen Abschnitt erstellen
      for (const category of Object.keys(issuesByCategory).sort()) {
        const categoryIssues = issuesByCategory[category];
        const categoryErrorCount = categoryIssues.filter(issue => issue.issue_type === 'error').length;
        const categoryWarningCount = categoryIssues.filter(issue => issue.issue_type === 'warning').length;
        const categoryInfoCount = categoryIssues.filter(issue => issue.issue_type === 'info').length;
        
        htmlContent += `
          <div class="category">
            <div class="category-header">
              <div class="category-name">${category}</div>
              <div class="badges">
        `;
        
        if (categoryErrorCount > 0) {
          htmlContent += `<span class="badge badge-error">${categoryErrorCount} Fehler</span>`;
        }
        
        if (categoryWarningCount > 0) {
          htmlContent += `<span class="badge badge-warning">${categoryWarningCount} Warnungen</span>`;
        }
        
        if (categoryInfoCount > 0) {
          htmlContent += `<span class="badge badge-info">${categoryInfoCount} Hinweise</span>`;
        }
        
        htmlContent += `
              </div>
            </div>
            <ul class="issue-list">
        `;
        
        for (const issue of categoryIssues) {
          htmlContent += `
            <li class="issue ${issue.issue_type}">
              <div class="issue-message">${issue.message}</div>
          `;
          
          if (issue.details) {
            htmlContent += `<div class="issue-details">${issue.details}</div>`;
          }
          
          if (issue.table || issue.column) {
            htmlContent += `<div class="issue-details">Betrifft: `;
            
            if (issue.table) {
              htmlContent += `<span class="table-column">${issue.table}</span>`;
            }
            
            if (issue.table && issue.column) {
              htmlContent += `.`;
            }
            
            if (issue.column) {
              htmlContent += `<span class="table-column">${issue.column}</span>`;
            }
            
            htmlContent += `</div>`;
          }
          
          htmlContent += `</li>`;
        }
        
        htmlContent += `
            </ul>
          </div>
        `;
      }
    }
    
    htmlContent += `
    </body>
    </html>
    `;

    // Speichern des Berichts in eine Datei
    const reportPath = path.join(process.cwd(), 'public', 'db_structure_quality_report.html');
    await fs.writeFile(reportPath, htmlContent, 'utf8');
    
    return htmlContent;
  }
}

// Exportiere eine Instanz des Checkers
export const dataQualityChecker = new DataQualityChecker();