/**
 * Skript zum Klonen einer Umgebungskonfiguration in eine andere
 * 
 * Verwendung:
 * npx tsx scripts/clone-environment.ts <source-environment> <target-environment> [--force]
 * 
 * Beispiel:
 * npx tsx scripts/clone-environment.ts development staging
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  Environment,
  ENV_CONFIG_FILES,
  PROTECTED_ENV_VARS,
  cloneEnvironmentConfig,
  saveEnvironmentConfig
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
const forceFlag = args.includes('--force');

// Die Argumente ohne Flags extrahieren
const envArgs = args.filter(arg => !arg.startsWith('--'));

if (envArgs.length !== 2) {
  console.error('Verwendung: npx tsx scripts/clone-environment.ts <source-environment> <target-environment> [--force]');
  process.exit(1);
}

const sourceEnv = envArgs[0] as Environment;
const targetEnv = envArgs[1] as Environment;

// Überprüfen der Umgebungsnamen
const validEnvironments: Environment[] = ['development', 'staging', 'production'];
if (!validEnvironments.includes(sourceEnv) || !validEnvironments.includes(targetEnv)) {
  console.error(`${colors.red}Ungültige Umgebung. Gültige Werte: development, staging, production${colors.reset}`);
  process.exit(1);
}

if (sourceEnv === targetEnv) {
  console.error(`${colors.red}Fehler: Quell- und Zielumgebung dürfen nicht identisch sein.${colors.reset}`);
  process.exit(1);
}

/**
 * Erstellt ein Backup der Zielumgebungskonfiguration
 */
function backupTargetConfig(targetEnv: Environment): void {
  const targetConfigPath = path.resolve(process.cwd(), ENV_CONFIG_FILES[targetEnv]);
  
  if (fs.existsSync(targetConfigPath)) {
    const backupPath = `${targetConfigPath}.backup`;
    fs.copyFileSync(targetConfigPath, backupPath);
    console.log(`${colors.blue}Backup der Zielkonfiguration erstellt: ${backupPath}${colors.reset}`);
  }
}

/**
 * Klont eine Umgebung in eine andere
 */
async function cloneEnvironment(): Promise<void> {
  console.log(`\n${colors.bright}Bau-Structura App - Umgebungskloner${colors.reset}\n`);
  console.log(`${colors.bright}Klone von ${colors.green}${sourceEnv}${colors.reset} ${colors.bright}nach ${colors.yellow}${targetEnv}${colors.reset}\n`);
  
  // 1. Prüfen, ob die Quellumgebungskonfiguration existiert
  const sourceConfigPath = path.resolve(process.cwd(), ENV_CONFIG_FILES[sourceEnv]);
  const targetConfigPath = path.resolve(process.cwd(), ENV_CONFIG_FILES[targetEnv]);
  
  if (!fs.existsSync(sourceConfigPath)) {
    console.error(`${colors.red}Fehler: Die Quellkonfiguration ${ENV_CONFIG_FILES[sourceEnv]} existiert nicht.${colors.reset}`);
    console.log(`\nBitte erstellen Sie zuerst die Quellumgebung mit:`);
    console.log(`${colors.bright}./scripts/run-env-setup.sh ${sourceEnv}${colors.reset}\n`);
    process.exit(1);
  }
  
  // 2. Prüfen, ob die Zielumgebungskonfiguration bereits existiert
  const targetExists = fs.existsSync(targetConfigPath);
  
  if (targetExists && !forceFlag) {
    console.log(`${colors.yellow}Die Zielkonfiguration ${ENV_CONFIG_FILES[targetEnv]} existiert bereits.${colors.reset}`);
    console.log(`Um sie zu überschreiben, führen Sie den Befehl mit --force aus.`);
    console.log(`${colors.bright}./scripts/run-env-clone.sh ${sourceEnv} ${targetEnv} --force${colors.reset}\n`);
    process.exit(1);
  }
  
  // 3. Backup der Zielumgebungskonfiguration erstellen
  if (targetExists) {
    backupTargetConfig(targetEnv);
  }
  
  try {
    // 4. Konfiguration klonen
    console.log(`Klone Konfiguration...`);
    const newConfig = cloneEnvironmentConfig(sourceEnv, targetEnv);
    
    // 5. Konfiguration speichern
    saveEnvironmentConfig(targetEnv, newConfig);
    console.log(`${colors.green}✓ Konfiguration erfolgreich geklont und in ${ENV_CONFIG_FILES[targetEnv]} gespeichert.${colors.reset}`);
    
    // 6. Datenbank klonen (optional)
    if (targetExists && newConfig.DATABASE_URL) {
      console.log(`\n${colors.yellow}⚠️ Datenbank-Klonen ist ein optionaler Schritt, der derzeit nicht automatisch ausgeführt wird.${colors.reset}`);
      console.log(`${colors.yellow}⚠️ Für ein vollständiges Umgebungsklonen müssen Sie die Datenbank manuell klonen.${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}Die ${targetEnv}-Umgebung wurde erfolgreich aus ${sourceEnv} geklont.${colors.reset}`);
    console.log(`\nSie können die Anwendung jetzt in der ${targetEnv}-Umgebung starten mit:`);
    console.log(`${colors.bright}./scripts/env-tools.sh start ${targetEnv}${colors.reset}\n`);
    
  } catch (error) {
    console.error(`\n${colors.red}Fehler beim Klonen der Umgebung: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Skript ausführen
cloneEnvironment().catch(error => {
  console.error(`${colors.red}Unbehandelter Fehler: ${error.message}${colors.reset}`);
  process.exit(1);
});