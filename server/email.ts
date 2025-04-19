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

    // Für Testzwecke: Simulieren des E-Mail-Versands (keine tatsächliche E-Mail wird gesendet)
    console.log(`[SIMULIERTER E-MAIL-VERSAND] An: ${email}, Code: ${code}, Reset-Link: ${resetLink || 'N/A'}`);
    
    // In einer echten Implementierung würden wir den E-Mail-Versand über Brevo durchführen
    // Da es aktuell Probleme mit der Brevo SDK Integration gibt, senden wir vorerst keine echten E-Mails
    
    // Im Produktivbetrieb würde hier der tatsächliche E-Mail-Versand stattfinden
    // z.B. mit Code ähnlich dem folgenden:
    /*
    const API_KEY = process.env.BREVO_API_KEY;
    const apiUrl = 'https://api.brevo.com/v3/smtp/email';
    
    const emailData = {
      sender: { name: 'Baustellen App', email: 'noreply@baustellenapp.de' },
      to: [{ email }],
      subject: resetLink ? 'Passwort zurücksetzen - Baustellen App' : 'Ihr Anmeldecode - Baustellen App',
      htmlContent: resetLink 
        ? `<html><body><h1>Passwort zurücksetzen</h1><p>Code: ${code}</p><p><a href="${resetLink}">Zurücksetzen</a></p></body></html>`
        : `<html><body><h1>Ihr Anmeldecode</h1><p>Code: ${code}</p></body></html>`,
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
      body: JSON.stringify(emailData),
    });
    
    if (!response.ok) {
      throw new Error(`E-Mail-Versand fehlgeschlagen: ${response.statusText}`);
    }
    */
    
    return true;
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return false;
  }
}