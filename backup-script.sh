#!/bin/bash

# Erstellt ein Backup des Projekts
BACKUP_DIR="backup/$(date +%Y-%m-%d)"
BACKUP_FILE="bau-structura-backup-$(date +%Y-%m-%d-%H%M%S).tar.gz"

# Backup-Verzeichnis erstellen
mkdir -p "${BACKUP_DIR}"

# Archiv erstellen, aber .env-Dateien, node_modules und andere sensible Daten ausschließen
tar --exclude="node_modules" \
    --exclude=".git" \
    --exclude="dist" \
    --exclude=".env" \
    --exclude=".env.development" \
    --exclude=".env.production" \
    --exclude=".env.staging" \
    --exclude="temp" \
    --exclude="*.log" \
    --exclude="backup.dump" \
    -czf "${BACKUP_DIR}/${BACKUP_FILE}" \
    client server shared scripts config.ts drizzle.config.ts package.json tsconfig.json

# Ausgabe
echo "Backup erstellt: ${BACKUP_DIR}/${BACKUP_FILE}"