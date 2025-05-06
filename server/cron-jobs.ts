/**
 * Cron-Jobs für regelmäßige Aufgaben
 * 
 * Dieses Modul initialisiert und verwaltet alle Cron-Jobs der Anwendung,
 * wie z.B. die tägliche Überprüfung auf ablaufende Testphasen.
 */

import { CronJob } from 'cron';
import { logger } from './logger';
import { trialExpirationService } from './services/trial-expiration-service';

// Spezifischer Logger für Cron-Jobs
const cronLogger = logger.createLogger('cron');

/**
 * Manager für alle Cron-Jobs
 */
export class CronJobManager {
  private jobs: CronJob[] = [];

  /**
   * Initialisiert alle Cron-Jobs
   */
  async initialize(): Promise<void> {
    try {
      // Initialisiere den Trial-Expiration-Service
      await trialExpirationService.initialize();

      // Cron-Job für die tägliche Überprüfung auf ablaufende Testphasen (03:00 Uhr)
      // Format: Sekunde Minute Stunde Tag Monat Wochentag
      this.addJob('0 0 3 * * *', async () => {
        cronLogger.info('Starte geplante Überprüfung auf ablaufende Testphasen');
        await trialExpirationService.checkAndNotifyExpiringTrials();
      }, 'trial-expiration-check');

      cronLogger.info('Cron-Jobs initialisiert');
    } catch (error) {
      cronLogger.error('Fehler beim Initialisieren der Cron-Jobs:', error);
    }
  }

  /**
   * Fügt einen neuen Cron-Job hinzu und startet ihn
   */
  private addJob(cronTime: string, onTick: () => void, name: string): void {
    try {
      const job = new CronJob(
        cronTime,
        async () => {
          try {
            cronLogger.info(`Cron-Job "${name}" ausgeführt`);
            await onTick();
            cronLogger.info(`Cron-Job "${name}" erfolgreich abgeschlossen`);
          } catch (error) {
            cronLogger.error(`Fehler bei der Ausführung des Cron-Jobs "${name}":`, error);
          }
        },
        null, // onComplete
        true, // start
        'Europe/Berlin' // Zeitzone
      );

      this.jobs.push(job);
      cronLogger.info(`Cron-Job "${name}" mit Zeitplan "${cronTime}" initialisiert und gestartet`);
    } catch (error) {
      cronLogger.error(`Fehler beim Hinzufügen des Cron-Jobs "${name}":`, error);
    }
  }

  /**
   * Führt den Trial-Expiration-Check manuell aus
   */
  async runTrialExpirationCheck(): Promise<void> {
    try {
      cronLogger.info('Manueller Trial-Expiration-Check gestartet');
      await trialExpirationService.checkAndNotifyExpiringTrials();
      cronLogger.info('Manueller Trial-Expiration-Check abgeschlossen');
    } catch (error) {
      cronLogger.error('Fehler beim manuellen Trial-Expiration-Check:', error);
    }
  }

  /**
   * Stoppt alle Cron-Jobs
   */
  stopAll(): void {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    cronLogger.info('Alle Cron-Jobs gestoppt');
  }
}

// Singleton-Instanz
export const cronJobManager = new CronJobManager();

export default cronJobManager;