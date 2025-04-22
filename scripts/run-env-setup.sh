#!/bin/bash
# Skript zum Einrichten einer neuen Umgebung

# Überprüfung der Argumente
if [ $# -lt 1 ]; then
  echo "Verwendung: $0 <environment> [--force]"
  echo "Beispiel: $0 development"
  exit 1
fi

ENV=$1
FORCE=""

# Prüfen, ob --force als zweites Argument angegeben wurde
if [ $# -eq 2 ] && [ "$2" == "--force" ]; then
  FORCE="--force"
fi

# Gültige Umgebungen überprüfen
if [[ "$ENV" != "development" && "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "Fehler: Ungültige Umgebung. Gültige Werte: development, staging, production"
  exit 1
fi

echo "🔧 Starte Umgebungs-Setup für $ENV..."

# TypeScript-Skript ausführen
if [ -n "$FORCE" ]; then
  npx tsx scripts/setup-environment.ts $ENV --force
else
  npx tsx scripts/setup-environment.ts $ENV
fi

# Exitcode des TypeScript-Skripts überprüfen
RESULT=$?
if [ $RESULT -eq 0 ]; then
  echo "✅ Umgebung erfolgreich eingerichtet."
else
  echo "❌ Fehler beim Einrichten der Umgebung."
  exit $RESULT
fi