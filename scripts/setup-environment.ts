/**
 * Dieses Skript richtet eine neue Umgebung ein (Development, Staging, Produktion).
 * 
 * Verwendung:
 * ts-node scripts/setup-environment.ts <environment>
 * 
 * Beispiele:
 * ts-node scripts/setup-environment.ts development
 * ts-node scripts/setup-environment.ts staging
 * ts-node scripts/setup-environment.ts production
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';
import { Environment } from '../config/environments';

// Pfade zu den .env-Dateien
const ENV_FILES: Record<Environment, string> = {
  development: '.env.development',
  staging: '.env.staging',
  production: '.env.production'
};

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

// Datenbank initialisieren
async function initializeDatabase(env: Environment): Promise<void> {
  const envFile = ENV_FILES[env];
  
  if (!fs.existsSync(envFile)) {
    throw new Error(`Umgebungsdatei ${envFile} nicht gefunden!`);
  }
  
  // Lade die Umgebungskonfiguration
  const envConfig = dotenv.parse(fs.readFileSync(envFile));
  const databaseUrl = envConfig.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error(`Keine DATABASE_URL in der Umgebung ${env} gefunden!`);
  }

  console.log(`\n⏳ Initialisiere Datenbank für ${env}-Umgebung...`);

  try {
    // Schema erstellen und Migrationen ausführen
    console.log('Wende Datenbankmigrationen an...');
    
    // Generiere aktualisiertes Drizzle-Schema
    await executeCommand('npm run db:generate');
    console.log('✅ Drizzle-Schema aktualisiert.');
    
    // Wende die Migrationen an
    await executeCommand('npm run db:push');
    console.log('✅ Datenbankmigrationen erfolgreich angewendet.');
    
    // Seed-Daten für Development und Staging
    if (env !== 'production') {
      await seedDatabaseWithTestData(env, databaseUrl);
    }
  } catch (error) {
    console.error(`❌ Fehler beim Initialisieren der Datenbank: ${error.message}`);
    throw error;
  }
}

// Seed-Daten in die Datenbank einfügen
async function seedDatabaseWithTestData(env: Environment, databaseUrl: string): Promise<void> {
  console.log(`\n⏳ Füge Seed-Daten für ${env}-Umgebung ein...`);

  try {
    if (env === 'development') {
      // Für Development ausführliche Test-Daten
      await executeCommand(`psql "${databaseUrl}" -f ./seeds/development_seed.sql`);
    } else if (env === 'staging') {
      // Für Staging minimale Test-Daten
      await executeCommand(`psql "${databaseUrl}" -f ./seeds/staging_seed.sql`);
    }
    console.log('✅ Seed-Daten erfolgreich eingefügt.');
  } catch (error) {
    console.error(`❌ Warnung: Konnte Seed-Daten nicht einfügen: ${error.message}`);
    console.log('Fahre ohne Seed-Daten fort...');
  }
}

// Umgebung initialisieren
async function setupEnvironment(env: Environment): Promise<void> {
  console.log(`\n🚀 Initialisiere ${env}-Umgebung...`);
  
  // Umgebungsspezifische Einstellungen
  const envSettings = {
    development: {
      description: 'Development-Umgebung für lokale Entwicklung',
      nodeEnv: 'development',
      apiEndpoint: 'http://localhost:3000',
      logLevel: 'debug'
    },
    staging: {
      description: 'Staging-Umgebung für Tests vor der Produktion',
      nodeEnv: 'staging',
      apiEndpoint: 'https://staging.app.example.com',
      logLevel: 'info'
    },
    production: {
      description: 'Produktions-Umgebung für Live-Betrieb',
      nodeEnv: 'production',
      apiEndpoint: 'https://app.example.com',
      logLevel: 'warn'
    }
  };
  
  const settings = envSettings[env];
  
  console.log(`\n📋 ${settings.description}`);
  console.log(`📌 API-Endpunkt: ${settings.apiEndpoint}`);
  console.log(`📌 Log-Level: ${settings.logLevel}`);
  
  // Datenbank initialisieren
  await initializeDatabase(env);
  
  console.log(`\n✅ Die ${env}-Umgebung wurde erfolgreich eingerichtet!`);
  console.log(`\n🚀 Um die Anwendung in der ${env}-Umgebung zu starten, führen Sie aus:`);
  console.log(`\n   NODE_ENV=${env} npm run dev`);
}

// Hauptfunktion
async function main() {
  try {
    // Überprüfe Befehlszeilenargumente
    const [,, targetEnv] = process.argv;
    
    if (!targetEnv) {
      console.error('❌ Fehler: Zielumgebung muss angegeben werden.');
      console.log('Verwendung: ts-node setup-environment.ts <environment>');
      console.log('Beispiel: ts-node setup-environment.ts development');
      process.exit(1);
    }
    
    // Überprüfe, ob die angegebene Umgebung gültig ist
    const validEnvs: Environment[] = ['development', 'staging', 'production'];
    
    if (!validEnvs.includes(targetEnv as Environment)) {
      console.error('❌ Fehler: Ungültige Umgebung. Gültige Werte: development, staging, production');
      process.exit(1);
    }
    
    // Bestätigung für Produktionsumgebung
    if (targetEnv === 'production') {
      await confirmAction(`
        ⚠️ WARNUNG: Sie sind dabei, die Produktionsumgebung zu initialisieren!
        Dies sollte nur in einer gesicherten Produktionsumgebung durchgeführt werden.
        
        Möchten Sie fortfahren? (ja/nein): 
      `);
    }
    
    // Umgebung einrichten
    await setupEnvironment(targetEnv as Environment);
    
  } catch (error) {
    console.error(`\n❌ Fehler beim Einrichten der Umgebung: ${error.message}`);
    process.exit(1);
  }
}

// Starte das Skript
main();