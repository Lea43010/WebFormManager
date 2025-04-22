/**
 * Skript zum Klonen einer Umgebung in eine andere
 * 
 * Verwendung:
 * npx tsx scripts/clone-environment.ts <source-environment> <target-environment>
 * 
 * Beispiel:
 * npx tsx scripts/clone-environment.ts development staging
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { 
  Environment, 
  cloneEnvironmentConfig 
} from '../config/environments';
import * as dotenv from 'dotenv';

// Überprüfen der Befehlszeilenargumente
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Verwendung: npx tsx scripts/clone-environment.ts <source-environment> <target-environment>');
  process.exit(1);
}

const sourceEnv = args[0] as Environment;
const targetEnv = args[1] as Environment;

// Überprüfen der Umgebungsnamen
const validEnvironments: Environment[] = ['development', 'staging', 'production'];
if (!validEnvironments.includes(sourceEnv) || !validEnvironments.includes(targetEnv)) {
  console.error('Ungültige Umgebung. Gültige Werte: development, staging, production');
  process.exit(1);
}

if (sourceEnv === targetEnv) {
  console.error('Quell- und Zielumgebung dürfen nicht identisch sein.');
  process.exit(1);
}

// Hauptfunktion zum Klonen der Umgebung
async function cloneEnvironment() {
  try {
    console.log(`🔄 Klonen der Umgebung von ${sourceEnv} nach ${targetEnv}...`);

    // 1. Umgebungsvariablen klonen
    console.log('📄 Umgebungsvariablen werden geklont...');
    const newConfig = cloneEnvironmentConfig(sourceEnv, targetEnv);
    console.log(`✅ Umgebungsvariablen wurden erfolgreich geklont: ${Object.keys(newConfig).length} Variablen`);

    // 2. Datenbank klonen (Wenn die Konfiguration eine Datenbank-URL enthält)
    if (process.env.DATABASE_URL) {
      await cloneDatabase();
    } else {
      console.warn('⚠️ Keine Datenbank-URL gefunden. Der Datenbankklonvorgang wird übersprungen.');
    }

    console.log(`\n✅ Klonen von ${sourceEnv} nach ${targetEnv} erfolgreich abgeschlossen!`);
    
    // Hinweise ausgeben
    if (targetEnv === 'production') {
      console.log('\n⚠️ WICHTIGER HINWEIS:');
      console.log('Sie haben in die Produktionsumgebung geklont. Bitte überprüfen Sie die Konfiguration,');
      console.log('insbesondere Sicherheitseinstellungen, bevor Sie die Anwendung starten.');
    }

    console.log('\nUm die neue Umgebung zu starten:');
    console.log(`NODE_ENV=${targetEnv} npm run ${targetEnv === 'production' ? 'start' : 'dev'}`);

  } catch (error) {
    console.error(`❌ Fehler beim Klonen der Umgebung: ${error.message}`);
    process.exit(1);
  }
}

// Hilfsfunktion zum Klonen der Datenbank
async function cloneDatabase() {
  try {
    console.log('🔄 Datenbank wird geklont...');
    
    // Die zu ladende Konfigurationsdatei bestimmen
    const sourceConfigPath = path.resolve(process.cwd(), `.env.${sourceEnv}`);
    const targetConfigPath = path.resolve(process.cwd(), `.env.${targetEnv}`);
    
    // Quell- und Zielumgebungsvariablen laden
    const sourceConfig = dotenv.parse(fs.readFileSync(sourceConfigPath));
    const targetConfig = dotenv.parse(fs.readFileSync(targetConfigPath));
    
    // Überprüfen, ob beide Umgebungen Datenbank-URLs haben
    if (!sourceConfig.DATABASE_URL || !targetConfig.DATABASE_URL) {
      throw new Error('Beide Umgebungen müssen eine DATABASE_URL-Variable haben.');
    }
    
    // Datenbankname aus der URL extrahieren (einige Vereinfachungen)
    const sourceDbUrl = new URL(sourceConfig.DATABASE_URL);
    const targetDbUrl = new URL(targetConfig.DATABASE_URL);
    
    console.log(`📦 Backup der Quelldatenbank wird erstellt...`);
    
    // Temporären Backup-Dateinamen generieren
    const backupFileName = `./backup/backup_${sourceEnv}_to_${targetEnv}_${Date.now()}.dump`;
    
    // Sicherstellen, dass das Backup-Verzeichnis existiert
    if (!fs.existsSync('./backup')) {
      fs.mkdirSync('./backup', { recursive: true });
    }
    
    // Backup der Quelldatenbank erstellen (mit pg_dump)
    // Dies ist ein vereinfachtes Beispiel und sollte für die tatsächliche Umgebung angepasst werden
    try {
      console.log(`🔄 Führe pg_dump für ${sourceEnv}-Datenbank aus...`);
      
      // Wir verwenden die Umgebungsvariablen der Quellumgebung
      const command = `PGPASSWORD="${sourceDbUrl.password}" pg_dump -h ${sourceDbUrl.hostname} -p ${sourceDbUrl.port || 5432} -U ${sourceDbUrl.username} -d ${sourceDbUrl.pathname.slice(1)} -f ${backupFileName} -F c`;
      
      execSync(command, { stdio: 'inherit' });
      console.log(`✅ Backup der Quelldatenbank wurde erstellt: ${backupFileName}`);
      
    } catch (error) {
      console.error(`❌ Fehler beim Erstellen des Datenbankbackups: ${error.message}`);
      console.log('⚠️ Datenbankklonvorgang übersprungen. Nur Umgebungsvariablen wurden geklont.');
      return;
    }
    
    // Wiederherstellung der Datenbank in der Zielumgebung
    try {
      console.log(`🔄 Stelle Backup in ${targetEnv}-Datenbank wieder her...`);
      
      // Wir verwenden die Umgebungsvariablen der Zielumgebung
      // Beachten Sie, dass wir zuerst die Zieldatenbank löschen und neu erstellen
      const dropCommand = `PGPASSWORD="${targetDbUrl.password}" dropdb -h ${targetDbUrl.hostname} -p ${targetDbUrl.port || 5432} -U ${targetDbUrl.username} ${targetDbUrl.pathname.slice(1)} --if-exists`;
      const createCommand = `PGPASSWORD="${targetDbUrl.password}" createdb -h ${targetDbUrl.hostname} -p ${targetDbUrl.port || 5432} -U ${targetDbUrl.username} ${targetDbUrl.pathname.slice(1)}`;
      const restoreCommand = `PGPASSWORD="${targetDbUrl.password}" pg_restore -h ${targetDbUrl.hostname} -p ${targetDbUrl.port || 5432} -U ${targetDbUrl.username} -d ${targetDbUrl.pathname.slice(1)} ${backupFileName} -c`;
      
      console.log('🗑️  Lösche Zieldatenbank, falls vorhanden...');
      execSync(dropCommand, { stdio: 'inherit' });
      
      console.log('🆕 Erstelle neue Zieldatenbank...');
      execSync(createCommand, { stdio: 'inherit' });
      
      console.log('📥 Stelle Backup in Zieldatenbank wieder her...');
      execSync(restoreCommand, { stdio: 'inherit' });
      
      console.log(`✅ Datenbank wurde erfolgreich von ${sourceEnv} nach ${targetEnv} geklont!`);
      
    } catch (error) {
      console.error(`❌ Fehler beim Wiederherstellen der Datenbank: ${error.message}`);
      console.log('⚠️ Die Zieldatenbank ist möglicherweise in einem inkonsistenten Zustand.');
    }
  } catch (error) {
    console.error(`❌ Fehler beim Datenbankklonen: ${error.message}`);
    throw error;
  }
}

// Skript ausführen
cloneEnvironment().catch(error => {
  console.error(`❌ Unbehandelter Fehler: ${error.message}`);
  process.exit(1);
});