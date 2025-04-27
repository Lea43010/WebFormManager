/**
 * Backup-Service für die Bau-Structura App
 * 
 * Dieser Service führt automatisierte Datenbankbackups durch
 * und kann als eigenständiger Prozess gestartet werden.
 */

import cron from 'node-cron';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Umgebungsvariablen laden
dotenv.config();

// __dirname-Äquivalent für ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Pfad zum Backup-Skript
const backupScriptPath = path.join(rootDir, 'scripts', 'backup-database.sh');
const backupDir = path.join(rootDir, 'backups');

console.log('🔄 Initialisiere Datenbank-Backup-Service...');

// Verzeichnisse prüfen und ggf. erstellen
if (!fs.existsSync(backupDir)) {
  console.log(`📁 Erstelle Backup-Verzeichnis: ${backupDir}`);
  fs.mkdirSync(backupDir, { recursive: true });
}

// Prüfen, ob das Backup-Skript existiert
if (!fs.existsSync(backupScriptPath)) {
  console.error(`⚠️ Das Backup-Skript wurde nicht gefunden: ${backupScriptPath}`);
  process.exit(1);
}

// Sicherstellen, dass das Skript ausführbar ist
try {
  fs.chmodSync(backupScriptPath, 0o755);
  console.log('✅ Ausführungsrechte für das Backup-Skript gesetzt');
} catch (error) {
  console.error('⚠️ Konnte Ausführungsrechte nicht setzen:', error);
}

/**
 * Führt das Backup-Skript aus
 */
function runBackup() {
  const now = new Date();
  console.log(`🔄 Datenbankbackup gestartet: ${now.toLocaleString()}`);
  
  exec(backupScriptPath, (error, stdout, stderr) => {
    if (error) {
      console.error(`⚠️ Fehler bei der Ausführung des Backups: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`⚠️ Backup-Skript meldete Fehler: ${stderr}`);
      return;
    }
    
    console.log('Backup-Ausgabe:');
    console.log(stdout);
    console.log(`✅ Datenbankbackup abgeschlossen: ${new Date().toLocaleString()}`);

    // Vorhandene Backups anzeigen
    console.log('📋 Aktuelle Backups:');
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup_'))
      .sort()
      .reverse();
    
    for (const file of files.slice(0, 5)) {
      const stats = fs.statSync(path.join(backupDir, file));
      const size = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`- ${file} (${size} MB)`);
    }
    
    if (files.length > 5) {
      console.log(`... und ${files.length - 5} weitere Backup(s)`);
    }
  });
}

// Cron-Job für tägliches Backup um 3:00 Uhr morgens einrichten
// Cron-Format: Sekunde Minute Stunde Tag Monat Wochentag
console.log('⏱️ Richte Cron-Job für tägliches Backup ein (täglich um 3:00 Uhr)');
cron.schedule('0 0 3 * * *', runBackup);

// Sofort ein erstes Backup erstellen
console.log('🔄 Erstelle initiales Backup...');
runBackup();

console.log('✅ Backup-Service wurde erfolgreich gestartet');
console.log('📝 Automatische Backups werden täglich um 3:00 Uhr erstellt');
console.log('📁 Backups werden im Verzeichnis ./backups gespeichert');
console.log('🗑️ Backups werden für 30 Tage aufbewahrt');

// Event-Handler für sauberes Beenden
process.on('SIGINT', () => {
  console.log('👋 Backup-Service wird beendet...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Backup-Service wird beendet...');
  process.exit(0);
});

// Service am Leben halten
console.log('⏳ Service läuft, warten auf geplante Backup-Ausführungen...');