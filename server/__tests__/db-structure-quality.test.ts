import { DataQualityChecker } from '../data-quality-checker';
import { DbStructureQualityChecker } from '../db-structure-quality';

// Mocking der Datenbank-Abfrage-Funktionen
jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('DbStructureQualityChecker', () => {
  let dbStructureQualityChecker: DbStructureQualityChecker;
  
  beforeEach(() => {
    // Zurücksetzen der Mocks zwischen den Tests
    jest.clearAllMocks();
    
    // Instanz der Klasse erstellen
    dbStructureQualityChecker = new DbStructureQualityChecker();
  });
  
  test('sollte eine Instanz von DataQualityChecker sein', () => {
    expect(dbStructureQualityChecker).toBeInstanceOf(DataQualityChecker);
  });
  
  test('sollte Qualitätsregeln haben', () => {
    expect(dbStructureQualityChecker.rules).toBeDefined();
    expect(Array.isArray(dbStructureQualityChecker.rules)).toBe(true);
    expect(dbStructureQualityChecker.rules.length).toBeGreaterThan(0);
  });
  
  test('sollte Namensregeln für Tabellen enthalten', () => {
    const tableNameRules = dbStructureQualityChecker.rules.find(
      rule => rule.name.includes('Tabellennamen')
    );
    
    expect(tableNameRules).toBeDefined();
  });
  
  test('sollte Regeln für Primärschlüssel enthalten', () => {
    const primaryKeyRules = dbStructureQualityChecker.rules.find(
      rule => rule.name.includes('Primärschlüssel')
    );
    
    expect(primaryKeyRules).toBeDefined();
  });
  
  test('sollte Regeln für Fremdschlüssel enthalten', () => {
    const foreignKeyRules = dbStructureQualityChecker.rules.find(
      rule => rule.name.includes('Fremdschlüssel')
    );
    
    expect(foreignKeyRules).toBeDefined();
  });
  
  test('sollte eine gültige ID-Struktur haben', () => {
    expect(dbStructureQualityChecker.id).toMatch(/^db-structure-quality-/);
  });
  
  test('sollte einen validen HTML-Report generieren können', async () => {
    // Mock für die Tabellenliste
    const mockTables = [
      { table_name: 'tbluser', table_schema: 'public' },
      { table_name: 'tblproject', table_schema: 'public' }
    ];
    
    // Mock für die Spalteninformationen
    const mockColumns = [
      { table_name: 'tbluser', column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
      { table_name: 'tbluser', column_name: 'username', data_type: 'character varying', is_nullable: 'NO' },
      { table_name: 'tblproject', column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
      { table_name: 'tblproject', column_name: 'name', data_type: 'character varying', is_nullable: 'NO' }
    ];
    
    // Mock der Datenbankabfragen
    const db = require('../db');
    db.pool.query.mockImplementation((query: string) => {
      if (query.includes('SELECT table_name, table_schema FROM information_schema.tables')) {
        return Promise.resolve({ rows: mockTables });
      } else if (query.includes('SELECT table_name, column_name, data_type, is_nullable')) {
        return Promise.resolve({ rows: mockColumns });
      } else if (query.includes('SELECT tc.table_name, tc.constraint_name')) {
        return Promise.resolve({ rows: [] });
      } else if (query.includes('SELECT tc.table_name, kcu.column_name')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });
    
    // HTML-Report generieren
    const htmlReport = await dbStructureQualityChecker.generateHtmlReport();
    
    // Prüfen, ob der HTML-Report gültige Daten enthält
    expect(htmlReport).toContain('<!DOCTYPE html>');
    expect(htmlReport).toContain('<html');
    expect(htmlReport).toContain('Datenbankstruktur-Qualitätsbericht');
    expect(htmlReport).toContain('tbluser');
    expect(htmlReport).toContain('tblproject');
  });
  
  test('sollte einen validen JSON-Report generieren können', async () => {
    // Mock für die Tabellenliste
    const mockTables = [
      { table_name: 'tbluser', table_schema: 'public' },
      { table_name: 'tblproject', table_schema: 'public' }
    ];
    
    // Mock für die Spalteninformationen
    const mockColumns = [
      { table_name: 'tbluser', column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
      { table_name: 'tbluser', column_name: 'username', data_type: 'character varying', is_nullable: 'NO' },
      { table_name: 'tblproject', column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
      { table_name: 'tblproject', column_name: 'name', data_type: 'character varying', is_nullable: 'NO' }
    ];
    
    // Mock der Datenbankabfragen
    const db = require('../db');
    db.pool.query.mockImplementation((query: string) => {
      if (query.includes('SELECT table_name, table_schema FROM information_schema.tables')) {
        return Promise.resolve({ rows: mockTables });
      } else if (query.includes('SELECT table_name, column_name, data_type, is_nullable')) {
        return Promise.resolve({ rows: mockColumns });
      } else if (query.includes('SELECT tc.table_name, tc.constraint_name')) {
        return Promise.resolve({ rows: [] });
      } else if (query.includes('SELECT tc.table_name, kcu.column_name')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });
    
    // JSON-Report generieren
    const jsonReport = await dbStructureQualityChecker.generateJsonReport();
    
    // Prüfen, ob der JSON-Report gültige Daten enthält
    expect(jsonReport).toBeDefined();
    expect(jsonReport.tables).toBeDefined();
    expect(jsonReport.tables.length).toBe(2);
    expect(jsonReport.rules).toBeDefined();
    expect(jsonReport.columns).toBeDefined();
    expect(jsonReport.status).toBe('success');
  });
});