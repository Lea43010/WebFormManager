#!/bin/bash
# Skript zum Klonen einer Umgebung in eine andere

# Überprüfung der Argumente
if [ $# -lt 2 ]; then
  echo "Verwendung: $0 <source-environment> <target-environment> [--force]"
  echo "Beispiel: $0 development staging"
  exit 1
fi

SOURCE_ENV=$1
TARGET_ENV=$2
FORCE=""

# Prüfen, ob --force als drittes Argument angegeben wurde
if [ $# -eq 3 ] && [ "$3" == "--force" ]; then
  FORCE="--force"
fi

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

echo "🔄 Starte Umgebungsklonen von $SOURCE_ENV nach $TARGET_ENV..."

# TypeScript-Skript ausführen
if [ -n "$FORCE" ]; then
  npx tsx scripts/clone-environment.ts $SOURCE_ENV $TARGET_ENV --force
else
  npx tsx scripts/clone-environment.ts $SOURCE_ENV $TARGET_ENV
fi

# Exitcode des TypeScript-Skripts überprüfen
RESULT=$?
if [ $RESULT -eq 0 ]; then
  echo "✅ Umgebung erfolgreich geklont."
else
  echo "❌ Fehler beim Klonen der Umgebung."
  exit $RESULT
fi