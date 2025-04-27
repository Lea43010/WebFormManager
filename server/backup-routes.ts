/**
 * Backup-API-Routen für die Bau-Structura App
 */

import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

// Hilfsfunktion für Promises
const execPromise = promisify(exec);
const statPromise = promisify(fs.stat);
const readdirPromise = promisify(fs.readdir);
const unlinkPromise = promisify(fs.unlink);

// __dirname-Äquivalent für ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Pfade zu Backup-Skripten und -Verzeichnis
const backupScriptPath = path.join(rootDir, 'scripts', 'backup-database.sh');
const restoreScriptPath = path.join(rootDir, 'scripts', 'restore-database.sh');
const backupDir = path.join(rootDir, 'backups');

// Middleware für Admin-Berechtigung
const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Nicht autorisiert' });
  }
  
  const user = req.user as any;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Keine ausreichenden Berechtigungen' });
  }
  
  next();
};

// Prüfen, ob das Verzeichnis existiert, wenn nicht, erstellen
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

export function registerBackupRoutes(app: express.Express) {
  // Route zum Auflisten aller Backups
  app.get('/api/admin/backups', isAdmin, async (req, res) => {
    try {
      // Prüfen, ob das Backup-Verzeichnis existiert
      if (!fs.existsSync(backupDir)) {
        return res.json([]);
      }
      
      // Alle Dateien im Backup-Verzeichnis lesen
      const files = await readdirPromise(backupDir);
      
      // Nur Backup-Dateien filtern
      const backupFiles = files.filter(file => file.startsWith('backup_') && file.endsWith('.sql'));
      
      // Informationen zu jeder Backup-Datei sammeln
      const backupInfos = await Promise.all(
        backupFiles.map(async file => {
          const filePath = path.join(backupDir, file);
          const stats = await statPromise(filePath);
          
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.mtime.toISOString(),
          };
        })
      );
      
      // Nach Datum sortieren (neueste zuerst)
      backupInfos.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      res.json(backupInfos);
    } catch (error) {
      console.error('Fehler beim Auflisten der Backups:', error);
      res.status(500).json({ message: 'Fehler beim Auflisten der Backups', error: (error as Error).message });
    }
  });

  // Route zum Erstellen eines Backups
  app.post('/api/admin/backups/create', isAdmin, async (req, res) => {
    try {
      // Prüfen, ob das Backup-Skript existiert
      if (!fs.existsSync(backupScriptPath)) {
        return res.status(500).json({ 
          message: 'Backup-Skript nicht gefunden',
          path: backupScriptPath
        });
      }

      // Das Backup-Skript ausführen
      const { stdout, stderr } = await execPromise(backupScriptPath);
      
      if (stderr && !stderr.includes('NOTICE:') && !stderr.includes('INFO:')) {
        throw new Error(stderr);
      }
      
      res.json({ 
        message: 'Backup erfolgreich erstellt',
        details: stdout 
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des Backups:', error);
      res.status(500).json({ 
        message: 'Fehler beim Erstellen des Backups', 
        error: (error as Error).message 
      });
    }
  });

  // Route zum Wiederherstellen eines Backups
  app.post('/api/admin/backups/restore/:filename', isAdmin, async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Pfad zur Backup-Datei
      const backupFilePath = path.join(backupDir, filename);
      
      // Prüfen, ob die Backup-Datei existiert
      if (!fs.existsSync(backupFilePath)) {
        return res.status(404).json({ message: 'Backup-Datei nicht gefunden' });
      }
      
      // Prüfen, ob das Wiederherstellungs-Skript existiert
      if (!fs.existsSync(restoreScriptPath)) {
        return res.status(500).json({ 
          message: 'Wiederherstellungs-Skript nicht gefunden',
          path: restoreScriptPath
        });
      }
      
      // Das Wiederherstellungs-Skript ausführen
      const { stdout, stderr } = await execPromise(`${restoreScriptPath} ${backupFilePath}`);
      
      if (stderr && !stderr.includes('NOTICE:') && !stderr.includes('INFO:')) {
        throw new Error(stderr);
      }
      
      res.json({ 
        message: 'Backup erfolgreich wiederhergestellt',
        details: stdout 
      });
    } catch (error) {
      console.error('Fehler bei der Wiederherstellung des Backups:', error);
      res.status(500).json({ 
        message: 'Fehler bei der Wiederherstellung des Backups', 
        error: (error as Error).message 
      });
    }
  });

  // Route zum Löschen eines Backups
  app.delete('/api/admin/backups/:filename', isAdmin, async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Pfad zur Backup-Datei
      const backupFilePath = path.join(backupDir, filename);
      
      // Prüfen, ob die Backup-Datei existiert
      if (!fs.existsSync(backupFilePath)) {
        return res.status(404).json({ message: 'Backup-Datei nicht gefunden' });
      }
      
      // Die Backup-Datei löschen
      await unlinkPromise(backupFilePath);
      
      res.json({ message: 'Backup erfolgreich gelöscht' });
    } catch (error) {
      console.error('Fehler beim Löschen des Backups:', error);
      res.status(500).json({ 
        message: 'Fehler beim Löschen des Backups', 
        error: (error as Error).message 
      });
    }
  });

  // Route zum Herunterladen eines Backups
  app.get('/api/admin/backups/download/:filename', isAdmin, (req, res) => {
    try {
      const { filename } = req.params;
      
      // Pfad zur Backup-Datei
      const backupFilePath = path.join(backupDir, filename);
      
      // Prüfen, ob die Backup-Datei existiert
      if (!fs.existsSync(backupFilePath)) {
        return res.status(404).json({ message: 'Backup-Datei nicht gefunden' });
      }
      
      // Die Backup-Datei zum Download anbieten
      res.download(backupFilePath);
    } catch (error) {
      console.error('Fehler beim Herunterladen des Backups:', error);
      res.status(500).json({ 
        message: 'Fehler beim Herunterladen des Backups', 
        error: (error as Error).message 
      });
    }
  });

  // Route für den Status des Backup-Dienstes
  app.get('/api/admin/backups/service-status', isAdmin, (req, res) => {
    // Den Backup-Service-Status zurückgeben
    res.json({
      active: true, // In einer vollständigen Implementierung würde dieser Wert dynamisch ermittelt
      scheduleTime: '3:00 Uhr',
      retentionDays: 30,
      backupDir: './backups',
      lastBackup: null, // In einer vollständigen Implementierung würde dieser Wert dynamisch ermittelt
    });
  });

  console.log('[INFO] [backup] Backup-API-Endpunkte eingerichtet');
}