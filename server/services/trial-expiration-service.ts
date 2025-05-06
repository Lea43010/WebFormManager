/**
 * Service zur Überprüfung und Benachrichtigung von ablaufenden Testphasen
 * 
 * Dieser Service prüft täglich, welche Benutzer eine bald ablaufende Testphase haben
 * und sendet Erinnerungs-E-Mails.
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import { emailService } from '../email-service';
import config from '../../config';
import trialExpirationTemplate from '../email-templates/trial-expiration';
import { logger } from '../logger';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Spezifischer Logger für den Testphasen-Service
const trialLogger = logger.createLogger('trial-expiration');

interface UserWithExpiration {
  id: number;
  username: string;
  user_name: string | null;
  user_email: string;
  trial_end_date: Date;
}

/**
 * Service zur Verwaltung von Testphasen-Benachrichtigungen
 */
export class TrialExpirationService {
  // Tabelle zum Tracking versendeter Benachrichtigungen
  private async initNotificationTracking(): Promise<void> {
    try {
      // Prüfe, ob die Tabelle bereits existiert
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS trial_expiration_notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          notification_type VARCHAR(50) NOT NULL,
          sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, notification_type)
        );
      `);
      trialLogger.info('Tabelle für Testphasen-Benachrichtigungen initialisiert');
    } catch (error) {
      trialLogger.error('Fehler beim Initialisieren der Benachrichtigungs-Tracking-Tabelle:', error);
    }
  }

  /**
   * Sucht nach Benutzern, deren Testphase in 2 Tagen abläuft
   */
  private async findUsersWithExpiringTrials(): Promise<UserWithExpiration[]> {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    // Datum auf Mitternacht setzen
    twoDaysFromNow.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(twoDaysFromNow);
    nextDay.setDate(nextDay.getDate() + 1);
    
    try {
      // @ts-ignore - Neon DB Typen sind nicht immer korrekt
      const result = await db.execute(sql`
        SELECT id, username, user_name, user_email, trial_end_date
        FROM tbluser
        WHERE trial_end_date >= ${twoDaysFromNow.toISOString()} 
        AND trial_end_date < ${nextDay.toISOString()}
        AND subscription_status = 'trial'
        AND user_email IS NOT NULL
      `);
      
      // @ts-ignore - Neon DB Typen sind nicht immer korrekt
      return result.rows;
    } catch (error) {
      trialLogger.error('Fehler beim Suchen nach Benutzern mit ablaufender Testphase:', error);
      return [];
    }
  }

  /**
   * Prüft, ob dem Benutzer bereits eine Benachrichtigung gesendet wurde
   */
  private async wasNotificationSent(userId: number, notificationType: string): Promise<boolean> {
    try {
      // @ts-ignore - Neon DB Typen sind nicht immer korrekt
      const result = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM trial_expiration_notifications
        WHERE user_id = ${userId} 
        AND notification_type = ${notificationType}
      `);
      
      // @ts-ignore - Neon DB Typen sind nicht immer korrekt
      return result.rows[0].count > 0;
    } catch (error) {
      trialLogger.error(`Fehler beim Prüfen der Benachrichtigungshistorie für Benutzer ${userId}:`, error);
      return false; // Im Zweifelsfall Benachrichtigung senden
    }
  }

  /**
   * Markiert eine Benachrichtigung als gesendet
   */
  private async markNotificationSent(userId: number, notificationType: string): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO trial_expiration_notifications (user_id, notification_type, sent_at)
        VALUES (${userId}, ${notificationType}, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, notification_type) DO UPDATE
        SET sent_at = CURRENT_TIMESTAMP
      `);
      trialLogger.info(`Benachrichtigung '${notificationType}' für Benutzer ${userId} als gesendet markiert`);
    } catch (error) {
      trialLogger.error(`Fehler beim Markieren der Benachrichtigung für Benutzer ${userId}:`, error);
    }
  }

  /**
   * Sendet eine E-Mail-Benachrichtigung über die ablaufende Testphase
   */
  private async sendExpirationEmail(user: UserWithExpiration): Promise<boolean> {
    const subscriptionLink = `${config.APP_URL}/admin/account`;
    const expirationDate = format(user.trial_end_date, 'dd. MMMM yyyy', { locale: de });
    const userName = user.user_name || user.username;
    
    try {
      const success = await emailService.sendEmail({
        to: user.user_email,
        subject: trialExpirationTemplate.subject,
        text: trialExpirationTemplate.text
          .replace(/{{userName}}/g, userName)
          .replace(/{{expirationDate}}/g, expirationDate)
          .replace(/{{subscriptionLink}}/g, subscriptionLink),
        html: trialExpirationTemplate.html
          .replace(/{{userName}}/g, userName)
          .replace(/{{expirationDate}}/g, expirationDate)
          .replace(/{{subscriptionLink}}/g, subscriptionLink),
        highPriority: true,
        metadata: {
          type: 'trial_expiration',
          userId: user.id,
          expirationDate: user.trial_end_date.toISOString()
        }
      });
      
      if (success) {
        trialLogger.info(`Testphasen-Ablauf-Benachrichtigung für Benutzer ${user.id} (${user.username}) gesendet`);
      } else {
        trialLogger.error(`Fehler beim Senden der Testphasen-Ablauf-Benachrichtigung für Benutzer ${user.id}`);
      }
      
      return success;
    } catch (error) {
      trialLogger.error(`Unerwarteter Fehler beim Senden der Testphasen-Ablauf-Benachrichtigung für Benutzer ${user.id}:`, error);
      return false;
    }
  }

  /**
   * Initialisiert den Service und Tracking-Tabelle
   */
  async initialize(): Promise<void> {
    await this.initNotificationTracking();
  }

  /**
   * Hauptfunktion zur Überprüfung und Benachrichtigung von ablaufenden Testphasen
   */
  async checkAndNotifyExpiringTrials(): Promise<void> {
    try {
      trialLogger.info('Überprüfung auf ablaufende Testphasen gestartet');
      
      // Benutzer mit bald ablaufenden Testphasen finden
      const users = await this.findUsersWithExpiringTrials();
      
      if (users.length === 0) {
        trialLogger.info('Keine Benutzer mit in Kürze ablaufenden Testphasen gefunden');
        return;
      }
      
      trialLogger.info(`${users.length} Benutzer mit in Kürze ablaufenden Testphasen gefunden`);
      
      // Für jeden Benutzer prüfen und benachrichtigen
      for (const user of users) {
        // Prüfen, ob dem Benutzer bereits eine Benachrichtigung gesendet wurde
        const notificationType = 'two_days_before_expiration';
        const alreadyNotified = await this.wasNotificationSent(user.id, notificationType);
        
        if (alreadyNotified) {
          trialLogger.info(`Benutzer ${user.id} (${user.username}) wurde bereits über den Ablauf der Testphase benachrichtigt`);
          continue;
        }
        
        // E-Mail-Benachrichtigung senden
        const success = await this.sendExpirationEmail(user);
        
        if (success) {
          // Benachrichtigung als gesendet markieren
          await this.markNotificationSent(user.id, notificationType);
        }
      }
      
      trialLogger.info('Überprüfung auf ablaufende Testphasen abgeschlossen');
    } catch (error) {
      trialLogger.error('Fehler bei der Überprüfung auf ablaufende Testphasen:', error);
    }
  }
}

// Singleton-Instanz des Services
export const trialExpirationService = new TrialExpirationService();

export default trialExpirationService;