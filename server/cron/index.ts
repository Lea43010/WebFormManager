/**
 * Zentrales Cron-Job-Modul
 * 
 * Dieses Modul initialisiert und verwaltet alle Cron-Jobs der Anwendung.
 */

import { logger } from '../logger';
import { initializeSecurityReviewJob } from './security-review-job';

// Sammlung aller aktiven Cron-Jobs
const activeCronJobs = new Map();

/**
 * Initialisiert alle Cron-Jobs der Anwendung
 */
export function initializeCronJobs(): void {
  logger.info('Initialisiere Cron-Jobs');
  
  // Security-Review-Job hinzufügen
  const securityReviewJob = initializeSecurityReviewJob();
  activeCronJobs.set('security-review', securityReviewJob);
  
  // Weitere Jobs hier hinzufügen
  // ...
  
  const jobCount = activeCronJobs.size;
  logger.info(`${jobCount} Cron-Jobs erfolgreich initialisiert`);
}

/**
 * Stoppt alle aktiven Cron-Jobs
 */
export function stopAllCronJobs(): void {
  logger.info('Stoppe alle Cron-Jobs');
  
  // Array.from verwendet, um Iterator-Kompatibilität zu verbessern
  Array.from(activeCronJobs.entries()).forEach(([name, job]) => {
    job.stop();
    logger.info(`Cron-Job "${name}" gestoppt`);
  });
  
  activeCronJobs.clear();
}

/**
 * Führt einen Job sofort aus (für Tests oder manuelle Ausführung)
 */
export function runJobImmediately(jobName: string): boolean {
  const job = activeCronJobs.get(jobName);
  
  if (!job) {
    logger.error(`Cron-Job "${jobName}" nicht gefunden`);
    return false;
  }
  
  logger.info(`Führe Cron-Job "${jobName}" sofort aus`);
  job.fireOnTick();
  return true;
}

// ES Modul Handling
export function manuallyInitializeCronJobs(): void {
  initializeCronJobs();
}