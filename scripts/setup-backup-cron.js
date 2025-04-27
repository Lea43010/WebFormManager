/**
 * Skript zur Einrichtung eines Cron-Jobs für tägliche Datenbankbackups
 */

const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Umgebungsvariablen laden
dotenv.config();

// Pfad zum Backup-Skript
const backupScriptPath = path.join(__dirname, 'backup-database.sh');

// Prüfen, ob das Backup-Skript existiert
if (!fs.existsSync(backupScriptPath)) {
  console.error(`⚠️  Das Backup-Skript wurde nicht gefunden: ${backupScriptPath}`);
  process.exit(1);
}

// Sicherstellen, dass das Skript ausführbar ist
try {
  fs.chmodSync(backupScriptPath, '755');
  console.log('✅ Ausführungsrechte für das Backup-Skript gesetzt');
} catch (error) {
  console.error('⚠️  Konnte Ausführungsrechte nicht setzen:', error);
}

console.log('🔄 Starte Cron-Job für tägliche Datenbankbackups...');

// Cron-Job für tägliches Backup um 3:00 Uhr morgens einrichten
// Cron-Format: Sekunde Minute Stunde Tag Monat Wochentag
cron.schedule('0 0 3 * * *', () => {
  console.log(`Datenbankbackup gestartet: ${new Date().toLocaleString()}`);
  
  exec(backupScriptPath, (error, stdout, stderr) => {
    if (error) {
      console.error(`⚠️  Fehler bei der Ausführung des Backups: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`⚠️  Backup-Skript meldete Fehler: ${stderr}`);
      return;
    }
    
    console.log(`Backup-Ausgabe: ${stdout}`);
    console.log(`✅ Datenbankbackup abgeschlossen: ${new Date().toLocaleString()}`);
  });
});

// Sofort ein erstes Backup erstellen
console.log('🔄 Erstelle initiales Backup...');
exec(backupScriptPath, (error, stdout, stderr) => {
  if (error) {
    console.error(`⚠️  Fehler bei der Ausführung des initialen Backups: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`⚠️  Backup-Skript meldete Fehler: ${stderr}`);
    return;
  }
  
  console.log('Ausgabe des initialen Backups:');
  console.log(stdout);
  console.log('✅ Initiales Backup abgeschlossen');
});

console.log('✅ Cron-Job für tägliche Datenbankbackups wurde eingerichtet');
console.log('📝 Backups werden täglich um 3:00 Uhr erstellt');
console.log('📁 Backups werden im Verzeichnis ./backups gespeichert');
console.log('🗑️  Backups werden für 30 Tage aufbewahrt');

// Prozess am Leben halten
console.log('⏳ Prozess läuft, warten auf geplante Backup-Ausführungen...');