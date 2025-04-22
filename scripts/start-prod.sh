#!/bin/bash
# Skript zum Starten der Anwendung in der Produktionsumgebung

# Umgebungsvariablen laden
source .env.production

# Build erstellen und dann in Produktion starten
NODE_ENV=production npm run build && NODE_ENV=production npm run start