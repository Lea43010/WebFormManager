/**
 * Backup-API-Routen-Register
 */

import express from 'express';
import { backupApi } from '../backup-api';

/**
 * Registriert die Backup-API-Routen am Express-Server
 * @param app Express-App-Instanz
 */
export function registerBackupApiRoutes(app: express.Express) {
  // Backup-API an /api/backup-Endpunkt montieren
  app.use('/api/backup', backupApi);

  // Loggen, dass die Routen eingerichtet wurden
  console.log('[INFO] [backup] Backup-API-Endpunkte eingerichtet');
}