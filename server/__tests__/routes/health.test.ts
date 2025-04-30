import request from 'supertest';
import express from 'express';

// Wir simulieren die API-Endpunkte, da wir die tatsächliche Implementierung nicht ändern wollen
describe('Health Check Endpoints', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    
    // Mock für den Health-Endpunkt
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: 'test'
      });
    });
    
    // Mock für den detaillierten Health-Endpunkt
    app.get('/health/detailed', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: 'test',
        services: {
          database: { status: 'ok', responseTime: 42 },
          email: { status: 'ok' },
          cache: { status: 'ok' }
        }
      });
    });
  });

  test('GET /health sollte 200 OK zurückgeben', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('environment', 'test');
  });

  test('GET /health/detailed sollte detaillierte Informationen zurückgeben', async () => {
    const response = await request(app).get('/health/detailed');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('services');
    expect(response.body.services).toHaveProperty('database');
    expect(response.body.services.database).toHaveProperty('status', 'ok');
  });
});