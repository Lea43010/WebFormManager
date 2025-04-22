/**
 * Skript zum Testen der Umgebungsklonfunktion (ohne tatsächliche Datenbankmanipulation)
 * 
 * Verwendung:
 * npx tsx scripts/test-env-clone.ts <source-environment> <target-environment>
 * 
 * Beispiel:
 * npx tsx scripts/test-env-clone.ts development staging
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { 
  Environment, 
  ENV_CONFIG_FILES,
  PROTECTED_ENV_VARS,
  cloneEnvironmentConfig,
  loadEnvironmentConfig
} from '../config/environments';

// Farben für die Konsolenausgabe
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
};

// Überprüfen der Befehlszeilenargumente
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Verwendung: npx tsx scripts/test-env-clone.ts <source-environment> <target-environment>');
  process.exit(1);
}

const sourceEnv = args[0] as Environment;
const targetEnv = args[1] as Environment;

// Überprüfen der Umgebungsnamen
const validEnvironments: Environment[] = ['development', 'staging', 'production'];
if (!validEnvironments.includes(sourceEnv) || !validEnvironments.includes(targetEnv)) {
  console.error(`${colors.red}Ungültige Umgebung. Gültige Werte: development, staging, production${colors.reset}`);
  process.exit(1);
}

if (sourceEnv === targetEnv) {
  console.error(`${colors.red}Quell- und Zielumgebung dürfen nicht identisch sein.${colors.reset}`);
  process.exit(1);
}

/**
 * Simuliert den Klonvorgang ohne tatsächliche Änderungen vorzunehmen
 */
