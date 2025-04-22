#!/bin/bash
# Skript zum Testen des Umgebungsklonens (ohne tatsächliche Änderungen)

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

echo "🧪 Teste Umgebungsklonen von $SOURCE_ENV nach $TARGET_ENV..."

# TypeScript-Skript ausführen
npx tsx scripts/test-env-clone.ts $SOURCE_ENV $TARGET_ENV

echo "✅ Test abgeschlossen."