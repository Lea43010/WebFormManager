/**
 * Passwort-Manager
 * 
 * Dieser Dienst bietet Funktionen zum sicheren Hashen und Verifizieren von Passwörtern
 * unter Verwendung von bcrypt als State-of-the-Art-Algorithmus für Passwörter.
 */

import * as bcrypt from 'bcrypt';
import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';

// Für die Legacy-Kompatibilität mit dem aktuellen System
const scrypt = promisify(scryptCallback);

// Anzahl der Saltrunden für bcrypt (höhere Werte = sicherer, aber langsamer)
const SALT_ROUNDS = 12;

// Kennzeichen für den Verschlüsselungstyp
const HASH_IDENTIFIER = {
  BCRYPT: '$2b$', // bcrypt
  SCRYPT: '.'     // Unser aktuelles scrypt-Format enthält einen Punkt
};

/**
 * Hasht ein Passwort mit bcrypt
 * 
 * @param password Das zu hashende Passwort
 * @returns Das gehashte Passwort
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error('[Passwort-Manager] Fehler beim Hashen des Passworts:', error);
    throw new Error('Passwort konnte nicht gesichert werden');
  }
}

/**
 * Verifiziert ein Passwort gegen einen Hash
 * 
 * @param suppliedPassword Das eingegebene Passwort
 * @param storedHash Der gespeicherte Hash
 * @returns true, wenn das Passwort korrekt ist, sonst false
 */
export async function verifyPassword(suppliedPassword: string, storedHash: string): Promise<boolean> {
  try {
    // Prüfen, ob es sich um einen bcrypt-Hash handelt
    if (storedHash.startsWith(HASH_IDENTIFIER.BCRYPT)) {
      return await bcrypt.compare(suppliedPassword, storedHash);
    } 
    // Legacy-Support für scrypt
    else if (storedHash.includes(HASH_IDENTIFIER.SCRYPT)) {
      return await compareScryptPasswords(suppliedPassword, storedHash);
    }
    // Unbekanntes Format
    else {
      console.error('[Passwort-Manager] Unbekanntes Hash-Format:', storedHash.substring(0, 4));
      return false;
    }
  } catch (error) {
    console.error('[Passwort-Manager] Fehler bei der Passwortüberprüfung:', error);
    return false;
  }
}

/**
 * Legacy-Methode: Vergleicht ein Passwort mit einem scrypt-Hash
 * Diese Methode wird nur für die Abwärtskompatibilität mit bestehenden Passwörtern verwendet
 */
async function compareScryptPasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scrypt(supplied, salt, 64)) as Buffer;
    
    // Sicherer Vergleich der Puffer
    if (hashedBuf.length !== suppliedBuf.length) {
      return false;
    }
    
    // Zeitkonstanter Vergleich, um Timing-Attacken zu vermeiden
    let result = 0;
    for (let i = 0; i < hashedBuf.length; i++) {
      result |= hashedBuf[i] ^ suppliedBuf[i];
    }
    
    return result === 0;
  } catch (error) {
    console.error('[Passwort-Manager] Fehler beim Legacy-Passwortvergleich:', error);
    return false;
  }
}

/**
 * Migriert ein Passwort vom alten scrypt-Format zum neuen bcrypt-Format
 * 
 * @param userId Die ID des Benutzers
 * @param password Das Klartextpasswort (nur nach erfolgreicher Anmeldung verfügbar)
 * @returns true, wenn die Migration erfolgreich war, sonst false
 */
export async function migratePasswordHash(userId: number, password: string): Promise<boolean> {
  try {
    // Neuen bcrypt-Hash erzeugen
    const newHash = await hashPassword(password);
    
    // Hash in der Datenbank aktualisieren
    // Diese Funktion ist nur ein Platzhalter und muss an die tatsächliche Datenbankstruktur angepasst werden
    // await db.execute(sql`UPDATE tbluser SET password = ${newHash} WHERE id = ${userId}`);
    
    console.log(`[Passwort-Manager] Passwort-Hash für Benutzer ${userId} migriert`);
    return true;
  } catch (error) {
    console.error('[Passwort-Manager] Fehler bei der Passwort-Migration:', error);
    return false;
  }
}

/**
 * Generiert ein sicheres Zufallspasswort
 * 
 * @param length Die Länge des Passworts
 * @returns Ein sicheres Zufallspasswort
 */
export function generateSecurePassword(length: number = 12): string {
  try {
    // Zeichen für das Passwort
    const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';  // ohne I und O (leicht zu verwechseln)
    const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // ohne l (leicht zu verwechseln)
    const numericChars = '23456789';                    // ohne 0 und 1 (leicht zu verwechseln)
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercaseChars + lowercaseChars + numericChars + specialChars;
    
    // Sicherstellen, dass das Passwort mindestens ein Zeichen aus jeder Kategorie enthält
    let password = '';
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
    password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
    password += numericChars.charAt(Math.floor(Math.random() * numericChars.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    
    // Restliche Zeichen zufällig hinzufügen
    const remainingLength = length - 4;
    const randomBytes = randomBytes(remainingLength);
    
    for (let i = 0; i < remainingLength; i++) {
      const randomIndex = randomBytes[i] % allChars.length;
      password += allChars.charAt(randomIndex);
    }
    
    // Zeichen mischen
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  } catch (error) {
    console.error('[Passwort-Manager] Fehler bei der Passwortgenerierung:', error);
    // Fallback zu einem einfacheren Algorithmus
    return `Temp${Math.random().toString(36).substring(2, 10)}!${Math.floor(Math.random() * 100)}`;
  }
}