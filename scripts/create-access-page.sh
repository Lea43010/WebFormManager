#!/bin/bash

# Script zum Generieren und Bereitstellen der Zugangsseite

# Farbdefinitionen
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   Bau-Structura Zugangsseite Generator${NC}"
echo -e "${BLUE}==================================================${NC}"

# Funktion zur Generierung der Zugangsseite
generate_page() {
  echo -e "\n${YELLOW}Generiere Zugangsseite...${NC}"
  cd "$(dirname "$0")/.." # Ins Hauptverzeichnis wechseln
  node scripts/generate-access-page.js
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Zugangsseite erfolgreich erstellt${NC}"
    echo -e "  Gespeichert unter: ${BLUE}public/access.html${NC}"
  else
    echo -e "${RED}✗ Fehler beim Erstellen der Zugangsseite${NC}"
    exit 1
  fi
}

# Anleitung zum Hosting anzeigen
show_hosting_options() {
  echo -e "\n${YELLOW}Hosting-Optionen für die Zugangsseite:${NC}"
  echo -e "  1. ${BLUE}GitHub Pages${NC}"
  echo -e "     - Erstellen Sie ein Repository"
  echo -e "     - Laden Sie public/access.html als index.html hoch"
  echo -e "     - Aktivieren Sie GitHub Pages in den Repository-Einstellungen"
  echo -e "\n  2. ${BLUE}Netlify Drop${NC}"
  echo -e "     - Besuchen Sie: https://app.netlify.com/drop"
  echo -e "     - Ziehen Sie die access.html per Drag & Drop hinein"
  echo -e "     - Sofort online verfügbar unter einer Netlify-URL"
  echo -e "\n  3. ${BLUE}Einfache Dateifreigabe${NC}"
  echo -e "     - Teilen Sie die Datei direkt per E-Mail"
  echo -e "     - Laden Sie sie in einen Cloud-Speicher hoch (Google Drive, Dropbox)"
  echo -e "     - Hosten Sie sie auf einem Webserver Ihrer Wahl"
}

# Hauptprogramm
main() {
  # Zugangsseite generieren
  generate_page
  
  # Hosting-Optionen anzeigen
  show_hosting_options
  
  echo -e "\n${GREEN}Fertig!${NC}"
  echo -e "${BLUE}==================================================${NC}"
}

# Programm ausführen
main