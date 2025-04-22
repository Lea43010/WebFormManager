#!/bin/bash
# Skript zum Starten der Anwendung in der Staging-Umgebung

# Umgebungsvariablen laden
source .env.staging

# Umgebung setzen und Anwendung starten
NODE_ENV=staging npm run dev