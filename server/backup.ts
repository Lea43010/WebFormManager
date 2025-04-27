/**
 * Backup-Funktionalität für die Bau-Structura App
 */

import express from 'express';
import { registerBackupRoutes } from './backup-routes';

/**
 * Richtet die Backup-Routen ein
 * @param app Express-App-Instanz
 */
export function setupBackupRoutes(app: express.Express) {
  registerBackupRoutes(app);
}