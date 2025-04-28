#!/bin/bash
#
# Datenbankbackup-Skript für die Bau-Structura App
# Erstellt von: Bau-Structura App
# Datum: $(date +%F)
#
# Beschreibung: Dieses Skript erstellt ein vollständiges SQL-Backup der Datenbank
# und speichert es im Verzeichnis 'backups' im Hauptverzeichnis der Anwendung.
# Alte Backups werden nach 30 Tagen automatisch gelöscht.

# Verzeichnis-Konfiguration
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
ROOT_DIR=$(dirname "$SCRIPT_DIR")
BACKUP_DIR="${ROOT_DIR}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
RETENTION_DAYS=30

# Umgebungsvariablen aus .env Datei laden (wenn vorhanden)
if [ -f "${ROOT_DIR}/.env" ]; then
  source "${ROOT_DIR}/.env"
  echo "Umgebungsvariablen aus .env geladen"
fi

# Prüfen, ob die erforderlichen Umgebungsvariablen gesetzt sind
if [ -z "$DATABASE_URL" ]; then
  echo "FEHLER: Die Umgebungsvariable DATABASE_URL ist nicht gesetzt!"
  exit 1
fi

# Datenbank-Verbindungsinformationen aus DATABASE_URL extrahieren
# Format: postgresql://username:password@hostname:port/database?options
DB_URL="${DATABASE_URL}"
echo "Analysiere Datenbank-URL: $DB_URL"

# Extrahiere Benutzer
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
echo "Extrahierter Benutzer: $DB_USER"

# Extrahiere Passwort
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
echo "Passwort wurde extrahiert (nicht angezeigt)"

# Extrahiere Host - korrigiert, um nur den Hostnamen ohne Pfad oder Parameter zu bekommen
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:/]*\).*/\1/p')
echo "Extrahierter Host: $DB_HOST"

# Extrahiere Port
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
echo "Extrahierter Port: $DB_PORT"

# Extrahiere Datenbankname - korrigiert, um nur den Namen ohne Parameter zu bekommen
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
echo "Extrahierter Datenbankname: $DB_NAME"

# Standardwerte für Port
if [ -z "$DB_PORT" ]; then
  DB_PORT=5432
fi

# Fortschrittsanzeige
echo "=== Datenbankbackup wird erstellt ==="
echo "Datum: $(date +%F)"
echo "Zeit: $(date +%H:%M:%S)"
echo "Datenbankhost: ${DB_HOST}"
echo "Datenbankname: ${DB_NAME}"
echo "Backup-Datei: ${BACKUP_FILE}"
echo "===============================\n"

# Backup-Verzeichnis erstellen, falls es nicht existiert
mkdir -p "${BACKUP_DIR}"

# Backup erstellen mit pg_dump
echo "Starte pg_dump..."
PGPASSWORD="${DB_PASS}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -F p -f "${BACKUP_FILE}" -v

# Prüfen, ob das Backup erfolgreich war
if [ $? -eq 0 ]; then
  # Größe des Backups berechnen
  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "\n=== Backup erfolgreich erstellt ==="
  echo "Backup-Datei: ${BACKUP_FILE}"
  echo "Größe: ${BACKUP_SIZE}"
  echo "Datum: $(date +%F)"
  echo "Zeit: $(date +%H:%M:%S)"
  echo "===============================\n"
  
  # Alte Backups löschen, die älter als RETENTION_DAYS sind
  echo "Alte Backups werden geprüft..."
  find "${BACKUP_DIR}" -name "backup_*.sql" -type f -mtime +${RETENTION_DAYS} -delete -print | while read line; do
    echo "Gelöscht: $line (älter als ${RETENTION_DAYS} Tage)"
  done
  
  echo "\nBackup-Prozess abgeschlossen."
  exit 0
else
  echo "\n=== FEHLER: Backup fehlgeschlagen ==="
  echo "Datum: $(date +%F)"
  echo "Zeit: $(date +%H:%M:%S)"
  echo "===============================\n"
  exit 1
fi