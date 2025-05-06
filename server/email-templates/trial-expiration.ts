/**
 * E-Mail-Template für Benachrichtigungen über ablaufende Testphasen
 */

/**
 * Template für die Benachrichtigung über eine ablaufende Testphase (2 Tage vor Ablauf)
 */
const trialExpirationTemplate = {
  subject: 'Ihre Testphase von Bau-Structura endet bald',
  text: `Sehr geehrte(r) {{userName}},

Wir möchten Sie darüber informieren, dass Ihre Testphase für Bau-Structura am {{expirationDate}} abläuft.

Damit Sie ohne Unterbrechung weiterhin alle Funktionen nutzen können, empfehlen wir Ihnen, jetzt ein Abonnement abzuschließen.

Besuchen Sie einfach Ihre Kontoseite unter {{subscriptionLink}}, um Ihre Zahlungsinformationen einzugeben.

Die Vorteile eines Abonnements:
- Unbegrenzter Zugriff auf alle Funktionen der Bau-Structura Plattform
- Regelmäßige Updates und neue Funktionen
- Professioneller Support bei Fragen und Problemen
- Keine Datenverluste und unterbrechungsfreie Nutzung

Wenn Sie Fragen haben oder Unterstützung benötigen, antworten Sie einfach auf diese E-Mail oder kontaktieren Sie unseren Support unter support@bau-structura.de.

Vielen Dank, dass Sie Bau-Structura nutzen!

Mit freundlichen Grüßen
Ihr Bau-Structura Team`,

  html: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ihre Testphase endet bald</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2563eb;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      padding: 30px 20px;
      background-color: #fff;
      border: 1px solid #e0e0e0;
      border-top: none;
      border-radius: 0 0 5px 5px;
    }
    .footer {
      text-align: center;
      color: #777;
      font-size: 12px;
      margin-top: 30px;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      padding: 12px 25px;
      border-radius: 5px;
      font-weight: bold;
      margin: 15px 0;
    }
    .benefits {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .benefits h3 {
      margin-top: 0;
      color: #2563eb;
    }
    .expiration {
      color: #e11d48;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ihre Testphase endet bald</h1>
    </div>
    <div class="content">
      <p>Sehr geehrte(r) <strong>{{userName}}</strong>,</p>
      <p>Wir möchten Sie darüber informieren, dass Ihre Testphase für <strong>Bau-Structura</strong> am <span class="expiration">{{expirationDate}}</span> abläuft.</p>
      <p>Damit Sie ohne Unterbrechung weiterhin alle Funktionen nutzen können, empfehlen wir Ihnen, jetzt ein Abonnement abzuschließen.</p>
      <div style="text-align: center;">
        <a href="{{subscriptionLink}}" class="button">Jetzt abonnieren</a>
      </div>
      <div class="benefits">
        <h3>Die Vorteile eines Abonnements:</h3>
        <ul>
          <li>Unbegrenzter Zugriff auf alle Funktionen der Bau-Structura Plattform</li>
          <li>Regelmäßige Updates und neue Funktionen</li>
          <li>Professioneller Support bei Fragen und Problemen</li>
          <li>Keine Datenverluste und unterbrechungsfreie Nutzung</li>
        </ul>
      </div>
      <p>Wenn Sie Fragen haben oder Unterstützung benötigen, antworten Sie einfach auf diese E-Mail oder kontaktieren Sie unseren Support unter <a href="mailto:support@bau-structura.de">support@bau-structura.de</a>.</p>
      <p>Vielen Dank, dass Sie Bau-Structura nutzen!</p>
      <p>Mit freundlichen Grüßen<br>Ihr Bau-Structura Team</p>
    </div>
    <div class="footer">
      <p>© 2025 Bau-Structura. Alle Rechte vorbehalten.</p>
      <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.</p>
    </div>
  </div>
</body>
</html>`
};

export default trialExpirationTemplate;