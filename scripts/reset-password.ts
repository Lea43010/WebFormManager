/**
 * Skript zum Zurücksetzen des Passworts eines Benutzers
 * 
 * Dieses Skript setzt das Passwort eines existierenden Benutzers zurück und
 * generiert ein neues temporäres Passwort.
 * 
 * Verwendung:
 * npx tsx scripts/reset-password.ts --username [username]
 */

import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { sql } from '../server/db';

// Kommandozeilenargumente parsen
const args = process.argv.slice(2);
let username = '';

for (let i = 0; i < args.length; i += 2) {
  const arg = args[i];
  const value = args[i + 1];
  
  if (arg === '--username') username = value;
}

// Prüfen, ob erforderliche Parameter vorhanden sind
if (!username) {
  console.error('Fehler: Benutzername ist erforderlich!');
  console.log('Verwendung: npx tsx scripts/reset-password.ts --username [username]');
  process.exit(1);
}

// Zufälliges Passwort generieren
const temporaryPassword = randomBytes(10).toString('hex');

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function resetPassword() {
  try {
    console.log(`Prüfe Benutzer ${username}...`);
    
    // Prüfen, ob der Benutzer existiert
    const checkResult = await sql`
      SELECT id, username, user_name, user_email FROM tbluser WHERE username = ${username}
    `;
    
    if (checkResult.length === 0) {
      console.error(`Fehler: Benutzer "${username}" existiert nicht!`);
      process.exit(1);
    }
    
    const user = checkResult[0];
    
    // Passwort hashen
    const hashedPassword = await hashPassword(temporaryPassword);
    
    // Passwort aktualisieren
    await sql`
      UPDATE tbluser
      SET password = ${hashedPassword}
      WHERE id = ${user.id}
    `;
    
    console.log(`✅ Passwort für Benutzer ${user.username} wurde zurückgesetzt:`);
    console.log(`Name: ${user.user_name}`);
    console.log(`E-Mail: ${user.user_email}`);
    console.log(`\nNeues temporäres Passwort: ${temporaryPassword}`);
    console.log(`\nBitte fordern Sie den Benutzer auf, das Passwort nach der ersten Anmeldung zu ändern.`);
    
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Passworts:', error);
    process.exit(1);
  }
}

// Skript ausführen
resetPassword().catch(console.error).finally(() => {
  // Verbindung beenden
  process.exit(0);
});