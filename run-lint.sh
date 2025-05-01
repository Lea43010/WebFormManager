#!/bin/bash

# Farben für eine bessere Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funktion für Überschriften
print_header() {
  echo -e "${GREEN}=========================================================${NC}"
  echo -e "${GREEN}$1${NC}"
  echo -e "${GREEN}=========================================================${NC}"
}

# Funktion für Info-Meldungen
print_info() {
  echo -e "${YELLOW}$1${NC}"
}

# Funktion für Fehler-Meldungen
print_error() {
  echo -e "${RED}$1${NC}"
}

# Banner für das Skript
echo -e "${GREEN}"
echo "  _     _       _   _           "
echo " | |   (_)_ __ | |_(_)_ __   __ _ "
echo " | |   | | '_ \| __| | '_ \ / _\` |"
echo " | |___| | | | | |_| | | | | (_| |"
echo " |_____|_|_| |_|\__|_|_| |_|\__, |"
echo "                            |___/ "
echo -e "${NC}"
echo "Linting-Tool für Bau-Structura App"
echo ""

# Prüfe, ob ESLint installiert ist
if ! command -v npx &> /dev/null
then
  print_error "npx konnte nicht gefunden werden. Bitte installiere Node.js."
  exit 1
fi

# Hauptmenü
while true; do
  echo ""
  echo "Wähle eine Option:"
  echo "1) Überprüfe alle TypeScript/React-Dateien"
  echo "2) Überprüfe und korrigiere automatisch behebbare Probleme"
  echo "3) Überprüfe nur JSX/TSX-Dateien (React-Komponenten)"
  echo "4) Überprüfe eine bestimmte Datei"
  echo "5) Erstelle detaillierten Linting-Bericht (JSON)"
  echo "6) Überprüfe eine bestimmte Komponente"
  echo "q) Beenden"
  echo ""
  read -p "Option: " option

  case $option in
    1)
      print_header "Überprüfe alle TypeScript/React-Dateien"
      npx eslint --ext .ts,.tsx --cache .
      ;;
    2)
      print_header "Korrigiere automatisch behebbare Probleme"
      npx eslint --ext .ts,.tsx --fix .
      print_info "Automatische Korrekturen wurden angewendet."
      ;;
    3)
      print_header "Überprüfe nur JSX/TSX-Dateien (React-Komponenten)"
      npx eslint --ext .tsx --cache 'client/src/**/*.tsx'
      ;;
    4)
      print_header "Überprüfe eine bestimmte Datei"
      read -p "Pfad zur Datei (z.B. client/src/pages/home.tsx): " file_path
      if [ -f "$file_path" ]; then
        npx eslint "$file_path"
      else
        print_error "Datei nicht gefunden: $file_path"
      fi
      ;;
    5)
      print_header "Erstelle detaillierten Linting-Bericht"
      npx eslint --ext .ts,.tsx --output-file eslint-report.json --format json .
      print_info "Bericht wurde in eslint-report.json gespeichert."
      ;;
    6)
      print_header "Überprüfe eine bestimmte Komponente"
      read -p "Name der Komponente (z.B. BreadcrumbLink): " component_name
      print_info "Suche nach Komponente $component_name..."
      # Find files containing the component name and lint them
      files=$(grep -l "$component_name" --include="*.tsx" --include="*.ts" -r client/src/ 2>/dev/null)
      if [ -z "$files" ]; then
        print_error "Keine Dateien mit der Komponente $component_name gefunden."
      else
        echo "Gefundene Dateien mit $component_name:"
        echo "$files"
        echo ""
        npx eslint $files
      fi
      ;;
    q|Q)
      print_info "Linting-Tool wird beendet."
      exit 0
      ;;
    *)
      print_error "Ungültige Option. Bitte wähle eine Option aus dem Menü."
      ;;
  esac
done