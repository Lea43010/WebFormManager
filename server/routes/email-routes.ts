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
  
  const user = req.user as any;
  if (user.role !== 'administrator') {
    return res.status(403).json({ message: 'Keine ausreichenden Berechtigungen' });
  }
  
  next();
};

export function registerEmailRoutes(app: express.Express) {
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
    async (req, res) => {
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
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Willkommen bei Bau - Structura App</h1>
            
            <p>Sehr geehrter Herr ${user_name},</p>
            
            <p>wir freuen uns, Sie als neuen Benutzer der Bau - Structura App begrüßen zu dürfen. Ihr Konto wurde erfolgreich eingerichtet und ist ab sofort einsatzbereit.</p>
            
            <div class="highlight">
              <h3>Ihre Zugangsdaten:</h3>
              <p><strong>Benutzername:</strong> <span class="credentials">${username}</span></p>
              <p><strong>Temporäres Passwort:</strong> <span class="credentials">${password}</span></p>
              <p><strong>Login-URL:</strong> <a href="https://bau-structura.de">https://bau-structura.de</a></p>
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

Sehr geehrter Herr ${user_name},

wir freuen uns, Sie als neuen Benutzer der Bau - Structura App begrüßen zu dürfen. Ihr Konto wurde erfolgreich eingerichtet und ist ab sofort einsatzbereit.

Ihre Zugangsdaten:
- Benutzername: ${username}
- Temporäres Passwort: ${password}
- Login-URL: https://bau-structura.de

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
          to: user_email,
          subject: 'Willkommen bei Bau-Structura App - Ihre Zugangsdaten',
          html: htmlContent,
          text: textContent
        });
        
        // Wenn gewünscht, Kopie an Administrator senden
        let adminResult = null;
        if (sendToAdmin) {
          const adminUser = req.user as any;
          const adminEmail = adminUser.user_email;
          
          if (adminEmail) {
            adminResult = await emailService.sendEmail({
              to: adminEmail,
              subject: `[KOPIE] Willkommen bei Bau-Structura App - Zugangsdaten für ${username}`,
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
      } catch (error) {
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