#!/bin/bash
# Zentrales Skript für die Umgebungsverwaltung der Bau-Structura App

# Farben für die Konsolenausgabe
RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
CYAN="\033[36m"
RED="\033[31m"

# Hilfefunktion
show_help() {
  echo -e "\n${BOLD}Bau-Structura App - Umgebungsverwaltungstools${RESET}\n"
  echo -e "Verwendung: $0 ${BOLD}<befehl>${RESET} [parameter...]\n"
  echo -e "Verfügbare Befehle:"
  echo -e "  ${GREEN}list${RESET} [details]           Listet alle verfügbaren Umgebungen auf"
  echo -e "  ${GREEN}setup${RESET} <env>              Richtet eine neue Umgebung ein"
  echo -e "  ${GREEN}clone${RESET} <source> <target>  Klont eine Umgebung in eine andere"
  echo -e "  ${GREEN}test${RESET} <source> <target>   Testet das Klonen (ohne Änderungen)"
  echo -e "  ${GREEN}start${RESET} <env>              Startet die Anwendung in der angegebenen Umgebung"
  echo -e "  ${GREEN}help${RESET}                     Zeigt diese Hilfe an\n"
  echo -e "Beispiele:"
  echo -e "  $0 ${GREEN}list${RESET} details"
  echo -e "  $0 ${GREEN}setup${RESET} development"
  echo -e "  $0 ${GREEN}clone${RESET} development staging"
  echo -e "  $0 ${GREEN}test${RESET} development production"
  echo -e "  $0 ${GREEN}start${RESET} development\n"
}

# Überprüfen, ob ein Befehl angegeben wurde
if [ $# -lt 1 ]; then
  show_help
  exit 1
fi

COMMAND=$1
shift

# Befehl ausführen
case $COMMAND in
  list)
    ./scripts/run-env-list.sh $@
    ;;
    
  setup)
    if [ $# -ne 1 ]; then
      echo -e "${RED}Fehler: Der Befehl 'setup' erfordert eine Umgebung als Parameter.${RESET}"
      echo -e "Beispiel: $0 setup development\n"
      exit 1
    fi
    ./scripts/run-env-setup.sh $1
    ;;
    
  clone)
    if [ $# -ne 2 ]; then
      echo -e "${RED}Fehler: Der Befehl 'clone' erfordert Quell- und Zielumgebung als Parameter.${RESET}"
      echo -e "Beispiel: $0 clone development staging\n"
      exit 1
    fi
    ./scripts/run-env-clone.sh $1 $2
    ;;
    
  test)
    if [ $# -ne 2 ]; then
      echo -e "${RED}Fehler: Der Befehl 'test' erfordert Quell- und Zielumgebung als Parameter.${RESET}"
      echo -e "Beispiel: $0 test development staging\n"
      exit 1
    fi
    ./scripts/run-env-test.sh $1 $2
    ;;
    
  start)
    if [ $# -ne 1 ]; then
      echo -e "${RED}Fehler: Der Befehl 'start' erfordert eine Umgebung als Parameter.${RESET}"
      echo -e "Beispiel: $0 start development\n"
      exit 1
    fi
    
    case $1 in
      development)
        ./scripts/start-dev.sh
        ;;
      staging)
        ./scripts/start-staging.sh
        ;;
      production)
        ./scripts/start-prod.sh
        ;;
      *)
        echo -e "${RED}Fehler: Ungültige Umgebung '$1'. Gültige Werte: development, staging, production${RESET}\n"
        exit 1
        ;;
    esac
    ;;
    
  help)
    show_help
    ;;
    
  *)
    echo -e "${RED}Fehler: Unbekannter Befehl '$COMMAND'${RESET}\n"
    show_help
    exit 1
    ;;
esac