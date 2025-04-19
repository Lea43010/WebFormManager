import * as SibApiV3Sdk from 'sib-api-v3-sdk';

// Konfiguriere Brevo API-Client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  senderName?: string;
  senderEmail?: string;
}

/**
 * Sendet eine E-Mail über Brevo
 */
export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent,
  senderName = 'Baustellen App',
  senderEmail = 'noreply@baustellenapp.de'
}: EmailOptions): Promise<boolean> {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = [{ email: to }];
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('E-Mail erfolgreich gesendet:', response);
    return true;
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return false;
  }
}

/**
 * Generiert einen zufälligen 5-stelligen Code
 */
export function generateVerificationCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/**
 * Sendet einen Verifizierungscode per E-Mail
 */
export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #6a961f;">Baustellen App - Sicherheitscode</h2>
      <p>Guten Tag,</p>
      <p>hier ist Ihr Sicherheitscode für die Anmeldung bei der Baustellen App:</p>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; border-radius: 4px;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</span>
      </div>
      <p>Dieser Code ist 10 Minuten gültig.</p>
      <p>Falls Sie diese Anfrage nicht getätigt haben, können Sie diese E-Mail ignorieren.</p>
      <p>Mit freundlichen Grüßen,<br>Ihr Baustellen App Team</p>
    </div>
  `;
  
  const textContent = `
    Baustellen App - Sicherheitscode

    Guten Tag,
    
    hier ist Ihr Sicherheitscode für die Anmeldung bei der Baustellen App:
    
    ${code}
    
    Dieser Code ist 10 Minuten gültig.
    
    Falls Sie diese Anfrage nicht getätigt haben, können Sie diese E-Mail ignorieren.
    
    Mit freundlichen Grüßen,
    Ihr Baustellen App Team
  `;
  
  return sendEmail({
    to: email,
    subject: 'Ihr Sicherheitscode für die Baustellen App',
    htmlContent,
    textContent
  });
}