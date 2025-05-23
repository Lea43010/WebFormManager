/**
 * E-Mail-Routen für die Administration und den Benutzerservice
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { emailService } from '../email-service';
import { logger } from '../logger';

// Spezifischer Logger für E-Mail-Routen
const emailLogger = logger.createLogger('email-routes');

/**
 * Middleware zur Überprüfung, ob der Benutzer Administrator ist
 */
const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Nicht autorisiert' });
  }
  
  const user = req.user as { role?: string };
  if (user.role !== 'administrator') {
    return res.status(403).json({ message: 'Keine ausreichenden Berechtigungen' });
  }
  
  next();
};

export function registerEmailRoutes(app: express.Express) {
  /**
   * Route zum Testen der Willkommens-E-Mail (nur für Entwicklungsumgebung)
   */
  app.post('/api/email/test', 
    async (req: express.Request, res: express.Response) => {
      try {
        const { email, name = 'Tester', username = 'test-user' } = req.body;
        
        if (!email) {
          return res.status(400).json({ 
            success: false, 
            message: 'E-Mail-Adresse ist erforderlich' 
          });
        }
        
        // Aktuelles Datum für die E-Mail formatieren
        const heute = new Date().toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        // HTML-Inhalt für die Test-Willkommens-E-Mail
        const htmlContent = `
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            h1 { color: #76a730; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .highlight { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #76a730; margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 0.8em; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
            .trial-info { font-weight: bold; color: #76a730; }
            .feature-list { margin-top: 15px; }
            .feature-list li { margin-bottom: 8px; }
            strong { color: #76a730; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Herzlich willkommen bei Bau-Structura!</h1>
            
            <p><strong>Liebe(r) ${name},</strong></p>
            
            <p>wir freuen uns sehr, Sie als neues Mitglied bei <strong>Bau-Structura</strong> begrüßen zu dürfen – herzlich willkommen!</p>
            
            <div class="highlight">
              <p class="trial-info">Damit Sie unsere Plattform in aller Ruhe entdecken können, schenken wir Ihnen die ersten <strong>14 Tage kostenfrei und unverbindlich</strong>.</p>
            </div>
            
            <p><strong>Bau-Structura</strong> unterstützt Sie dabei, Ihre Bauprojekte effizient zu planen, zu organisieren und erfolgreich umzusetzen. Freuen Sie sich auf folgende Vorteile:</p>
            
            <ul class="feature-list">
              <li>Intuitive und zeitsparende Verwaltung Ihrer Bauprojekte</li>
              <li>Zentrale Organisation aller relevanten Dokumente</li>
              <li>Schnelle Erfassung und präzise Analyse von Straßenschäden</li>
              <li>Übersichtlich visualisierte Bauflächen auf interaktiven Karten</li>
              <li>Lückenlose Nachverfolgung und Dokumentation Ihres Baufortschritts</li>
            </ul>
            
            <p>Ihre persönlichen Zugangsdaten sind bereits eingerichtet – passend zu Ihren individuellen Anforderungen.</p>
            
            <p>Bei Fragen oder Anliegen steht Ihnen unser Support-Team gerne zur Seite: <strong>Montag bis Freitag, 8:00 bis 17:00 Uhr</strong>.</p>
            
            <p>Wir wünschen Ihnen einen erfolgreichen Start und viel Freude bei der Arbeit mit Bau-Structura!</p>
            
            <p><strong>Mit besten Grüßen</strong><br>
            Ihr <strong>Bau-Structura App Team</strong></p>
            
            <div class="footer">
              <p><em>Hinweis: Diese Nachricht wurde automatisch am ${heute} erstellt. Bitte antworten Sie nicht direkt auf diese E-Mail.</em></p>
              <p><strong>TEST-E-MAIL</strong> - Diese E-Mail wurde zu Testzwecken gesendet.</p>
            </div>
          </div>
        </body>
        </html>
        `;
        
        // Text-Version der E-Mail
        const textContent = `
Herzlich willkommen bei Bau-Structura, ${name}!

Liebe(r) ${name},

wir freuen uns sehr, Sie als neues Mitglied bei Bau-Structura begrüßen zu dürfen – herzlich willkommen!

Damit Sie unsere Plattform in aller Ruhe entdecken können, schenken wir Ihnen die ersten 14 Tage kostenfrei und unverbindlich.

Bau-Structura unterstützt Sie dabei, Ihre Bauprojekte effizient zu planen, zu organisieren und erfolgreich umzusetzen. Freuen Sie sich auf folgende Vorteile:

* Intuitive und zeitsparende Verwaltung Ihrer Bauprojekte
* Zentrale Organisation aller relevanten Dokumente
* Schnelle Erfassung und präzise Analyse von Straßenschäden
* Übersichtlich visualisierte Bauflächen auf interaktiven Karten
* Lückenlose Nachverfolgung und Dokumentation Ihres Baufortschritts

Ihre persönlichen Zugangsdaten sind bereits eingerichtet – passend zu Ihren individuellen Anforderungen.

Bei Fragen oder Anliegen steht Ihnen unser Support-Team gerne zur Seite: Montag bis Freitag, 8:00 bis 17:00 Uhr.

Wir wünschen Ihnen einen erfolgreichen Start und viel Freude bei der Arbeit mit Bau-Structura!

Mit besten Grüßen
Ihr Bau-Structura App Team

---
Hinweis: Diese Nachricht wurde automatisch am ${heute} erstellt. Bitte antworten Sie nicht direkt auf diese E-Mail.
TEST-E-MAIL - Diese E-Mail wurde zu Testzwecken gesendet.
        `;
        
        // E-Mail senden
        const result = await emailService.sendEmail({
          to: email,
          subject: `Herzlich willkommen bei Bau-Structura, ${name}!`,
          html: htmlContent,
          text: textContent,
          highPriority: true
        });
        
        // Log
        emailLogger.info(`Test-Willkommens-E-Mail an ${email} gesendet`);
        
        // Antwort
        res.json({
          success: true,
          message: `Test-Willkommens-E-Mail an ${email} gesendet`
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        emailLogger.error('Fehler beim Senden der Test-E-Mail:', error);
        
        res.status(500).json({
          success: false,
          message: 'Fehler beim Senden der Test-E-Mail',
          error: errorMessage
        });
      }
    }
  );
  
  /**
   * Route zum Senden einer Willkommens-E-Mail
   */
  app.post('/api/admin/send-welcome-email', 
    isAdmin,
    [
      body('username').isString().trim().isLength({ min: 3 }),
      body('user_name').isString().trim().isLength({ min: 2 }),
      body('user_email').isEmail(),
      body('password').isString().isLength({ min: 6 }),
      body('sendToAdmin').isBoolean().optional()
    ],
    async (req: express.Request, res: express.Response) => {
      try {
        // Validierungsfehler prüfen
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        
        const { username, user_name, user_email, password, sendToAdmin = true } = req.body;
        
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
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 15px; }
            .button:hover { background-color: #1d4ed8; }
            .feature-list { margin-top: 15px; }
            .feature-list li { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Willkommen in der Bau - Structura App!</h1>
            
            <p>Sehr geehrte Frau/Herr ${user_name},</p>
            
            <p>herzlich willkommen bei der Bau - Structura App! Wir freuen uns sehr, Sie als neue Nutzerin/neuen Nutzer begrüßen zu dürfen. Ihr Konto wurde erfolgreich eingerichtet und steht Ihnen ab sofort zur Verfügung.</p>
            
            <div class="highlight">
              <h3>Hier Ihre Zugangsdaten:</h3>
              <p><strong>Benutzername:</strong> <span class="credentials">${username}</span></p>
              <p><strong>Temporäres Passwort:</strong> <span class="credentials">${password}</span></p>
              <p><strong>Login-URL:</strong> <a href="https://bau-structura.de">https://bau-structura.de</a></p>
            </div>
            
            <div class="note">
              <p><strong>Wichtig:</strong> Aus Sicherheitsgründen bitten wir Sie, Ihr Passwort nach der ersten Anmeldung zu ändern.</p>
            </div>
            
            <h3>Ein kurzer Überblick über Ihre Möglichkeiten in der App:</h3>
            <ul class="feature-list">
              <li>Projektübersicht und -verwaltung</li>
              <li>Bautagebuch mit automatischer Speicherung</li>
              <li>Meilensteinkontrolle und Terminplanung</li>
              <li>Filemanagement und Dokumentenablage</li>
              <li>Oberflächenanalyse mit KI-Unterstützung</li>
              <li>Bedarfs- und Kapazitätsplanung</li>
            </ul>
            
            <p>
              <a href="https://bau-structura.de/" class="button">Zur Bau - Structura App</a>
            </p>
            
            <p>Unser Support-Team steht Ihnen jederzeit gerne zur Verfügung, falls Sie Fragen haben oder Unterstützung benötigen.</p>
            
            <p>Wir wünschen Ihnen viel Freude und Erfolg bei der Arbeit mit der Bau - Structura App!</p>
            
            <p>Mit besten Grüßen,<br>
            Ihr Bau - Structura App Team</p>
            
            <div class="footer">
              <p>Hinweis: Diese E-Mail wurde automatisch am ${heute} generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.</p>
            </div>
          </div>
        </body>
        </html>
        `;
        
        // Text-Version für E-Mail-Clients, die kein HTML anzeigen
        const textContent = `
Willkommen in der Bau - Structura App!

Sehr geehrte Frau/Herr ${user_name},

herzlich willkommen bei der Bau - Structura App!
Wir freuen uns sehr, Sie als neue Nutzerin/neuen Nutzer begrüßen zu dürfen. Ihr Konto wurde erfolgreich eingerichtet und steht Ihnen ab sofort zur Verfügung.

Hier Ihre Zugangsdaten:

Benutzername: ${username}
Temporäres Passwort: ${password}
Login-URL: https://bau-structura.de

Wichtig: Aus Sicherheitsgründen bitten wir Sie, Ihr Passwort nach der ersten Anmeldung zu ändern.

Ein kurzer Überblick über Ihre Möglichkeiten in der App:
* Projektübersicht und -verwaltung
* Bautagebuch mit automatischer Speicherung
* Meilensteinkontrolle und Terminplanung
* Filemanagement und Dokumentenablage
* Oberflächenanalyse mit KI-Unterstützung
* Bedarfs- und Kapazitätsplanung

Zur Bau - Structura App: https://bau-structura.de/

Unser Support-Team steht Ihnen jederzeit gerne zur Verfügung, falls Sie Fragen haben oder Unterstützung benötigen.

Wir wünschen Ihnen viel Freude und Erfolg bei der Arbeit mit der Bau - Structura App!

Mit besten Grüßen,
Ihr Bau - Structura App Team

---
Hinweis: Diese E-Mail wurde automatisch am ${heute} generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.
        `;
        
        // E-Mail an Benutzer senden
        const result = await emailService.sendEmail({
          to: user_email,
          subject: 'Herzlich willkommen in der Bau-Structura App!',
          html: htmlContent,
          text: textContent
        });
        
        // Wenn gewünscht, Kopie an Administrator senden
        let adminResult = null;
        if (sendToAdmin) {
          const adminUser = req.user as { user_email?: string };
          const adminEmail = adminUser.user_email;
          
          if (adminEmail) {
            adminResult = await emailService.sendEmail({
              to: adminEmail,
              subject: `[KOPIE] Herzlich willkommen in der Bau-Structura App - Zugangsdaten für ${username}`,
              html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                  <h2>Kopie der Willkommens-E-Mail</h2>
                  <p>Diese E-Mail ist eine Kopie der Willkommens-E-Mail, die an ${user_name} (${user_email}) gesendet wurde.</p>
                  <p><strong>Erstellt für Benutzer:</strong> ${username}</p>
                  <p><strong>Erstellt am:</strong> ${heute}</p>
                  <hr style="border: 1px solid #eee; margin: 20px 0;" />
                  ${htmlContent}
                </div>
              `,
              text: `KOPIE der Willkommens-E-Mail für ${username}\n\nErstellt am: ${heute}\n\n${textContent}`
            });
          }
        }
        
        // Log-Eintrag
        emailLogger.info(`Willkommens-E-Mail an ${user_email} für Benutzer ${username} gesendet`);
        
        // Erfolgreiche Antwort
        res.json({ 
          success: true, 
          message: 'Willkommens-E-Mail erfolgreich gesendet',
          adminCopySent: !!adminResult
        });
      } catch (error: unknown) {
        // Fehlerbehandlung
        const errorMessage = error instanceof Error ? error.message : String(error);
        emailLogger.error('Fehler beim Senden der Willkommens-E-Mail:', error);
        
        res.status(500).json({
          success: false,
          message: 'Fehler beim Senden der Willkommens-E-Mail',
          error: errorMessage
        });
      }
    }
  );
  
  console.log('[INFO] [email] E-Mail-API-Endpunkte eingerichtet');
}