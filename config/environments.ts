/**
 * Konfigurationsmodul für die verschiedenen Umgebungen der Bau-Structura App
 * 
 * Dieses Modul stellt Funktionen und Konstanten für die Verwaltung verschiedener
 * Deployment-Umgebungen (development, staging, production) bereit.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Verfügbare Umgebungen
export type Environment = 'development' | 'staging' | 'production';

// Zuordnung der Umgebungskonfigurationsdateien
export const ENV_CONFIG_FILES: Record<Environment, string> = {
  development: '.env.development',
  staging: '.env.staging',
  production: '.env.production'
};

// Standardwerte für fehlende Umgebungsvariablen
export const ENV_DEFAULTS: Record<string, string> = {
  PORT: '5000',
  HOST: '0.0.0.0',
  LOG_LEVEL: 'info',
  BCRYPT_ROUNDS: '10',
  TWO_FACTOR_ENABLED: 'false',
  EMAIL_DEV_MODE: 'true',
  RATE_LIMIT_LOGIN: '20',
  RATE_LIMIT_API: '300',
  RATE_LIMIT_HEALTH: '300',
  APP_URL: 'http://localhost:5000'
};

// Umgebungsvariablen, die beim Klonen geschützt werden sollen (nicht überschrieben)
export const PROTECTED_ENV_VARS = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'STRIPE_SECRET_KEY',
  'VITE_STRIPE_PUBLIC_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'BREVO_API_KEY',
  'OPENAI_API_KEY',
  'DEEPAI_API_KEY',
  'MAPBOX_ACCESS_TOKEN'
];

// Umgebungsspezifische Standardwerte
export const ENV_SPECIFIC_DEFAULTS: Record<Environment, Record<string, string>> = {
  development: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    EMAIL_FROM: 'dev@baustructura.de',
    EMAIL_FROM_NAME: 'BauStructura (DEV)',
    EMAIL_DEV_MODE: 'true',
    APP_URL: 'http://localhost:5000'
  },
  staging: {
    NODE_ENV: 'staging',
    LOG_LEVEL: 'info',
    EMAIL_FROM: 'staging@baustructura.de',
    EMAIL_FROM_NAME: 'BauStructura (STAGING)',
    EMAIL_DEV_MODE: 'true',
    BCRYPT_ROUNDS: '11',
    APP_URL: 'https://staging.baustructuraapp.de'
  },
  production: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'warn',
    EMAIL_FROM: 'info@baustructura.de',
    EMAIL_FROM_NAME: 'BauStructura',
    EMAIL_DEV_MODE: 'false',
    BCRYPT_ROUNDS: '12',
    TWO_FACTOR_ENABLED: 'true',
    RATE_LIMIT_LOGIN: '5',
    RATE_LIMIT_API: '150',
    RATE_LIMIT_HEALTH: '30',
    APP_URL: 'https://baustructuraapp.de'
  }
};

/**
 * Lädt die Konfiguration für die angegebene Umgebung
 * 
 * @param env Die Umgebung (development, staging, production)
 * @returns Die geladene Konfiguration als Objekt
 */
