import { fixDatabaseStructureIssues } from './db-structure-fix';
import logger from './logger';

/**
 * Dieses Skript führt die Datenbankstruktur-Reparaturen direkt aus, ohne auf Express-Routes angewiesen zu sein.
 * Es kann über die Kommandozeile mit `npx tsx server/run-db-fixes.ts` ausgeführt werden.
 */
async function main() {
  logger.info("Starte Datenbankstruktur-Reparatur Prozess...");
  
  try {
    const result = await fixDatabaseStructureIssues();
    
    if (result.success) {
      logger.info(`Datenbankstruktur-Reparatur erfolgreich. ${result.fixes_applied.length} Fixes wurden angewendet.`);
      
      // Details der angewendeten Fixes ausgeben
      if (result.fixes_applied.length > 0) {
        logger.info("Angewendete Fixes:");
        result.fixes_applied.forEach((fix, index) => {
          logger.info(`${index + 1}. Tabelle: ${fix.table}${fix.column ? `, Spalte: ${fix.column}` : ''}`);
          logger.info(`   Problem: ${fix.issue}`);
          logger.info(`   Fix: ${fix.fix}`);
          logger.info(`   Ergebnis: ${fix.result}`);
          logger.info("---");
        });
      }
    } else {
      logger.error(`Datenbankstruktur-Reparatur mit Fehlern beendet. ${result.errors.length} Fehler aufgetreten.`);
      
      // Details der Fehler ausgeben
      if (result.errors.length > 0) {
        logger.error("Aufgetretene Fehler:");
        result.errors.forEach((error, index) => {
          logger.error(`${index + 1}. Tabelle: ${error.table}${error.column ? `, Spalte: ${error.column}` : ''}`);
          logger.error(`   Problem: ${error.issue}`);
          logger.error(`   Fehler: ${error.error}`);
          logger.error("---");
        });
      }
    }
    
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    logger.error("Fehler bei der Ausführung der Datenbankstruktur-Reparatur:", error);
  } finally {
    // Nach 2 Sekunden beenden, um sicherzustellen, dass alle Logs geschrieben wurden
    setTimeout(() => process.exit(), 2000);
  }
}

// Führe das Skript aus
main().catch(error => {
  logger.error("Unerwarteter Fehler im Hauptprogramm:", error);
  process.exit(1);
});