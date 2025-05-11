/**
 * Erweiterter E-Mail-Service
 * 
 * Bietet eine zuverlässige, fehlertolerante Schnittstelle zum Versenden von E-Mails.
 * Features:
 * - Unterstützung für mehrere E-Mail-Provider (Brevo, SendGrid)
 * - Automatische Wiederholungsversuche
 * - E-Mail-Warteschlange mit Statusverfolgung
 * - Robuste Fehlerbehandlung
 * - Fallback-Mechanismus bei Ausfällen
 */

import * as fs from 'fs';
import * as path from 'path';
import config from '../config';
import { logger } from './logger';
import sgMail from '@sendgrid/mail';
import { db } from './db';
import { sql } from 'drizzle-orm';

// Verwende spezifischen Logger für E-Mail-Operationen
const emailLogger = logger.createLogger('email');

// Konstanten
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 60000; // 1 Minute

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
  highPriority?: boolean;
  metadata?: Record<string, any>;
}

interface EmailQueueItem extends Omit<EmailOptions, 'to'> {
  id?: number;
  recipient: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  sentAt?: Date;
  provider?: string;
}

interface EmailResult {
  success: boolean;
  id?: number;
  error?: string;
  provider?: string;
}

/**
 * E-Mail-Provider-Schnittstelle
 */
interface EmailProvider {
  name: string;
  isConfigured(): boolean;
  sendEmail(options: EmailOptions): Promise<EmailResult>;
}

/**
 * Provider für Brevo (früher SendinBlue) mit direkter API-Nutzung
 */
class BrevoEmailProvider implements EmailProvider {
  readonly name = 'brevo';
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    emailLogger.info('Brevo E-Mail-Provider initialisiert');
  }
  
  isConfigured(): boolean {
    return !!this.apiKey;
  }
  
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Brevo API-Key nicht konfiguriert',
        provider: this.name
      };
    }
    
    try {
      const apiUrl = 'https://api.brevo.com/v3/smtp/email';
      
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
      const emailData: any = {
        sender,
        to,
        subject: options.subject,
        htmlContent: options.html || undefined,
        textContent: options.text || undefined
      };
      
      // Wenn Anhänge vorhanden sind, diese hinzufügen
      if (options.attachments && options.attachments.length > 0) {
        emailData.attachment = options.attachments.map(attachment => ({
          name: attachment.filename,
          content: typeof attachment.content === 'string' 
            ? Buffer.from(attachment.content).toString('base64')
            : attachment.content.toString('base64'),
          contentType: attachment.contentType
        }));
      }
      
      // Wenn eine Template-ID angegeben wurde, diese verwenden
      if (options.templateId) {
        emailData.templateId = Number(options.templateId);
        if (options.templateData) {
          emailData.params = options.templateData;
        }
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(emailData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Spezifischere Fehlerbehandlung für häufige Probleme
        let fehlergrund = "";
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.code === 'unauthorized' || response.status === 401) {
            fehlergrund = "Ungültiger API-Schlüssel";
            emailLogger.error('Brevo API-Schlüssel ungültig. Generieren Sie einen neuen Schlüssel im Brevo-Dashboard.');
          } else if (errorJson.message?.includes('sender email')) {
            fehlergrund = "Absender-E-Mail nicht verifiziert";
            emailLogger.error('Die Absender-E-Mail ist nicht verifiziert. Bitte verifizieren Sie die Domain in Ihrem Brevo-Konto.');
          } else {
            fehlergrund = errorJson.message || errorText;
          }
        } catch (e: unknown) {
          fehlergrund = errorText;
        }
        
        return {
          success: false,
          error: `E-Mail-Versand fehlgeschlagen: ${response.statusText} - ${fehlergrund}`,
          provider: this.name
        };
      }
      
      const recipientList = Array.isArray(options.to) ? options.to.join(', ') : options.to;
      emailLogger.info(`E-Mail erfolgreich über Brevo gesendet an: ${recipientList}`);
      console.log(`✅ E-Mail erfolgreich über Brevo gesendet an: ${recipientList}`);
      
      return {
        success: true,
        provider: this.name
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      emailLogger.error('Fehler beim Senden der E-Mail über Brevo:', error);
      console.error('⚠️ Fehler beim Senden der E-Mail über Brevo:', error);
      
      return {
        success: false,
        error: errorMessage,
        provider: this.name
      };
    }
  }
}

