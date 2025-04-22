/**
 * Dieses Skript sendet eine Test-E-Mail an eine angegebene E-Mail-Adresse.
 * Es kann in Entwicklungs- und Testumgebungen verwendet werden.
 * 
 * Verwendung:
 * npx tsx scripts/send-test-email.ts --email "ziel@beispiel.de" [--subject "Betreff"] [--message "Nachricht"]
 */

import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import SibApiV3Sdk from 'sib-api-v3-sdk';
import fs from 'fs';
import config from '../config';

// Lade Umgebungsvariablen
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.development') });

// Konfiguriere Commander-Optionen
const program = new Command();
program
  .requiredOption('--email <email>', 'E-Mail-Adresse des Empfängers')
  .option('--subject <subject>', 'Betreff der E-Mail', 'Test-E-Mail von Bau-Structura')
  .option('--message <message>', 'Nachricht der E-Mail', 'Dies ist eine Test-E-Mail von der Bau-Structura App.')
  .parse();

const options = program.opts();

console.log('Sende Test-E-Mail an:', options.email);

// Funktion zum Senden einer E-Mail über Brevo API
async function sendEmailViaBrevo(
  to: string, 
  subject: string, 
  htmlContent: string, 
  textContent: string
): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.log('Kein Brevo API-Schlüssel gefunden. Simuliere E-Mail-Versand:');
    console.log('--------------------------------------------------');
    console.log(`Von: Bau-Structura <info@bau-structura.de>`);
    console.log(`An: ${to}`);
    console.log(`Betreff: ${subject}`);
    console.log(`Text-Inhalt: ${textContent}`);
    console.log(`HTML-Inhalt:`);
    console.log(htmlContent);
    console.log('--------------------------------------------------');
    return true;
  }

  try {
    // Konfiguriere Brevo API
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    // E-Mail-Konfiguration
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { name: 'Bau-Structura', email: 'info@bau-structura.de' };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.textContent = textContent;

    // Sende E-Mail
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('E-Mail erfolgreich gesendet:', result);
    return true;
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return false;
  }
}

// Erstelle E-Mail-Inhalte
const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.subject}</title>
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
    <h2>Bau-Structura Test-E-Mail</h2>
  </div>
  <div class="content">
    <p>Sehr geehrter Empfänger,</p>
    <p>${options.message}</p>
    <p>Diese E-Mail wurde von der Bau-Structura App gesendet, um die E-Mail-Funktionalität zu testen.</p>
    <p>Datum und Uhrzeit: ${new Date().toLocaleString('de-DE')}</p>
    <p>Anwendungs-URL: ${config.APP_URL}</p>
    <p>Mit freundlichen Grüßen,<br>Ihr Bau-Structura Team</p>
  </div>
  <div class="footer">
    <p>Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht auf diese Nachricht.</p>
    <p>© ${new Date().getFullYear()} Bau-Structura. Alle Rechte vorbehalten.</p>
  </div>
</body>
</html>
`;

const textContent = `
Bau-Structura Test-E-Mail

Sehr geehrter Empfänger,

${options.message}

Diese E-Mail wurde von der Bau-Structura App gesendet, um die E-Mail-Funktionalität zu testen.

Datum und Uhrzeit: ${new Date().toLocaleString('de-DE')}
Anwendungs-URL: ${config.APP_URL}

Mit freundlichen Grüßen,
Ihr Bau-Structura Team

---
Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht auf diese Nachricht.
© ${new Date().getFullYear()} Bau-Structura. Alle Rechte vorbehalten.
`;

// E-Mail senden
sendEmailViaBrevo(options.email, options.subject, htmlContent, textContent)
  .then(success => {
    if (success) {
      console.log('✅ Test-E-Mail erfolgreich versendet oder simuliert.');
    } else {
      console.error('❌ Fehler beim Versenden der Test-E-Mail.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unerwarteter Fehler:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });