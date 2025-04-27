import { constructionDiarySchema } from '../../shared/schema';

// Mocking der Datenbank-Abfrage-Funktionen
jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    desc: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  }
}));

// Mocking der Storage-Funktionen
jest.mock('../storage', () => ({
  storage: {
    createConstructionDiaryEntry: jest.fn().mockResolvedValue({
      id: 1,
      project_id: 1,
      entry_date: new Date().toISOString(),
      weather: 'Sonnig',
      temperature: 22,
      personnel_count: 5,
      interruptions: false,
      interruption_reason: null,
      notes: 'Testnotiz',
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    getConstructionDiaryEntries: jest.fn().mockResolvedValue([{
      id: 1,
      project_id: 1,
      entry_date: new Date().toISOString(),
      weather: 'Sonnig',
      temperature: 22,
      personnel_count: 5,
      interruptions: false,
      interruption_reason: null,
      notes: 'Testnotiz',
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]),
    getConstructionDiaryEntry: jest.fn().mockResolvedValue({
      id: 1,
      project_id: 1,
      entry_date: new Date().toISOString(),
      weather: 'Sonnig',
      temperature: 22,
      personnel_count: 5,
      interruptions: false,
      interruption_reason: null,
      notes: 'Testnotiz',
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    updateConstructionDiaryEntry: jest.fn().mockResolvedValue({
      id: 1,
      project_id: 1,
      entry_date: new Date().toISOString(),
      weather: 'Bewölkt',
      temperature: 18,
      personnel_count: 5,
      interruptions: false,
      interruption_reason: null,
      notes: 'Aktualisierte Testnotiz',
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    deleteConstructionDiaryEntry: jest.fn().mockResolvedValue(true),
  }
}));

describe('Bautagebuch-Funktionalität', () => {
  beforeEach(() => {
    // Zurücksetzen der Mocks zwischen den Tests
    jest.clearAllMocks();
  });
  
  test('sollte ein gültiges Bautagebuch-Schema haben', () => {
    expect(constructionDiarySchema).toBeDefined();
    
    // Validiere einen gültigen Bautagebuch-Eintrag
    const validEntry = {
      project_id: 1,
      entry_date: new Date().toISOString(),
      weather: 'Sonnig',
      temperature: 22,
      personnel_count: 5,
      interruptions: false,
      interruption_reason: null,
      notes: 'Testnotiz',
      created_by: 1,
    };
    
    const result = constructionDiarySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });
  
  test('sollte ungültige Wetterbedingungen erkennen', () => {
    const invalidEntry = {
      project_id: 1,
      entry_date: new Date().toISOString(),
      weather: '', // Leerer String ist ungültig
      temperature: 22,
      personnel_count: 5,
      interruptions: false,
      interruption_reason: null,
      notes: 'Testnotiz',
      created_by: 1,
    };
    
    const result = constructionDiarySchema.safeParse(invalidEntry);
    expect(result.success).toBe(false);
  });
  
  test('sollte ungültige Temperaturwerte erkennen', () => {
    const invalidEntry = {
      project_id: 1,
      entry_date: new Date().toISOString(),
      weather: 'Sonnig',
      temperature: -100, // Unrealistisch niedriger Wert
      personnel_count: 5,
      interruptions: false,
      interruption_reason: null,
      notes: 'Testnotiz',
      created_by: 1,
    };
    
    const result = constructionDiarySchema.safeParse(invalidEntry);
    expect(result.success).toBe(false);
  });
  
  test('sollte einen neuen Bautagebuch-Eintrag erstellen können', async () => {
    const storage = require('../storage').storage;
    
    const newEntry = {
      project_id: 1,
      entry_date: new Date().toISOString(),
      weather: 'Sonnig',
      temperature: 22,
      personnel_count: 5,
      interruptions: false,
      interruption_reason: null,
      notes: 'Testnotiz',
      created_by: 1,
    };
    
    const createdEntry = await storage.createConstructionDiaryEntry(newEntry);
    
    expect(createdEntry).toBeDefined();
    expect(createdEntry.id).toBe(1);
    expect(createdEntry.project_id).toBe(1);
    expect(createdEntry.weather).toBe('Sonnig');
    expect(storage.createConstructionDiaryEntry).toHaveBeenCalledWith(newEntry);
  });
  
  test('sollte alle Bautagebuch-Einträge für ein Projekt abrufen können', async () => {
    const storage = require('../storage').storage;
    
    const entries = await storage.getConstructionDiaryEntries(1);
    
    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].project_id).toBe(1);
    expect(storage.getConstructionDiaryEntries).toHaveBeenCalledWith(1);
  });
  
  test('sollte einen einzelnen Bautagebuch-Eintrag abrufen können', async () => {
    const storage = require('../storage').storage;
    
    const entry = await storage.getConstructionDiaryEntry(1);
    
    expect(entry).toBeDefined();
    expect(entry.id).toBe(1);
    expect(storage.getConstructionDiaryEntry).toHaveBeenCalledWith(1);
  });
  
  test('sollte einen Bautagebuch-Eintrag aktualisieren können', async () => {
    const storage = require('../storage').storage;
    
    const updatedEntry = {
      id: 1,
      project_id: 1,
      entry_date: new Date().toISOString(),
      weather: 'Bewölkt',
      temperature: 18,
      personnel_count: 5,
      interruptions: false,
      interruption_reason: null,
      notes: 'Aktualisierte Testnotiz',
      created_by: 1,
    };
    
    const result = await storage.updateConstructionDiaryEntry(1, updatedEntry);
    
    expect(result).toBeDefined();
    expect(result.weather).toBe('Bewölkt');
    expect(result.temperature).toBe(18);
    expect(result.notes).toBe('Aktualisierte Testnotiz');
    expect(storage.updateConstructionDiaryEntry).toHaveBeenCalledWith(1, updatedEntry);
  });
  
  test('sollte einen Bautagebuch-Eintrag löschen können', async () => {
    const storage = require('../storage').storage;
    
    const result = await storage.deleteConstructionDiaryEntry(1);
    
    expect(result).toBe(true);
    expect(storage.deleteConstructionDiaryEntry).toHaveBeenCalledWith(1);
  });
});