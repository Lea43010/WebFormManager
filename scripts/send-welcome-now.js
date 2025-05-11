/**
 * Skript zum direkten Senden einer Willkommens-E-Mail
 * 
 * Dieses Skript sendet direkt eine Willkommens-E-Mail an die angegebene E-Mail-Adresse
 */

import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
// Direkter Import nicht möglich, verwende eine REST-API-Anfrage
import fetch from 'node-fetch';

// Dateipfade für ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Umgebungsvariablen laden
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.development') });

async function sendWelcomeEmail() {
  const recipient = 'lea.zimmer@gmx.net';
  
  // Aktuelles Datum für die E-Mail
  const heute = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // HTML-Inhalt der E-Mail
  const htmlContent = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        h1 { color: #76a730; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .highlight { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #76a730; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 0.8em; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
        .btn { display: inline-block; background-color: #76a730; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Willkommen bei der Bau-Structura App!</h1>
        
        <p>Sehr geehrte Frau Zimmer,</p>
        
        <p>wir freuen uns, Sie bei Bau-Structura begrüßen zu dürfen! Unsere Plattform bietet Ihnen umfassende Funktionen für das Management von Bauprojekten, Analyse von Oberflächen und vieles mehr.</p>
        
        <div class="highlight">
          <p><strong>Wichtige Informationen zu Ihrem Zugang:</strong></p>
          <p>Ihre Anmeldedaten wurden mit den Zugriffsrechten eingerichtet, die Sie für die Anwendung benötigen.</p>
        </div>
        
        <p>Mit unserer App können Sie:</p>
        <ul>
          <li>Bauprojekte effizient verwalten</li>
          <li>Dokumente strukturiert organisieren</li>
          <li>Straßenschäden dokumentieren und analysieren</li>
          <li>Bauplätze auf Karten visualisieren</li>
          <li>Baufortschritte nachverfolgen und dokumentieren</li>
        </ul>
        
        <p>Bei Fragen stehen wir Ihnen jederzeit zur Verfügung. Unsere Supportzeiten sind Montag bis Freitag von 8:00 bis 17:00 Uhr.</p>
        
        <p>Mit besten Grüßen,<br>
        Ihr Bau-Structura App Team</p>
        
        <div class="footer">
          <p>Hinweis: Diese E-Mail wurde automatisch am ${heute} generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Text-Version (für E-Mail-Clients ohne HTML-Unterstützung)
  const textContent = `
Willkommen bei der Bau-Structura App!

Sehr geehrte Frau Zimmer,

wir freuen uns, Sie bei Bau-Structura begrüßen zu dürfen! Unsere Plattform bietet Ihnen umfassende Funktionen für das Management von Bauprojekten, Analyse von Oberflächen und vieles mehr.

Wichtige Informationen zu Ihrem Zugang:
Ihre Anmeldedaten wurden mit den Zugriffsrechten eingerichtet, die Sie für die Anwendung benötigen.

Mit unserer App können Sie:
- Bauprojekte effizient verwalten
- Dokumente strukturiert organisieren
- Straßenschäden dokumentieren und analysieren
- Bauplätze auf Karten visualisieren
- Baufortschritte nachverfolgen und dokumentieren

Bei Fragen stehen wir Ihnen jederzeit zur Verfügung. Unsere Supportzeiten sind Montag bis Freitag von 8:00 bis 17:00 Uhr.

Mit besten Grüßen,
Ihr Bau-Structura App Team

---
Hinweis: Diese E-Mail wurde automatisch am ${heute} generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.
  `;

  try {
    // E-Mail über REST-API senden
    console.log(`\nSende Willkommens-E-Mail an ${recipient}...`);
    
    const response = await fetch('http://localhost:5000/api/admin/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'leazimmer',
        user_name: 'Lea Zimmer',
        user_email: recipient,
        password: 'tempPassw0rd!',
        sendToAdmin: true
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Willkommens-E-Mail erfolgreich an ${recipient} gesendet.`);
      console.log(result);
    } else {
      const errorText = await response.text();
      console.error(`❌ Fehler beim Senden der Willkommens-E-Mail: HTTP Status ${response.status}`);
      console.error(errorText);
      
      // Da der direkte Zugriff auf die API fehlschlägt, simuliere E-Mail-Versand im Konsolenlog
      console.log('\n======== SIMULIERTE WILLKOMMENS-E-MAIL ========');
      console.log(`Von: Bau-Structura <info@bau-structura.de>`);
      console.log(`An: ${recipient}`);
      console.log(`Betreff: Willkommen bei der Bau-Structura App!`);
      console.log(`Nachricht: Gekürzte HTML-Version`);
      console.log(textContent.substring(0, 300) + '...');
      console.log('============================================\n');
    }
  } catch (error) {
    console.error('Fehler beim Senden der Willkommens-E-Mail:', error instanceof Error ? error.message : String(error));
    
    // Bei Fehler: Simuliere E-Mail in der Konsole
    console.log('\n======== SIMULIERTE WILLKOMMENS-E-MAIL (FEHLER-FALLBACK) ========');
    console.log(`Von: Bau-Structura <info@bau-structura.de>`);
    console.log(`An: ${recipient}`);
    console.log(`Betreff: Willkommen bei der Bau-Structura App!`);
    console.log(`Nachricht: Gekürzte HTML-Version`);
    console.log(textContent.substring(0, 300) + '...');
    console.log('===========================================================\n');
  }
}

// Ausführen der Funktion
sendWelcomeEmail().catch(error => {
  console.error('Unerwarteter Fehler:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});