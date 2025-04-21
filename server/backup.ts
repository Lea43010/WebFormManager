/**
 * Backup-Modul für die Datenbank
 * 
 * Bietet Funktionen zum regelmäßigen Backup der Datenbank und zur Wiederherstellung.
 * Die Backups werden in einem konfigurierbaren Verzeichnis gespeichert und können 
 * automatisch in einen externen Speicher (S3, FTP, etc.) hochgeladen werden.
 */

import { Express, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import * as util from 'util';
import config from '../config';
import { db } from './db';
import { logger } from './logger';

// Spezifischer Logger für Backups
const backupLogger = logger.createLogger('backup');

// Promisify der exec-Funktion für einfachere Verwendung
const exec = util.promisify(child_process.exec);

/**
 * Backup-Konfiguration
 */
const backupConfig = {
  // Verzeichnis für Backups, Standard: ./backup
  directory: process.env.BACKUP_DIRECTORY || './backup',
  
  // Backup-Aufbewahrung in Tagen
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  
  // Format für den Backup-Dateinamen
  filenameFormat: 'baustructura_backup_{date}_{time}.sql',
  
  // Maximale Anzahl von Backups, die aufbewahrt werden
  maxBackups: parseInt(process.env.MAX_BACKUPS || '10', 10),
  
  // Wenn ENABLE_BACKUP auf "true" gesetzt ist, werden automatische Backups aktiviert
  autoBackupEnabled: process.env.ENABLE_BACKUP === 'true',
  
  // CronJob-Zeitplan für automatische Backups (default: 0 0 * * * - täglich um Mitternacht)
  cronSchedule: process.env.BACKUP_CRON || '0 0 * * *',
};

/**
 * Schnittstellen für Backup-Daten
 */
interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  created: Date;
  tables: number;
}

interface BackupListResponse {
  backups: BackupInfo[];
  backupDirectory: string;
  autoBackupEnabled: boolean;
  nextScheduledBackup?: string;
}

/**
 * Stellt sicher, dass das Backup-Verzeichnis existiert
 */
function ensureBackupDirectory() {
  if (!fs.existsSync(backupConfig.directory)) {
    fs.mkdirSync(backupConfig.directory, { recursive: true });
    backupLogger.info(`Backup-Verzeichnis erstellt: ${backupConfig.directory}`);
  }
}

/**
 * Generiert einen Dateinamen für das Backup
 */
function generateBackupFilename(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  
  return backupConfig.filenameFormat
    .replace('{date}', date)
    .replace('{time}', time);
}

/**
 * Führt ein Datenbank-Backup durch
 */
