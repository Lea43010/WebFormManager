#!/bin/bash

# Wiederherstellungs-Skript für die PostgreSQL-Datenbank
# Erstellt von: Bau-Structura App
# Datum: $(date +%F)
# Beschreibung: Stellt ein Backup der PostgreSQL-Datenbank wieder her

# Umgebungsvariablen aus .env Datei laden (wenn vorhanden)
if [ -f .env ]; then
  source .env
fi

# Backup-Verzeichnis
BACKUP_DIR="./backups"

# Überprüfen, ob ein Backup-Pfad als Parameter übergeben wurde
if [ $# -eq 0 ]; then
  echo "=== Verfügbare Backups ==="
  ls -lh $BACKUP_DIR | grep "backup_" | sort
  echo ""
  echo "Verwendung: $0 <Backup-Datei>"
  echo "Beispiel:   $0 $BACKUP_DIR/backup_2025-04-27_12-00-00.dump"
  exit 1
fi

BACKUP_FILE=$1

# Überprüfen, ob die Backup-Datei existiert
if [ ! -f $BACKUP_FILE ]; then
  echo "❌ Fehler: Backup-Datei '$BACKUP_FILE' existiert nicht!"
  exit 1
fi

echo "=== Datenbank-Wiederherstellung gestartet ==="
echo "Datum: $(date +%F)"
echo "Zeit: $(date +%H:%M:%S)"
echo "Quelle: $BACKUP_FILE"

# Bestätigung vom Benutzer anfordern
read -p "⚠️  WARNUNG: Diese Aktion wird die aktuelle Datenbank überschreiben! Fortfahren? (j/N) " confirm
if [[ $confirm != [jJ] ]]; then
  echo "Wiederherstellung abgebrochen."
  exit 0
fi

# Sicherungskopie der aktuellen Datenbank erstellen
TEMP_BACKUP="$BACKUP_DIR/pre_restore_$(date +%Y-%m-%d_%H-%M-%S).dump"
echo "Erstelle Sicherungskopie der aktuellen Datenbank: $TEMP_BACKUP"
pg_dump -Fc $DATABASE_URL > $TEMP_BACKUP

if [ $? -ne 0 ]; then
  echo "❌ Fehler beim Erstellen der Sicherungskopie der aktuellen Datenbank!"
  exit 1
fi

# Datenbank wiederherstellen
echo "Stelle Datenbank aus Backup wieder her..."
pg_restore --clean --if-exists --no-owner --no-privileges --dbname=$DATABASE_URL $BACKUP_FILE

# Prüfen, ob die Wiederherstellung erfolgreich war
if [ $? -eq 0 ]; then
  echo "✅ Datenbank wurde erfolgreich wiederhergestellt!"
else
  echo "❌ Fehler bei der Wiederherstellung der Datenbank!"
  echo "Sicherungskopie der vorherigen Datenbank ist verfügbar unter: $TEMP_BACKUP"
  exit 1
fi

echo "=== Datenbank-Wiederherstellung abgeschlossen ==="