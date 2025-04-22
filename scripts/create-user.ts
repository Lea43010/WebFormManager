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
import { db } from '../server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
    const existingUser = await db.select().from(users).where(eq(users.username, NEW_USER.username));
    
    if (existingUser.length > 0) {
      console.error(`Fehler: Benutzer "${NEW_USER.username}" existiert bereits!`);
      process.exit(1);
    }
    
    // Passwort hashen
    const hashedPassword = await hashPassword(NEW_USER.password);
    
    // Aktuelle Zeit für Registrierungsdatum
    const now = new Date();
    
    // Ablaufdatum der Testphase (4 Wochen ab heute)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 28);
    
    // Benutzer einfügen
    const [newUser] = await db.insert(users).values({
      username: NEW_USER.username,
      password: hashedPassword,
      user_name: NEW_USER.user_name,
      user_email: NEW_USER.user_email,
      role: NEW_USER.role,
      created_by: NEW_USER.created_by,
      gdpr_consent: NEW_USER.gdpr_consent,
      trial_end_date: trialEndDate,
      subscription_status: 'trial' // Testphase
    }).returning();
    
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