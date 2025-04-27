#!/bin/bash

# Backup-Skript für die PostgreSQL-Datenbank
# Erstellt von: Bau-Structura App
# Datum: $(date +%F)
# Beschreibung: Führt tägliche Backups der PostgreSQL-Datenbank durch

# Konfiguration
BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H-%M-%S)
BACKUP_FILENAME="backup_${DATE}_${TIME}.dump"
FULL_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
RETENTION_DAYS=30

# Umgebungsvariablen aus .env Datei laden (wenn vorhanden)
if [ -f .env ]; then
  source .env
fi

# Verzeichnis erstellen, falls es nicht existiert
mkdir -p $BACKUP_DIR

echo "=== Datenbank-Backup gestartet ==="
echo "Datum: $DATE"
echo "Zeit: $TIME"
echo "Ziel: $FULL_PATH"

# Backup erstellen
echo "Erstelle Backup..."
pg_dump -Fc $DATABASE_URL > $FULL_PATH

# Prüfen, ob Backup erfolgreich war
if [ $? -eq 0 ]; then
  echo "✅ Backup erfolgreich erstellt!"
  echo "Dateigröße: $(du -h $FULL_PATH | cut -f1)"
  
  # Alte Backups löschen
  echo "Lösche Backups, die älter als $RETENTION_DAYS Tage sind..."
  find $BACKUP_DIR -name "backup_*.dump" -type f -mtime +$RETENTION_DAYS -delete
  
  # Backup-Liste anzeigen
  echo "Aktuelle Backups:"
  ls -lh $BACKUP_DIR | grep "backup_" | sort
else
  echo "❌ Backup fehlgeschlagen!"
  exit 1
fi

echo "=== Datenbank-Backup abgeschlossen ==="
echo "Nächstes Backup: Morgen um $(date +%H:%M)"