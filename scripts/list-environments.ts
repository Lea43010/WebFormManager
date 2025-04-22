/**
 * Skript zum Auflisten aller konfigurierten Umgebungen und ihrer Eigenschaften
 * 
 * Verwendung:
 * npx tsx scripts/list-environments.ts [details]
 * 
 * Mit dem optionalen Parameter "details" werden zusätzliche Informationen angezeigt
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { 
  Environment, 
  ENV_CONFIG_FILES,
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
};

// Überprüfen, ob detaillierte Informationen angezeigt werden sollen
const showDetails = process.argv.includes('details');

/**
 * Hauptfunktion zum Auflisten der Umgebungen
 */
async function listEnvironments() {
  console.log(`\n${colors.bright}Bau-Structura App - Konfigurierte Umgebungen${colors.reset}\n`);
  
  // Alle verfügbaren Umgebungen
  const environments: Environment[] = ['development', 'staging', 'production'];
  
  for (const env of environments) {
    const configFile = ENV_CONFIG_FILES[env];
    const exists = fs.existsSync(path.resolve(process.cwd(), configFile));
    
    // Farbe basierend auf Umgebung festlegen
    let color: string;
    let environmentLabel: string;
    switch (env) {
      case 'development':
        color = colors.green;
        environmentLabel = 'ENTWICKLUNG';
        break;
      case 'staging':
        color = colors.yellow;
        environmentLabel = 'STAGING';
        break;
      case 'production':
        color = colors.cyan;
        environmentLabel = 'PRODUKTION';
        break;
      default:
        color = colors.reset;
        environmentLabel = env.toUpperCase();
    }
    
    // Status der Umgebung anzeigen
    console.log(`${color}${colors.bright}${environmentLabel}${colors.reset}`);
    console.log(`${colors.gray}Konfigurationsdatei: ${configFile}${colors.reset}`);
    
    if (exists) {
      console.log(`Status: ${colors.green}✓ Konfiguriert${colors.reset}`);
      
      try {
        // Konfiguration laden
        const config = loadEnvironmentConfig(env);
        
        // Datenbank-Status prüfen
        if (config.DATABASE_URL) {
          console.log(`Datenbank: ${colors.green}✓ Konfiguriert${colors.reset}`);
          
          // Datenbank-Verbindung parsen
          try {
            const dbUrl = new URL(config.DATABASE_URL);
            console.log(`${colors.gray}Datenbank-Host: ${dbUrl.hostname}${colors.reset}`);
            console.log(`${colors.gray}Datenbank-Name: ${dbUrl.pathname.replace('/', '')}${colors.reset}`);
          } catch (error) {
            console.log(`${colors.gray}Datenbank-URL: Ungültiges Format${colors.reset}`);
          }
        } else {
          console.log(`Datenbank: ${colors.yellow}⚠️ Nicht konfiguriert${colors.reset}`);
        }
        
        // Wenn detaillierte Informationen angezeigt werden sollen
        if (showDetails) {
          console.log('\nKonfigurationsdetails:');
          
          // Wichtige Konfigurationsvariablen anzeigen
          const importantVars = [
            'NODE_ENV', 'PORT', 'HOST', 'LOG_LEVEL', 
            'EMAIL_DEV_MODE', 'TWO_FACTOR_ENABLED', 'BCRYPT_ROUNDS',
            'STRIPE_WEBHOOK_SECRET'
          ];
          
          for (const varName of importantVars) {
            if (config[varName]) {
              console.log(`${colors.gray}${varName}: ${config[varName]}${colors.reset}`);
            }
          }
          
          // API-Schlüssel prüfen und anzeigen (ohne Werte)
          const apiKeys = [
            'BREVO_API_KEY', 'OPENAI_API_KEY', 'DEEPAI_API_KEY', 
            'MAPBOX_ACCESS_TOKEN', 'STRIPE_SECRET_KEY'
          ];
          
          console.log('\nAPI-Schlüssel:');
          for (const key of apiKeys) {
            if (config[key]) {
              console.log(`${colors.gray}${key}: ${colors.green}✓ Konfiguriert${colors.reset}`);
            } else {
              console.log(`${colors.gray}${key}: ${colors.yellow}⚠️ Nicht konfiguriert${colors.reset}`);
            }
          }
        }
        
      } catch (error) {
        console.log(`Fehler beim Laden der Konfiguration: ${error.message}`);
      }
    } else {
      console.log(`Status: ${colors.yellow}⚠️ Nicht konfiguriert${colors.reset}`);
    }
    
    console.log('\n' + '-'.repeat(50) + '\n');
  }
  
  console.log('Befehle zur Umgebungsverwaltung:');
  console.log(`${colors.bright}./scripts/run-env-setup.sh <environment>${colors.reset} - Umgebung einrichten`);
  console.log(`${colors.bright}./scripts/run-env-clone.sh <source> <target>${colors.reset} - Umgebung klonen`);
  console.log(`${colors.bright}npx tsx scripts/list-environments.ts details${colors.reset} - Details anzeigen`);
  console.log('\n');
}

// Skript ausführen
listEnvironments().catch(error => {
  console.error(`Fehler: ${error.message}`);
  process.exit(1);
});