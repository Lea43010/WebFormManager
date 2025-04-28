/**
 * Skript zum Zurücksetzen des Passworts eines Benutzers
 * 
 * Dieses Skript setzt das Passwort eines existierenden Benutzers zurück,
 * generiert ein neues temporäres Passwort und sendet eine E-Mail mit den
 * Zugangsdaten über das robuste E-Mail-System.
 * 
 * Verwendung:
 * npx tsx scripts/reset-password.ts --username [username] [--temp-password [password]]
 */

import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { sql } from '../server/db';
import { emailService } from '../server/email-service';
import config from '../config';

// Kommandozeilenargumente parsen
const args = process.argv.slice(2);
let username = '';
let providedPassword = '';

for (let i = 0; i < args.length; i += 2) {
  const arg = args[i];
  const value = args[i + 1];
  
  if (arg === '--username') username = value;
  if (arg === '--temp-password') providedPassword = value;
}

// Prüfen, ob erforderliche Parameter vorhanden sind
if (!username) {
  console.error('Fehler: Benutzername ist erforderlich!');
  console.log('Verwendung: npx tsx scripts/reset-password.ts --username [username] [--temp-password [password]]');
  process.exit(1);
}

// Zufälliges Passwort generieren oder das übergebene verwenden
const temporaryPassword = providedPassword || randomBytes(10).toString('hex');

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Sendet eine E-Mail mit dem zurückgesetzten Passwort
 */
async function sendPasswordResetEmail(userEmail: string, userName: string, userUsername: string, tempPassword: string) {
  try {
    // HTML-E-Mail-Inhalt erstellen
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://bau-structura.de/logo.png" alt="Bau-Structura Logo" style="max-width: 150px;">
        </div>
        <h2 style="color: #333;">Ihr Passwort wurde zurückgesetzt</h2>
        <p>Hallo ${userName},</p>
        <p>Ihr Passwort für die Bau-Structura App wurde zurückgesetzt. Sie können sich mit den folgenden Zugangsdaten anmelden:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Benutzername:</strong> ${userUsername}</p>
          <p><strong>Temporäres Passwort:</strong> ${tempPassword}</p>
        </div>
        <p>Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung. So geht's:</p>
        <ol style="margin-top: 15px; margin-bottom: 25px; padding-left: 20px;">
          <li>Melden Sie sich mit dem temporären Passwort an</li>
          <li>Klicken Sie rechts oben auf Ihren Namen oder Ihr Benutzerbild</li>
          <li>Wählen Sie "Profil" im Dropdown-Menü</li>
          <li>Scrollen Sie zum Abschnitt "Passwort ändern"</li>
          <li>Geben Sie Ihr aktuelles temporäres Passwort ein</li>
          <li>Geben Sie Ihr neues Wunschpasswort zweimal ein</li>
          <li>Klicken Sie auf "Passwort ändern", um die Änderung zu speichern</li>
        </ol>
        <p style="margin-top: 30px;">
          <a href="https://bau-structura.de" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Zur Anmeldung
          </a>
        </p>
        <p style="margin-top: 30px; font-size: 12px; color: #777;">
          Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese Nachricht.
        </p>
      </div>
    `;

    // Text-Version für E-Mail-Clients, die kein HTML unterstützen
    const text = `
Ihr Passwort wurde zurückgesetzt
      
Hallo ${userName},

Ihr Passwort für die Bau-Structura App wurde zurückgesetzt. Sie können sich mit den folgenden Zugangsdaten anmelden:

Benutzername: ${userUsername}
Temporäres Passwort: ${tempPassword}

Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung. So geht's:

1. Melden Sie sich mit dem temporären Passwort an
2. Klicken Sie rechts oben auf Ihren Namen oder Ihr Benutzerbild
3. Wählen Sie "Profil" im Dropdown-Menü
4. Scrollen Sie zum Abschnitt "Passwort ändern"
5. Geben Sie Ihr aktuelles temporäres Passwort ein
6. Geben Sie Ihr neues Wunschpasswort zweimal ein
7. Klicken Sie auf "Passwort ändern", um die Änderung zu speichern

Anmelde-URL: https://bau-structura.de
    `;

    // E-Mail senden mit hoher Priorität
    const success = await emailService.sendEmail({
      to: userEmail,
      subject: 'Bau-Structura: Ihr Passwort wurde zurückgesetzt',
      html,
      text,
      highPriority: true
    });

    if (success) {
      console.log(`✅ E-Mail mit den Zugangsdaten an ${userEmail} gesendet`);
    } else {
      console.error(`⚠️ E-Mail konnte nicht gesendet werden. Bitte teilen Sie dem Benutzer die Zugangsdaten manuell mit.`);
    }
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    console.log(`⚠️ Bitte teilen Sie dem Benutzer die Zugangsdaten manuell mit.`);
  }
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
    
    // E-Mail mit Zugangsdaten senden
    await sendPasswordResetEmail(
      user.user_email, 
      user.user_name, 
      user.username, 
      temporaryPassword
    );

    console.log(`\nBitte fordern Sie den Benutzer auf, das Passwort nach der ersten Anmeldung zu ändern.`);
    
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Passworts:', error);
    process.exit(1);
  }
}

// Skript ausführen und dann 5 Sekunden warten, damit E-Mails verarbeitet werden können
resetPassword()
  .catch(console.error)
  .finally(() => {
    console.log('Warte auf E-Mail-Verarbeitung...');
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  });