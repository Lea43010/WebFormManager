import { createUserSchema } from '../../shared/schema';
import { hash } from '../auth';

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
  }
}));

describe('Benutzer-Management', () => {
  
  beforeEach(() => {
    // Zurücksetzen der Mocks zwischen den Tests
    jest.clearAllMocks();
  });
  
  test('sollte ein gültiges Benutzer-Schema haben', () => {
    expect(createUserSchema).toBeDefined();
    
    // Validiere ein gültiges Benutzerobjekt
    const validUser = {
      username: 'testuser',
      password: 'Test1234!',
      user_name: 'Test User',
      user_email: 'test@example.com',
      role: 'user',
    };
    
    const result = createUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });
  
  test('sollte ungültige E-Mail-Adressen erkennen', () => {
    const invalidUser = {
      username: 'testuser',
      password: 'Test1234!',
      user_name: 'Test User',
      user_email: 'invalid-email',
      role: 'user',
    };
    
    const result = createUserSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });
  
  test('sollte zu kurze Passwörter erkennen', () => {
    const userWithShortPassword = {
      username: 'testuser',
      password: 'short',
      user_name: 'Test User',
      user_email: 'test@example.com',
      role: 'user',
    };
    
    const result = createUserSchema.safeParse(userWithShortPassword);
    expect(result.success).toBe(false);
  });
  
  test('sollte ungültige Benutzerrollen erkennen', () => {
    const userWithInvalidRole = {
      username: 'testuser',
      password: 'Test1234!',
      user_name: 'Test User',
      user_email: 'test@example.com',
      role: 'invalid-role',
    };
    
    const result = createUserSchema.safeParse(userWithInvalidRole);
    expect(result.success).toBe(false);
  });
  
  test('sollte ein Passwort hashen können', async () => {
    const password = 'Test1234!';
    const hashedPassword = await hash(password);
    
    // Überprüfen ob das gehashte Passwort ein String ist und länger als das Originalpasswort
    expect(typeof hashedPassword).toBe('string');
    expect(hashedPassword.length).toBeGreaterThan(password.length);
    
    // Überprüfen ob es das erwartete Format hat (hash.salt)
    expect(hashedPassword).toContain('.');
  });
});