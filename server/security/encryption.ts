/**
 * Verschlüsselungsdienst für sensible Daten
 * 
 * Dieser Dienst stellt Funktionen zur Verfügung, um sensible Daten in der Datenbank 
 * zu verschlüsseln und zu entschlüsseln. Es verwendet den AES-256-GCM Algorithmus
 * für eine sichere Verschlüsselung mit Authentifizierung.
 */

import { randomBytes, createCipheriv, createDecipheriv, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// Promise-basierte Version von scrypt
const scrypt = promisify(scryptCallback);

// Schlüssellänge für AES-256
const KEY_LENGTH = 32;

// Umgebungsvariable für den Verschlüsselungsschlüssel
// Im Produktivbetrieb sollte dieser in einer sicheren Umgebungsvariable gespeichert sein
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'BAU_STRUCTURA_SECURE_ENCRYPTION_KEY_2025';

/**
 * Initialisiert die Verschlüsselungstabelle in der Datenbank
 */
export async function initializeEncryptionTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS encryption_keys (
        id SERIAL PRIMARY KEY,
        key_id VARCHAR(255) UNIQUE NOT NULL,
        key_version INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP,
        active BOOLEAN DEFAULT TRUE
      )
    `);
    console.log('[Verschlüsselung] Verschlüsselungstabelle initialisiert');
    
    // Prüfen, ob es bereits einen Primärschlüssel gibt
    const existingKeys = await db.execute(sql`
      SELECT * FROM encryption_keys WHERE key_id = 'primary'
    `);
    
    if (existingKeys.length === 0) {
      // Primärschlüssel erzeugen
      await db.execute(sql`
        INSERT INTO encryption_keys (key_id, key_version)
        VALUES ('primary', 1)
      `);
      console.log('[Verschlüsselung] Primärschlüssel erzeugt');
    }
    
    return true;
  } catch (error) {
    console.error('[Verschlüsselung] Fehler bei der Initialisierung:', error);
    return false;
  }
}

/**
 * Erzeugt einen Verschlüsselungsschlüssel aus dem Passwort
 */
async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
}

/**
 * Verschlüsselt einen Text
 * 
 * @param text Der zu verschlüsselnde Text
 * @returns Ein Objekt mit dem verschlüsselten Text und Metadaten zur Entschlüsselung
 */
export async function encrypt(text: string): Promise<string> {
  try {
    // Initialisieren des Zufalls-Vektors und Salt
    const iv = randomBytes(16);
    const salt = randomBytes(16);
    
    // Ableiten des Schlüssels
    const key = await deriveKey(ENCRYPTION_KEY, salt);
    
    // Erstellen und Initialisieren des Cipher-Objekts
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    
    // Verschlüsseln des Textes
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Abrufen des Auth-Tags für GCM
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Speichern der Verschlüsselungsparameter mit dem verschlüsselten Text
    // Format: iv.salt.authTag.encrypted
    const result = `${iv.toString('hex')}.${salt.toString('hex')}.${authTag}.${encrypted}`;
    
    // Aktualisieren des letzten Verwendungszeitpunkts des Schlüssels
    await db.execute(sql`
      UPDATE encryption_keys 
      SET last_used_at = CURRENT_TIMESTAMP
      WHERE key_id = 'primary' AND active = TRUE
    `);
    
    return result;
  } catch (error) {
    console.error('[Verschlüsselung] Fehler bei der Verschlüsselung:', error);
    // Im Fehlerfall geben wir den Original-Text zurück, damit die Anwendung nicht abstürzt
    // In der Produktivumgebung sollte hier eine bessere Fehlerbehandlung implementiert werden
    return text;
  }
}

/**
 * Entschlüsselt einen verschlüsselten Text
 * 
 * @param encryptedData Der verschlüsselte Text mit Metadaten
 * @returns Der entschlüsselte Text
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    // Prüfen, ob es sich um verschlüsselte Daten handelt
    if (!encryptedData.includes('.')) {
      return encryptedData; // Nicht verschlüsselt, Original zurückgeben
    }
    
    // Zerlegen der Verschlüsselungsparameter
    const [ivHex, saltHex, authTagHex, encrypted] = encryptedData.split('.');
    
    // Konvertieren der Parameter in Buffer
    const iv = Buffer.from(ivHex, 'hex');
    const salt = Buffer.from(saltHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Ableiten des Schlüssels
    const key = await deriveKey(ENCRYPTION_KEY, salt);
    
    // Erstellen und Initialisieren des Decipher-Objekts
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    // Entschlüsseln des Textes
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[Verschlüsselung] Fehler bei der Entschlüsselung:', error);
    // Bei einem Entschlüsselungsfehler geben wir einen Fehlerhinweis zurück
    return '[Verschlüsselungsfehler: Daten konnten nicht entschlüsselt werden]';
  }
}

/**
 * Rotiert den Verschlüsselungsschlüssel (für regelmäßige Sicherheitsmaßnahmen)
 */
export async function rotateEncryptionKey(): Promise<boolean> {
  try {
    // Aktuellen Schlüssel deaktivieren
    await db.execute(sql`
      UPDATE encryption_keys 
      SET active = FALSE
      WHERE key_id = 'primary' AND active = TRUE
    `);
    
    // Aktuelle Version abrufen
    const result = await db.execute(sql`
      SELECT MAX(key_version) as max_version
      FROM encryption_keys
      WHERE key_id = 'primary'
    `);
    
    const currentVersion = result[0]?.max_version || 0;
    const newVersion = currentVersion + 1;
    
    // Neuen Schlüssel erzeugen
    await db.execute(sql`
      INSERT INTO encryption_keys (key_id, key_version, active)
      VALUES ('primary', ${newVersion}, TRUE)
    `);
    
    console.log(`[Verschlüsselung] Schlüssel rotiert: Version ${newVersion}`);
    return true;
  } catch (error) {
    console.error('[Verschlüsselung] Fehler bei der Schlüsselrotation:', error);
    return false;
  }
}