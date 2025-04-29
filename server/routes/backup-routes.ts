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
  // Backup-API an /api/admin/backups-Endpunkt montieren
  // Anpassung an die bestehenden Frontend-Routen
  app.use('/api/admin/backups', backupApi);

  // Loggen, dass die Routen eingerichtet wurden
  console.log('[INFO] [backup] Backup-API-Endpunkte eingerichtet');
}