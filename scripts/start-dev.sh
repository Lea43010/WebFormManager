#!/bin/bash
# Skript zum Starten der Anwendung in der Entwicklungsumgebung

# Umgebungsvariablen laden
source .env.development

# Umgebung setzen und Anwendung starten
NODE_ENV=development npm run dev