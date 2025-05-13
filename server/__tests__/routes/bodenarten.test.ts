import express from 'express';
import request from 'supertest';
import bodenRouter from '../../routes/bodenarten';
import { sql } from '../../db';

// Type für den Mock
type MockSql = jest.Mock<any, any>;

// Mock der SQL-Funktion
jest.mock('../../db', () => ({
  sql: jest.fn(),
}));

// Helper-Funktion zum Erstellen der Express-App für Tests
function createApp() {
  const app = express();
  app.use(express.json());
  app.use(bodenRouter);
  return app;
}

describe('Bodenarten API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/bodenarten', () => {
    test('sollte alle Bodenarten zurückgeben', async () => {
      const mockBodenarten = [
        { id: 1, name: 'Lehm', klasse: 'RStO 12-Klasse 3', beschreibung: 'Bindiger Boden', kosten_pro_m2: 50.00 },
        { id: 2, name: 'Sand', klasse: 'RStO 12-Klasse 1', beschreibung: 'Locker, nicht bindiger Boden', kosten_pro_m2: 40.00 },
        { id: 3, name: 'Kies', klasse: 'RStO 12-Klasse 2', beschreibung: 'Grober, körniger Boden', kosten_pro_m2: 45.00 }
      ];

      // Mock der SQL-Funktion für den Test
      (sql as unknown as MockSql).mockResolvedValue(mockBodenarten);

      const app = createApp();
      const response = await request(app).get('/api/bodenarten');

      // Überprüfe die Antwort
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBodenarten);
      
      // Überprüfe, ob die SQL-Funktion mit dem richtigen Query aufgerufen wurde
      expect(sql).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM bodenarten ORDER BY name ASC')
      );
    });

    test('sollte einen Fehler zurückgeben, wenn die Datenbankabfrage fehlschlägt', async () => {
      // Mock eines Datenbankfehlers
      (sql as unknown as MockSql).mockRejectedValue(new Error('Datenbankverbindungsfehler'));

      const app = createApp();
      const response = await request(app).get('/api/bodenarten');

      // Überprüfe die Fehlerantwort
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Fehler beim Abrufen der Bodenarten');
      expect(response.body).toHaveProperty('details', 'Datenbankverbindungsfehler');
    });
  });

  describe('GET /api/bodenarten/:id', () => {
    test('sollte eine spezifische Bodenart zurückgeben', async () => {
      const mockBodenart = [{ 
        id: 1, 
        name: 'Lehm', 
        klasse: 'RStO 12-Klasse 3', 
        beschreibung: 'Bindiger Boden', 
        kosten_pro_m2: 50.00 
      }];

      // Mock der SQL-Funktion für den Test
      (sql as unknown as MockSql).mockResolvedValue(mockBodenart);

      const app = createApp();
      const response = await request(app).get('/api/bodenarten/1');

      // Überprüfe die Antwort
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBodenart[0]);
      
      // Überprüfe, ob die SQL-Funktion mit dem richtigen Query aufgerufen wurde
      expect(sql).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM bodenarten WHERE id ='),
        '1'
      );
    });

    test('sollte 404 zurückgeben, wenn die Bodenart nicht gefunden wird', async () => {
      // Mock einer leeren Ergebnismenge
      (sql as unknown as MockSql).mockResolvedValue([]);

      const app = createApp();
      const response = await request(app).get('/api/bodenarten/999');

      // Überprüfe die Fehlerantwort
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Bodenart nicht gefunden');
    });

    test('sollte einen Fehler zurückgeben, wenn die Datenbankabfrage fehlschlägt', async () => {
      // Mock eines Datenbankfehlers
      (sql as unknown as MockSql).mockRejectedValue(new Error('Datenbankverbindungsfehler'));

      const app = createApp();
      const response = await request(app).get('/api/bodenarten/1');

      // Überprüfe die Fehlerantwort
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Fehler beim Abrufen der Bodenart');
      expect(response.body).toHaveProperty('details', 'Datenbankverbindungsfehler');
    });
  });
});