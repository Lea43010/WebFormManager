/**
 * Dieses Skript klont eine Umgebung (Entwicklung, Staging, Produktion) mit den entsprechenden Einstellungen.
 * 
 * Verwendung:
 * ts-node scripts/clone-environment.ts <source-env> <target-env>
 * 
 * Beispiele:
 * ts-node scripts/clone-environment.ts development staging  # Klone von Dev zu Staging
 * ts-node scripts/clone-environment.ts staging production   # Klone von Staging zu Produktion
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';
import { Environment, EnvironmentConfig } from '../config/environments';

// Pfade zu den .env-Dateien
const ENV_FILES: Record<Environment, string> = {
  development: '.env.development',
  staging: '.env.staging',
  production: '.env.production'
};

// PostgreSQL-Datenbank-Klonen
async function cloneDatabase(sourceEnv: Environment, targetEnv: Environment): Promise<void> {
  // Lade Umgebungsvariablen
  const sourceEnvFile = ENV_FILES[sourceEnv];
  const targetEnvFile = ENV_FILES[targetEnv];
  
  if (!fs.existsSync(sourceEnvFile)) {
    throw new Error(`Quell-Umgebungsdatei ${sourceEnvFile} nicht gefunden!`);
  }
  
  if (!fs.existsSync(targetEnvFile)) {
    throw new Error(`Ziel-Umgebungsdatei ${targetEnvFile} nicht gefunden!`);
  }
  
  // Lade Quell- und Ziel-Konfigurationen
  const sourceConfig = dotenv.parse(fs.readFileSync(sourceEnvFile));
  const targetConfig = dotenv.parse(fs.readFileSync(targetEnvFile));
  
  // Überprüfe, ob Datenbank-URLs vorhanden sind
  const sourceDatabaseUrl = sourceConfig.DATABASE_URL;
  const targetDatabaseUrl = targetConfig.DATABASE_URL;
  
  if (!sourceDatabaseUrl) {
    throw new Error(`Keine DATABASE_URL in der Quell-Umgebung ${sourceEnv} gefunden!`);
  }
  
  if (!targetDatabaseUrl) {
    throw new Error(`Keine DATABASE_URL in der Ziel-Umgebung ${targetEnv} gefunden!`);
  }

  // Bestätigung vom Benutzer einholen
  await confirmAction(`
    ⚠️ WARNUNG: Sie sind dabei, die ${targetEnv}-Datenbank zu überschreiben!
    Die ${sourceEnv}-Datenbank wird geklont und ersetzt die vorhandene ${targetEnv}-Datenbank.
    Dieser Vorgang kann nicht rückgängig gemacht werden.
    
    Möchten Sie fortfahren? (ja/nein): 
  `);

  console.log(`\n⏳ Klone Datenbank von ${sourceEnv} zu ${targetEnv}...`);

  try {
    // Dump der Quelldatenbank erstellen
    const dumpFile = `./dump_${sourceEnv}_to_${targetEnv}.sql`;
    await executeCommand(`pg_dump "${sourceDatabaseUrl}" > ${dumpFile}`);
    console.log(`✅ Datenbank-Dump in ${dumpFile} erstellt.`);

    // Zieldatenbank leeren und Dump importieren
    await executeCommand(`psql "${targetDatabaseUrl}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`);
    await executeCommand(`psql "${targetDatabaseUrl}" < ${dumpFile}`);
    console.log(`✅ Datenbank erfolgreich in ${targetEnv}-Umgebung importiert.`);

    // Dump-Datei löschen
    fs.unlinkSync(dumpFile);
    console.log(`✅ Temporäre Dump-Datei gelöscht.`);
  } catch (error) {
    console.error(`❌ Fehler beim Klonen der Datenbank: ${error.message}`);
    throw error;
  }
}

// Umgebungsvariablen-Datei aktualisieren
function updateEnvironmentFile(sourceEnv: Environment, targetEnv: Environment): void {
  const sourceEnvFile = ENV_FILES[sourceEnv];
  const targetEnvFile = ENV_FILES[targetEnv];
  
  console.log(`\n⏳ Aktualisiere Umgebungsvariablen in ${targetEnvFile}...`);
  
  try {
    // Variablen, die nicht übertragen werden sollen
    const excludedVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'SESSION_SECRET'
    ];
    
    // Lade die Umgebungsvariablen
    const sourceVars = dotenv.parse(fs.readFileSync(sourceEnvFile));
    const targetVars = dotenv.parse(fs.readFileSync(targetEnvFile));
    
    // Kombiniere die Variablen, aber behalte den NODE_ENV und DATABASE_URL des Ziels
    const updatedVars = { ...sourceVars, ...targetVars };
    
    // Stelle sicher, dass ausgeschlossene Variablen nicht überschrieben werden
    excludedVars.forEach(varName => {
      if (targetVars[varName]) {
        updatedVars[varName] = targetVars[varName];
      }
    });
    
    // NODE_ENV auf Zielumgebung setzen
    updatedVars.NODE_ENV = targetEnv;
    
    // Schreibe aktualisierte Variablen in Zieldatei
    const envContent = Object.entries(updatedVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(targetEnvFile, envContent);
    console.log(`✅ Umgebungsvariablen in ${targetEnvFile} aktualisiert.`);
  } catch (error) {
    console.error(`❌ Fehler beim Aktualisieren der Umgebungsvariablen: ${error.message}`);
    throw error;
  }
}

// Bestätigung vom Benutzer einholen
function confirmAction(message: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    rl.question(message, (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'ja' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        resolve();
      } else {
        reject(new Error('Vorgang vom Benutzer abgebrochen.'));
      }
    });
  });
}

// Befehl ausführen und auf Abschluss warten
function executeCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Befehl fehlgeschlagen: ${error.message}\n${stderr}`));
        return;
      }
      resolve(stdout);
    });
  });
}

// Hauptfunktion
async function main() {
  try {
    // Überprüfe Befehlszeilenargumente
    const [,, sourceEnv, targetEnv] = process.argv;
    
    if (!sourceEnv || !targetEnv) {
      console.error('❌ Fehler: Quell- und Zielumgebung müssen angegeben werden.');
      console.log('Verwendung: ts-node clone-environment.ts <source-env> <target-env>');
      console.log('Beispiel: ts-node clone-environment.ts development staging');
      process.exit(1);
    }
    
    // Überprüfe, ob die angegebenen Umgebungen gültig sind
    const validEnvs: Environment[] = ['development', 'staging', 'production'];
    
    if (!validEnvs.includes(sourceEnv as Environment) || !validEnvs.includes(targetEnv as Environment)) {
      console.error('❌ Fehler: Ungültige Umgebung. Gültige Werte: development, staging, production');
      process.exit(1);
    }
    
    if (sourceEnv === targetEnv) {
      console.error('❌ Fehler: Quell- und Zielumgebung dürfen nicht identisch sein.');
      process.exit(1);
    }
    
    console.log(`🚀 Starte Klonen der Umgebung von ${sourceEnv} zu ${targetEnv}...`);
    
    // Datenbank klonen
    await cloneDatabase(sourceEnv as Environment, targetEnv as Environment);
    
    // Umgebungsvariablen aktualisieren
    updateEnvironmentFile(sourceEnv as Environment, targetEnv as Environment);
    
    console.log(`\n✅ Umgebung erfolgreich von ${sourceEnv} zu ${targetEnv} geklont!`);
    console.log(`\n🚀 Die ${targetEnv}-Umgebung ist jetzt einsatzbereit.`);
    
  } catch (error) {
    console.error(`\n❌ Fehler beim Klonen der Umgebung: ${error.message}`);
    process.exit(1);
  }
}

// Starte das Skript
main();