async function testCloneEnvironment() {
  console.log(`\n${colors.bright}Bau-Structura App - Umgebungsklontest${colors.reset}\n`);
  console.log(`${colors.bright}Source: ${colors.green}${sourceEnv}${colors.reset}`);
  console.log(`${colors.bright}Target: ${colors.yellow}${targetEnv}${colors.reset}\n`);
  
  // 1. Prüfen, ob die Umgebungskonfigurationen existieren
  const sourceConfigPath = path.resolve(process.cwd(), ENV_CONFIG_FILES[sourceEnv]);
  const targetConfigPath = path.resolve(process.cwd(), ENV_CONFIG_FILES[targetEnv]);
  
  const sourceExists = fs.existsSync(sourceConfigPath);
  const targetExists = fs.existsSync(targetConfigPath);
  
  console.log(`Quellkonfiguration: ${sourceExists ? `${colors.green}✓ Vorhanden${colors.reset}` : `${colors.red}✗ Nicht vorhanden${colors.reset}`}`);
  console.log(`Zielkonfiguration: ${targetExists ? `${colors.green}✓ Vorhanden${colors.reset}` : `${colors.yellow}⚠️ Nicht vorhanden (wird erstellt)${colors.reset}`}`);
  
  if (!sourceExists) {
    console.error(`\n${colors.red}Fehler: Die Quellkonfiguration ${ENV_CONFIG_FILES[sourceEnv]} existiert nicht.${colors.reset}`);
    console.log(`\nBitte erstellen Sie zuerst die Quellumgebung mit:`);
    console.log(`${colors.bright}./scripts/run-env-setup.sh ${sourceEnv}${colors.reset}\n`);
    process.exit(1);
  }
  
  console.log('\nSimuliere Umgebungsklonvorgang...');
  
  try {
    // 2. Konfigurationen laden
    const sourceConfig = loadEnvironmentConfig(sourceEnv);
    let targetConfig: Record<string, string> = {};
    
    if (targetExists) {
      targetConfig = loadEnvironmentConfig(targetEnv);
    } else {
      console.log(`${colors.yellow}Zielkonfiguration nicht vorhanden - würde erstellt werden${colors.reset}`);
    }
    
    // 3. Simulierte neue Konfiguration erstellen
    const newConfig: Record<string, string> = { ...sourceConfig };
    
    // 4. Schutzbedürftige Variablen aus der Zielumgebung beibehalten, falls vorhanden
    for (const protectedVar of PROTECTED_ENV_VARS) {
      if (targetConfig[protectedVar]) {
        newConfig[protectedVar] = targetConfig[protectedVar];
        console.log(`${colors.blue}→ Geschützte Variable beibehalten: ${protectedVar}${colors.reset}`);
      }
    }
    
    // 5. Umgebungsspezifische Änderungen
    newConfig['NODE_ENV'] = targetEnv;
    console.log(`${colors.blue}→ NODE_ENV auf ${targetEnv} gesetzt${colors.reset}`);
    
    // 6. Variablen im Test anzeigen
    console.log('\nFolgende Variablen würden übertragen werden:');
    
    const variablesToShow = [
      'NODE_ENV', 'PORT', 'HOST', 'LOG_LEVEL', 
      'EMAIL_DEV_MODE', 'TWO_FACTOR_ENABLED', 'BCRYPT_ROUNDS',
    ];
    
    const allVariables = Object.keys(newConfig).sort();
    
    console.log('\nWichtige Konfigurationsvariablen:');
    for (const key of variablesToShow) {
      if (newConfig[key]) {
        const sourceValue = sourceConfig[key] || 'nicht definiert';
        const targetValue = targetConfig[key] || 'nicht definiert';
        const newValue = newConfig[key];
        
        const changed = targetExists && targetValue !== newValue;
        const indicator = changed ? `${colors.yellow}≠${colors.reset}` : `${colors.green}=${colors.reset}`;
        
        console.log(`${colors.gray}${key}:${colors.reset} ${sourceValue} ${colors.blue}→${colors.reset} ${newValue} ${indicator} ${targetExists ? targetValue : '(neu)'}`);
      }
    }
    
    // 7. API-Schlüssel anzeigen
    const apiKeys = [
      'BREVO_API_KEY', 'OPENAI_API_KEY', 'DEEPAI_API_KEY', 
      'MAPBOX_ACCESS_TOKEN', 'STRIPE_SECRET_KEY'
    ];
    
    console.log('\nAPI-Schlüssel:');
    for (const key of apiKeys) {
      const sourceHasKey = !!sourceConfig[key];
      const targetHasKey = targetExists && !!targetConfig[key];
      const newHasKey = !!newConfig[key];
      
      const sourceStatus = sourceHasKey ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
      const targetStatus = targetHasKey ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
      const newStatus = newHasKey ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
      
      console.log(`${colors.gray}${key}:${colors.reset} ${sourceStatus} ${colors.blue}→${colors.reset} ${newStatus} ${targetExists ? `(war: ${targetStatus})` : '(neu)'}`);
    }
    
    // 8. Statistik anzeigen
    console.log('\nZusammenfassung:');
    const totalVars = Object.keys(newConfig).length;
    const protectedVarsCount = PROTECTED_ENV_VARS.filter(v => targetConfig[v]).length;
    
    console.log(`${colors.bright}Gesamtvariablen:${colors.reset} ${totalVars}`);
    console.log(`${colors.bright}Geschützte Variablen:${colors.reset} ${protectedVarsCount}`);
    console.log(`${colors.bright}Neue/aktualisierte Variablen:${colors.reset} ${totalVars - protectedVarsCount}`);
    
    // 9. Datenbankinformationen
    if (newConfig.DATABASE_URL) {
      console.log('\nDatenbank:');
      
      try {
        const dbUrl = new URL(newConfig.DATABASE_URL);
        console.log(`${colors.gray}Host:${colors.reset} ${dbUrl.hostname}`);
        console.log(`${colors.gray}Datenbank:${colors.reset} ${dbUrl.pathname.replace('/', '')}`);
        console.log(`${colors.gray}Benutzer:${colors.reset} ${dbUrl.username}`);
      } catch (error) {
        console.log(`${colors.gray}Datenbank-URL:${colors.reset} ${colors.red}Ungültiges Format${colors.reset}`);
      }
      
      console.log(`\n${colors.yellow}⚠️ Hinweis: Im tatsächlichen Klonvorgang würde die Datenbank ebenfalls geklont!${colors.reset}`);
    }
    
    console.log(`\n${colors.green}✓ Klontest erfolgreich! Der tatsächliche Klonvorgang kann mit folgendem Befehl durchgeführt werden:${colors.reset}`);
    console.log(`${colors.bright}./scripts/run-env-clone.sh ${sourceEnv} ${targetEnv}${colors.reset}\n`);
    
  } catch (error) {
    console.error(`\n${colors.red}Fehler beim Testen des Umgebungsklonvorgangs: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Skript ausführen
testCloneEnvironment().catch(error => {
  console.error(`${colors.red}Unbehandelter Fehler: ${error.message}${colors.reset}`);
  process.exit(1);
});