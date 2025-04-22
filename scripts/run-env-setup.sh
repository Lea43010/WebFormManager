#!/bin/bash
# Skript zum Einrichten einer Umgebung

# Überprüfung der Argumente
if [ $# -ne 1 ]; then
  echo "Verwendung: $0 <environment>"
  echo "Beispiel: $0 development"
  exit 1
fi

ENVIRONMENT=$1

# Gültige Umgebungen überprüfen
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo "Fehler: Ungültige Umgebung. Gültige Werte: development, staging, production"
  exit 1
fi

echo "🚀 Umgebung $ENVIRONMENT wird eingerichtet..."

# Besondere Warnung bei Einrichtung der Production-Umgebung
if [ "$ENVIRONMENT" = "production" ]; then
  echo "⚠️ WARNUNG: Sie sind dabei, die Produktionsumgebung einzurichten!"
  echo "Dieser Vorgang sollte nur in einer kontrollierten Umgebung durchgeführt werden."
  read -p "Möchten Sie fortfahren? (ja/nein): " CONFIRM
  
  if [[ "$CONFIRM" != "ja" && "$CONFIRM" != "yes" && "$CONFIRM" != "y" ]]; then
    echo "Vorgang abgebrochen."
    exit 1
  fi
fi

# TypeScript-Skript ausführen
npx tsx scripts/setup-environment.ts $ENVIRONMENT

echo "✅ Skript zur Umgebungseinrichtung wurde ausgeführt."