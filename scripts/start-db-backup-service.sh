#!/bin/bash

# Start-Skript für den Datenbank-Backup-Service
# Erstellt von: Bau-Structura App
# Datum: $(date +%F)

echo "=== Starte Datenbank-Backup-Service ==="
echo "Datum: $(date +%F)"
echo "Zeit: $(date +%H:%M:%S)"
echo ""

# Umgebungsvariablen aus .env Datei laden (wenn vorhanden)
if [ -f .env ]; then
  source .env
  echo "Umgebungsvariablen aus .env geladen"
fi

# Prüfen, ob die erforderlichen Umgebungsvariablen gesetzt sind
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ WARNUNG: Die Umgebungsvariable DATABASE_URL ist nicht gesetzt!"
  echo "Das Backup wird möglicherweise fehlschlagen."
fi

echo "Starte Backup-Service..."
node server/backup-service.js

echo "=== Datenbank-Backup-Service beendet ==="