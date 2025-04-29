/**
 * Backup-API-Endpunkte
 * 
 * Diese Datei stellt REST-API-Endpunkte bereit, um Backups manuell auszulösen
 * und zu verwalten.
 */

import express from 'express';
import { exec } from 'child_process';
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
 * POST /api/backup/create
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
 * GET /api/backup/list
 * Erfordert Admin-Rechte
 */
router.get('/list', requireAdmin(), (req, res) => {
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

// Router exportieren
export const backupApi = router;