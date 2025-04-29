/**
 * GitHub-Backup-API-Routen für die Bau-Structura App
 */

import express from 'express';
import { logger } from './logger';
import { 
  listGitHubBackups, 
  downloadBackupFromGitHub, 
  uploadBackupToGitHub,
  ensureGitHubBackupRepository,
  configureGitHubBackup,
  githubBackupConfig
} from './github-backup';
import path from 'path';
import fs from 'fs';
import config from '../config';
import { promisify } from 'util';

// Logger für dieses Modul
const githubBackupApiLogger = logger.createLogger('github-backup-api');

// Promises für Dateioperationen
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// Middleware für Admin-Berechtigung 
// (identisch mit der in backup-routes.ts, kann später extrahiert werden)
const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Nicht autorisiert' });
  }
  
  const user = req.user as any;
  // Überprüfe auf 'administrator' Rolle (korrekte Schreibweise mit kleinem "a")
  if (user.role !== 'administrator') {
    console.log(`Zugriff verweigert für Benutzer mit Rolle: ${user.role}`);
    return res.status(403).json({ 
      message: 'Keine ausreichenden Berechtigungen', 
      userRole: user.role,
      requiredRole: 'administrator'
    });
  }
  
  next();
};

// Temporäres Download-Verzeichnis
const tempDownloadDir = path.join(process.cwd(), 'temp', 'github-downloads');

// Sicherstellen, dass das temporäre Verzeichnis existiert
if (!fs.existsSync(tempDownloadDir)) {
  fs.mkdirSync(tempDownloadDir, { recursive: true });
}

/**
 * Registriert die GitHub-Backup-API-Routen
 * @param app Express-App-Instanz
 */