/**
 * Provider für SendGrid
 */
class SendGridEmailProvider implements EmailProvider {
  readonly name = 'sendgrid';
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      emailLogger.info('SendGrid E-Mail-Provider initialisiert');
    } else {
      emailLogger.warn('SendGrid API-Key nicht konfiguriert');
    }
  }
  
  isConfigured(): boolean {
    return !!this.apiKey;
  }
  
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'SendGrid API-Key nicht konfiguriert',
        provider: this.name
      };
    }
    
    try {
      // @ts-ignore - SendGrid Typdefinitionen sind unvollständig
      const msg: any = {
        to: options.to,
        from: {
          email: config.email.fromEmail,
          name: config.email.fromName
        },
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments ? options.attachments.map(attachment => ({
          filename: attachment.filename,
          content: typeof attachment.content === 'string' 
            ? Buffer.from(attachment.content).toString('base64')
            : attachment.content.toString('base64'),
          type: attachment.contentType
        })) : undefined,
      };
      
      // Template-Handling
      if (options.templateId) {
        // SendGrid verwendet unterschiedliche Parameter für Templates
        msg.templateId = options.templateId;
        if (options.templateData) {
          msg.dynamicTemplateData = options.templateData;
        }
      }
      
      await sgMail.send(msg);
      
      const recipientList = Array.isArray(options.to) ? options.to.join(', ') : options.to;
      emailLogger.info(`E-Mail erfolgreich über SendGrid gesendet an: ${recipientList}`);
      console.log(`✅ E-Mail erfolgreich über SendGrid gesendet an: ${recipientList}`);
      
      return {
        success: true,
        provider: this.name
      };
    } catch (error: any) {
      const errorResponse = error?.response?.body;
      let errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorResponse) {
        errorMessage = `SendGrid Fehler: ${JSON.stringify(errorResponse)}`;
      }
      
      emailLogger.error('Fehler beim Senden der E-Mail über SendGrid:', error);
      console.error('⚠️ Fehler beim Senden der E-Mail über SendGrid:', error);
      
      return {
        success: false,
        error: errorMessage,
        provider: this.name
      };
    }
  }
}

/**
 * Entwicklungs-Provider, der E-Mails nur in der Konsole ausgibt
 */
class ConsoleEmailProvider implements EmailProvider {
  readonly name = 'console';
  
  constructor() {
    emailLogger.info('Konsolen-E-Mail-Provider initialisiert (für Entwicklung)');
  }
  
  isConfigured(): boolean {
    return true; // Immer konfiguriert
  }
  
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
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
    
    return {
      success: true,
      provider: this.name
    };
  }
}

/**
 * Provider, der E-Mails in eine Datei schreibt (für Entwicklung/Tests)
 */
class FileEmailProvider implements EmailProvider {
  readonly name = 'file';
  private outputDir: string;
  
  constructor(outputDir: string) {
    this.outputDir = outputDir;
    // Stelle sicher, dass das Ausgabeverzeichnis existiert
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    emailLogger.info(`Datei-E-Mail-Provider initialisiert (Ausgabe nach: ${outputDir})`);
  }
  
  isConfigured(): boolean {
    return true; // Immer konfiguriert
  }
  
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
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
      return {
        success: true,
        provider: this.name
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      emailLogger.error('Fehler beim Speichern der E-Mail als Datei:', error);
      
      return {
        success: false,
        error: errorMessage,
        provider: this.name
      };
    }
  }
}

