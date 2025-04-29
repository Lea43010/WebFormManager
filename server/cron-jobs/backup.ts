/**
 * Automatisches Backup-Skript
 */
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logger } from '../logger';

// Maximale Anzahl von Backups, die aufbewahrt werden sollen
const MAX_BACKUPS = 10;

// Logger für dieses Modul erstellen
const backupLogger = logger.createLogger('backup');

/**
 * Führt das Backup-Skript aus und protokolliert die Ergebnisse
 */
export function runBackup(): void {
  backupLogger.info('Starte automatisches Backup...');
  
  const backupScript = path.resolve(process.cwd(), 'backup-script.sh');
  
  if (!fs.existsSync(backupScript)) {
    backupLogger.error('Backup-Skript nicht gefunden:', backupScript);
    return;
  }
  
  const backupProcess = spawn('bash', [backupScript], {
    stdio: 'pipe'
  });
  
  backupProcess.stdout.on('data', (data) => {
    backupLogger.info('Backup-Ausgabe:', data.toString().trim());
  });
  
  backupProcess.stderr.on('data', (data) => {
    backupLogger.error('Backup-Fehler:', data.toString().trim());
  });
  
  backupProcess.on('close', (code) => {
    if (code === 0) {
      backupLogger.info('Automatisches Backup erfolgreich abgeschlossen');
      cleanupOldBackups();
    } else {
      backupLogger.error(`Backup-Prozess beendet mit Code ${code}`);
    }
  });
}

/**
 * Bereinigt alte Backups und behält nur die neuesten MAX_BACKUPS
 */
function cleanupOldBackups(): void {
  const backupDir = path.resolve(process.cwd(), 'backup');
  
  if (!fs.existsSync(backupDir)) {
    return;
  }
  
  // Verzeichnisse nach Datum sortieren
  const dateDirs = fs.readdirSync(backupDir)
    .filter(dir => /^\d{4}-\d{2}-\d{2}$/.test(dir))
    .map(dir => {
      const fullPath = path.join(backupDir, dir);
      const stat = fs.statSync(fullPath);
      return { 
        name: dir, 
        path: fullPath, 
        time: stat.mtime.getTime() 
      };
    })
    .sort((a, b) => b.time - a.time); // Neueste zuerst
  
  // Lösche die ältesten, wenn mehr als MAX_BACKUPS vorhanden sind
  if (dateDirs.length > MAX_BACKUPS) {
    backupLogger.info(`${dateDirs.length} Backup-Verzeichnisse gefunden, behalte die neuesten ${MAX_BACKUPS}`);
    
    const toDelete = dateDirs.slice(MAX_BACKUPS);
    toDelete.forEach(dir => {
      try {
        backupLogger.info(`Lösche altes Backup-Verzeichnis: ${dir.name}`);
        fs.rmSync(dir.path, { recursive: true, force: true });
      } catch (err) {
        backupLogger.error(`Fehler beim Löschen des Verzeichnisses ${dir.path}:`, err);
      }
    });
  }
}