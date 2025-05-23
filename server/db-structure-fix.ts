import { sql, executeWithRetry } from './db';
import { logger } from './logger';
import { neonConfig } from '@neondatabase/serverless';

export interface DbFixResult {
  success: boolean;
  fixes_applied: {
    table: string;
    column?: string;
    issue: string;
    fix: string;
    result: string;
  }[];
  errors: {
    table: string;
    column?: string;
    issue: string;
    error: string;
  }[];
}

/**
 * Führt eine SQL-Abfrage mit automatischem Retry aus
 */
async function executeQuery(query: string, params: any[] = []): Promise<any[]> {
  try {
    // Bereite die Parameter für Neon SQL vor
    const preparedParams = params.map((param, index) => {
      return { name: (index + 1).toString(), value: param };
    });
    
    // Führe die Abfrage mit Retry aus
    const result = await executeWithRetry(() => sql(query, preparedParams));
    
    return result as any[];
  } catch (error) {
    logger.error("Fehler bei der Ausführung der Datenbankabfrage:", error);
    throw error;
  }
}

// Hauptfunktion zum Beheben der Datenbankstrukturprobleme
export async function fixDatabaseStructureIssues(): Promise<DbFixResult> {
  const result: DbFixResult = {
    success: true,
    fixes_applied: [],
    errors: []
  };

  try {
    logger.info("Starte Datenbank-Strukturproblembehebung...");
    
    // Schritt 0: Spezielle Fixes für bekannte Probleme ausführen
    await fixKnownSpecialCases(result);
    
    // Schritt 1: Tabellen identifizieren, die keinen Primärschlüssel haben
    await fixMissingPrimaryKeys(result);
    
    // Schritt 2: NULL-Werte in Fremdschlüsseln prüfen und fixen
    await fixNullableForeignKeys(result);
    
    // Prüfen, ob es Fehler gab
    if (result.errors.length > 0) {
      result.success = false;
    }

    return result;
  } catch (error) {
    logger.error("Fehler bei der Datenbank-Strukturproblembehebung:", error);
    result.success = false;
    result.errors.push({
      table: 'global',
      issue: 'Allgemeiner Fehler',
      error: error instanceof Error ? error.message : String(error)
    });
    return result;
  }
}

/**
 * Behebt spezielle bekannte Probleme, die in früheren Durchläufen identifiziert wurden
 */
