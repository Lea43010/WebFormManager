/**
 * Konfigurationsdatei für die Anwendung
 * 
 * Lädt Umgebungsvariablen und stellt eine zentrale Konfiguration zur Verfügung
 * Die Werte können je nach Umgebung (development/production) variieren
 */

// Prüfe, ob die Umgebung korrekt gesetzt ist
const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv === 'development';
const isProduction = nodeEnv === 'production';

// Datenbankspezifische Konfiguration
const database = {
  url: process.env.DATABASE_URL,
  poolSize: isProduction ? 20 : 5,
  connectionTimeout: isProduction ? 10000 : 30000, // Längeres Timeout in dev für Debug
  idleTimeout: isProduction ? 60000 : 10000,       // In Prod länger, um Verbindungen zu halten
};

// Server-Konfiguration
const server = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  sessionSecret: process.env.SESSION_SECRET || 'local_dev_secret',
  cookieMaxAge: isProduction ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 7 Tage in Prod, 1 Tag in Dev
  cors: {
    origin: isProduction ? ['https://*.baustructura.de'] : '*',
    credentials: true,
  },
};

// Sicherheitseinstellungen
const security = {
  bcryptRounds: isProduction ? 12 : 10, // Stärkere Hashing-Stärke in Produktion
  rateLimits: {
    loginAttempts: isProduction ? 5 : 50,    // Max. Login-Versuche in 15 Minuten
    apiRequests: isProduction ? 150 : 1500,  // Max. API-Anfragen pro IP in 15 Minuten
    healthCheck: isProduction ? 30 : 300,    // Max. Health-Check-Anfragen pro Minute
  },
  twoFactorEnabled: isProduction, // 2FA nur in Produktion aktivieren
};

// Logging-Konfiguration
const logging = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: isProduction ? 'json' : 'dev',
  disableConsole: false,
  // In Produktion können Logs an ein externes System gesendet werden
  externalLogService: isProduction ? process.env.LOG_SERVICE_URL : undefined,
};

// Fehlerbehandlung
const errorHandling = {
  showStackTraces: !isProduction,
  detailedErrors: !isProduction,
};

// Dateispeicher-Konfiguration
const storage = {
  uploads: {
    maxFileSize: isProduction ? 15 * 1024 * 1024 : 50 * 1024 * 1024, // 15MB in Prod, 50MB in Dev
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 
                  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    path: process.env.UPLOAD_PATH || './uploads',
  },
};

// Email-Konfiguration
const email = {
  provider: 'brevo', // 'brevo', 'console', etc.
  fromEmail: isProduction ? 'info@baustructura.de' : 'dev-test@baustructura.de',
  fromName: isProduction ? 'BauStructura' : 'BauStructura (DEV)',
  apiKey: process.env.BREVO_API_KEY,
  // In Entwicklung können E-Mails in eine Datei oder die Konsole ausgegeben werden
  devMode: !isProduction,
  devOutputPath: './temp/emails',
  
  // Verschiedene E-Mail-Templates
  templates: {
    welcome: {
      templateId: isProduction ? 'prod-template-id-1' : 'dev-template-id-1',
    },
    verification: {
      templateId: isProduction ? 'prod-template-id-2' : 'dev-template-id-2',
    },
    passwordReset: {
      templateId: isProduction ? 'prod-template-id-3' : 'dev-template-id-3',
    },
  },
};

// KI-Funktionalitäten
const ai = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: isProduction ? 'gpt-4o' : 'gpt-3.5-turbo', // Schnelleres, günstigeres Modell in Dev
    maxTokens: isProduction ? 8000 : 2000,
  },
  deepai: {
    apiKey: process.env.DEEPAI_API_KEY,
  },
};

// Integrationen und externe APIs
const externalServices = {
  mapbox: {
    accessToken: process.env.MAPBOX_ACCESS_TOKEN,
  },
};

// Zusammenführen aller Konfigurationen
const config = {
  env: nodeEnv,
  isDevelopment,
  isProduction,
  database,
  server,
  security,
  logging,
  errorHandling,
  storage,
  email,
  ai,
  externalServices,
};

export default config;