/**
 * E-Mail-Datenbank-Service für die Warteschlange
 */
class EmailQueueService {
  constructor() {
    emailLogger.info('E-Mail-Warteschlange initialisiert');
  }
  
  /**
   * Fügt eine E-Mail zur Warteschlange hinzu
   */
  async enqueueEmail(options: EmailOptions): Promise<number> {
    try {
      const now = new Date();
      const recipient = Array.isArray(options.to) ? options.to.join(',') : options.to;
      
      let attachmentsJson = null;
      if (options.attachments && options.attachments.length > 0) {
        attachmentsJson = options.attachments.map(attachment => ({
          filename: attachment.filename,
          content: typeof attachment.content === 'string' 
            ? attachment.content 
            : attachment.content.toString('base64'),
          contentType: attachment.contentType
        }));
      }
      
      // Verbesserte Typsicherheit für Neon DB
      const result = await db.execute(sql`
        INSERT INTO email_queue (
          recipient, subject, html_content, text_content, 
          template_id, template_data, status, created_at, attachments
        ) VALUES (
          ${String(recipient)}, 
          ${String(options.subject)}, 
          ${options.html ? String(options.html) : null}, 
          ${options.text ? String(options.text) : null}, 
          ${options.templateId ? String(options.templateId) : null}, 
          ${options.templateData ? JSON.stringify(options.templateData) : null}, 
          'pending', 
          ${now.toISOString()}, 
          ${attachmentsJson ? JSON.stringify(attachmentsJson) : null}
        ) RETURNING id
      `);
      
      // Typüberprüfung für ID aus Rückgabewert
      const rows = result.rows as any[];
      if (!rows || rows.length === 0 || !rows[0].id) {
        throw new Error('Fehler beim Hinzufügen der E-Mail: Keine ID zurückgegeben');
      }
      
      const id = Number(rows[0].id);
      emailLogger.info(`E-Mail zur Warteschlange hinzugefügt mit ID: ${id}`);
      return id;
    } catch (error) {
      emailLogger.error('Fehler beim Hinzufügen zur E-Mail-Warteschlange:', error);
      throw error;
    }
  }
  
  /**
   * Aktualisiert den Status einer E-Mail in der Warteschlange
   */
  async updateEmailStatus(id: number, status: string, errorMessage?: string, provider?: string): Promise<void> {
    try {
      let sentAt = null;
      if (status === 'sent') {
        sentAt = new Date();
      }
      
      await db.execute(sql`
        UPDATE email_queue 
        SET status = ${status},
            error_message = ${errorMessage || null},
            provider = ${provider || null},
            sent_at = ${sentAt} 
        WHERE id = ${id}
      `);
      
      emailLogger.info(`E-Mail-Status aktualisiert für ID ${id}: ${status}`);
    } catch (error) {
      emailLogger.error(`Fehler beim Aktualisieren des E-Mail-Status für ID ${id}:`, error);
    }
  }
  
  /**
   * Erhöht den Wiederholungszähler für eine E-Mail
   */
  async incrementRetryCount(id: number): Promise<void> {
    try {
      await db.execute(sql`
        UPDATE email_queue 
        SET retry_count = retry_count + 1
        WHERE id = ${id}
      `);
    } catch (error) {
      emailLogger.error(`Fehler beim Erhöhen des Wiederholungszählers für ID ${id}:`, error);
    }
  }
  
