/**
 * Automatisches Backup-Skript
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { logger } from '../logger';

// Logger für Backup-Aufgaben
const backupLogger = logger.createLogger('backup');

// Maximale Anzahl der zu behaltenden Backups 
const MAX_BACKUPS = 10;

// Hilfsfunktion für asynchrone Prozessausführung
const execAsync = promisify(exec);

/**
 * Führt das Backup-Skript aus und protokolliert die Ergebnisse
 */
export function runBackup(): void {
  // Pfad zum Backup-Skript
  const backupScriptPath = path.resolve(process.cwd(), 'backup-script.sh');
  
  // Prüfen, ob das Skript existiert
  if (!fs.existsSync(backupScriptPath)) {
    backupLogger.error('Backup-Skript nicht gefunden:', backupScriptPath);
    return;
  }
  
  backupLogger.info('Starte automatisches Backup...');
  
  // Skript ausführen
  execAsync(backupScriptPath)
    .then(({stdout, stderr}) => {
      if (stderr && !stderr.includes('NOTICE:') && !stderr.includes('INFO:')) {
        backupLogger.error('Fehler beim Backup:', stderr);
        return;
      }
      
      // Erfolg protokollieren
      const backupFile = stdout.trim().replace('Backup erstellt: ', '');
      backupLogger.info('Automatisches Backup erfolgreich abgeschlossen:', backupFile);
      
      // Alte Backups bereinigen
      cleanupOldBackups();
    })
    .catch(error => {
      backupLogger.error('Fehler bei der Ausführung des Backup-Skripts:', error);
    });
}

/**
 * Bereinigt alte Backups und behält nur die neuesten MAX_BACKUPS
 */
function cleanupOldBackups(): void {
  const backupRoot = path.resolve(process.cwd(), 'backup');
  
  // Prüfen, ob das Backup-Verzeichnis existiert
  if (!fs.existsSync(backupRoot)) {
    return;
  }
  
  try {
    // Alle Datumsordner finden
    const dateDirs = fs.readdirSync(backupRoot)
      .filter(dir => /^\d{4}-\d{2}-\d{2}$/.test(dir))
      .sort((a, b) => b.localeCompare(a)); // Neueste zuerst
    
    // Wenn zu viele Datumsordner vorhanden sind, die ältesten löschen
    if (dateDirs.length > MAX_BACKUPS) {
      const dirsToDelete = dateDirs.slice(MAX_BACKUPS);
      
      dirsToDelete.forEach(dir => {
        const dirPath = path.join(backupRoot, dir);
        backupLogger.info(`Lösche alten Backup-Ordner: ${dirPath}`);
        
        try {
          fs.rmSync(dirPath, { recursive: true, force: true });
        } catch (error) {
          backupLogger.error(`Fehler beim Löschen des alten Backup-Ordners ${dirPath}:`, error);
        }
      });
    }
  } catch (error) {
    backupLogger.error('Fehler bei der Bereinigung alter Backups:', error);
  }
}