/**
 * Cron-Jobs für wiederkehrende Aufgaben
 * 
 * Diese Datei enthält alle zeitgesteuerten Aufgaben wie:
 * - Tägliches Datenbank-Backup
 * - E-Mail-Benachrichtigungen für Testphasen-Ende
 * - Automatische Bereinigungsaufgaben
 */

import cron from 'node-cron';
import { logger } from './logger';
import { trialEmailService } from './trial-email-service';
import config from '../config';
import { runBackup } from './cron-jobs/backup';

// Logger für dieses Modul erstellen
const cronLogger = logger.createLogger('cron-jobs');

/**
 * Startet alle konfigurierten Cron-Jobs
 */
export function initCronJobs() {
  cronLogger.info('Initialisiere Cron-Jobs...');
  
  // Tägliches Backup - Um 3:00 Uhr morgens
  cron.schedule('0 3 * * *', () => {
    cronLogger.info('Führe tägliches Backup aus...');
    try {
      runBackup();
    } catch (error) {
      cronLogger.error('Fehler bei der Ausführung des täglichen Backups:', error);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Berlin"
  });
  
  // Testphasen-Benachrichtigungen - Täglich um 9:00 Uhr
  cron.schedule('0 9 * * *', async () => {
    cronLogger.info('Führe Testphasen-Benachrichtigungen aus...');
    
    try {
      // Benachrichtigungen für Testphasen, die in 3 Tagen ablaufen
      const endingSoon = await trialEmailService.sendTrialEndingNotifications(3);
      cronLogger.info(`${endingSoon} Benachrichtigungen für bald endende Testphasen gesendet.`);
      
      // Benachrichtigungen für abgelaufene Testphasen (1 Tag nach Ablauf)
      const ended = await trialEmailService.sendTrialEndedNotifications(1);
      cronLogger.info(`${ended} Benachrichtigungen für abgelaufene Testphasen gesendet.`);
    } catch (error) {
      cronLogger.error('Fehler bei der Ausführung der Testphasen-Benachrichtigungen:', error);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Berlin"
  });
  
  // Wenn wir in Entwicklungsumgebung sind und DEBUG_CRON_JOBS aktiviert ist, 
  // führe die Jobs sofort aus (für Debugging)
  if (config.isDevelopment && process.env.DEBUG_CRON_JOBS === 'true') {
    cronLogger.info('DEBUG_CRON_JOBS ist aktiviert. Führe Jobs sofort aus...');
    
    // Führe das Backup sofort aus
    setTimeout(() => {
      try {
        cronLogger.info('[DEBUG] Führe sofortiges Backup aus...');
        runBackup();
      } catch (error) {
        cronLogger.error('[DEBUG] Fehler bei der Ausführung des sofortigen Backups:', error);
      }
    }, 3000); // Warte 3 Sekunden nach Server-Start
    
    // Führe die Testphasen-Benachrichtigungen sofort aus
    setTimeout(async () => {
      try {
        const endingSoon = await trialEmailService.sendTrialEndingNotifications(3);
        cronLogger.info(`[DEBUG] ${endingSoon} Benachrichtigungen für bald endende Testphasen gesendet.`);
        
        const ended = await trialEmailService.sendTrialEndedNotifications(1);
        cronLogger.info(`[DEBUG] ${ended} Benachrichtigungen für abgelaufene Testphasen gesendet.`);
      } catch (error) {
        cronLogger.error('[DEBUG] Fehler bei der Ausführung der Testphasen-Benachrichtigungen:', error);
      }
    }, 5000); // Warte 5 Sekunden nach Server-Start
  }
  
  cronLogger.info('Alle Cron-Jobs wurden initialisiert.');
}

// Standard-Export
export default { initCronJobs };