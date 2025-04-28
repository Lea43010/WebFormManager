/**
 * Trial Email Service
 * 
 * Dieser Service verwaltet E-Mails im Zusammenhang mit der Testphase:
 * - Benachrichtigung, wenn die Testphase bald endet (3 Tage vorher)
 * - Benachrichtigung, wenn die Testphase abgelaufen ist
 * - Angebote zur Verlängerung durch Abonnement
 */

import { db } from './db';
import { sql } from 'drizzle-orm';
import { emailService } from './email-service';
import { logger } from './logger';
import config from '../config';

// Logger für diesen Service erstellen
const trialLogger = logger.createLogger('trial-emails');

export class TrialEmailService {
  /**
   * Sendet eine Benachrichtigung an Benutzer, deren Testphase in den nächsten Tagen ausläuft
   * @param daysBeforeExpiry Wie viele Tage vor Ablauf die Benachrichtigung gesendet werden soll (Standard: 3)
   */
  async sendTrialEndingNotifications(daysBeforeExpiry: number = 3): Promise<number> {
    try {
      // Berechne das Datum, das daysBeforeExpiry Tage in der Zukunft liegt
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);
      
      // Setze die Zeit auf 23:59:59, um den gesamten Tag abzudecken
      targetDate.setHours(23, 59, 59, 999);
      
      // Datum für SQL-Abfrage formatieren (YYYY-MM-DD)
      const formattedDate = targetDate.toISOString().split('T')[0];
      
      // Benutzer finden, deren Testphase an diesem Tag ausläuft und die noch keine Benachrichtigung erhalten haben
      // @ts-ignore - Neon DB Typen sind nicht immer korrekt
      const results = await db.execute(sql`
        SELECT id, username, user_name, user_email, trial_end_date
        FROM tbluser
        WHERE DATE(trial_end_date) = DATE(${formattedDate})
        AND (subscription_status = 'trial' OR subscription_status IS NULL)
        AND user_email IS NOT NULL
      `);
      
      // @ts-ignore - Neon DB Typen sind nicht immer korrekt
      const users = results.rows;
      
      if (users.length === 0) {
        trialLogger.info(`Keine Benutzer mit ablaufender Testphase in ${daysBeforeExpiry} Tagen gefunden.`);
        return 0;
      }
      
      let sentCount = 0;
      
      // Sende E-Mails an alle gefundenen Benutzer
      for (const user of users) {
        if (!user.user_email) continue; // Überspringe Benutzer ohne E-Mail-Adresse
        
        // Ein lokalisierbarer Anzeigename für E-Mail-Anrede (nutze username als Fallback)
        const displayName = user.user_name || user.username;
        
        // Formatiertes Ablaufdatum für die E-Mail
        const formattedEndDate = new Date(user.trial_end_date).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        // E-Mail senden
        const emailSent = await emailService.sendTemplateEmail(
          'trialEnding',
          user.user_email,
          'Ihre Testphase endet bald – Jetzt Abonnement sichern',
          {
            userName: displayName,
            daysRemaining: daysBeforeExpiry,
            endDate: formattedEndDate,
            subscriptionLink: `${config.APP_URL}/abonnement`,
            appName: 'Bau-Structura'
          },
          true // Hohe Priorität
        );
        
        if (emailSent) {
          sentCount++;
          trialLogger.info(`Testphasen-Benachrichtigung gesendet an: ${user.user_email} (ID: ${user.id})`);
          
          // Aktivitätsprotokoll-Eintrag erstellen
          await this.logEmailActivity(user.id, 'trial_ending_notification', daysBeforeExpiry);
        }
      }
      
      trialLogger.info(`${sentCount} von ${users.length} Testphasen-Ende-Benachrichtigungen gesendet.`);
      return sentCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      trialLogger.error(`Fehler beim Senden von Testphasen-Ende-Benachrichtigungen: ${errorMessage}`, error);
      return 0;
    }
  }
  
  /**
   * Sendet eine Benachrichtigung an Benutzer, deren Testphase abgelaufen ist
   * @param daysAfterExpiry Wie viele Tage nach Ablauf die Benachrichtigung gesendet werden soll (Standard: 1)
   */
  async sendTrialEndedNotifications(daysAfterExpiry: number = 1): Promise<number> {
    try {
      // Berechne das Datum, das daysAfterExpiry Tage in der Vergangenheit liegt
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - daysAfterExpiry);
      
      // Setze die Zeit auf den Anfang des Tages
      targetDate.setHours(0, 0, 0, 0);
      
      // Datum für SQL-Abfrage formatieren (YYYY-MM-DD)
      const formattedDate = targetDate.toISOString().split('T')[0];
      
      // Benutzer finden, deren Testphase an diesem Tag abgelaufen ist und die noch keine Abo haben
      // @ts-ignore - Neon DB Typen sind nicht immer korrekt
      const results = await db.execute(sql`
        SELECT id, username, user_name, user_email, trial_end_date
        FROM tbluser
        WHERE DATE(trial_end_date) = DATE(${formattedDate})
        AND (subscription_status = 'trial' OR subscription_status IS NULL)
        AND user_email IS NOT NULL
      `);
      
      // @ts-ignore - Neon DB Typen sind nicht immer korrekt
      const users = results.rows;
      
      if (users.length === 0) {
        trialLogger.info(`Keine Benutzer mit abgelaufener Testphase vor ${daysAfterExpiry} Tagen gefunden.`);
        return 0;
      }
      
      let sentCount = 0;
      
      // Sende E-Mails an alle gefundenen Benutzer
      for (const user of users) {
        if (!user.user_email) continue; // Überspringe Benutzer ohne E-Mail-Adresse
        
        // Ein lokalisierbarer Anzeigename für E-Mail-Anrede (nutze username als Fallback)
        const displayName = user.user_name || user.username;
        
        // Formatiertes Ablaufdatum für die E-Mail
        const formattedEndDate = new Date(user.trial_end_date).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        // Update Subscription Status to 'expired'
        await db.execute(sql`
          UPDATE tbluser
          SET subscription_status = 'expired'
          WHERE id = ${user.id}
        `);
        
        // E-Mail senden
        const emailSent = await emailService.sendTemplateEmail(
          'trialEnded',
          user.user_email,
          'Ihre Testphase ist abgelaufen – Handeln Sie jetzt',
          {
            userName: displayName,
            endDate: formattedEndDate,
            daysExpired: daysAfterExpiry,
            subscriptionLink: `${config.APP_URL}/abonnement`,
            appName: 'Bau-Structura'
          },
          true // Hohe Priorität
        );
        
        if (emailSent) {
          sentCount++;
          trialLogger.info(`Testphase-abgelaufen-Benachrichtigung gesendet an: ${user.user_email} (ID: ${user.id})`);
          
          // Aktivitätsprotokoll-Eintrag erstellen
          await this.logEmailActivity(user.id, 'trial_ended_notification', daysAfterExpiry);
        }
      }
      
      trialLogger.info(`${sentCount} von ${users.length} Testphase-abgelaufen-Benachrichtigungen gesendet.`);
      return sentCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      trialLogger.error(`Fehler beim Senden von Testphase-abgelaufen-Benachrichtigungen: ${errorMessage}`, error);
      return 0;
    }
  }
  
  /**
   * Hilfsmethode: Protokolliert E-Mail-Aktivitäten in der Datenbank
   */
  private async logEmailActivity(userId: number, activityType: string, days: number): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO tblactivity_log (
          user_id, activity_type, activity_data, timestamp
        ) VALUES (
          ${userId}, 
          ${activityType}, 
          ${JSON.stringify({ days })}, 
          ${new Date()}
        )
      `);
    } catch (error) {
      trialLogger.error(`Fehler beim Protokollieren der E-Mail-Aktivität: ${error}`);
    }
  }
}

// Singleton-Instanz exportieren
export const trialEmailService = new TrialEmailService();

// Standard-Export für einfachen Import
export default trialEmailService;