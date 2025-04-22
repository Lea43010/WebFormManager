/**
 * Skript zum Senden einer Willkommens-E-Mail an einen neuen Benutzer
 * 
 * Dieses Skript sendet eine Willkommens-E-Mail an den angegebenen Benutzer
 * mit seinen Zugangsdaten und wichtigen Informationen zur Anwendung.
 * 
 * Verwendung:
 * npx tsx scripts/send-welcome-email.ts --username [username] --name [name] --email [email] --password [password]
 */

import { emailService } from '../server/email-service';
import { db } from '../server/db';
import config from '../config';

// Kommandozeilenargumente parsen
const args = process.argv.slice(2);
let username = '';
let user_name = '';
let user_email = '';
let password = '';

for (let i = 0; i < args.length; i += 2) {
  const arg = args[i];
  const value = args[i + 1];
  
  if (arg === '--username') username = value;
  if (arg === '--name') user_name = value;
  if (arg === '--email') user_email = value;
  if (arg === '--password') password = value;
}

// Wenn keine Parameter angegeben wurden, Standard-Werte verwenden
// (letzte gesendete E-Mail)
if (!username && !user_name && !user_email && !password) {
  username = 'aeisenmann';
  user_name = 'Alexander Eisenmann';
  user_email = 'alexandereisenmann@sachverstandigenburojustiti.onmicrosoft.com';
  password = 'a7f681da9824f3dc6b43';
}

// Prüfen, ob erforderliche Parameter vorhanden sind
if (!username || !user_name || !user_email || !password) {
  console.error('Fehler: Erforderliche Parameter fehlen!');
  console.log('Verwendung: npx tsx scripts/send-welcome-email.ts --username [username] --name [name] --email [email] --password [password]');
  process.exit(1);
}

// Parameter für den Benutzer
const USER_INFO = {
  username,
  user_name,
  user_email,
  password,
};

