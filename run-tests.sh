#!/bin/bash

# Farben für die Ausgabe
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}# Bau-Structura Test Runner #${NC}"
echo -e "${BLUE}=============================${NC}\n"

# Überprüfen, ob Jest installiert ist
if ! [ -x "$(command -v npx jest)" ]; then
  echo -e "${RED}Error: Jest ist nicht installiert.${NC}" >&2
  echo "  Bitte führen Sie 'npm install --save-dev jest @types/jest ts-jest' aus."
  exit 1
fi

# Funktion zum Ausführen der Tests
run_tests() {
  local test_type=$1
  local test_path=$2
  local test_name=$3

  echo -e "${BLUE}Führe $test_name Tests aus...${NC}"
  
  npx jest $test_path --colors
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $test_name Tests erfolgreich!${NC}\n"
    return 0
  else
    echo -e "${RED}✗ $test_name Tests fehlgeschlagen!${NC}\n"
    return 1
  fi
}

# Client-Tests
echo -e "${BLUE}CLIENT TESTS${NC}"
echo -e "${BLUE}------------${NC}"

run_tests "client" "client/src/__tests__" "Client"
client_result=$?

# Server-Tests
echo -e "${BLUE}SERVER TESTS${NC}"
echo -e "${BLUE}------------${NC}"

run_tests "server" "server/__tests__" "Server"
server_result=$?

# Zusammenfassung
echo -e "${BLUE}TEST ZUSAMMENFASSUNG${NC}"
echo -e "${BLUE}------------------${NC}"

if [ $client_result -eq 0 ]; then
  echo -e "${GREEN}✓ Client Tests: Erfolgreich${NC}"
else
  echo -e "${RED}✗ Client Tests: Fehlgeschlagen${NC}"
fi

if [ $server_result -eq 0 ]; then
  echo -e "${GREEN}✓ Server Tests: Erfolgreich${NC}"
else
  echo -e "${RED}✗ Server Tests: Fehlgeschlagen${NC}"
fi

# Gesamtergebnis
if [ $client_result -eq 0 ] && [ $server_result -eq 0 ]; then
  echo -e "\n${GREEN}✓ Alle Tests erfolgreich bestanden!${NC}"
  exit 0
else
  echo -e "\n${RED}✗ Einige Tests sind fehlgeschlagen.${NC}"
  exit 1
fi