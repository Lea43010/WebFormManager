/**
 * Skript zur Einrichtung eines Cron-Jobs für tägliche Datenbankbackups
 */

import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Umgebungsvariablen laden
dotenv.config();

// __dirname-Äquivalent für ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Pfad zum Backup-Skript
const backupScriptPath = path.join(rootDir, 'scripts', 'backup-database.sh');

// Cron-Job für tägliches Backup
// Standardmäßig um 3:00 Uhr morgens
const scheduleTime = process.env.BACKUP_SCHEDULE_TIME || '0 3 * * *';

console.log('===== Backup-Cron-Job-Setup =====');
console.log(`Backup-Skript: ${backupScriptPath}`);
console.log(`Zeitplan: ${scheduleTime}`);

// Prüfen, ob das Backup-Skript existiert
if (!fs.existsSync(backupScriptPath)) {
  console.error(`FEHLER: Backup-Skript nicht gefunden: ${backupScriptPath}`);
  process.exit(1);
}

// Skript ausführbar machen
try {
  fs.chmodSync(backupScriptPath, 0o755);
  console.log('Ausführungsrechte für das Backup-Skript gesetzt');
} catch (error) {
  console.error('Konnte Ausführungsrechte nicht setzen:', error);
}

// Cron-Job erstellen
console.log(`Richte Cron-Job für tägliches Backup ein (${scheduleTime})...`);

try {
  cron.schedule(scheduleTime, () => {
    console.log(`[${new Date().toISOString()}] Automatisches Backup wird gestartet...`);
    exec(backupScriptPath, (error, stdout, stderr) => {
      if (error) {
        console.error(`Fehler bei der Ausführung des Backups: ${error.message}`);
        return;
      }
      
      if (stderr && !stderr.includes('NOTICE:') && !stderr.includes('INFO:')) {
        console.error(`Backup-Skript meldete Fehler: ${stderr}`);
        return;
      }
      
      console.log(`Backup-Ausgabe: ${stdout}`);
      console.log(`[${new Date().toISOString()}] Automatisches Backup abgeschlossen`);
    });
  });
  
  console.log('Cron-Job erfolgreich eingerichtet');
} catch (error) {
  console.error('Fehler beim Einrichten des Cron-Jobs:', error);
  process.exit(1);
}

// Sicherstellen, dass das Backup-Verzeichnis existiert
const backupDir = path.join(rootDir, 'backups');
if (!fs.existsSync(backupDir)) {
  try {
    fs.mkdirSync(backupDir, { recursive: true });
    fs.chmodSync(backupDir, 0o777); // Volle Berechtigungen für das Backup-Verzeichnis
    console.log(`Backup-Verzeichnis erstellt: ${backupDir}`);
  } catch (error) {
    console.error(`Fehler beim Erstellen des Backup-Verzeichnisses: ${error.message}`);
  }
} else {
  console.log(`Backup-Verzeichnis existiert bereits: ${backupDir}`);
}

// Sofortiges Backup erstellen (optional)
if (process.env.BACKUP_RUN_IMMEDIATELY === 'true') {
  console.log('Erstelle sofortiges Backup...');
  exec(backupScriptPath, (error, stdout, stderr) => {
    if (error) {
      console.error(`Fehler bei der Ausführung des Backups: ${error.message}`);
      return;
    }
    
    if (stderr && !stderr.includes('NOTICE:') && !stderr.includes('INFO:')) {
      console.error(`Backup-Skript meldete Fehler: ${stderr}`);
      return;
    }
    
    console.log(`Backup-Ausgabe: ${stdout}`);
    console.log('Sofortiges Backup abgeschlossen');
  });
}

console.log('===== Backup-Cron-Job-Setup abgeschlossen =====');
console.log('Prozess bleibt aktiv, um Cron-Jobs auszuführen.');
console.log('Drücken Sie Strg+C, um den Prozess zu beenden.');

// Prozess am Leben halten
process.stdin.resume();

// Event-Handler für sauberes Beenden
process.on('SIGINT', () => {
  console.log('Backup-Cron-Job wird beendet...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Backup-Cron-Job wird beendet...');
  process.exit(0);
});