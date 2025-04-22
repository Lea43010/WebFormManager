/**
 * Skript zum Einrichten einer Umgebung
 * 
 * Verwendung:
 * npx tsx scripts/setup-environment.ts <environment>
 * 
 * Beispiel:
 * npx tsx scripts/setup-environment.ts development
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { 
  Environment, 
  ENV_CONFIG_FILES,
  createEnvironmentFileIfNotExists,
  loadEnvironmentConfig,
  updateEnvironmentVariable
} from '../config/environments';
import * as dotenv from 'dotenv';

// Überprüfen der Befehlszeilenargumente
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Verwendung: npx tsx scripts/setup-environment.ts <environment>');
  process.exit(1);
}

const env = args[0] as Environment;

// Überprüfen des Umgebungsnamens
const validEnvironments: Environment[] = ['development', 'staging', 'production'];
if (!validEnvironments.includes(env)) {
  console.error('Ungültige Umgebung. Gültige Werte: development, staging, production');
  process.exit(1);
}

// Hauptfunktion zum Einrichten der Umgebung
async function setupEnvironment() {
  try {
    console.log(`🛠️  Einrichten der Umgebung "${env}"...`);
    
    // 1. Umgebungskonfigurationsdatei erstellen/überprüfen
    createEnvironmentFileIfNotExists(env);
    console.log(`✅ Umgebungskonfigurationsdatei überprüft: ${ENV_CONFIG_FILES[env]}`);
    
    // Konfiguration laden
    const config = loadEnvironmentConfig(env);
    
    // 2. NODE_ENV setzen
    updateEnvironmentVariable(env, 'NODE_ENV', env);
    console.log(`✅ NODE_ENV auf "${env}" gesetzt`);
    
    // 3. Überprüfen, ob eine Datenbank-URL vorhanden ist
    if (!config.DATABASE_URL) {
      console.warn('⚠️ Keine Datenbank-URL gefunden. Bitte fügen Sie eine DATABASE_URL zur Umgebungskonfiguration hinzu.');
    } else {
      // Datenbankverbindung testen
      await testDatabaseConnection(config.DATABASE_URL);
      
      // 4. Datenbank-Schema initialisieren
      console.log('🔄 Datenbank-Schema wird initialisiert...');
      
      try {
        // Drizzle verwenden, um das Schema zu aktualisieren
        console.log('🔄 Führe Drizzle-Schema-Push aus...');
        
        // Wir verwenden NODE_ENV, um sicherzustellen, dass die richtige Konfiguration verwendet wird
        execSync(`NODE_ENV=${env} npm run db:push`, { stdio: 'inherit' });
        console.log('✅ Datenbank-Schema wurde erfolgreich initialisiert!');
        
        // 5. Seed-Daten laden (nur für Development und Staging)
        if (env !== 'production') {
          await seedDatabase();
        }
        
      } catch (error) {
        console.error(`❌ Fehler beim Initialisieren des Datenbank-Schemas: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Umgebung "${env}" wurde erfolgreich eingerichtet!`);
    
    // Hinweise ausgeben
    console.log('\nUm die Umgebung zu starten:');
    console.log(`NODE_ENV=${env} npm run ${env === 'production' ? 'start' : 'dev'}`);
    
  } catch (error) {
    console.error(`❌ Fehler beim Einrichten der Umgebung: ${error.message}`);
    process.exit(1);
  }
}

// Datenbankverbindung testen
async function testDatabaseConnection(dbUrl: string) {
  try {
    console.log('🔄 Datenbankverbindung wird getestet...');
    
    // Einfachen Test mit pg-Client durchführen
    // In einer realen Anwendung würden wir hier den vorhandenen Datenbankpool verwenden
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: dbUrl });
    
    // Verbindung testen
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    client.release();
    
    // Verbindung schließen
    await pool.end();
    
    console.log(`✅ Datenbankverbindung erfolgreich getestet. Datenbankversion: ${result.rows[0].version.split(' ')[0]}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Fehler beim Testen der Datenbankverbindung: ${error.message}`);
    throw error;
  }
}

// Seed-Daten in die Datenbank laden
async function seedDatabase() {
  try {
    console.log('🔄 Seed-Daten werden geladen...');
    
    // Überprüfen, ob Seed-Skripte existieren
    const seedsDir = path.resolve(process.cwd(), 'seeds');
    if (!fs.existsSync(seedsDir)) {
      console.warn('⚠️ Kein Seeds-Verzeichnis gefunden. Seeds werden übersprungen.');
      return;
    }
    
    // Alle .ts-Dateien im Seeds-Verzeichnis ausführen
    const seedFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.ts'))
      .sort(); // Sortieren, um Reihenfolge sicherzustellen
    
    if (seedFiles.length === 0) {
      console.warn('⚠️ Keine Seed-Dateien gefunden. Seeds werden übersprungen.');
      return;
    }
    
    for (const seedFile of seedFiles) {
      const seedPath = path.join(seedsDir, seedFile);
      console.log(`🌱 Führe Seed aus: ${seedFile}...`);
      
      try {
        // We're using npx tsx here to run the seed file directly
        execSync(`NODE_ENV=${env} npx tsx ${seedPath}`, { stdio: 'inherit' });
        console.log(`✅ Seed ${seedFile} erfolgreich ausgeführt`);
      } catch (error) {
        console.error(`❌ Fehler beim Ausführen des Seeds ${seedFile}: ${error.message}`);
        // Wenn ein Seed fehlschlägt, fahren wir trotzdem fort
      }
    }
    
    console.log('✅ Alle Seed-Daten wurden erfolgreich geladen!');
    
  } catch (error) {
    console.error(`❌ Fehler beim Laden der Seed-Daten: ${error.message}`);
    throw error;
  }
}

// Skript ausführen
setupEnvironment().catch(error => {
  console.error(`❌ Unbehandelter Fehler: ${error.message}`);
  process.exit(1);
});