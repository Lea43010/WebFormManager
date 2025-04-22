/**
 * Dieses Skript testet die Verbindung zum Brevo API-Dienst.
 * Es sendet eine Test-E-Mail, um zu überprüfen, ob der API-Schlüssel korrekt funktioniert.
 */

import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module Hilfsvariablen
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Umgebungsvariablen laden
dotenv.config();

// Argumente aus Befehlszeile
const email = process.argv[2] || 'lea.zimmer@gmx.net';

// API-Schlüssel aus Umgebungsvariablen
const apiKey = process.env.BREVO_API_KEY;

if (!apiKey) {
  console.error('\n❌ FEHLER: Kein Brevo API-Schlüssel in den Umgebungsvariablen gefunden.');
  console.error('Bitte setzen Sie die Umgebungsvariable BREVO_API_KEY.\n');
  process.exit(1);
}

console.log(`\n🔑 Brevo API-Schlüssel gefunden: ${apiKey.substring(0, 8)}...`);
console.log(`📧 Sende Test-E-Mail an: ${email}`);

// Konfiguriere Brevo API
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKeyAuth = defaultClient.authentications['api-key'];
apiKeyAuth.apiKey = apiKey;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

// E-Mail-Konfiguration
sendSmtpEmail.subject = 'Test der Brevo API - Bau-Structura App';
sendSmtpEmail.htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brevo API Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #3b82f6;
      color: white;
      padding: 15px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      padding: 20px;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 5px 5px;
    }
    .footer {
      font-size: 12px;
      color: #666;
      text-align: center;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>Brevo API Verbindungstest</h2>
  </div>
  <div class="content">
    <p>Sehr geehrter Empfänger,</p>
    <p>Diese E-Mail bestätigt, dass die Verbindung zur Brevo API erfolgreich hergestellt wurde!</p>
    <p>Dies bedeutet, dass:</p>
    <ul>
      <li>Der API-Schlüssel korrekt konfiguriert ist</li>
      <li>Die Domain <strong>bau-structura.de</strong> authentifiziert ist</li>
      <li>Die E-Mail-Funktionalität der Bau-Structura App einsatzbereit ist</li>
    </ul>
    <p>Datum und Uhrzeit: ${new Date().toLocaleString('de-DE')}</p>
    <p>Mit freundlichen Grüßen,<br>Ihr Bau-Structura Team</p>
  </div>
  <div class="footer">
    <p>Dies ist eine automatisch generierte Test-E-Mail. Bitte antworten Sie nicht auf diese Nachricht.</p>
    <p>© ${new Date().getFullYear()} Bau-Structura. Alle Rechte vorbehalten.</p>
  </div>
</body>
</html>
`;
sendSmtpEmail.sender = { name: 'Bau-Structura', email: 'info@bau-structura.de' };
sendSmtpEmail.to = [{ email: email }];
sendSmtpEmail.textContent = `
Brevo API Verbindungstest

Sehr geehrter Empfänger,

Diese E-Mail bestätigt, dass die Verbindung zur Brevo API erfolgreich hergestellt wurde!

Dies bedeutet, dass:
- Der API-Schlüssel korrekt konfiguriert ist
- Die Domain bau-structura.de authentifiziert ist
- Die E-Mail-Funktionalität der Bau-Structura App einsatzbereit ist

Datum und Uhrzeit: ${new Date().toLocaleString('de-DE')}

Mit freundlichen Grüßen,
Ihr Bau-Structura Team

---
Dies ist eine automatisch generierte Test-E-Mail. Bitte antworten Sie nicht auf diese Nachricht.
© ${new Date().getFullYear()} Bau-Structura. Alle Rechte vorbehalten.
`;

// Sende E-Mail
apiInstance.sendTransacEmail(sendSmtpEmail)
  .then(data => {
    console.log('\n✅ E-Mail erfolgreich gesendet!');
    console.log(`📊 Brevo API-Antwort: ${JSON.stringify(data)}`);
    console.log(`\n🔍 Überprüfen Sie den Posteingang von ${email}, um die Test-E-Mail zu bestätigen.\n`);
  })
  .catch(error => {
    console.error('\n❌ Fehler beim Senden der E-Mail:');
    console.error(error.response?.text || error.message || error);
    
    // Spezifischere Fehleranalyse
    if (error.response?.text) {
      try {
        const errorData = JSON.parse(error.response.text);
        if (errorData.code === 'unauthorized') {
          console.error('\n🔑 Der API-Schlüssel scheint ungültig zu sein. Bitte überprüfen Sie den Schlüssel im Brevo-Dashboard.');
        } else if (errorData.message?.includes('sender email')) {
          console.error('\n📧 Die Absender-E-Mail ist nicht verifiziert. Bitte verifizieren Sie die Domain in Ihrem Brevo-Konto.');
        }
      } catch (e) {
        // Fehler beim Parsen der Fehlermeldung, ignorieren
      }
    }
    
    console.error('\nBitte überprüfen Sie:');
    console.error('1. Ob der API-Schlüssel korrekt ist (beginnt mit "xkeysib-")');
    console.error('2. Ob die Domain "bau-structura.de" in Ihrem Brevo-Konto verifiziert ist');
    console.error('3. Ob Ihr Brevo-Konto aktiv ist und über ausreichende Guthaben verfügt\n');
  });