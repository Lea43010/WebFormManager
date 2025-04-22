#!/bin/bash
# Skript zum Klonen einer Umgebung

# Überprüfung der Argumente
if [ $# -ne 2 ]; then
  echo "Verwendung: $0 <source-environment> <target-environment>"
  echo "Beispiel: $0 development staging"
  exit 1
fi

SOURCE_ENV=$1
TARGET_ENV=$2

# Gültige Umgebungen überprüfen
if [[ "$SOURCE_ENV" != "development" && "$SOURCE_ENV" != "staging" && "$SOURCE_ENV" != "production" ]]; then
  echo "Fehler: Ungültige Quell-Umgebung. Gültige Werte: development, staging, production"
  exit 1
fi

if [[ "$TARGET_ENV" != "development" && "$TARGET_ENV" != "staging" && "$TARGET_ENV" != "production" ]]; then
  echo "Fehler: Ungültige Ziel-Umgebung. Gültige Werte: development, staging, production"
  exit 1
fi

if [ "$SOURCE_ENV" = "$TARGET_ENV" ]; then
  echo "Fehler: Quell- und Ziel-Umgebung dürfen nicht identisch sein."
  exit 1
fi

echo "🚀 Umgebung wird von $SOURCE_ENV nach $TARGET_ENV geklont..."

# Besondere Warnung bei Klonen nach Production
if [ "$TARGET_ENV" = "production" ]; then
  echo "⚠️ WARNUNG: Sie sind dabei, in die Produktionsumgebung zu klonen!"
  echo "Dieser Vorgang sollte nur in einer kontrollierten Umgebung durchgeführt werden."
  read -p "Möchten Sie fortfahren? (ja/nein): " CONFIRM
  
  if [[ "$CONFIRM" != "ja" && "$CONFIRM" != "yes" && "$CONFIRM" != "y" ]]; then
    echo "Vorgang abgebrochen."
    exit 1
  fi
fi

# TypeScript-Skript ausführen
npx tsx scripts/clone-environment.ts $SOURCE_ENV $TARGET_ENV

echo "✅ Skript zum Umgebungsklonen wurde ausgeführt."