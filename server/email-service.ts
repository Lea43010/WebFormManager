/**
 * E-Mail-Service
 * 
 * Bietet eine zentrale Schnittstelle zum Versenden von E-Mails.
 * Basierend auf der Umgebungskonfiguration werden E-Mails entweder:
 * - In Produktion: über den Brevo API-Service versendet
 * - In Entwicklung: auf der Konsole ausgegeben oder als Datei gespeichert
 */

import * as fs from 'fs';
import * as path from 'path';
import config from '../config';
import { logger } from './logger';

// Verwende spezifischen Logger für E-Mail-Operationen
const emailLogger = logger.createLogger('email');

// Schnittstellendefinitionen
interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  templateId?: number | string;
  templateData?: Record<string, any>;
}

/**
 * E-Mail-Provider-Schnittstelle
 */
interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<boolean>;
}

/**
 * Provider für Brevo (früher SendinBlue)
 */
class BrevoEmailProvider implements EmailProvider {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    emailLogger.info('Brevo E-Mail-Provider initialisiert');
  }
  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      emailLogger.error('Brevo API-Key nicht konfiguriert');
      return false;
    }
    
    try {
      const SibApiV3Sdk = await import('sib-api-v3-sdk');
      
      // Brevo API-Konfiguration
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = this.apiKey;
      
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      
      // Empfänger-Array erstellen
      const to = Array.isArray(options.to) 
        ? options.to.map(email => ({ email })) 
        : [{ email: options.to }];
      
      // Absender definieren
      const sender = {
        email: config.email.fromEmail,
        name: config.email.fromName
      };
      
      // Anfrage vorbereiten
      const sendEmailRequest = {
        sender,
        to,
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        attachment: options.attachments?.map(attachment => ({
          name: attachment.filename,
          content: typeof attachment.content === 'string' 
            ? Buffer.from(attachment.content).toString('base64')
            : attachment.content.toString('base64'),
          contentType: attachment.contentType
        }))
      };
      
      // Wenn eine Template-ID angegeben wurde, diese verwenden
      if (options.templateId) {
        const templateRequest = {
          templateId: Number(options.templateId),
          params: options.templateData,
          ...sendEmailRequest
        };
        await apiInstance.sendTransacEmail(templateRequest);
      } else {
        // Sonst einfache E-Mail senden
        await apiInstance.sendTransacEmail(sendEmailRequest);
      }
      
      emailLogger.info(`E-Mail erfolgreich gesendet an: ${options.to}`);
      return true;
    } catch (error) {
      emailLogger.error('Fehler beim Senden der E-Mail über Brevo:', error);
      return false;
    }
  }
}

/**
 * Entwicklungs-Provider, der E-Mails nur in der Konsole ausgibt
 */