export function registerGitHubBackupRoutes(app: express.Express) {
  // Route für GitHub-Backup-Konfiguration abfragen
  app.get('/api/admin/github-backups/config', isAdmin, (req, res) => {
    try {
      // Sensible Informationen ausblenden
      const safeConfig = { 
        ...githubBackupConfig,
        token: githubBackupConfig.token ? '***' : undefined,
        encryptionKey: githubBackupConfig.encryptionKey ? '***' : undefined
      };
      
      res.json({
        config: safeConfig,
        status: 'success'
      });
    } catch (error) {
      githubBackupApiLogger.error('Fehler beim Abrufen der GitHub-Backup-Konfiguration:', error);
      res.status(500).json({ 
        message: 'Fehler beim Abrufen der GitHub-Backup-Konfiguration', 
        error: (error as Error).message 
      });
    }
  });

  // Route zum Abrufen aller GitHub-Backups
  app.get('/api/admin/github-backups', isAdmin, async (req, res) => {
    try {
      // Prüfen, ob GitHub-Backup aktiviert ist
      if (!config.backup.github?.enabled) {
        return res.status(400).json({ 
          message: 'GitHub-Backup ist deaktiviert', 
          enabled: false 
        });
      }
      
      // Repository sicherstellen
      const repoOk = await ensureGitHubBackupRepository();
      if (!repoOk) {
        return res.status(500).json({ 
          message: 'GitHub-Repository konnte nicht überprüft oder erstellt werden' 
        });
      }
      
      // Backups auflisten
      const backups = await listGitHubBackups();
      
      res.json({
        backups,
        count: backups.length,
        status: 'success'
      });
    } catch (error) {
      githubBackupApiLogger.error('Fehler beim Auflisten der GitHub-Backups:', error);
      res.status(500).json({ 
        message: 'Fehler beim Auflisten der GitHub-Backups', 
        error: (error as Error).message 
      });
    }
  });

  // Route zum Herunterladen eines Backups von GitHub
  app.get('/api/admin/github-backups/download/:path(*)', isAdmin, async (req, res) => {
    try {
      // Prüfen, ob GitHub-Backup aktiviert ist
      if (!config.backup.github?.enabled) {
        return res.status(400).json({ 
          message: 'GitHub-Backup ist deaktiviert', 
          enabled: false 
        });
      }
      
      const remotePath = req.params.path;
      if (!remotePath) {
        return res.status(400).json({ message: 'Kein Pfad angegeben' });
      }
      
      // Lokalen Download-Pfad erstellen
      const localFilename = path.basename(remotePath);
      const localPath = path.join(tempDownloadDir, localFilename);
      
      // Von GitHub herunterladen
      const success = await downloadBackupFromGitHub(remotePath, localPath);
      
      if (!success) {
        return res.status(500).json({ message: 'Fehler beim Herunterladen des Backups von GitHub' });
      }
      
      // Datei zum Download anbieten
      res.download(localPath, localFilename, (err) => {
        if (err) {
          githubBackupApiLogger.error('Fehler beim Senden der heruntergeladenen Datei:', err);
        }
        
        // Datei nach dem Download löschen
        try {
          fs.unlinkSync(localPath);
        } catch (unlinkErr) {
          githubBackupApiLogger.error('Fehler beim Löschen der temporären Datei:', unlinkErr);
        }
      });
    } catch (error) {
      githubBackupApiLogger.error('Fehler beim Herunterladen des Backups von GitHub:', error);
      res.status(500).json({ 
        message: 'Fehler beim Herunterladen des Backups von GitHub', 
        error: (error as Error).message 
      });
    }
  });

  // Route zum manuellen Hochladen eines lokalen Backups zu GitHub
  app.post('/api/admin/github-backups/upload', isAdmin, async (req, res) => {
    try {
      // Prüfen, ob GitHub-Backup aktiviert ist
      if (!config.backup.github?.enabled) {
        return res.status(400).json({ 
          message: 'GitHub-Backup ist deaktiviert', 
          enabled: false 
        });
      }
      
      const { backupPath } = req.body;
      
      if (!backupPath) {
        return res.status(400).json({ message: 'Kein Backup-Pfad angegeben' });
      }
      
      // Prüfen, ob die Datei existiert
      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({ message: 'Backup-Datei nicht gefunden' });
      }
      
      // Repository sicherstellen
      const repoOk = await ensureGitHubBackupRepository();
      if (!repoOk) {
        return res.status(500).json({ 
          message: 'GitHub-Repository konnte nicht überprüft oder erstellt werden' 
        });
      }
      
      // Zu GitHub hochladen
      const success = await uploadBackupToGitHub(backupPath);
      
      if (!success) {
        return res.status(500).json({ message: 'Fehler beim Hochladen des Backups zu GitHub' });
      }
      
      res.json({ 
        message: 'Backup erfolgreich zu GitHub hochgeladen',
        status: 'success'
      });
    } catch (error) {
      githubBackupApiLogger.error('Fehler beim Hochladen des Backups zu GitHub:', error);
      res.status(500).json({ 
        message: 'Fehler beim Hochladen des Backups zu GitHub', 
        error: (error as Error).message 
      });
    }
  });

  // Route zum Aktualisieren der GitHub-Backup-Konfiguration
  app.post('/api/admin/github-backups/config', isAdmin, (req, res) => {
    try {
      const { enabled, owner, repo, branch, backupPath, encryptBackups } = req.body;
      
      // Konfiguration aktualisieren
      configureGitHubBackup({
        enabled: enabled !== undefined ? enabled : githubBackupConfig.enabled,
        owner: owner || githubBackupConfig.owner,
        repo: repo || githubBackupConfig.repo,
        branch: branch || githubBackupConfig.branch,
        backupPath: backupPath || githubBackupConfig.backupPath,
        encryptBackups: encryptBackups !== undefined ? encryptBackups : githubBackupConfig.encryptBackups,
      });
      
      // Sensible Informationen ausblenden
      const safeConfig = { 
        ...githubBackupConfig,
        token: githubBackupConfig.token ? '***' : undefined,
        encryptionKey: githubBackupConfig.encryptionKey ? '***' : undefined
      };
      
      res.json({
        message: 'GitHub-Backup-Konfiguration aktualisiert',
        config: safeConfig,
        status: 'success'
      });
    } catch (error) {
      githubBackupApiLogger.error('Fehler beim Aktualisieren der GitHub-Backup-Konfiguration:', error);
      res.status(500).json({ 
        message: 'Fehler beim Aktualisieren der GitHub-Backup-Konfiguration', 
        error: (error as Error).message 
      });
    }
  });

  githubBackupApiLogger.info('GitHub-Backup-API-Endpunkte eingerichtet');
}