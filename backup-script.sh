#!/bin/bash

# Backup-Skript für Bau-Structura
# Erstellt ein Backup der Datenbank und wichtiger Dateien

# Errorhandling
set -e

# Datum für den Backup-Namen
DATE=$(date +"%Y-%m-%d")
TIME=$(date +"%H-%M-%S")
TIMESTAMP="${DATE}_${TIME}"

# Verzeichnisse
BACKUP_ROOT="./backup"
BACKUP_DIR="${BACKUP_ROOT}/${DATE}"
TEMP_DIR="${BACKUP_DIR}/temp"

# Erstelle Verzeichnisse, falls sie nicht existieren
mkdir -p "${BACKUP_DIR}"
mkdir -p "${TEMP_DIR}"

# Datenbankverbindungsinformationen aus .env-Datei oder Umgebungsvariablen
DB_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/database}"

# Datenbankname extrahieren
DB_NAME=$(echo "${DB_URL}" | sed -E 's/.*\/([^?]+).*/\1/')

# Exportiere Datenbank nach SQL
pg_dump "${DB_URL}" > "${TEMP_DIR}/database_dump.sql"

# Kopiere wichtige Konfigurationsdateien
cp .env* "${TEMP_DIR}/" 2>/dev/null || true
cp package.json "${TEMP_DIR}/" 2>/dev/null || true

# Erstelle ein komprimiertes Archiv
BACKUP_FILENAME="bau-structura-backup-${TIMESTAMP}.tar.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

tar -czf "${BACKUP_PATH}" -C "${TEMP_DIR}" .

# Räume temporäre Dateien auf
rm -rf "${TEMP_DIR}"

# Ausgabe
echo "Backup erstellt: ${BACKUP_PATH}"

exit 0