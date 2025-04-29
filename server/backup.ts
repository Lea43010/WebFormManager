/**
 * Backup-Funktionalität für die Bau-Structura App
 */

import express from 'express';
import { registerBackupRoutes } from './backup-routes';
import { registerGitHubBackupRoutes } from './github-backup-routes';
import { initGitHubBackup } from './github-backup';
import config from '../config';

/**
 * Initialisiert die Backup-Funktionalität
 */
export function initBackupSystem() {
  // GitHub-Backup initialisieren, wenn konfiguriert
  if (config.backup.github && config.backup.github.enabled) {
    initGitHubBackup();
  }
}

/**
 * Richtet die Backup-Routen ein
 * @param app Express-App-Instanz
 */
export function setupBackupRoutes(app: express.Express) {
  // Standard-Backup-Routen
  registerBackupRoutes(app);
  
  // GitHub-Backup-Routen
  registerGitHubBackupRoutes(app);
}