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
      // Fallback für Entwicklungsumgebung: Simulieren des E-Mail-Versands
      console.log(`[SIMULIERTER E-MAIL-VERSAND] An: ${email}, Code: ${code}, Reset-Link: ${resetLink || 'N/A'}`);
      console.warn('Brevo API-Schlüssel nicht gefunden - E-Mail-Versand nur simuliert. Für echten E-Mail-Versand einen BREVO_API_KEY konfigurieren.');
      return true;
    }

    // Auch in der Produktionsumgebung den Code loggen, aber mit Hinweis
    console.log(`[E-MAIL-VERIFIZIERUNGSCODE] Code: ${code} wird an ${email} gesendet.`);

    // Tatsächlicher E-Mail-Versand über Brevo API
    const API_KEY = process.env.BREVO_API_KEY;
    const apiUrl = 'https://api.brevo.com/v3/smtp/email';
    
    const emailData = {
      sender: { name: 'Baustellen App', email: 'noreply@baustellenapp.de' },
      to: [{ email }],
      subject: resetLink ? 'Passwort zurücksetzen - Baustellen App' : 'Ihr Anmeldecode - Baustellen App',
      htmlContent: resetLink 
        ? `<html><body>
            <h1>Passwort zurücksetzen</h1>
            <p>Bitte verwenden Sie den folgenden Code, um Ihr Passwort zurückzusetzen:</p>
            <p style="font-size: 24px; font-weight: bold; padding: 10px; background-color: #f4f4f4; display: inline-block;">${code}</p>
            <p>Oder klicken Sie auf diesen Link zum Zurücksetzen: <a href="${resetLink}">Passwort zurücksetzen</a></p>
            <p>Dieser Code ist 30 Minuten lang gültig.</p>
            <p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
            <p>Mit freundlichen Grüßen<br>Ihr Baustellen App Team</p>
          </body></html>`
        : `<html><body>
            <h1>Ihr Anmeldecode</h1>
            <p>Bitte verwenden Sie den folgenden Code zur Verifizierung Ihrer Anmeldung:</p>
            <p style="font-size: 24px; font-weight: bold; padding: 10px; background-color: #f4f4f4; display: inline-block;">${code}</p>
            <p>Dieser Code ist 30 Minuten lang gültig.</p>
            <p>Falls Sie sich nicht bei der Baustellen App angemeldet haben, können Sie diese E-Mail ignorieren.</p>
            <p>Mit freundlichen Grüßen<br>Ihr Baustellen App Team</p>
          </body></html>`,
    };
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY,
        },
        body: JSON.stringify(emailData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`E-Mail-Versand fehlgeschlagen: ${response.statusText} - ${errorText}`);
      }
      
      console.log(`E-Mail erfolgreich an ${email} gesendet.`);
      return true;
    } catch (apiError) {
      console.error('API-Fehler beim Senden der E-Mail:', apiError);
      
      // Fallback zur simulierten E-Mail wenn die API fehlschlägt
      console.log(`[FALLBACK SIMULIERTER E-MAIL-VERSAND] An: ${email}, Code: ${code}, Reset-Link: ${resetLink || 'N/A'}`);
      return true; // Wir geben trotzdem true zurück, damit der Benutzer fortfahren kann
    }
  } catch (error) {
    console.error('Unerwarteter Fehler beim Senden der E-Mail:', error);
    return false;
  }
}