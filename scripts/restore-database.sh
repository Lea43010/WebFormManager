#!/bin/bash
#
# Datenbank-Wiederherstellungs-Skript für die Bau-Structura App
# Erstellt von: Bau-Structura App
# Datum: $(date +%F)
#
# Beschreibung: Dieses Skript stellt eine Datenbank aus einem SQL-Backup wieder her.
# Es benötigt den Pfad zur SQL-Backup-Datei als ersten Parameter.

# Parameter prüfen
if [ $# -ne 1 ]; then
  echo "Verwendung: $0 <Pfad-zur-Backup-Datei>"
  exit 1
fi

# Pfad zur Backup-Datei
BACKUP_FILE="$1"

# Prüfen, ob die Backup-Datei existiert
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "FEHLER: Die Backup-Datei '${BACKUP_FILE}' wurde nicht gefunden!"
  exit 1
fi

# Verzeichnis-Konfiguration
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
ROOT_DIR=$(dirname "$SCRIPT_DIR")

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
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Standardwerte für Port
if [ -z "$DB_PORT" ]; then
  DB_PORT=5432
fi

# Timestamp für Sicherungszwecke
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Fortschrittsanzeige
echo "=== Datenbank-Wiederherstellung wird gestartet ==="
echo "Datum: $(date +%F)"
echo "Zeit: $(date +%H:%M:%S)"
echo "Datenbankhost: ${DB_HOST}"
echo "Datenbankname: ${DB_NAME}"
echo "Backup-Datei: ${BACKUP_FILE}"
echo "========================================\n"

# Sicherheitsabfrage
echo "WARNUNG: Diese Aktion überschreibt die aktuelle Datenbank vollständig!"
echo "Möchten Sie fortfahren? (ja/nein)"

# Bei automatischer Ausführung (z.B. via API) wird ohne Abfrage fortgefahren
if [ -t 0 ]; then  # Terminal-Check
  read ANSWER
  if [ "$ANSWER" != "ja" ]; then
    echo "Wiederherstellung abgebrochen."
    exit 0
  fi
else
  echo "Automatischer Modus: Wiederherstellung wird fortgesetzt..."
fi

# Bestehende Verbindungen schließen
echo "Schließe bestehende Datenbankverbindungen..."
PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '${DB_NAME}'
  AND pid <> pg_backend_pid();" || true

# Datenbank wiederherstellen
echo "Starte Wiederherstellung..."
PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${BACKUP_FILE}"

# Prüfen, ob die Wiederherstellung erfolgreich war
if [ $? -eq 0 ]; then
  echo "\n=== Wiederherstellung erfolgreich abgeschlossen ==="
  echo "Datum: $(date +%F)"
  echo "Zeit: $(date +%H:%M:%S)"
  echo "==================================================\n"
  exit 0
else
  echo "\n=== FEHLER: Wiederherstellung fehlgeschlagen ==="
  echo "Datum: $(date +%F)"
  echo "Zeit: $(date +%H:%M:%S)"
  echo "==================================================\n"
  exit 1
fi