#!/bin/bash

# Farben für die Konsolenausgabe
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Überschrift
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE} Bau-Structura Test Runner              ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Jest-Konfiguration
JEST_CONFIG="--config=jest.config.ts"

# Überprüfen, ob ein bestimmter Test ausgeführt werden soll
if [ "$1" ]; then
  TEST_PATTERN=$1
  echo -e "${BLUE}Führe Tests aus, die auf '$TEST_PATTERN' passen...${NC}"
  npx jest $JEST_CONFIG -t "$TEST_PATTERN"
else
  # Backend-Tests
  echo -e "${BLUE}Führe Backend-Tests aus...${NC}"
  npx jest $JEST_CONFIG "server/__tests__"
  BACKEND_RESULT=$?
  
  # Frontend-Tests
  echo -e "${BLUE}Führe Frontend-Tests aus...${NC}"
  npx jest $JEST_CONFIG "client/src"
  FRONTEND_RESULT=$?
  
  # Ergebnisse anzeigen
  echo -e "${BLUE}=========================================${NC}"
  if [ $BACKEND_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Backend-Tests erfolgreich${NC}"
  else
    echo -e "${RED}✗ Backend-Tests fehlgeschlagen${NC}"
  fi
  
  if [ $FRONTEND_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend-Tests erfolgreich${NC}"
  else
    echo -e "${RED}✗ Frontend-Tests fehlgeschlagen${NC}"
  fi
  
  echo -e "${BLUE}=========================================${NC}"
  
  # Gesamtergebnis
  if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ]; then
    echo -e "${GREEN}Alle Tests erfolgreich!${NC}"
    exit 0
  else
    echo -e "${RED}Einige Tests sind fehlgeschlagen!${NC}"
    exit 1
  fi
fi