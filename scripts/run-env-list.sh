#!/bin/bash
# Skript zum Auflisten aller konfigurierten Umgebungen

# Überprüfen, ob der "details" Parameter übergeben wurde
if [ "$1" == "details" ]; then
  npx tsx scripts/list-environments.ts details
else
  npx tsx scripts/list-environments.ts
fi