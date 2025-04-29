/**
 * Backup-API-Endpunkte
 * 
 * Diese Datei stellt REST-API-Endpunkte bereit, um Backups manuell auszulösen
 * und zu verwalten.
 */

import express from 'express';
import { exec, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';
import { requireAdmin } from './middleware/role-check';

// Logger für dieses Modul
const backupLogger = logger.createLogger('backup');

// Router erstellen
const router = express.Router();

/**
 * Manuelles Backup auslösen
 * POST /api/admin/backups/create
 * Erfordert Admin-Rechte
 */
router.post('/create', requireAdmin(), (req, res) => {
  backupLogger.info('Manuelles Backup wird ausgelöst durch Benutzer:', req.user?.id);
  
  const backupScript = path.resolve(process.cwd(), 'backup-script.sh');
  
  if (!fs.existsSync(backupScript)) {
    backupLogger.error('Backup-Skript nicht gefunden:', backupScript);
    return res.status(500).json({ 
      success: false, 
      message: 'Backup-Skript nicht gefunden' 
    });
  }
  
  exec(backupScript, (error, stdout, stderr) => {
    if (error) {
      backupLogger.error('Fehler bei der Ausführung des Backups:', error);
      return res.status(500).json({ 
        success: false, 
        message: `Fehler bei der Ausführung des Backups: ${error.message}` 
      });
    }
    
    if (stderr && !stderr.includes('NOTICE:') && !stderr.includes('INFO:')) {
      backupLogger.error('Backup-Skript meldete Fehler:', stderr);
      return res.status(500).json({ 
        success: false, 
        message: `Backup-Skript meldete Fehler: ${stderr}` 
      });
    }
    
    // Backup erfolgreich
    const backupFile = stdout.trim().replace('Backup erstellt: ', '');
    backupLogger.info('Manuelles Backup erfolgreich abgeschlossen:', backupFile);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Backup erfolgreich erstellt',
      file: backupFile
    });
  });
});

/**
 * Liste aller Backups abrufen
 * GET /api/admin/backups (ohne Pfadzusatz)
 * Erfordert Admin-Rechte
 */
router.get('/', requireAdmin(), (req, res) => {
  const backupDir = path.resolve(process.cwd(), 'backup');
  
  if (!fs.existsSync(backupDir)) {
    return res.status(200).json({ backups: [] });
  }
  
  try {
    // Verzeichnisse nach Datum durchsuchen
    const backups: any[] = [];
    
    const dateDirs = fs.readdirSync(backupDir)
      .filter(dir => /^\d{4}-\d{2}-\d{2}$/.test(dir))
      .sort((a, b) => b.localeCompare(a)); // Neueste zuerst
      
    dateDirs.forEach(dateDir => {
      const datePath = path.join(backupDir, dateDir);
      if (fs.statSync(datePath).isDirectory()) {
        // Backup-Dateien in diesem Verzeichnis abrufen
        const files = fs.readdirSync(datePath)
          .filter(file => file.endsWith('.tar.gz'))
          .map(file => {
            const filePath = path.join(datePath, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              path: `backup/${dateDir}/${file}`,
              date: dateDir,
              timestamp: stats.mtime,
              size: stats.size
            };
          })
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          
        backups.push(...files);
      }
    });
    
    return res.status(200).json({ backups });
  } catch (error: any) {
    backupLogger.error('Fehler beim Abrufen der Backup-Liste:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Fehler beim Abrufen der Backup-Liste: ${error.message}` 
    });
  }
});

/**
 * Status des Backup-Dienstes abrufen
 * GET /api/admin/backups/service-status
 * Erfordert Admin-Rechte
 */
router.get('/service-status', requireAdmin(), (req, res) => {
  const backupConfig: {
    active: boolean;
    scheduleTime: string;
    retentionDays: number;
    backupDir: string;
    lastBackup: string | null;
  } = {
    active: true,
    scheduleTime: '3:00 Uhr',
    retentionDays: 30,
    backupDir: './backup',
    lastBackup: null
  };
  
  // Versuche, das Datum des letzten Backups zu ermitteln
  try {
    const backupDir = path.resolve(process.cwd(), 'backup');
    if (fs.existsSync(backupDir)) {
      const dateDirs = fs.readdirSync(backupDir)
        .filter(dir => /^\d{4}-\d{2}-\d{2}$/.test(dir))
        .sort((a, b) => b.localeCompare(a)); // Neueste zuerst
      
      if (dateDirs.length > 0) {
        const newestDir = path.join(backupDir, dateDirs[0]);
        const files = fs.readdirSync(newestDir)
          .filter(file => file.endsWith('.tar.gz'))
          .map(file => {
            const filePath = path.join(newestDir, file);
            return {
              path: filePath,
              mtime: fs.statSync(filePath).mtime
            };
          })
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        
        if (files.length > 0) {
          backupConfig.lastBackup = files[0].mtime.toISOString();
        }
      }
    }
  } catch (error) {
    backupLogger.error('Fehler beim Ermitteln des letzten Backups:', error);
  }
  
  return res.status(200).json(backupConfig);
});

