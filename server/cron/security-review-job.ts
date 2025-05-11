/**
 * Cron-Job für den täglichen Sicherheits-Code-Review
 * 
 * Dieser Job wird täglich ausgeführt und sendet einen Code-Review der
 * Sicherheitsmodule per E-Mail an die konfigurierte Adresse.
 */

import { CronJob } from 'cron';
import { logger } from '../logger';
import { runSecurityReview } from '../scripts/security-review';

// Zeitplan für den täglichen Bericht (08:00 Uhr)
const SCHEDULE = '0 0 8 * * *';  // Sekunde Minute Stunde Tag Monat Wochentag

/**
 * Erstellt und startet den Cron-Job für den täglichen Sicherheits-Code-Review
 */
export function initializeSecurityReviewJob(): CronJob {
  logger.info(`Sicherheits-Code-Review Cron-Job mit Zeitplan '${SCHEDULE}' wird initialisiert`);
  
  const job = new CronJob(
    SCHEDULE,
    async function() {
      logger.info('Starte geplanten Sicherheits-Code-Review');
      try {
        await runSecurityReview();
        logger.info('Geplanter Sicherheits-Code-Review erfolgreich abgeschlossen');
      } catch (error) {
        logger.error('Fehler beim Ausführen des geplanten Sicherheits-Code-Reviews:', error);
      }
    },
    null,  // onComplete
    true,  // autostart
    'Europe/Berlin'  // Timezone
  );
  
  return job;
}

// Direkte Ausführung in ES Modulen funktioniert anders
// Bei Bedarf kann diese Funktion manuell aufgerufen werden
export function startSecurityReviewJob(): void {
  initializeSecurityReviewJob();
  logger.info('Sicherheits-Code-Review Cron-Job gestartet');
}