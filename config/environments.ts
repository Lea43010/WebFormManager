// Umgebungskonfigurationen für Development, Staging und Production
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Umgebungstypen
export type Environment = 'development' | 'staging' | 'production';

// Umgebungskonfiguration Interface
export interface EnvironmentConfig {
  name: Environment;
  databaseUrl: string;
  apiBaseUrl: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableCache: boolean;
  enableAnalytics: boolean;
  sessionSecret: string;
  corsOrigins: string[];
  port: number;
  assetsCDN?: string;
}

// Lade Umgebungsspezifische .env-Datei, falls vorhanden
function loadEnvFile(environment: Environment): void {
  const envFile = `.env.${environment}`;
  
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    console.log(`Umgebungsvariablen aus ${envFile} geladen.`);
  } else {
    // Fallback zur Standard-.env-Datei
    dotenv.config();
    console.log('Standard .env-Datei geladen (spezifische Umgebungsdatei nicht gefunden).');
  }
}

// Basis-Konfiguration für alle Umgebungen
const baseConfig: Partial<EnvironmentConfig> = {
  port: parseInt(process.env.PORT || '3000', 10),
  sessionSecret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
  logLevel: 'info',
};

// Development-Umgebungskonfiguration
const developmentConfig: EnvironmentConfig = {
  ...baseConfig as EnvironmentConfig,
  name: 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/app_development',
  apiBaseUrl: 'http://localhost:3000',
  logLevel: 'debug',
  enableCache: false,
  enableAnalytics: false,
  corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
  port: parseInt(process.env.PORT || '3000', 10),
};

// Staging-Umgebungskonfiguration
const stagingConfig: EnvironmentConfig = {
  ...baseConfig as EnvironmentConfig,
  name: 'staging',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/app_staging',
  apiBaseUrl: 'https://staging.app.example.com',
  logLevel: 'info',
  enableCache: true,
  enableAnalytics: true,
  corsOrigins: ['https://staging.app.example.com'],
  port: parseInt(process.env.PORT || '3000', 10),
  assetsCDN: 'https://staging-cdn.example.com',
};

// Production-Umgebungskonfiguration
const productionConfig: EnvironmentConfig = {
  ...baseConfig as EnvironmentConfig,
  name: 'production',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/app_production',
  apiBaseUrl: 'https://app.example.com',
  logLevel: 'warn',
  enableCache: true,
  enableAnalytics: true,
  corsOrigins: ['https://app.example.com'],
  port: parseInt(process.env.PORT || '3000', 10),
  assetsCDN: 'https://cdn.example.com',
};

// Konfigurationen für alle Umgebungen
const configs: Record<Environment, EnvironmentConfig> = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
};

// Aktuelle Umgebung bestimmen
export function getCurrentEnvironment(): Environment {
  const env = (process.env.NODE_ENV || 'development') as Environment;
  return env;
}

// Konfiguration für aktuelle Umgebung laden
export function loadEnvironmentConfig(): EnvironmentConfig {
  const currentEnv = getCurrentEnvironment();
  loadEnvFile(currentEnv);
  return configs[currentEnv];
}

// Exportiere die Konfiguration für die aktuelle Umgebung
export const environmentConfig = loadEnvironmentConfig();
export default environmentConfig;