/**
 * Backup-Datei herunterladen
 * GET /api/admin/backups/download/:filename
 * Erfordert Admin-Rechte
 */
router.get('/download/:path(*)', requireAdmin(), (req, res) => {
  const filePath = req.params.path;
  
  // Sicherheitsprüfung: Pfad darf nicht außerhalb des Backup-Verzeichnisses führen
  if (filePath.includes('..') || !filePath.startsWith('backup/')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Ungültiger Dateipfad' 
    });
  }
  
  const fullPath = path.resolve(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ 
      success: false, 
      message: 'Backup-Datei nicht gefunden' 
    });
  }
  
  // Datei zum Download senden
  res.download(fullPath);
});

/**
 * Backup-Datei wiederherstellen
 * POST /api/admin/backups/restore/:filename
 * Erfordert Admin-Rechte
 */
router.post('/restore/:path(*)', requireAdmin(), (req, res) => {
  const filePath = req.params.path;
  
  // Sicherheitsprüfung: Pfad darf nicht außerhalb des Backup-Verzeichnisses führen
  if (filePath.includes('..') || !filePath.startsWith('backup/')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Ungültiger Dateipfad' 
    });
  }
  
  const fullPath = path.resolve(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ 
      success: false, 
      message: 'Backup-Datei nicht gefunden' 
    });
  }
  
  // Hier würden wir die Wiederherstellung des Backups durchführen
  // Dies ist eine komplexe Operation, die das Entpacken der Backup-Datei
  // und das Wiederherstellen der Datenbank erfordert
  
  // Beispielimplementierung:
  try {
    const tempDir = path.resolve(process.cwd(), 'temp', 'restore-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Backup entpacken mit Child Process
    const child_process = require('child_process');
    child_process.execSync(`tar -xzf "${fullPath}" -C "${tempDir}"`);
    
    // SQL-Datei finden
    const sqlFiles = fs.readdirSync(tempDir).filter(file => file.endsWith('.sql'));
    if (sqlFiles.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'Keine SQL-Datei im Backup gefunden' 
      });
    }
    
    const sqlFile = path.join(tempDir, sqlFiles[0]);
    
    // Datenbank wiederherstellen
    child_process.execSync(`PGPASSWORD="${process.env.PGPASSWORD}" psql -h ${process.env.PGHOST} -p ${process.env.PGPORT} -U ${process.env.PGUSER} -d ${process.env.PGDATABASE} -f "${sqlFile}"`, {
      env: process.env
    });
    
    // Aufräumen
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Backup erfolgreich wiederhergestellt'
    });
  } catch (error: any) {
    backupLogger.error('Fehler bei der Wiederherstellung des Backups:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Fehler bei der Wiederherstellung des Backups: ${error.message}` 
    });
  }
});

/**
 * Backup-Datei löschen
 * DELETE /api/admin/backups/:filename
 * Erfordert Admin-Rechte
 */
router.delete('/:path(*)', requireAdmin(), (req, res) => {
  const filePath = req.params.path;
  
  // Sicherheitsprüfung: Pfad darf nicht außerhalb des Backup-Verzeichnisses führen
  if (filePath.includes('..') || !filePath.startsWith('backup/')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Ungültiger Dateipfad' 
    });
  }
  
  const fullPath = path.resolve(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ 
      success: false, 
      message: 'Backup-Datei nicht gefunden' 
    });
  }
  
  try {
    fs.unlinkSync(fullPath);
    
    // Wenn Verzeichnis leer ist, auch das entfernen
    const dirPath = path.dirname(fullPath);
    const remainingFiles = fs.readdirSync(dirPath);
    if (remainingFiles.length === 0) {
      fs.rmdirSync(dirPath);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Backup erfolgreich gelöscht'
    });
  } catch (error: any) {
    backupLogger.error('Fehler beim Löschen des Backups:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Fehler beim Löschen des Backups: ${error.message}` 
    });
  }
});

// Router exportieren
export const backupApi = router;