export function loadEnvironmentConfig(env: Environment): Record<string, string> {
  const configPath = path.resolve(process.cwd(), ENV_CONFIG_FILES[env]);
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Umgebungskonfiguration ${ENV_CONFIG_FILES[env]} nicht gefunden`);
  }
  
  const envConfig = dotenv.parse(fs.readFileSync(configPath));
  return envConfig;
}

/**
 * Speichert die Umgebungskonfiguration in die entsprechende .env-Datei
 * 
 * @param env Die Zielumgebung
 * @param config Die zu speichernde Konfiguration
 */
export function saveEnvironmentConfig(env: Environment, config: Record<string, string>): void {
  const configPath = path.resolve(process.cwd(), ENV_CONFIG_FILES[env]);
  
  // Konfiguration als .env-Datei formatieren
  const envFileContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(configPath, envFileContent, 'utf8');
}

/**
 * Erstellt eine neue Umgebungskonfiguration mit Standardwerten
 * 
 * @param env Die zu erstellende Umgebung
 * @returns Die erstellte Konfiguration
 */
export function createEnvironmentConfig(env: Environment): Record<string, string> {
  const config: Record<string, string> = { ...ENV_DEFAULTS };
  
  // Umgebungsspezifische Defaults hinzufügen
  Object.entries(ENV_SPECIFIC_DEFAULTS[env]).forEach(([key, value]) => {
    config[key] = value;
  });
  
  return config;
}

/**
 * Aktualisiert eine bestehende Umgebungskonfiguration mit neuen Werten
 * 
 * @param env Die zu aktualisierende Umgebung
 * @param newValues Die neuen Konfigurationswerte
 * @returns Die aktualisierte Konfiguration
 */
export function updateEnvironmentConfig(
  env: Environment, 
  newValues: Record<string, string>
): Record<string, string> {
  let config: Record<string, string>;
  
  try {
    config = loadEnvironmentConfig(env);
  } catch (error) {
    config = createEnvironmentConfig(env);
  }
  
  // Neue Werte übernehmen
  Object.entries(newValues).forEach(([key, value]) => {
    config[key] = value;
  });
  
  return config;
}

/**
 * Klont eine Umgebungskonfiguration in eine andere
 * 
 * @param sourceEnv Die Quellumgebung
 * @param targetEnv Die Zielumgebung
 * @param overwriteProtected Ob geschützte Variablen überschrieben werden sollen
 * @returns Die geklonte Konfiguration
 */
export function cloneEnvironmentConfig(
  sourceEnv: Environment, 
  targetEnv: Environment,
  overwriteProtected: boolean = false
): Record<string, string> {
  // Quellkonfiguration laden
  const sourceConfig = loadEnvironmentConfig(sourceEnv);
  
  // Zielkonfiguration laden (falls vorhanden)
  let targetConfig: Record<string, string> = {};
  try {
    targetConfig = loadEnvironmentConfig(targetEnv);
  } catch (error) {
    // Keine bestehende Zielkonfiguration gefunden, wird neu erstellt
  }
  
  // Neue Konfiguration erstellen
  const newConfig: Record<string, string> = { ...sourceConfig };
  
  // Geschützte Variablen aus der Zielumgebung beibehalten, falls vorhanden
  if (!overwriteProtected) {
    for (const protectedVar of PROTECTED_ENV_VARS) {
      if (targetConfig[protectedVar]) {
        newConfig[protectedVar] = targetConfig[protectedVar];
      }
    }
  }
  
  // Umgebungsspezifische Änderungen
  newConfig['NODE_ENV'] = targetEnv;
  
  // Spezifische Standardwerte für die Zielumgebung anwenden
  Object.entries(ENV_SPECIFIC_DEFAULTS[targetEnv]).forEach(([key, value]) => {
    newConfig[key] = value;
  });
  
  return newConfig;
}

/**
 * Aktueller Umgebungsname basierend auf NODE_ENV
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV as string;
  
  if (env === 'development' || env === 'staging' || env === 'production') {
    return env as Environment;
  }
  
  return 'development'; // Fallback
}

/**
 * Gibt die Farbe für eine bestimmte Umgebung zurück (für Console-Logs)
 */
export function getEnvironmentColor(env: Environment): string {
  switch (env) {
    case 'development':
      return '\x1b[36m'; // Cyan
    case 'staging':
      return '\x1b[33m'; // Gelb
    case 'production':
      return '\x1b[31m'; // Rot
    default:
      return '\x1b[0m'; // Reset
  }
}

/**
 * Gibt Informationen über die aktuelle Umgebung in die Konsole aus
 */
export function logEnvironmentInfo(): void {
  const env = getCurrentEnvironment();
  const color = getEnvironmentColor(env);
  const reset = '\x1b[0m';
  
  console.log(`[DB] Umgebung: ${color}${env.toUpperCase()}${reset}`);
}