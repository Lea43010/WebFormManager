/**
 * E-Mail-Template für Benachrichtigungen über ablaufende Testphasen
 */

export const trialExpirationTemplate = {
  subject: 'Ihre Testphase für Bau-Structura endet in Kürze',
  text: `
Sehr geehrte(r) {{userName}},

Ihre Testphase für Bau-Structura endet in 2 Tagen am {{expirationDate}}.

Um Ihre Arbeit ohne Unterbrechung fortsetzen zu können, empfehlen wir Ihnen, Ihr Abonnement jetzt zu verlängern.

Vorteile Ihres Bau-Structura Abonnements:
- Zugriff auf alle Projekte und Funktionen
- Unbegrenzte Nutzung aller Module
- Kostenlose Updates und neue Funktionen
- Persönlicher Support

Klicken Sie auf den folgenden Link, um Ihr Abonnement zu verlängern:
{{subscriptionLink}}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen,
Ihr Bau-Structura Team
`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4a6da7; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { font-size: 12px; color: #999; text-align: center; margin-top: 20px; }
    .button { display: inline-block; background-color: #4a6da7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
    .benefits { margin: 20px 0; }
    .benefits ul { padding-left: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ihre Testphase endet bald</h1>
    </div>
    <div class="content">
      <p>Sehr geehrte(r) {{userName}},</p>
      
      <p>Ihre Testphase für <strong>Bau-Structura</strong> endet in <strong>2 Tagen</strong> am <strong>{{expirationDate}}</strong>.</p>
      
      <p>Um Ihre Arbeit ohne Unterbrechung fortsetzen zu können, empfehlen wir Ihnen, Ihr Abonnement jetzt zu verlängern.</p>
      
      <div class="benefits">
        <p><strong>Vorteile Ihres Bau-Structura Abonnements:</strong></p>
        <ul>
          <li>Zugriff auf alle Projekte und Funktionen</li>
          <li>Unbegrenzte Nutzung aller Module</li>
          <li>Kostenlose Updates und neue Funktionen</li>
          <li>Persönlicher Support</li>
        </ul>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{subscriptionLink}}" class="button">Jetzt Abonnement verlängern</a>
      </p>
      
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
      
      <p>Mit freundlichen Grüßen,<br>Ihr Bau-Structura Team</p>
    </div>
    <div class="footer">
      <p>© 2025 Bau-Structura. Alle Rechte vorbehalten.</p>
    </div>
  </div>
</body>
</html>
`
};

export default trialExpirationTemplate;