class ConsoleEmailProvider implements EmailProvider {
  constructor() {
    emailLogger.info('Konsolen-E-Mail-Provider initialisiert (für Entwicklung)');
  }
  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    const separator = '='.repeat(50);
    console.log('\n' + separator);
    console.log('ENTWICKLUNGS-E-MAIL (WIRD NICHT WIRKLICH GESENDET)');
    console.log(separator);
    console.log(`An: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    console.log(`Von: ${config.email.fromName} <${config.email.fromEmail}>`);
    console.log(`Betreff: ${options.subject}`);
    
    if (options.templateId) {
      console.log(`Template-ID: ${options.templateId}`);
      console.log('Template-Daten:', options.templateData);
    }
    
    if (options.text) {
      console.log('\nText-Inhalt:');
      console.log(options.text);
    }
    
    if (options.html) {
      console.log('\nHTML-Inhalt (gekürzt):');
      // HTML auf max. 300 Zeichen begrenzen, um die Konsole nicht zu überfüllen
      console.log(options.html.substring(0, 300) + (options.html.length > 300 ? '...' : ''));
    }
    
    if (options.attachments && options.attachments.length > 0) {
      console.log('\nAnhänge:');
      options.attachments.forEach(attachment => {
        console.log(`- ${attachment.filename} (${attachment.contentType || 'unbekannter Typ'})`);
      });
    }
    
    console.log(separator + '\n');
    
    return true;
  }
}

/**
 * Provider, der E-Mails in eine Datei schreibt (für Entwicklung/Tests)
 */
class FileEmailProvider implements EmailProvider {
  private outputDir: string;
  
  constructor(outputDir: string) {
    this.outputDir = outputDir;
    // Stelle sicher, dass das Ausgabeverzeichnis existiert
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    emailLogger.info(`Datei-E-Mail-Provider initialisiert (Ausgabe nach: ${outputDir})`);
  }
  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
      const recipient = Array.isArray(options.to) ? options.to[0] : options.to;
      const safeRecipient = recipient.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${timestamp}_${safeRecipient}_${options.subject.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.eml`;
      const filePath = path.join(this.outputDir, filename);
      
      // E-Mail im EML-Format erstellen
      let content = `Date: ${new Date().toString()}\n`;
      content += `From: ${config.email.fromName} <${config.email.fromEmail}>\n`;
      content += `To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}\n`;
      content += `Subject: ${options.subject}\n`;
      content += 'MIME-Version: 1.0\n';
      
      if (options.html) {
        content += 'Content-Type: text/html; charset=utf-8\n\n';
        content += options.html;
      } else if (options.text) {
        content += 'Content-Type: text/plain; charset=utf-8\n\n';
        content += options.text;
      }
      
      // Templateinformationen als Kommentar hinzufügen, falls vorhanden
      if (options.templateId) {
        content += `\n\n<!-- Template-ID: ${options.templateId} -->\n`;
        content += `<!-- Template-Daten: ${JSON.stringify(options.templateData)} -->\n`;
      }
      
      // In Datei schreiben
      fs.writeFileSync(filePath, content);
      
      emailLogger.info(`E-Mail als Datei gespeichert: ${filePath}`);
      return true;
    } catch (error) {
      emailLogger.error('Fehler beim Speichern der E-Mail als Datei:', error);
      return false;
    }
  }
}

/**
 * Hauptklasse des E-Mail-Services
 */
class EmailService {
  private provider: EmailProvider;
  
  constructor() {
    // Provider basierend auf Konfiguration auswählen
    if (config.isProduction) {
      const apiKey = config.email.apiKey || process.env.BREVO_API_KEY;
      if (!apiKey) {
        emailLogger.warn('Kein Brevo API-Key gefunden, verwende Konsolen-Provider auch in Produktion');
        this.provider = new ConsoleEmailProvider();
      } else {
        this.provider = new BrevoEmailProvider(apiKey);
      }
    } else {
      // In Entwicklung: basierend auf dev-Mode-Einstellung
      if (config.email.devMode && config.email.devOutputPath) {
        this.provider = new FileEmailProvider(config.email.devOutputPath);
      } else {
        this.provider = new ConsoleEmailProvider();
      }
    }
  }
  
  /**
   * Sendet eine E-Mail
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    return await this.provider.sendEmail(options);
  }
  
  /**
   * Sendet eine E-Mail mit einem vorkonfigurierten Template
   */
  async sendTemplateEmail(
    templateKey: keyof typeof config.email.templates,
    to: string | string[],
    subject: string,
    templateData: Record<string, any>
  ): Promise<boolean> {
    const templateId = config.email.templates[templateKey]?.templateId;
    
    if (!templateId) {
      emailLogger.error(`Template-ID für ${templateKey} nicht gefunden`);
      return false;
    }
    
    return await this.sendEmail({
      to,
      subject,
      templateId,
      templateData
    });
  }
}

// Exportiere eine Singleton-Instanz des E-Mail-Services
export const emailService = new EmailService();

// Standard-Export für einfachen Import
export default emailService;