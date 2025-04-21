/**
 * API-Dokumentation mit Swagger/OpenAPI
 * 
 * Stellt eine interaktive API-Dokumentation bereit, die automatisch
 * aus JSDoc-Kommentaren in den Route-Definitionen generiert wird.
 */

import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from '../config';
import { version } from '../package.json';
import { logger } from './logger';

// Verwende spezifischen Logger für API-Dokumentation
const docsLogger = logger.createLogger('api-docs');

/**
 * Swagger-Konfiguration
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bau - Structura API',
      version,
      description: 'API-Dokumentation für die Bau-Structura-Anwendung',
      contact: {
        name: 'Support',
        email: 'info@baustructura.de',
      },
      license: {
        name: 'Proprietär - Alle Rechte vorbehalten',
      },
    },
    servers: [
      {
        url: config.isDevelopment 
          ? `http://localhost:${config.server.port}` 
          : 'https://api.baustructura.de',
        description: config.isDevelopment ? 'Entwicklungsserver' : 'Produktionsserver',
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Cookie-basierte Authentifizierung über Express-Session',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Zugriff verweigert - Authentifizierung erforderlich',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Nicht autorisiert',
                      },
                      statusCode: {
                        type: 'integer',
                        example: 401,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Die angeforderte Ressource wurde nicht gefunden',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Ressource wurde nicht gefunden',
                      },
                      statusCode: {
                        type: 'integer',
                        example: 404,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Die Anfragedaten haben die Validierung nicht bestanden',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Validierungsfehler',
                      },
                      statusCode: {
                        type: 'integer',
                        example: 422,
                      },
                      details: {
                        type: 'object',
                        example: {
                          field1: ['Pflichtfeld fehlt'],
                          field2: ['Ungültiges Format'],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ServerError: {
          description: 'Ein interner Serverfehler ist aufgetreten',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Ein interner Serverfehler ist aufgetreten',
                      },
                      statusCode: {
                        type: 'integer',
                        example: 500,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      schemas: {
        // Benutzer-Schema
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Eindeutige Benutzer-ID',
            },
            username: {
              type: 'string',
              description: 'Benutzername für Login',
            },
            user_name: {
              type: 'string',
              description: 'Vollständiger Name des Benutzers',
            },
            user_email: {
              type: 'string',
              format: 'email',
              description: 'E-Mail-Adresse des Benutzers',
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'user'],
              description: 'Benutzerrolle',
            },
            gdpr_consent: {
              type: 'boolean',
              description: 'DSGVO-Einwilligung erteilt',
            },
          },
        },
        // Projekt-Schema
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Eindeutige Projekt-ID',
            },
            project_id: {
              type: 'string',
              description: 'Externe Projektnummer',
            },
            customer_id: {
              type: 'integer',
              description: 'Kunden-ID',
            },
            company_id: {
              type: 'integer',
              description: 'Unternehmens-ID',
            },
            project_name: {
              type: 'string',
              description: 'Projektname',
            },
            project_art: {
              type: 'string',
              enum: ['Tiefbau', 'Hochbau'],
              description: 'Projektart',
            },
            project_text: {
              type: 'string',
              description: 'Projektbeschreibung',
            },
            project_startdate: {
              type: 'string',
              format: 'date',
              description: 'Startdatum des Projekts',
            },
            project_enddate: {
              type: 'string',
              format: 'date',
              description: 'Enddatum des Projekts',
            },
            created_by: {
              type: 'integer',
              description: 'ID des Erstellers',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Erstellungszeitpunkt',
            },
          },
        },
        // Kunden-Schema
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Eindeutige Kunden-ID',
            },
            customer_id: {
              type: 'string',
              description: 'Externe Kundennummer',
            },
            customer_name: {
              type: 'string',
              description: 'Kundenname',
            },
            customer_street: {
              type: 'string',
              description: 'Straße des Kunden',
            },
            customer_plz: {
              type: 'string',
              description: 'Postleitzahl des Kunden',
            },
            customer_city: {
              type: 'string',
              description: 'Stadt des Kunden',
            },
            customer_phone: {
              type: 'string',
              description: 'Telefonnummer des Kunden',
            },
            customer_email: {
              type: 'string',
              format: 'email',
              description: 'E-Mail-Adresse des Kunden',
            },
            created_by: {
              type: 'integer',
              description: 'ID des Erstellers',
            },
          },
        },
        // Unternehmen-Schema
        Company: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Eindeutige Unternehmens-ID',
            },
            company_id: {
              type: 'string',
              description: 'Externe Unternehmensnummer',
            },
            company_name: {
              type: 'string',
              description: 'Unternehmensname',
            },
            company_street: {
              type: 'string',
              description: 'Straße des Unternehmens',
            },
            company_plz: {
              type: 'string',
              description: 'Postleitzahl des Unternehmens',
            },
            company_city: {
              type: 'string',
              description: 'Stadt des Unternehmens',
            },
            company_phone: {
              type: 'string',
              description: 'Telefonnummer des Unternehmens',
            },
            company_email: {
              type: 'string',
              format: 'email',
              description: 'E-Mail-Adresse des Unternehmens',
            },
            created_by: {
              type: 'integer',
              description: 'ID des Erstellers',
            },
          },
        },
        // Meilenstein-Schema
        Milestone: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Eindeutige Meilenstein-ID',
            },
            project_id: {
              type: 'integer',
              description: 'Projekt-ID',
            },
            milestone_type: {
              type: 'string',
              description: 'Meilensteintyp',
            },
            milestone_text: {
              type: 'string',
              description: 'Meilensteinbeschreibung',
            },
            milestone_kw: {
              type: 'integer',
              description: 'Kalenderwoche des Meilensteins',
            },
            milestone_jahr: {
              type: 'integer',
              description: 'Jahr des Meilensteins',
            },
            milestone_ewb: {
              type: 'boolean',
              description: 'EWB-Status des Meilensteins',
            },
            milestone_foeb: {
              type: 'boolean',
              description: 'FÖB-Status des Meilensteins',
            },
            bauphase: {
              type: 'string',
              enum: ['Grundbau', 'Rohbau', 'Ausbau', 'Technik', 'Abnahme'],
              description: 'Bauphase des Meilensteins',
            },
            created_by: {
              type: 'integer',
              description: 'ID des Erstellers',
            },
          },
        },
      },
    },
  },
  apis: ['./server/routes.ts'], // Pfad zu den API-Routen
};

/**
 * Generiere die Swagger-Spezifikation aus den JSDoc-Kommentaren
 */
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Konfiguriere die UI-Optionen für Swagger
 */
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }', // Entferne die Standard-Topbar
  customSiteTitle: 'Bau - Structura API Dokumentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'none',      // Alle Endpoints standardmäßig geschlossen
    persistAuthorization: true, // Behalte die Authentifizierung auch bei Seitenwechseln
    displayRequestDuration: true, // Zeige die Dauer für API-Anfragen an
    defaultModelsExpandDepth: 1, // Begrenzte Anzeige der Modelle
  },
};

/**
 * Registriere die Swagger-Dokumentationsrouten in der Express-Anwendung
 */
export function setupApiDocs(app: Express) {
  // Nur in Entwicklungsumgebung oder explizit für Docs freigeschaltete Umgebungen aktivieren
  if (!config.isDevelopment && !process.env.ENABLE_API_DOCS) {
    docsLogger.info('API-Dokumentation in Produktionsumgebung deaktiviert');
    return;
  }

  // Swagger-UI einrichten
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  
  // Raw Swagger JSON bereitstellen
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  docsLogger.info(`API-Dokumentation verfügbar unter /api-docs (${config.env})`);
}

export default setupApiDocs;