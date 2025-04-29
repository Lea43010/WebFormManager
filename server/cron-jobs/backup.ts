/**
 * Backup-Cron-Job mit GitHub-Integration für Bau-Structura
 * 
 * Führt regelmäßige Backups der Datenbank und Konfigurationsdateien durch
 * und speichert sie sowohl lokal als auch optional in einem GitHub-Repository.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from '../logger';
import config from '../../config';
import { 
  uploadBackupToGitHub, 
  ensureGitHubBackupRepository, 
  githubBackupConfig 
} from '../github-backup';

// Logger für Backup-Operationen
const backupLogger = logger.createLogger('backup');

// Hilfsfunktionen
const execPromise = promisify(exec);
const fsPromises = fs.promises;

// Backup-Verzeichnis (mit Konfiguration aus config.ts)
const backupDir = config.backup.directory || './backup';

/**
 * Führt ein Backup der Anwendung aus und speichert es lokal
 * und optional in GitHub
 */
export async function runBackup() {
  try {
    backupLogger.info('Starte Backup-Prozess...');

    // Sicherstellen, dass das Backup-Verzeichnis existiert
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      backupLogger.info(`Backup-Verzeichnis erstellt: ${backupDir}`);
    }

    // Aktuelle Zeit für Backup-Namen
    const now = new Date();
    const datePrefix = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timePrefix = now.toISOString().slice(11, 19).replace(/:/g, '-'); // HH-MM-SS
    const timestamp = `${datePrefix}_${timePrefix}`;
    const backupFilename = `bau-structura-backup-${timestamp}.tar.gz`;
    const backupPath = path.join(backupDir, backupFilename);

    // Backup-Skript ausführen
    backupLogger.info('Führe Backup-Skript aus...');
    const backupScriptPath = path.join(process.cwd(), 'backup-script.sh');
    
    // Prüfen, ob das Backup-Skript existiert
    if (!fs.existsSync(backupScriptPath)) {
      throw new Error(`Backup-Skript nicht gefunden: ${backupScriptPath}`);
    }

    // Skript ausführen
    const { stdout, stderr } = await execPromise(backupScriptPath);
    
    if (stderr && !stderr.includes('NOTICE:') && !stderr.includes('INFO:')) {
      backupLogger.warn(`Warnungen beim Ausführen des Backup-Skripts: ${stderr}`);
    }
    
    backupLogger.info(`Backup-Skript erfolgreich ausgeführt: ${stdout.trim()}`);
    
    // Extrahieren des Backup-Pfads aus der Ausgabe
    const backupPathMatch = stdout.match(/Backup erstellt: (.*)/);
    const actualBackupPath = backupPathMatch ? backupPathMatch[1] : backupPath;
    
    // Prüfen, ob die Backup-Datei existiert
    if (!fs.existsSync(actualBackupPath)) {
      throw new Error(`Backup-Datei wurde nicht erstellt: ${actualBackupPath}`);
    }
    
    backupLogger.info(`Lokales Backup erstellt: ${actualBackupPath}`);
    
    // GitHub-Integration, wenn konfiguriert
    if (config.backup.github && config.backup.github.enabled) {
      try {
        backupLogger.info('Starte GitHub-Integration für Backup...');
        
        // Stellen Sie sicher, dass das Repository existiert
        await ensureGitHubBackupRepository();
        
        // Upload des Backups zu GitHub
        const uploadResult = await uploadBackupToGitHub(actualBackupPath);
        
        if (uploadResult) {
          backupLogger.info('Backup erfolgreich zu GitHub hochgeladen');
        } else {
          backupLogger.error('Fehler beim Hochladen des Backups zu GitHub');
        }
      } catch (githubError) {
        // Lokales Backup ist bereits erstellt, also nur Fehler protokollieren
        backupLogger.error('Fehler bei der GitHub-Integration:', githubError);
      }
    } else {
      backupLogger.info('GitHub-Integration ist deaktiviert, überspringe Upload');
    }
    
    // Bereinige alte Backups
    await cleanupOldBackups();
    
    backupLogger.info('Backup-Prozess abgeschlossen');
    return { success: true, path: actualBackupPath };
  } catch (error) {
    backupLogger.error('Fehler beim Ausführen des Backups:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Bereinigt alte Backup-Dateien basierend auf der Konfiguration
 */
async function cleanupOldBackups() {
  try {
    // Überprüfe die Konfiguration für die maximale Anzahl von Backups
    const maxBackups = config.backup.maxBackups || 10;
    const retentionDays = config.backup.retentionDays || 30;
    
    backupLogger.info(`Beginne mit der Bereinigung alter Backups (behalte max ${maxBackups} Dateien oder ${retentionDays} Tage)...`);
    
    // Alle Backup-Dateien auflisten
    const files = await fsPromises.readdir(backupDir);
    const backupFiles = files.filter(file => file.startsWith('bau-structura-backup-') && file.endsWith('.tar.gz'));
    
    // Dateien mit Statistiken sammeln
    const backupInfos = await Promise.all(
      backupFiles.map(async file => {
        const filePath = path.join(backupDir, file);
        const stats = await fsPromises.stat(filePath);
        return {
          filename: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.mtime.getTime()
        };
      })
    );
    
    // Nach Datum sortieren (neueste zuerst)
    backupInfos.sort((a, b) => b.createdAt - a.createdAt);
    
    // Cutoff-Datum für die Aufbewahrung (jetzt - retentionDays)
    const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    // Zu löschende Dateien sammeln (älter als Aufbewahrungszeitraum oder über maxBackups)
    const filesToDelete = backupInfos.filter((file, index) => {
      return index >= maxBackups || file.createdAt < cutoffDate;
    });
    
    // Lösche alte Dateien
    for (const file of filesToDelete) {
      backupLogger.info(`Lösche altes Backup: ${file.filename}`);
      await fsPromises.unlink(file.path);
    }
    
    backupLogger.info(`Bereinigung abgeschlossen. ${filesToDelete.length} alte Backups gelöscht.`);
  } catch (error) {
    backupLogger.error('Fehler bei der Bereinigung alter Backups:', error);
  }
}

// Standard-Export
export default { runBackup, cleanupOldBackups };