  /**
   * Holt die nächste zu sendende E-Mail aus der Warteschlange
   */
  async getNextPendingEmail(): Promise<EmailQueueItem | null> {
    try {
      // Verbesserte Typenbehandlung
      const result = await db.execute(sql`
        SELECT * FROM email_queue
        WHERE status = 'pending' AND retry_count < ${MAX_RETRY_COUNT}
        ORDER BY created_at ASC
        LIMIT 1
      `);
      
      // Bessere Typsicherheit für Neon DB-Ergebnisse
      const rows = result.rows as any[];
      if (rows.length === 0) {
        return null;
      }
      
      const emailData = rows[0];
      
      // Typüberprüfungen für bessere Zuverlässigkeit
      if (!emailData || typeof emailData.id !== 'number') {
        emailLogger.warn('Ungültige E-Mail-Daten in der Warteschlange gefunden:', emailData);
        return null;
      }
      
      // Wandle die Daten in ein EmailQueueItem um mit Typsicherheit
      return {
        id: Number(emailData.id),
        recipient: String(emailData.recipient || ''),
        subject: String(emailData.subject || ''),
        html: emailData.html_content ? String(emailData.html_content) : undefined,
        text: emailData.text_content ? String(emailData.text_content) : undefined,
        templateId: emailData.template_id ? String(emailData.template_id) : undefined,
        templateData: emailData.template_data ? JSON.parse(String(emailData.template_data)) : undefined,
        attachments: emailData.attachments ? JSON.parse(String(emailData.attachments)) : undefined,
        status: String(emailData.status) as 'pending' | 'processing' | 'sent' | 'failed',
        errorMessage: emailData.error_message ? String(emailData.error_message) : undefined,
        retryCount: Number(emailData.retry_count || 0),
        createdAt: emailData.created_at ? new Date(emailData.created_at) : new Date(),
        sentAt: emailData.sent_at ? new Date(emailData.sent_at) : undefined,
        provider: emailData.provider ? String(emailData.provider) : undefined
      };
    } catch (error) {
      emailLogger.error('Fehler beim Abrufen der nächsten E-Mail aus der Warteschlange:', error);
      return null;
    }
  }
  
  // Zähler für leere Abfragen, um die Häufigkeit zu reduzieren
  private emptyQueueCounter: number = 0;
  private readonly MAX_EMPTY_COUNT: number = 5; // Nach 5 leeren Abfragen wird die Überprüfung ausgesetzt
  private queueLastCheckedAt: Date | null = null;
  
