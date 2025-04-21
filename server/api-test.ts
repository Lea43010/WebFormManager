/**
 * API-Test-Tool
 * 
 * Stellt Funktionalität zum automatisierten Testen der API-Endpunkte bereit.
 * Das Testmodul kann sowohl programmatisch als auch über einen dedizierten Endpunkt 
 * ausgeführt werden (nur in Entwicklungsumgebung verfügbar).
 */

import { Express, Request, Response } from 'express';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import config from '../config';
import { logger } from './logger';

// Spezifischer Logger für API-Tests
const testLogger = logger.createLogger('api-test');

/**
 * Testschnittstelle und -typen
 */
interface TestCase {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  auth?: boolean;
  expectedStatus?: number;
  validateResponse?: (response: any) => boolean;
  skip?: boolean;
  dependsOn?: string;
}

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  success: boolean;
  statusCode?: number;
  expectedStatus?: number;
  responseTime: number;
  error?: string;
  response?: any;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
}

interface TestReport {
  success: boolean;
  timestamp: string;
  environment: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  executionTime: number;
  results: TestResult[];
}

/**
 * Konfiguration eines API-Test-Clients
 */
class ApiTestClient {
  private baseUrl: string;
  private authCookie: string | null = null;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (config.isDevelopment 
      ? `http://localhost:${config.server.port}` 
      : 'https://api.baustructura.de');
  }
  
  /**
   * Führt Authentifizierung durch und speichert das Session-Cookie
   */
  async authenticate(username: string, password: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/login`, { 
        username, 
        password 
      }, { withCredentials: true });
      
      if (response.status === 200 && response.headers['set-cookie']) {
        this.authCookie = response.headers['set-cookie'][0];
        return true;
      }
      
      return false;
    } catch (error) {
      testLogger.error('Authentifizierungsfehler:', error);
      return false;
    }
  }
  
  /**
   * Führt einen API-Request aus
   */
  async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    endpoint: string, 
    payload?: any,
    useAuth: boolean = false
  ): Promise<AxiosResponse> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const options: AxiosRequestConfig = {
      method,
      url,
      data: payload,
      withCredentials: true,
      headers: {},
    };
    
    // Authentifizierung hinzufügen, wenn nötig
    if (useAuth && this.authCookie) {
      options.headers!.Cookie = this.authCookie;
    }
    
    return await axios(options);
  }
}

/**
 * Standard-Testsuite mit grundlegenden API-Tests
 */
const standardTestSuite: TestSuite = {
  name: 'Standard API Tests',
  tests: [
    // Basistests
    {
      name: 'Health-Check',
      endpoint: '/health',
      method: 'GET',
      expectedStatus: 200,
      validateResponse: (res) => res.status === 'ok' && res.databaseStatus.connected === true,
    },
    {
      name: 'Ping',
      endpoint: '/ping',
      method: 'GET',
      expectedStatus: 200,
    },
    
    // Authentifizierungstests
    {
      name: 'Login mit falschen Anmeldedaten',
      endpoint: '/api/login',
      method: 'POST',
      payload: { username: 'nonexistent', password: 'wrongpassword' },
      expectedStatus: 401,
    },
    {
      name: 'Zugriff auf geschützte Route ohne Authentifizierung',
      endpoint: '/api/user',
      method: 'GET',
      expectedStatus: 401,
    },
    
    // Datenzugriffstests
    {
      name: 'Öffentliche Ressource',
      endpoint: '/api/health/status',
      method: 'GET',
      expectedStatus: 200,
    },
  ],
};

/**
 * Erweiterte Testsuite mit authentifizierten Tests
 */
const authenticatedTestSuite: TestSuite = {
  name: 'Authenticated API Tests',
  tests: [
    {
      name: 'Login erfolgreich',
      endpoint: '/api/login',
      method: 'POST',
      payload: { username: 'testuser', password: 'testpassword' },
      expectedStatus: 200,
    },
    {
      name: 'Benutzerprofil abrufen',
      endpoint: '/api/user',
      method: 'GET',
      auth: true,
      expectedStatus: 200,
      dependsOn: 'Login erfolgreich',
    },
    {
      name: 'Projekte abrufen',
      endpoint: '/api/projects',
      method: 'GET',
      auth: true,
      expectedStatus: 200,
      dependsOn: 'Login erfolgreich',
    },
  ],
};

/**
 * CRUD-Testsuite generieren
 */
function generateCrudTestSuite(entityName: string, basePath: string): TestSuite {
  return {
    name: `${entityName} CRUD Tests`,
    tests: [
      // Create
      {
        name: `${entityName} erstellen`,
        endpoint: basePath,
        method: 'POST',
        auth: true,
        payload: {}, // Dynamisch zu füllen
        expectedStatus: 201,
      },
      // Read
      {
        name: `${entityName} abrufen`,
        endpoint: `${basePath}/1`, // ID dynamisch anpassen
        method: 'GET',
        auth: true,
        expectedStatus: 200,
        dependsOn: `${entityName} erstellen`,
      },
      // Update
      {
        name: `${entityName} aktualisieren`,
        endpoint: `${basePath}/1`, // ID dynamisch anpassen
        method: 'PUT',
        auth: true,
        payload: {}, // Dynamisch zu füllen
        expectedStatus: 200,
        dependsOn: `${entityName} abrufen`,
      },
      // Delete
      {
        name: `${entityName} löschen`,
        endpoint: `${basePath}/1`, // ID dynamisch anpassen
        method: 'DELETE',
        auth: true,
        expectedStatus: 200,
        dependsOn: `${entityName} aktualisieren`,
      },
    ],
  };
}

/**
 * Testsuite ausführen
 */
async function runTestSuite(
  suite: TestSuite, 
  client: ApiTestClient = new ApiTestClient(),
  testCredentials?: { username: string; password: string }
): Promise<TestReport> {
  const startTime = Date.now();
  const results: TestResult[] = [];
  const testMap: Map<string, TestResult> = new Map();
  let authenticated = false;
  
  // Wenn Anmeldedaten angegeben wurden, versuche eine Authentifizierung
  if (testCredentials) {
    authenticated = await client.authenticate(testCredentials.username, testCredentials.password);
    testLogger.info(`Authentifizierung ${authenticated ? 'erfolgreich' : 'fehlgeschlagen'}`);
  }
  
  // Tests ausführen
  for (const test of suite.tests) {
    // Überspringen, wenn der Test als "skip" markiert ist
    if (test.skip) {
      results.push({
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        success: false,
        responseTime: 0,
        error: 'Test übersprungen',
      });
      continue;
    }
    
    // Prüfen, ob Abhängigkeiten erfüllt sind
    if (test.dependsOn) {
      const dependencyResult = testMap.get(test.dependsOn);
      if (!dependencyResult || !dependencyResult.success) {
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          success: false,
          responseTime: 0,
          error: `Abhängigkeit '${test.dependsOn}' nicht erfüllt`,
        });
        continue;
      }
    }
    
    // Authentifizierung prüfen, wenn erforderlich
    if (test.auth && !authenticated && test.name !== 'Login erfolgreich') {
      results.push({
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        success: false,
        responseTime: 0,
        error: 'Authentifizierung erforderlich, aber nicht erfolgt',
      });
      continue;
    }
    
    try {
      testLogger.debug(`Test ausführen: ${test.name} (${test.method} ${test.endpoint})`);
      const requestStartTime = Date.now();
      
      // Spezialfall für den Login-Test
      if (test.name === 'Login erfolgreich') {
        authenticated = await client.authenticate(
          test.payload.username, 
          test.payload.password
        );
        
        const responseTime = Date.now() - requestStartTime;
        const result: TestResult = {
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          success: authenticated,
          statusCode: authenticated ? 200 : 401,
          expectedStatus: test.expectedStatus,
          responseTime,
          error: authenticated ? undefined : 'Login fehlgeschlagen',
        };
        
        results.push(result);
        testMap.set(test.name, result);
        continue;
      }
      
      // Normale API-Anfrage
      const response = await client.request(
        test.method, 
        test.endpoint, 
        test.payload,
        test.auth
      );
      
      const responseTime = Date.now() - requestStartTime;
      
      // Antwort validieren
      let success = true;
      if (test.expectedStatus && response.status !== test.expectedStatus) {
        success = false;
      }
      
      if (success && test.validateResponse && !test.validateResponse(response.data)) {
        success = false;
      }
      
      const result: TestResult = {
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        success,
        statusCode: response.status,
        expectedStatus: test.expectedStatus,
        responseTime,
        response: response.data,
      };
      
      results.push(result);
      testMap.set(test.name, result);
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      const result: TestResult = {
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        success: false,
        statusCode: error.response?.status,
        expectedStatus: test.expectedStatus,
        responseTime,
        error: error.message,
        response: error.response?.data,
      };
      
      // Spezialfall: Der Test erwartet genau diesen Fehlercode
      if (test.expectedStatus && error.response?.status === test.expectedStatus) {
        result.success = true;
      }
      
      results.push(result);
      testMap.set(test.name, result);
    }
  }
  
  // Testbericht erstellen
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = results.filter(r => !r.success && !r.error?.includes('übersprungen')).length;
  const skippedTests = results.filter(r => r.error?.includes('übersprungen') || r.error?.includes('Abhängigkeit')).length;
  
  return {
    success: failedTests === 0,
    timestamp: new Date().toISOString(),
    environment: config.env,
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    executionTime: Date.now() - startTime,
    results,
  };
}

/**
 * Testendpunkt im Express einrichten
 */
export function setupApiTests(app: Express) {
  // API-Tests nur in Entwicklungsumgebung verfügbar machen
  if (!config.isDevelopment && !process.env.ENABLE_API_TESTS) {
    return;
  }
  
  testLogger.info('API-Test-Endpunkt eingerichtet');
  
  // Einfacher Testendpunkt, der die Standard-Testsuite ausführt
  app.get('/api/test/basic', async (req: Request, res: Response) => {
    const client = new ApiTestClient();
    const report = await runTestSuite(standardTestSuite, client);
    
    res.status(report.success ? 200 : 500).json(report);
  });
  
  // Endpunkt für authentifizierte Tests (erfordert Anmeldedaten im Body)
  app.post('/api/test/auth', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'Benutzername und Passwort sind erforderlich',
      });
    }
    
    const client = new ApiTestClient();
    const report = await runTestSuite(authenticatedTestSuite, client, { username, password });
    
    res.status(report.success ? 200 : 500).json(report);
  });
  
  // Endpunkt, der alle verfügbaren Testsuites anzeigt
  app.get('/api/test/suites', (req: Request, res: Response) => {
    const availableSuites = [
      { name: standardTestSuite.name, endpoint: '/api/test/basic', method: 'GET' },
      { name: authenticatedTestSuite.name, endpoint: '/api/test/auth', method: 'POST' },
      { name: 'Projekte CRUD Tests', endpoint: '/api/test/crud/projects', method: 'POST' },
      { name: 'Kunden CRUD Tests', endpoint: '/api/test/crud/customers', method: 'POST' },
      { name: 'Unternehmen CRUD Tests', endpoint: '/api/test/crud/companies', method: 'POST' },
    ];
    
    res.json({ suites: availableSuites });
  });
  
  // Dynamische CRUD-Test-Endpunkte
  const entityConfigs = [
    { name: 'Project', basePath: '/api/projects' },
    { name: 'Customer', basePath: '/api/customers' },
    { name: 'Company', basePath: '/api/companies' },
  ];
  
  entityConfigs.forEach(({ name, basePath }) => {
    const endpoint = `/api/test/crud${basePath}`;
    
    app.post(endpoint, async (req: Request, res: Response) => {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          error: 'Benutzername und Passwort sind erforderlich',
        });
      }
      
      const client = new ApiTestClient();
      const suite = generateCrudTestSuite(name, basePath);
      const report = await runTestSuite(suite, client, { username, password });
      
      res.status(report.success ? 200 : 500).json(report);
    });
  });
}

// Exporte für programmgesteuerte Verwendung
export {
  ApiTestClient,
  runTestSuite,
  standardTestSuite,
  authenticatedTestSuite,
  generateCrudTestSuite,
  type TestCase,
  type TestResult,
  type TestSuite,
  type TestReport,
};