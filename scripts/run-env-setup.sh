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

# TypeScript-Skript ausführen
npx tsx scripts/setup-environment.ts $ENVIRONMENT

echo "✅ Skript zur Umgebungseinrichtung wurde ausgeführt."