  /**
   * Verarbeitet die E-Mail-Warteschlange (wird regelmäßig aufgerufen)
   * Optimiert: Intelligente Reduzierung der Abfragen bei leerer Warteschlange
   */
  async processQueue(emailService: EmailService): Promise<void> {
    // Überprüfen, ob wir kürzlich mehrfach eine leere Warteschlange gefunden haben
    if (this.emptyQueueCounter >= this.MAX_EMPTY_COUNT) {
      const now = new Date();
      // Wenn die letzte Überprüfung weniger als 15 Minuten her ist, überspringen
      if (this.queueLastCheckedAt && 
          (now.getTime() - this.queueLastCheckedAt.getTime() < 15 * 60 * 1000)) {
        // Überspringe, aber logge dies nur bei jeder 10. Gelegenheit, um das Log nicht zu überfüllen
        if (this.emptyQueueCounter % 10 === 0) {
          emailLogger.debug(`E-Mail-Warteschlange-Überprüfung ausgesetzt (leere Warteschlange, zuletzt geprüft: ${this.queueLastCheckedAt.toISOString()})`);
        }
        return;
      } else {
        // Setze den Zähler zurück nach 15 Minuten
        this.emptyQueueCounter = 0;
      }
    }
    
    const pendingEmail = await this.getNextPendingEmail();
    if (!pendingEmail || !pendingEmail.id) {
      // Erhöhe den Zähler für leere Warteschlangen
      this.emptyQueueCounter++;
      this.queueLastCheckedAt = new Date();
      return; // Nichts zu tun
    }
    
    // Zurücksetzen des Zählers, da wir eine E-Mail gefunden haben
    this.emptyQueueCounter = 0;
    
    try {
      // Markiere die E-Mail als "wird verarbeitet"
      await this.updateEmailStatus(pendingEmail.id, 'processing');
      
      // Bereite die E-Mail-Optionen vor
      const options: EmailOptions = {
        to: pendingEmail.recipient.split(','),
        subject: pendingEmail.subject,
        html: pendingEmail.html,
        text: pendingEmail.text,
        templateId: pendingEmail.templateId,
        templateData: pendingEmail.templateData,
        attachments: pendingEmail.attachments
      };
      
      // Sende die E-Mail
      const result = await emailService.sendEmailWithFallback(options);
      
      if (result.success) {
        // E-Mail wurde erfolgreich gesendet
        await this.updateEmailStatus(pendingEmail.id, 'sent', undefined, result.provider);
      } else {
        // Fehler beim Senden
        await this.incrementRetryCount(pendingEmail.id);
        
        if (pendingEmail.retryCount >= MAX_RETRY_COUNT - 1) {
          // Maximale Anzahl an Wiederholungen erreicht
          await this.updateEmailStatus(pendingEmail.id, 'failed', result.error, result.provider);
          emailLogger.error(`E-Mail mit ID ${pendingEmail.id} konnte nach ${MAX_RETRY_COUNT} Versuchen nicht gesendet werden`);
        } else {
          // Zurück auf 'pending' setzen für einen weiteren Versuch
          await this.updateEmailStatus(pendingEmail.id, 'pending', result.error, result.provider);
          emailLogger.warn(`E-Mail mit ID ${pendingEmail.id} wird später erneut versucht (Fehler: ${result.error})`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      emailLogger.error(`Fehler bei der Verarbeitung der E-Mail mit ID ${pendingEmail.id}:`, error);
      
      await this.incrementRetryCount(pendingEmail.id);
      await this.updateEmailStatus(pendingEmail.id, 'pending', errorMessage);
    }
  }
}

/**
 * Hauptklasse des E-Mail-Services
 */
class EmailService {
  private providers: EmailProvider[] = [];
  private queueService: EmailQueueService;
  private queueProcessorInterval: NodeJS.Timer | null = null;
  
  constructor() {
    // Provider basierend auf Konfiguration initialisieren
    const brevoApiKey = config.email.apiKey || process.env.BREVO_API_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    
    // Provider in der Reihenfolge hinzufügen, in der sie verwendet werden sollen
    if (brevoApiKey) {
      this.providers.push(new BrevoEmailProvider(brevoApiKey));
    }
    
    if (sendgridApiKey) {
      this.providers.push(new SendGridEmailProvider(sendgridApiKey));
    }
    
    // Konsolen-Provider als Fallback immer hinzufügen
    this.providers.push(new ConsoleEmailProvider());
    
    // Zusätzlich Datei-Provider in der Entwicklungsumgebung
    if (config.isDevelopment) {
      this.providers.push(new FileEmailProvider('./temp/emails'));
    }
    
    // E-Mail-Warteschlange initialisieren
    this.queueService = new EmailQueueService();
    
    // Status-Log
    emailLogger.info(`E-Mail-Service initialisiert mit ${this.providers.length} Providern`);
    this.providers.forEach(provider => {
      emailLogger.info(`- ${provider.name} (${provider.isConfigured() ? 'konfiguriert' : 'nicht konfiguriert'})`);
    });
    
    // Warteschlangen-Prozessor starten (falls nicht in einer Test-Umgebung)
    if (process.env.NODE_ENV !== 'test') {
      this.startQueueProcessor();
    }
  }
  
  /**
   * Startet den Prozessor für die E-Mail-Warteschlange
   * Optimiert: Längeres Intervall (5 Minuten statt 1 Minute)
   */
  private startQueueProcessor(): void {
    // Warteschlangen-Prozessor alle 5 Minuten (300 Sekunden) ausführen statt 60 Sekunden
    // Dies reduziert die Datenbankbelastung erheblich
    // @ts-ignore - Timer-Kompatibilitätsproblem zwischen Node-Typen ignorieren
    this.queueProcessorInterval = setInterval(() => {
      this.queueService.processQueue(this).catch(error => {
        emailLogger.error('Fehler beim Verarbeiten der E-Mail-Warteschlange:', error);
      });
    }, 300000);
    
    emailLogger.info('E-Mail-Warteschlangen-Prozessor gestartet (5-Minuten-Intervall)');
  }
  
  /**
   * Stoppt den Prozessor für die E-Mail-Warteschlange
   */
  stopQueueProcessor(): void {
    if (this.queueProcessorInterval) {
      // @ts-ignore - Timer-Kompatibilitätsproblem zwischen Node-Typen ignorieren
      clearInterval(this.queueProcessorInterval);
      this.queueProcessorInterval = null;
      emailLogger.info('E-Mail-Warteschlangen-Prozessor gestoppt');
    }
  }
  
  /**
   * Sendet eine E-Mail mit dem ersten verfügbaren Provider
   */
  async sendEmailDirectly(options: EmailOptions): Promise<EmailResult> {
    // Nur konfigurierte Provider verwenden
    const configuredProviders = this.providers.filter(provider => provider.isConfigured());
    
    if (configuredProviders.length === 0) {
      return {
        success: false,
        error: 'Kein E-Mail-Provider konfiguriert'
      };
    }
    
    // Erster Versuch mit dem bevorzugten Provider
    const primaryProvider = configuredProviders[0];
    const result = await primaryProvider.sendEmail(options);
    
    return result;
  }
  
  /**
   * Sendet eine E-Mail mit Fallback auf andere Provider bei Fehler
   */
  async sendEmailWithFallback(options: EmailOptions): Promise<EmailResult> {
    // Nur konfigurierte Provider verwenden
    const configuredProviders = this.providers.filter(provider => provider.isConfigured());
    
    if (configuredProviders.length === 0) {
      return {
        success: false,
        error: 'Kein E-Mail-Provider konfiguriert'
      };
    }
    
    let lastError: string | undefined;
    
    // Versuche mit jedem Provider, bis einer erfolgreich ist
    for (const provider of configuredProviders) {
      try {
        const result = await provider.sendEmail(options);
        
        if (result.success) {
          return result;
        }
        
        lastError = result.error;
        emailLogger.warn(`Provider ${provider.name} konnte E-Mail nicht senden: ${result.error}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        lastError = errorMessage;
        emailLogger.error(`Unerwarteter Fehler mit Provider ${provider.name}:`, error);
      }
    }
    
    // Wenn alle Provider fehlgeschlagen sind
    return {
      success: false,
      error: lastError || 'Alle E-Mail-Provider sind fehlgeschlagen'
    };
  }
  
  /**
   * Fügt eine E-Mail zur Warteschlange hinzu und sendet sie asynchron
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // E-Mail zur Warteschlange hinzufügen
      const emailId = await this.queueService.enqueueEmail(options);
      
      // Wenn hohe Priorität, sofort verarbeiten
      if (options.highPriority) {
        await this.queueService.processQueue(this);
      }
      
      return true;
    } catch (error) {
      emailLogger.error('Fehler beim Senden der E-Mail über die Warteschlange:', error);
      
      // Fallback: Direkt senden, wenn die Warteschlange nicht funktioniert
      const result = await this.sendEmailDirectly(options);
      return result.success;
    }
  }
  
  /**
   * Sendet eine E-Mail mit einem vorkonfigurierten Template
   */
  async sendTemplateEmail(
    templateKey: keyof typeof config.email.templates,
    to: string | string[],
    subject: string,
    templateData: Record<string, any>,
    highPriority = false
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
      templateData,
      highPriority
    });
  }
}

// Exportiere eine Singleton-Instanz des E-Mail-Services
export const emailService = new EmailService();

// Standard-Export für einfachen Import
export default emailService;