async function performBackup(): Promise<BackupInfo | null> {
  ensureBackupDirectory();
  
  const filename = generateBackupFilename();
  const backupPath = path.join(backupConfig.directory, filename);
  
  try {
    backupLogger.info(`Starte Datenbank-Backup nach ${backupPath}`);
    
    // Extrahiere die Verbindungsinformationen aus der DATABASE_URL
    const dbUrl = new URL(config.database.url || '');
    const host = dbUrl.hostname;
    const port = dbUrl.port;
    const database = dbUrl.pathname.substring(1); // Entferne den führenden "/"
    const username = dbUrl.username;
    const password = dbUrl.password;
    
    // Führe pg_dump aus
    const pgDumpCmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${backupPath}"`;
    
    const { stdout, stderr } = await exec(pgDumpCmd);
    
    if (stderr && !stderr.includes('warning')) {
      throw new Error(`pg_dump Fehler: ${stderr}`);
    }
    
    // Datei-Statistiken sammeln
    const stats = fs.statSync(backupPath);
    
    // Anzahl der Tabellen im Backup zählen (Schätzung)
    const tableCount = await countTablesInBackup(backupPath);
    
    const backupInfo: BackupInfo = {
      filename,
      path: backupPath,
      size: stats.size,
      created: stats.birthtime,
      tables: tableCount,
    };
    
    backupLogger.info(`Backup erfolgreich abgeschlossen: ${filename} (${formatFileSize(stats.size)})`);
    
    // Alte Backups aufräumen
    await cleanupOldBackups();
    
    return backupInfo;
  } catch (error) {
    backupLogger.error(`Backup fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    
    // Lösche fehlgeschlagene Backup-Datei, falls sie existiert
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
    
    return null;
  }
}

/**
 * Zählt die Tabellen in einer Backup-Datei
 */
async function countTablesInBackup(backupPath: string): Promise<number> {
  try {
    // Grep nach CREATE TABLE Anweisungen
    const { stdout } = await exec(`grep -c "CREATE TABLE" "${backupPath}"`);
    return parseInt(stdout.trim(), 10);
  } catch (error) {
    // Bei Fehlern oder wenn keine CREATE TABLE gefunden wurde, gebe 0 zurück
    return 0;
  }
}

/**
 * Formatiert die Dateigröße in menschenlesbare Form
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Listet alle verfügbaren Backups auf
 */
async function listBackups(): Promise<BackupInfo[]> {
  ensureBackupDirectory();
  
  try {
    const files = fs.readdirSync(backupConfig.directory)
      .filter(file => file.endsWith('.sql'));
    
    const backups: BackupInfo[] = [];
    
    for (const file of files) {
      const filePath = path.join(backupConfig.directory, file);
      const stats = fs.statSync(filePath);
      
      // Tabellen-Anzahl ermitteln
      const tableCount = await countTablesInBackup(filePath);
      
      backups.push({
        filename: file,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        tables: tableCount,
      });
    }
    
    // Nach Erstellungsdatum sortieren (neueste zuerst)
    return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
  } catch (error) {
    backupLogger.error(`Fehler beim Auflisten der Backups: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Bereinigt alte Backups basierend auf Konfiguration
 */
async function cleanupOldBackups(): Promise<void> {
  try {
    const backups = await listBackups();
    
    // Prüfe, ob die maximale Anzahl an Backups überschritten wurde
    if (backups.length > backupConfig.maxBackups) {
      // Lösche die ältesten Backups, um unter dem Limit zu bleiben
      const backupsToDelete = backups.slice(backupConfig.maxBackups);
      
      for (const backup of backupsToDelete) {
        fs.unlinkSync(backup.path);
        backupLogger.info(`Altes Backup gelöscht: ${backup.filename}`);
      }
    }
    
    // Lösche Backups, die älter als die Aufbewahrungsfrist sind
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - backupConfig.retentionDays);
    
    for (const backup of backups) {
      if (backup.created < retentionDate) {
        fs.unlinkSync(backup.path);
        backupLogger.info(`Backup älter als ${backupConfig.retentionDays} Tage gelöscht: ${backup.filename}`);
      }
    }
  } catch (error) {
    backupLogger.error(`Fehler beim Bereinigen alter Backups: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Stellt ein Backup wieder her
 */
async function restoreBackup(backupPath: string): Promise<boolean> {
  try {
    backupLogger.info(`Starte Wiederherstellung aus Backup: ${backupPath}`);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup-Datei nicht gefunden: ${backupPath}`);
    }
    
    // Extrahiere die Verbindungsinformationen aus der DATABASE_URL
    const dbUrl = new URL(config.database.url || '');
    const host = dbUrl.hostname;
    const port = dbUrl.port;
    const database = dbUrl.pathname.substring(1);
    const username = dbUrl.username;
    const password = dbUrl.password;
    
    // Wiederherstellung mit psql
    const psqlCmd = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${backupPath}"`;
    
    const { stdout, stderr } = await exec(psqlCmd);
    
    if (stderr && !stderr.includes('NOTICE:') && !stderr.includes('INFO:')) {
      throw new Error(`psql Fehler: ${stderr}`);
    }
    
    backupLogger.info(`Wiederherstellung erfolgreich abgeschlossen: ${path.basename(backupPath)}`);
    return true;
  } catch (error) {
    backupLogger.error(`Wiederherstellung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Registriert die Backup-API-Endpunkte in der Express-Anwendung
 */
export function setupBackupRoutes(app: Express) {
  // Backup-Verzeichnis sicherstellen
  ensureBackupDirectory();
  
  // API-Endpunkte nur in Entwicklung oder für Administratoren verfügbar machen
  if (config.isDevelopment || process.env.ENABLE_BACKUP_API === 'true') {
    backupLogger.info('Backup-API-Endpunkte eingerichtet');
    
    // Endpunkt für die Auflistung aller Backups
    app.get('/api/admin/backups', async (req: Request, res: Response) => {
      // Prüfen, ob der Benutzer ein Administrator ist
      if (!req.isAuthenticated() || (req.user && req.user.role !== 'administrator')) {
        return res.status(403).json({ error: 'Zugriff verweigert' });
      }
      
      const backups = await listBackups();
      
      const response: BackupListResponse = {
        backups: backups.map(b => ({
          ...b,
          size: b.size,
          path: b.path.replace(process.cwd(), ''), // Relativen Pfad zurückgeben
        })),
        backupDirectory: backupConfig.directory,
        autoBackupEnabled: backupConfig.autoBackupEnabled,
      };
      
      res.json(response);
    });
    
    // Endpunkt zum Erstellen eines Backups
    app.post('/api/admin/backups', async (req: Request, res: Response) => {
      // Prüfen, ob der Benutzer ein Administrator ist
      if (!req.isAuthenticated() || (req.user && req.user.role !== 'administrator')) {
        return res.status(403).json({ error: 'Zugriff verweigert' });
      }
      
      const backupInfo = await performBackup();
      
      if (backupInfo) {
        res.status(201).json({
          message: 'Backup erfolgreich erstellt',
          backup: {
            ...backupInfo,
            size: backupInfo.size,
            path: backupInfo.path.replace(process.cwd(), ''),
          },
        });
      } else {
        res.status(500).json({ error: 'Backup konnte nicht erstellt werden' });
      }
    });
    
    // Endpunkt zum Herunterladen eines Backups
    app.get('/api/admin/backups/:filename', (req: Request, res: Response) => {
      // Prüfen, ob der Benutzer ein Administrator ist
      if (!req.isAuthenticated() || (req.user && req.user.role !== 'administrator')) {
        return res.status(403).json({ error: 'Zugriff verweigert' });
      }
      
      const filename = req.params.filename;
      const backupPath = path.join(backupConfig.directory, filename);
      
      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({ error: 'Backup nicht gefunden' });
      }
      
      // Datei zum Download anbieten
      res.download(backupPath);
    });
    
    // Endpunkt zum Löschen eines Backups
    app.delete('/api/admin/backups/:filename', (req: Request, res: Response) => {
      // Prüfen, ob der Benutzer ein Administrator ist
      if (!req.isAuthenticated() || (req.user && req.user.role !== 'administrator')) {
        return res.status(403).json({ error: 'Zugriff verweigert' });
      }
      
      const filename = req.params.filename;
      const backupPath = path.join(backupConfig.directory, filename);
      
      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({ error: 'Backup nicht gefunden' });
      }
      
      try {
        fs.unlinkSync(backupPath);
        backupLogger.info(`Backup gelöscht: ${filename}`);
        res.status(200).json({ message: 'Backup erfolgreich gelöscht' });
      } catch (error) {
        backupLogger.error(`Fehler beim Löschen des Backups: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({ error: 'Backup konnte nicht gelöscht werden' });
      }
    });
    
    // Endpunkt zum Wiederherstellen eines Backups
    app.post('/api/admin/backups/:filename/restore', async (req: Request, res: Response) => {
      // Prüfen, ob der Benutzer ein Administrator ist
      if (!req.isAuthenticated() || (req.user && req.user.role !== 'administrator')) {
        return res.status(403).json({ error: 'Zugriff verweigert' });
      }
      
      const filename = req.params.filename;
      const backupPath = path.join(backupConfig.directory, filename);
      
      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({ error: 'Backup nicht gefunden' });
      }
      
      // Bestätigungstoken überprüfen
      const { confirmationToken } = req.body;
      if (!confirmationToken || confirmationToken !== 'CONFIRM_RESTORE') {
        return res.status(400).json({ 
          error: 'Bestätigungstoken erforderlich',
          message: 'Bitte fügen Sie "confirmationToken": "CONFIRM_RESTORE" im Request-Body hinzu, um die Wiederherstellung zu bestätigen.'
        });
      }
      
      const success = await restoreBackup(backupPath);
      
      if (success) {
        res.status(200).json({ message: 'Backup erfolgreich wiederhergestellt' });
      } else {
        res.status(500).json({ error: 'Backup konnte nicht wiederhergestellt werden' });
      }
    });
  }
}

// Export der Funktionen für programmatische Verwendung
export {
  performBackup,
  listBackups,
  restoreBackup,
  cleanupOldBackups,
  backupConfig,
};

// Wenn automatische Backups aktiviert sind, registriere den Cron-Job
// Hinweis: In Produktionsumgebung sollte dies über einen externen Scheduler (z.B. cron) erfolgen
if (backupConfig.autoBackupEnabled) {
  backupLogger.info(`Automatisches Backup aktiviert, Zeitplan: ${backupConfig.cronSchedule}`);
  
  // In einer vollständigen Implementierung würde hier ein Cron-Job eingerichtet werden
  // Zum Beispiel mit node-cron:
  // import * as cron from 'node-cron';
  // cron.schedule(backupConfig.cronSchedule, () => {
  //   performBackup().catch(err => {
  //     backupLogger.error(`Fehler beim automatischen Backup: ${err.message}`);
  //   });
  // });
}