/**
 * Skript zum Einrichten einer neuen Umgebungskonfiguration
 * 
 * Verwendung:
 * npx tsx scripts/setup-environment.ts <environment> [--force]
 * 
 * Beispiel:
 * npx tsx scripts/setup-environment.ts development
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import {
  Environment,
  ENV_CONFIG_FILES,
  PROTECTED_ENV_VARS,
  createEnvironmentConfig,
  saveEnvironmentConfig,
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

// Readline-Interface für Benutzereingaben
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Überprüfen der Befehlszeilenargumente
const args = process.argv.slice(2);
const forceFlag = args.includes('--force');

// Die Argumente ohne Flags extrahieren
const envArgs = args.filter(arg => !arg.startsWith('--'));

if (envArgs.length !== 1) {
  console.error('Verwendung: npx tsx scripts/setup-environment.ts <environment> [--force]');
  process.exit(1);
}

const targetEnv = envArgs[0] as Environment;

// Überprüfen der Umgebungsnamen
const validEnvironments: Environment[] = ['development', 'staging', 'production'];
if (!validEnvironments.includes(targetEnv)) {
  console.error(`${colors.red}Ungültige Umgebung. Gültige Werte: development, staging, production${colors.reset}`);
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
 * Fragt den Benutzer nach einem Wert mit einer Vorgabe
 */
function promptUser(question: string, defaultValue: string = ''): Promise<string> {
  const defaultText = defaultValue ? ` (Standard: ${defaultValue})` : '';
  
  return new Promise((resolve) => {
    rl.question(`${question}${defaultText}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

/**
 * Fragt den Benutzer nach sensiblen Umgebungsvariablen
 */
async function promptForSensitiveVars(config: Record<string, string>): Promise<Record<string, string>> {
  const newConfig = { ...config };
  
  console.log(`\n${colors.bright}Bitte geben Sie die folgenden sensiblen Umgebungsvariablen ein:${colors.reset}`);
  console.log(`(Drücken Sie Enter, um einen Wert zu überspringen oder den Standardwert zu verwenden)\n`);
  
  // Datenbank-URL
  if (!newConfig.DATABASE_URL) {
    newConfig.DATABASE_URL = await promptUser(`${colors.bright}DATABASE_URL${colors.reset} (Postgres-Verbindungsstring)`, 'postgresql://user:password@localhost:5432/baustructura');
  }
  
  // SESSION_SECRET
  if (!newConfig.SESSION_SECRET) {
    newConfig.SESSION_SECRET = await promptUser(`${colors.bright}SESSION_SECRET${colors.reset}`, Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }
  
  // API-Schlüssel
  for (const key of ['BREVO_API_KEY', 'OPENAI_API_KEY', 'DEEPAI_API_KEY', 'MAPBOX_ACCESS_TOKEN', 'STRIPE_SECRET_KEY', 'VITE_STRIPE_PUBLIC_KEY']) {
    if (!newConfig[key]) {
      newConfig[key] = await promptUser(`${colors.bright}${key}${colors.reset}`);
    }
  }
  
  return newConfig;
}

/**
 * Richtet eine neue Umgebungskonfiguration ein
 */
async function setupEnvironment(): Promise<void> {
  console.log(`\n${colors.bright}Bau-Structura App - Umgebungs-Setup${colors.reset}\n`);
  console.log(`${colors.bright}Richte ${colors.green}${targetEnv}${colors.reset} ${colors.bright}Umgebung ein${colors.reset}\n`);
  
  // 1. Prüfen, ob die Zielumgebungskonfiguration bereits existiert
  const targetConfigPath = path.resolve(process.cwd(), ENV_CONFIG_FILES[targetEnv]);
  const targetExists = fs.existsSync(targetConfigPath);
  
  if (targetExists && !forceFlag) {
    console.log(`${colors.yellow}Die Konfiguration ${ENV_CONFIG_FILES[targetEnv]} existiert bereits.${colors.reset}`);
    console.log(`Um sie zu überschreiben, führen Sie den Befehl mit --force aus.`);
    console.log(`${colors.bright}./scripts/run-env-setup.sh ${targetEnv} --force${colors.reset}\n`);
    rl.close();
    process.exit(1);
  }
  
  // 2. Backup der Zielumgebungskonfiguration erstellen
  if (targetExists) {
    backupTargetConfig(targetEnv);
  }
  
  try {
    // 3. Neue Konfiguration erstellen oder bestehende laden
    let config: Record<string, string>;
    
    if (targetExists) {
      console.log(`Lade bestehende Konfiguration für ${targetEnv}...`);
      config = loadEnvironmentConfig(targetEnv);
    } else {
      console.log(`Erstelle neue Konfiguration für ${targetEnv}...`);
      config = createEnvironmentConfig(targetEnv);
    }
    
    // 4. Benutzer nach sensiblen Variablen fragen
    config = await promptForSensitiveVars(config);
    
    // 5. Konfiguration speichern
    saveEnvironmentConfig(targetEnv, config);
    console.log(`\n${colors.green}✓ Konfiguration erfolgreich in ${ENV_CONFIG_FILES[targetEnv]} gespeichert.${colors.reset}`);
    
    console.log(`\n${colors.bright}Die ${targetEnv}-Umgebung wurde erfolgreich eingerichtet.${colors.reset}`);
    console.log(`\nSie können die Anwendung jetzt in der ${targetEnv}-Umgebung starten mit:`);
    console.log(`${colors.bright}./scripts/env-tools.sh start ${targetEnv}${colors.reset}\n`);
    
    rl.close();
  } catch (error) {
    console.error(`\n${colors.red}Fehler beim Einrichten der Umgebung: ${error.message}${colors.reset}`);
    rl.close();
    process.exit(1);
  }
}

// Skript ausführen
setupEnvironment().catch(error => {
  console.error(`${colors.red}Unbehandelter Fehler: ${error.message}${colors.reset}`);
  rl.close();
  process.exit(1);
});