async function sendWelcomeEmail() {
  try {
    console.log(`Sende Willkommens-E-Mail an ${USER_INFO.user_email}...`);
    
    // Aktuelles Datum für Anrede formatieren
    const heute = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // HTML für die E-Mail erstellen
    const htmlContent = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        h1 { color: #2563eb; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .highlight { background-color: #f4f4f4; padding: 10px; border-radius: 4px; margin: 15px 0; }
        .credentials { font-family: Consolas, monospace; font-weight: bold; }
        .note { font-size: 0.9em; background-color: #fdf6e3; padding: 10px; border-left: 4px solid #e5c07b; margin: 15px 0; }
        .footer { margin-top: 30px; font-size: 0.9em; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Willkommen bei Bau - Structura App</h1>
        
        <p>Sehr geehrter Herr ${USER_INFO.user_name},</p>
        
        <p>wir freuen uns, Sie als neuen Benutzer der Bau - Structura App begrüßen zu dürfen. Ihr Konto wurde erfolgreich eingerichtet und ist ab sofort einsatzbereit.</p>
        
        <div class="highlight">
          <h3>Ihre Zugangsdaten:</h3>
          <p><strong>Benutzername:</strong> <span class="credentials">${USER_INFO.username}</span></p>
          <p><strong>Temporäres Passwort:</strong> <span class="credentials">${USER_INFO.password}</span></p>
          <p><strong>Login-URL:</strong> <a href="${config.APP_URL}">${config.APP_URL}</a></p>
        </div>
        
        <div class="note">
          <p><strong>Wichtig:</strong> Bitte ändern Sie aus Sicherheitsgründen Ihr Passwort nach der ersten Anmeldung.</p>
        </div>
        
        <h3>Die wichtigsten Funktionen im Überblick:</h3>
        <ul>
          <li>Projektübersicht und -verwaltung</li>
          <li>Bautagebuch mit automatischer Speicherung</li>
          <li>Meilensteinkontrolle und Terminplanung</li>
          <li>Filemanagement und Dokumentenablage</li>
          <li>Oberflächenanalyse mit KI-Unterstützung</li>
          <li>Bedarfs- und Kapazitätsplanung</li>
        </ul>
        
        <p>Sollten Sie Fragen zur Nutzung der Anwendung haben oder auf Probleme stoßen, steht Ihnen unser Support-Team gerne zur Verfügung.</p>
        
        <p>Wir wünschen Ihnen viel Erfolg bei der Nutzung der Bau - Structura App!</p>
        
        <p>Mit freundlichen Grüßen,<br>
        Ihr Bau - Structura App Team</p>
        
        <div class="footer">
          <p>Diese E-Mail wurde am ${heute} automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Text-Version für E-Mail-Clients, die kein HTML anzeigen
    const textContent = `
Willkommen bei Bau - Structura App

Sehr geehrter Herr ${USER_INFO.user_name},

wir freuen uns, Sie als neuen Benutzer der Bau - Structura App begrüßen zu dürfen. Ihr Konto wurde erfolgreich eingerichtet und ist ab sofort einsatzbereit.

Ihre Zugangsdaten:
- Benutzername: ${USER_INFO.username}
- Temporäres Passwort: ${USER_INFO.password}
- Login-URL: ${config.APP_URL}

Wichtig: Bitte ändern Sie aus Sicherheitsgründen Ihr Passwort nach der ersten Anmeldung.

Die wichtigsten Funktionen im Überblick:
* Projektübersicht und -verwaltung
* Bautagebuch mit automatischer Speicherung
* Meilensteinkontrolle und Terminplanung
* Filemanagement und Dokumentenablage
* Oberflächenanalyse mit KI-Unterstützung
* Bedarfs- und Kapazitätsplanung

Sollten Sie Fragen zur Nutzung der Anwendung haben oder auf Probleme stoßen, steht Ihnen unser Support-Team gerne zur Verfügung.

Wir wünschen Ihnen viel Erfolg bei der Nutzung der Bau - Structura App!

Mit freundlichen Grüßen,
Ihr Bau - Structura App Team

---
Diese E-Mail wurde am ${heute} automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
    `;
    
    // E-Mail an Benutzer senden
    const result = await emailService.sendEmail({
      to: USER_INFO.user_email,
      subject: 'Willkommen bei Bau - Structura App - Ihre Zugangsdaten',
      html: htmlContent,
      text: textContent
    });
    
    // Kopie an Administrator senden
    const adminResult = await emailService.sendEmail({
      to: 'lea.zimmer@gmx.net',
      subject: `[KOPIE] Willkommen bei Bau - Structura App - Zugangsdaten für ${USER_INFO.username}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Kopie der Willkommens-E-Mail</h2>
          <p>Diese E-Mail ist eine Kopie der Willkommens-E-Mail, die an ${USER_INFO.user_name} (${USER_INFO.user_email}) gesendet wurde.</p>
          <p><strong>Erstellt für Benutzer:</strong> ${USER_INFO.username}</p>
          <p><strong>Erstellt am:</strong> ${heute}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          ${htmlContent}
        </div>
      `,
      text: `KOPIE der Willkommens-E-Mail für ${USER_INFO.username}\n\nErstellt am: ${heute}\n\n${textContent}`
    });
    
    if (result) {
      console.log(`✅ Willkommens-E-Mail erfolgreich an ${USER_INFO.user_email} gesendet.`);
      
      if (adminResult) {
        console.log(`✅ Kopie der Willkommens-E-Mail erfolgreich an lea.zimmer@gmx.net gesendet.`);
      } else {
        console.error(`❌ Fehler beim Senden der Kopie der Willkommens-E-Mail an den Administrator.`);
      }
    } else {
      console.error(`❌ Fehler beim Senden der Willkommens-E-Mail.`);
    }
    
  } catch (error) {
    console.error('Fehler beim Senden der Willkommens-E-Mail:', error);
    process.exit(1);
  }
}

// Skript ausführen
sendWelcomeEmail().catch(console.error).finally(() => {
  // Verbindung beenden
  process.exit(0);
});