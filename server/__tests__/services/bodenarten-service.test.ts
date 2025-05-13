import { BodenartService } from '../../services/bodenarten-service';
import { sql } from '../../db';

// Mock für die SQL-Funktion
jest.mock('../../db', () => ({
  sql: jest.fn(),
}));

// Typ für den Mock
type MockSql = jest.Mock<any, any>;

describe('BodenartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('sollte alle Bodenarten zurückgeben', async () => {
      const mockBodenarten = [
        { id: 1, name: 'Lehm', klasse: 'RStO 12-Klasse 3', beschreibung: 'Bindiger Boden', kosten_pro_m2: 50.00 },
        { id: 2, name: 'Sand', klasse: 'RStO 12-Klasse 1', beschreibung: 'Locker, nicht bindiger Boden', kosten_pro_m2: 40.00 },
      ];

      // Mock der SQL-Anfrage
      (sql as unknown as MockSql).mockResolvedValue(mockBodenarten);

      // Service aufrufen
      const bodenarten = await BodenartService.getAll();

      // Überprüfen der Ergebnisse
      expect(bodenarten).toEqual(mockBodenarten);
      expect(sql).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM bodenarten'));
    });

    test('sollte einen Fehler werfen, wenn die Datenbankabfrage fehlschlägt', async () => {
      // Mock einer fehlgeschlagenen Anfrage
      (sql as unknown as MockSql).mockRejectedValue(new Error('Datenbankfehler'));

      // Service aufrufen und Fehler erwarten
      await expect(BodenartService.getAll()).rejects.toThrow('Fehler beim Abrufen der Bodenarten');
    });
  });

  describe('getById', () => {
    test('sollte eine Bodenart nach ID zurückgeben', async () => {
      const mockBodenart = [{ 
        id: 1, 
        name: 'Lehm', 
        klasse: 'RStO 12-Klasse 3', 
        beschreibung: 'Bindiger Boden', 
        kosten_pro_m2: 50.00 
      }];

      // Mock der SQL-Anfrage
      (sql as unknown as MockSql).mockResolvedValue(mockBodenart);

      // Service aufrufen
      const bodenart = await BodenartService.getById(1);

      // Überprüfen der Ergebnisse
      expect(bodenart).toEqual(mockBodenart[0]);
      expect(sql).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM bodenarten WHERE id ='), 1);
    });

    test('sollte null zurückgeben, wenn keine Bodenart gefunden wird', async () => {
      // Mock einer leeren Ergebnismenge
      (sql as unknown as MockSql).mockResolvedValue([]);

      // Service aufrufen
      const bodenart = await BodenartService.getById(999);

      // Überprüfen der Ergebnisse
      expect(bodenart).toBeNull();
    });

    test('sollte einen Fehler werfen, wenn die Datenbankabfrage fehlschlägt', async () => {
      // Mock einer fehlgeschlagenen Anfrage
      (sql as unknown as MockSql).mockRejectedValue(new Error('Datenbankfehler'));

      // Service aufrufen und Fehler erwarten
      await expect(BodenartService.getById(1)).rejects.toThrow('Fehler beim Abrufen der Bodenart');
    });
  });

  describe('create', () => {
    test('sollte eine neue Bodenart erstellen', async () => {
      const newBodenart = { 
        name: 'Ton', 
        klasse: 'RStO 12-Klasse 4', 
        beschreibung: 'Schwerer bindiger Boden', 
        kosten_pro_m2: 60.00 
      };

      const mockResult = [{ 
        id: 3, 
        ...newBodenart 
      }];

      // Mock der SQL-Anfrage
      (sql as unknown as MockSql).mockResolvedValue(mockResult);

      // Service aufrufen
      const created = await BodenartService.create(newBodenart);

      // Überprüfen der Ergebnisse
      expect(created).toEqual(mockResult[0]);
      expect(sql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO bodenarten'),
        expect.objectContaining(newBodenart)
      );
    });

    test('sollte einen Fehler werfen, wenn die Erstellung fehlschlägt', async () => {
      const newBodenart = { 
        name: 'Ton', 
        klasse: 'RStO 12-Klasse 4', 
        beschreibung: 'Schwerer bindiger Boden', 
        kosten_pro_m2: 60.00 
      };

      // Mock einer fehlgeschlagenen Anfrage
      (sql as unknown as MockSql).mockRejectedValue(new Error('Datenbankfehler'));

      // Service aufrufen und Fehler erwarten
      await expect(BodenartService.create(newBodenart)).rejects.toThrow('Fehler beim Erstellen der Bodenart');
    });
  });

  describe('update', () => {
    test('sollte eine Bodenart aktualisieren', async () => {
      const updateData = { 
        name: 'Lehm (überarbeitet)', 
        kosten_pro_m2: 55.00 
      };

      const mockResult = [{ 
        id: 1, 
        name: 'Lehm (überarbeitet)', 
        klasse: 'RStO 12-Klasse 3', 
        beschreibung: 'Bindiger Boden', 
        kosten_pro_m2: 55.00 
      }];

      // Mock der SQL-Anfrage
      (sql as unknown as MockSql).mockResolvedValue(mockResult);

      // Service aufrufen
      const updated = await BodenartService.update(1, updateData);

      // Überprüfen der Ergebnisse
      expect(updated).toEqual(mockResult[0]);
      expect(sql).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE bodenarten SET'),
        expect.objectContaining(updateData),
        1
      );
    });

    test('sollte null zurückgeben, wenn keine Bodenart gefunden wird', async () => {
      // Mock einer leeren Ergebnismenge
      (sql as unknown as MockSql).mockResolvedValue([]);

      // Service aufrufen
      const updated = await BodenartService.update(999, { name: 'Nicht existierend' });

      // Überprüfen der Ergebnisse
      expect(updated).toBeNull();
    });

    test('sollte einen Fehler werfen, wenn die Aktualisierung fehlschlägt', async () => {
      // Mock einer fehlgeschlagenen Anfrage
      (sql as unknown as MockSql).mockRejectedValue(new Error('Datenbankfehler'));

      // Service aufrufen und Fehler erwarten
      await expect(BodenartService.update(1, { name: 'Test' })).rejects.toThrow('Fehler beim Aktualisieren der Bodenart');
    });
  });

  describe('delete', () => {
    test('sollte eine Bodenart löschen', async () => {
      // Mock der SQL-Anfrage, die anzeigt, dass ein Datensatz gelöscht wurde
      (sql as unknown as MockSql).mockResolvedValue([{ count: 1 }]);

      // Service aufrufen
      const result = await BodenartService.delete(1);

      // Überprüfen der Ergebnisse
      expect(result).toBe(true);
      expect(sql).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM bodenarten WHERE id ='), 1);
    });

    test('sollte false zurückgeben, wenn keine Bodenart gelöscht wurde', async () => {
      // Mock der SQL-Anfrage, die anzeigt, dass kein Datensatz gelöscht wurde
      (sql as unknown as MockSql).mockResolvedValue([{ count: 0 }]);

      // Service aufrufen
      const result = await BodenartService.delete(999);

      // Überprüfen der Ergebnisse
      expect(result).toBe(false);
    });

    test('sollte einen Fehler werfen, wenn das Löschen fehlschlägt', async () => {
      // Mock einer fehlgeschlagenen Anfrage
      (sql as unknown as MockSql).mockRejectedValue(new Error('Datenbankfehler'));

      // Service aufrufen und Fehler erwarten
      await expect(BodenartService.delete(1)).rejects.toThrow('Fehler beim Löschen der Bodenart');
    });
  });
});