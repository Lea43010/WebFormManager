/**
 * Umgebungskonfigurationen für die Anwendung
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

export type Environment = 'development' | 'staging' | 'production';

// Umgebungsspezifische Konstanten
export const ENV_CONFIG_FILES: Record<Environment, string> = {
  development: '.env.development',
  staging: '.env.staging',
  production: '.env.production'
};

// Schutzbedürftige Umgebungsvariablen, die bei einem Klonen nicht überschrieben werden sollten
export const PROTECTED_ENV_VARS = [
  'NODE_ENV',
  'DATABASE_URL',
  'PORT',
  'HOST',
  'SESSION_SECRET',
  'STRIPE_WEBHOOK_SECRET'
];

/**
 * Lädt eine spezifische Umgebungskonfigurationsdatei
 * @param env Die zu ladende Umgebung
 * @returns Ein Objekt mit allen Umgebungsvariablen aus der Konfigurationsdatei
 */
export function loadEnvironmentConfig(env: Environment): Record<string, string> {
  const envFilePath = path.resolve(process.cwd(), ENV_CONFIG_FILES[env]);
  
  // Prüfen, ob die Datei existiert
  if (!fs.existsSync(envFilePath)) {
    throw new Error(`Umgebungskonfigurationsdatei nicht gefunden: ${envFilePath}`);
  }
  
  // Datei parsen
  const envConfig = dotenv.parse(fs.readFileSync(envFilePath));
  return envConfig;
}

/**
 * Speichert die Umgebungskonfiguration in der entsprechenden Datei
 * @param env Die Zielumgebung
 * @param config Die Konfigurationsvariablen als Schlüssel-Wert-Paare
 */
export function saveEnvironmentConfig(env: Environment, config: Record<string, string>): void {
  const envFilePath = path.resolve(process.cwd(), ENV_CONFIG_FILES[env]);
  
  // Konfiguration in eine String-Darstellung umwandeln
  let envContent = '';
  for (const [key, value] of Object.entries(config)) {
    envContent += `${key}=${value}\n`;
  }
  
  // In Datei schreiben
  fs.writeFileSync(envFilePath, envContent);
}

/**
 * Erstellt eine neue Umgebungskonfigurationsdatei, wenn diese noch nicht existiert
 * @param env Die zu erstellende Umgebung
 */
export function createEnvironmentFileIfNotExists(env: Environment): void {
  const envFilePath = path.resolve(process.cwd(), ENV_CONFIG_FILES[env]);
  
  if (!fs.existsSync(envFilePath)) {
    // Template für neue Umgebungen erstellen
    let template = '';
    
    if (env === 'development') {
      template = `
# Entwicklungsumgebung Konfiguration
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
# Fügen Sie hier weitere Umgebungsvariablen hinzu
`;
    } else if (env === 'staging') {
      template = `
# Staging-Umgebung Konfiguration
NODE_ENV=staging
PORT=5000
HOST=0.0.0.0
# Fügen Sie hier weitere Umgebungsvariablen hinzu
`;
    } else if (env === 'production') {
      template = `
# Produktionsumgebung Konfiguration
NODE_ENV=production
PORT=80
HOST=0.0.0.0
# Fügen Sie hier weitere Umgebungsvariablen hinzu
`;
    }
    
    fs.writeFileSync(envFilePath, template.trim());
    console.log(`Neue Umgebungskonfigurationsdatei erstellt: ${envFilePath}`);
  }
}

/**
 * Klont die Konfiguration von einer Umgebung zu einer anderen
 * Dabei werden schutzbedürftige Variablen der Zielumgebung beibehalten
 * @param sourceEnv Quellumgebung 
 * @param targetEnv Zielumgebung
 * @returns Ein Objekt mit der neuen Zielkonfiguration
 */
export function cloneEnvironmentConfig(sourceEnv: Environment, targetEnv: Environment): Record<string, string> {
  // Beide Konfigurationen laden
  const sourceConfig = loadEnvironmentConfig(sourceEnv);
  let targetConfig: Record<string, string> = {};
  
  try {
    // Wenn die Zielkonfiguration existiert, wird sie geladen
    targetConfig = loadEnvironmentConfig(targetEnv);
  } catch (error) {
    // Falls die Zielkonfiguration nicht existiert, wird eine neue erstellt
    createEnvironmentFileIfNotExists(targetEnv);
    targetConfig = loadEnvironmentConfig(targetEnv);
  }
  
  // Neue Konfiguration erstellen, schutzbedürftige Variablen der Zielumgebung beibehalten
  const newConfig: Record<string, string> = { ...sourceConfig };
  
  // Schutzbedürftige Variablen aus der Zielumgebung beibehalten, falls vorhanden
  for (const protectedVar of PROTECTED_ENV_VARS) {
    if (targetConfig[protectedVar]) {
      newConfig[protectedVar] = targetConfig[protectedVar];
    }
  }
  
  // Sicherstellen, dass NODE_ENV korrekt gesetzt ist
  newConfig['NODE_ENV'] = targetEnv;
  
  // Neue Konfiguration speichern und zurückgeben
  saveEnvironmentConfig(targetEnv, newConfig);
  return newConfig;
}

/**
 * Aktualisiert eine einzelne Umgebungsvariable in einer Umgebung
 * @param env Die Zielumgebung
 * @param key Der Schlüssel der Umgebungsvariable
 * @param value Der neue Wert
 */
export function updateEnvironmentVariable(env: Environment, key: string, value: string): void {
  const config = loadEnvironmentConfig(env);
  config[key] = value;
  saveEnvironmentConfig(env, config);
}