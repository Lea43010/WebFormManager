import * as SibApiV3Sdk from 'sib-api-v3-sdk';

// Generiert einen zufälligen 6-stelligen Code für die Verifizierung
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sendet einen Verifizierungscode per E-Mail.
 * 
 * @param email Die E-Mail-Adresse des Empfängers
 * @param code Der Verifizierungscode
 * @param resetLink Optional: Reset-Link für Passwort-Reset-E-Mails
 * @returns true, wenn die E-Mail erfolgreich gesendet wurde, sonst false
 */
export async function sendVerificationCode(
  email: string,
  code: string,
  resetLink?: string
): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error('Brevo API-Schlüssel nicht gefunden');
      return false;
    }

    // Brevo API Client initialisieren
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // E-Mail-Inhalte vorbereiten
    let subject, htmlContent, textContent;
    
    if (resetLink) {
      // Passwort-Reset-E-Mail
      subject = 'Passwort zurücksetzen - Baustellen App';
      htmlContent = `
        <html>
          <body>
            <h1>Passwort zurücksetzen</h1>
            <p>Sie haben angefordert, Ihr Passwort zurückzusetzen.</p>
            <p>Ihr Verifizierungscode lautet: <strong>${code}</strong></p>
            <p>Alternativ können Sie auf den folgenden Link klicken, um Ihr Passwort zurückzusetzen:</p>
            <p><a href="${resetLink}">Passwort zurücksetzen</a></p>
            <p>Dieser Link ist eine Stunde lang gültig.</p>
            <p>Falls Sie diese Anfrage nicht getätigt haben, können Sie diese E-Mail ignorieren.</p>
          </body>
        </html>
      `;
      textContent = `
        Passwort zurücksetzen
        
        Sie haben angefordert, Ihr Passwort zurückzusetzen.
        
        Ihr Verifizierungscode lautet: ${code}
        
        Alternativ können Sie den folgenden Link besuchen, um Ihr Passwort zurückzusetzen:
        ${resetLink}
        
        Dieser Link ist eine Stunde lang gültig.
        
        Falls Sie diese Anfrage nicht getätigt haben, können Sie diese E-Mail ignorieren.
      `;
    } else {
      // Login-Verifizierungs-E-Mail
      subject = 'Ihr Anmeldecode - Baustellen App';
      htmlContent = `
        <html>
          <body>
            <h1>Ihr Anmeldecode</h1>
            <p>Um Ihre Anmeldung abzuschließen, geben Sie bitte den folgenden Code ein:</p>
            <p style="font-size: 24px; font-weight: bold;">${code}</p>
            <p>Dieser Code ist 10 Minuten lang gültig.</p>
            <p>Falls Sie sich nicht angemeldet haben, ignorieren Sie bitte diese E-Mail.</p>
          </body>
        </html>
      `;
      textContent = `
        Ihr Anmeldecode
        
        Um Ihre Anmeldung abzuschließen, geben Sie bitte den folgenden Code ein:
        
        ${code}
        
        Dieser Code ist 10 Minuten lang gültig.
        
        Falls Sie sich nicht angemeldet haben, ignorieren Sie bitte diese E-Mail.
      `;
    }

    // E-Mail-Objekt erstellen
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.sender = {
      name: 'Baustellen App',
      email: 'noreply@baustellenapp.de'
    };
    sendSmtpEmail.to = [{ email }];

    // E-Mail senden
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    return true;
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return false;
  }
}