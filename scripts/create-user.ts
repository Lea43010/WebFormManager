/**
 * Skript zum Erstellen eines neuen Benutzers
 * 
 * Dieses Skript erstellt einen neuen Benutzer mit den angegebenen Daten
 * und hasht dabei das Passwort sicher.
 * 
 * Verwendung:
 * npx tsx scripts/create-user.ts
 */

import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { sql, drizzleSql } from '../server/db';

// Parameter für den neuen Benutzer
const NEW_USER = {
  username: 'rkuisle',
  password: '4bc979e3495b7c93aa70', // Temporäres Passwort
  user_name: 'René Kuisle',
  user_email: 'Rene.Kuisle@netz-germany.de',
  role: 'benutzer',
  created_by: 1, // Admin-Benutzer
  gdpr_consent: true
};

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function createUser() {
  try {
    console.log(`Erstelle Benutzer ${NEW_USER.username}...`);
    
    // Prüfen, ob der Benutzer bereits existiert
    const checkResult = await sql`
      SELECT username FROM tbluser WHERE username = ${NEW_USER.username}
    `;
    
    if (checkResult.length > 0) {
      console.error(`Fehler: Benutzer "${NEW_USER.username}" existiert bereits!`);
      process.exit(1);
    }
    
    // Passwort hashen
    const hashedPassword = await hashPassword(NEW_USER.password);
    
    // Ablaufdatum der Testphase (4 Wochen ab heute)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 28);
    
    // Benutzer einfügen
    const result = await sql`
      INSERT INTO tbluser (
        username, 
        password, 
        user_name, 
        user_email, 
        role, 
        created_by, 
        gdpr_consent, 
        trial_end_date,
        subscription_status
      ) 
      VALUES (
        ${NEW_USER.username}, 
        ${hashedPassword}, 
        ${NEW_USER.user_name}, 
        ${NEW_USER.user_email}, 
        ${NEW_USER.role}, 
        ${NEW_USER.created_by}, 
        ${NEW_USER.gdpr_consent}, 
        ${trialEndDate}, 
        'trial'
      )
      RETURNING id, username, user_name, user_email, role, trial_end_date
    `;
    
    const newUser = result[0];
    
    console.log(`✅ Benutzer erfolgreich erstellt:`);
    console.log(`Username: ${newUser.username}`);
    console.log(`Name: ${newUser.user_name}`);
    console.log(`E-Mail: ${newUser.user_email}`);
    console.log(`Rolle: ${newUser.role}`);
    console.log(`Testphase endet am: ${trialEndDate.toLocaleDateString('de-DE')}`);
    console.log(`\nTemporäres Passwort: ${NEW_USER.password}`);
    console.log(`\nBitte fordern Sie den Benutzer auf, das Passwort nach der ersten Anmeldung zu ändern.`);
    
  } catch (error) {
    console.error('Fehler beim Erstellen des Benutzers:', error);
    process.exit(1);
  }
}

// Skript ausführen
createUser().catch(console.error).finally(() => {
  // Verbindung beenden
  process.exit(0);
});