async function fixKnownSpecialCases(result: DbFixResult) {
  try {
    // 1. Spezialfall: tblpermissions_backup hat bereits eine id-Spalte, braucht aber PRIMARY KEY
    try {
      // Prüfen, ob die Tabelle existiert
      const tableExists = await doesTableExist('tblpermissions_backup');
      if (tableExists) {
        // Prüfen, ob ein Primary Key fehlt
        const hasPrimaryKey = await hasTablePrimaryKey('tblpermissions_backup');
        if (!hasPrimaryKey) {
          // PRIMARY KEY direkt auf vorhandene id-Spalte setzen (ohne ALTER TABLE ADD COLUMN)
          await executeQuery(
            `ALTER TABLE "tblpermissions_backup" ADD CONSTRAINT "tblpermissions_backup_pkey" PRIMARY KEY (id)`
          );
          
          result.fixes_applied.push({
            table: 'tblpermissions_backup',
            issue: 'Primärschlüssel fehlt, aber id-Spalte vorhanden',
            fix: 'PRIMARY KEY Constraint für vorhandene id-Spalte hinzugefügt',
            result: 'Erfolgreich'
          });
        }
      }
    } catch (error) {
      logger.error("Fehler beim Spezialfix für tblpermissions_backup:", error);
      result.errors.push({
        table: 'tblpermissions_backup',
        issue: 'Primärschlüssel fehlt, aber id-Spalte vorhanden',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // 2. Spezialfall: tbluser.created_by verletzt Foreign Key Constraints
    try {
      // Zuerst prüfen, ob created_by überhaupt NULL-Werte enthält
      const nullValues = await executeQuery(
        `SELECT COUNT(*) as count FROM "tbluser" WHERE "created_by" IS NULL`
      );
      
      if (nullValues[0].count > 0) {
        // Statt zu löschen, setzen wir NULL-Werte auf einen Standard-Wert (1 = Admin)
        await executeQuery(
          `UPDATE "tbluser" SET "created_by" = 1 WHERE "created_by" IS NULL`
        );
        
        // Dann NOT NULL Constraint hinzufügen
        await executeQuery(
          `ALTER TABLE "tbluser" ALTER COLUMN "created_by" SET NOT NULL`
        );
        
        result.fixes_applied.push({
          table: 'tbluser',
          column: 'created_by',
          issue: 'Fremdschlüssel enthält NULL-Werte mit Foreign Key Constraints',
          fix: 'NULL-Werte auf Standard-Admin-Benutzer (ID 1) gesetzt und NOT NULL-Constraint hinzugefügt',
          result: 'Erfolgreich'
        });
      }
    } catch (error) {
      logger.error("Fehler beim Spezialfix für tbluser.created_by:", error);
      result.errors.push({
        table: 'tbluser',
        column: 'created_by',
        issue: 'Fremdschlüssel enthält NULL-Werte mit Foreign Key Constraints',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
  } catch (error) {
    logger.error("Fehler bei fixKnownSpecialCases:", error);
    result.errors.push({
      table: 'global',
      issue: 'Fehler beim Beheben bekannter Spezialfälle',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Prüft, ob eine Tabelle existiert
 */
async function doesTableExist(tableName: string): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    ) as exists
  `;
  
  const result = await executeQuery(query, [tableName]);
  return result[0].exists;
}

/**
 * Prüft, ob eine Tabelle einen Primärschlüssel hat
 */
async function hasTablePrimaryKey(tableName: string): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = $1
      AND constraint_type = 'PRIMARY KEY'
    ) as has_primary_key
  `;
  
  const result = await executeQuery(query, [tableName]);
  return result[0].has_primary_key;
}

/**
 * Behebt fehlende Primärschlüssel in Tabellen
 */
async function fixMissingPrimaryKeys(result: DbFixResult) {
  try {
    // Tabellen ohne Primärschlüssel identifizieren
    const tablesWithoutPK = await getTablesWithoutPrimaryKey();
    
    for (const table of tablesWithoutPK) {
      try {
        // Prüfen ob eine id-Spalte existiert
        const hasIdColumn = await columnExists(table, 'id');
        
        if (hasIdColumn) {
          // Id-Spalte ist bereits vorhanden, aber nicht als PK definiert
          // Prüfen, ob die Spalte bereits NOT NULL ist
          const isNullable = await isColumnNullable(table, 'id');
          
          if (isNullable) {
            // Zuerst NULL-Werte fixen, indem wir Default-Werte setzen
            await executeQuery(
              `UPDATE "${table}" SET id = nextval('${table}_id_seq') WHERE id IS NULL`
            );
            
            // Dann die Spalte als NOT NULL markieren
            await executeQuery(
              `ALTER TABLE "${table}" ALTER COLUMN id SET NOT NULL`
            );
            
            result.fixes_applied.push({
              table: table,
              column: 'id',
              issue: 'ID-Spalte erlaubt NULL-Werte',
              fix: 'NULL-Werte mit Sequenzwerten gefüllt und NOT NULL-Constraint hinzugefügt',
              result: 'Erfolgreich'
            });
          }
          
          // Primärschlüssel hinzufügen
          await executeQuery(
            `ALTER TABLE "${table}" ADD CONSTRAINT "${table}_pkey" PRIMARY KEY (id)`
          );
          
          result.fixes_applied.push({
            table: table,
            issue: 'Kein Primärschlüssel definiert',
            fix: 'Primärschlüssel auf id-Spalte hinzugefügt',
            result: 'Erfolgreich'
          });
        } else {
          // Keine id-Spalte vorhanden, wir müssen eine erstellen
          await executeQuery(
            `ALTER TABLE "${table}" ADD COLUMN id SERIAL PRIMARY KEY`
          );
          
          result.fixes_applied.push({
            table: table,
            issue: 'Keine id-Spalte und kein Primärschlüssel',
            fix: 'id-Spalte mit SERIAL und PRIMARY KEY hinzugefügt',
            result: 'Erfolgreich'
          });
        }
      } catch (error) {
        logger.error(`Fehler beim Beheben des Primärschlüssels für Tabelle ${table}:`, error);
        result.errors.push({
          table: table,
          issue: 'Kein Primärschlüssel definiert',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  } catch (error) {
    logger.error("Fehler bei fixMissingPrimaryKeys:", error);
    result.errors.push({
      table: 'global',
      issue: 'Fehler beim Beheben fehlender Primärschlüssel',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Behebt NULL-Werte in Fremdschlüsselspalten
 */
async function fixNullableForeignKeys(result: DbFixResult) {
  try {
    // Fremdschlüssel mit NULL-Werten identifizieren
    const nullableFKs = await getNullableForeignKeys();
    
    for (const fk of nullableFKs) {
      try {
        // Nur nicht-NULL Daten behalten
        await executeQuery(
          `DELETE FROM "${fk.table}" WHERE "${fk.column}" IS NULL`
        );
        
        // Spalte als NOT NULL markieren
        await executeQuery(
          `ALTER TABLE "${fk.table}" ALTER COLUMN "${fk.column}" SET NOT NULL`
        );
        
        result.fixes_applied.push({
          table: fk.table,
          column: fk.column,
          issue: 'Fremdschlüssel erlaubt NULL-Werte',
          fix: 'NULL-Werte gelöscht und NOT NULL-Constraint hinzugefügt',
          result: 'Erfolgreich'
        });
      } catch (error) {
        logger.error(`Fehler beim Beheben des Fremdschlüssels ${fk.column} in Tabelle ${fk.table}:`, error);
        result.errors.push({
          table: fk.table,
          column: fk.column,
          issue: 'Fremdschlüssel erlaubt NULL-Werte',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  } catch (error) {
    logger.error("Fehler bei fixNullableForeignKeys:", error);
    result.errors.push({
      table: 'global',
      issue: 'Fehler beim Beheben von NULL-Werten in Fremdschlüsseln',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Hilfsfunktionen
 */

// Gibt alle Tabellen ohne Primärschlüssel zurück
async function getTablesWithoutPrimaryKey(): Promise<string[]> {
  const query = `
    SELECT t.table_name
    FROM information_schema.tables t
    LEFT JOIN information_schema.table_constraints tc ON 
      tc.table_name = t.table_name AND 
      tc.constraint_type = 'PRIMARY KEY' AND
      tc.table_schema = t.table_schema
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND tc.constraint_name IS NULL
    ORDER BY t.table_name
  `;
  
  const result = await executeQuery(query);
  
  // Ergebnis in ein einfaches Array von Tabellennamen konvertieren
  return result.map(row => row.table_name);
}

// Gibt alle Fremdschlüssel zurück, die NULL-Werte erlauben
async function getNullableForeignKeys(): Promise<{ table: string, column: string }[]> {
  const query = `
    SELECT 
      tc.table_name, 
      kcu.column_name
    FROM 
      information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON
        tc.constraint_name = kcu.constraint_name AND
        tc.table_schema = kcu.table_schema
      JOIN information_schema.columns c ON
        c.table_name = tc.table_name AND
        c.column_name = kcu.column_name AND
        c.table_schema = tc.table_schema
    WHERE 
      tc.constraint_type = 'FOREIGN KEY' AND
      tc.table_schema = 'public' AND
      c.is_nullable = 'YES'
  `;
  
  const result = await executeQuery(query);
  
  // Ergebnis in Array mit table und column konvertieren
  return result.map(row => ({
    table: row.table_name,
    column: row.column_name
  }));
}

// Prüft, ob eine Spalte in einer Tabelle existiert
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const query = `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
    AND column_name = $2
  `;
  
  const result = await executeQuery(query, [tableName, columnName]);
  return result.length > 0;
}

// Prüft, ob eine Spalte NULL-Werte erlaubt
async function isColumnNullable(tableName: string, columnName: string): Promise<boolean> {
  const query = `
    SELECT is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
    AND column_name = $2
  `;
  
  const result = await executeQuery(query, [tableName, columnName]);
  return result.length > 0 && result[0].is_nullable === 'YES';
}