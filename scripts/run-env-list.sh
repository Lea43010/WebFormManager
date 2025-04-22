#!/bin/bash
# Skript zum Auflisten der verfügbaren Umgebungen

# Farben für die Konsolenausgabe
RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
CYAN="\033[36m"
RED="\033[31m"
GRAY="\033[90m"

SHOW_DETAILS=false
if [ "$1" = "details" ]; then
  SHOW_DETAILS=true
fi

echo -e "\n${BOLD}Bau-Structura App - Verfügbare Umgebungen${RESET}\n"

# Prüfen, welche Umgebungsdateien existieren
DEV_ENV=".env.development"
STAGING_ENV=".env.staging"
PROD_ENV=".env.production"

if [ -f "$DEV_ENV" ]; then
  DEV_STATUS="${GREEN}✓ Vorhanden${RESET}"
  DEV_NODE_ENV=$(grep "NODE_ENV" "$DEV_ENV" | cut -d= -f2)
  DEV_PORT=$(grep "PORT" "$DEV_ENV" | cut -d= -f2)
  DEV_DB=$(grep "DATABASE_URL" "$DEV_ENV" | head -1)
  if [ -n "$DEV_DB" ]; then 
    DEV_DB_STATUS="${GREEN}✓${RESET}"
  else
    DEV_DB_STATUS="${RED}✗${RESET}"
  fi
else
  DEV_STATUS="${RED}✗ Nicht eingerichtet${RESET}"
  DEV_DB_STATUS="${RED}✗${RESET}"
fi

if [ -f "$STAGING_ENV" ]; then
  STAGING_STATUS="${GREEN}✓ Vorhanden${RESET}"
  STAGING_NODE_ENV=$(grep "NODE_ENV" "$STAGING_ENV" | cut -d= -f2)
  STAGING_PORT=$(grep "PORT" "$STAGING_ENV" | cut -d= -f2)
  STAGING_DB=$(grep "DATABASE_URL" "$STAGING_ENV" | head -1)
  if [ -n "$STAGING_DB" ]; then 
    STAGING_DB_STATUS="${GREEN}✓${RESET}"
  else
    STAGING_DB_STATUS="${RED}✗${RESET}"
  fi
else
  STAGING_STATUS="${RED}✗ Nicht eingerichtet${RESET}"
  STAGING_DB_STATUS="${RED}✗${RESET}"
fi

if [ -f "$PROD_ENV" ]; then
  PROD_STATUS="${GREEN}✓ Vorhanden${RESET}"
  PROD_NODE_ENV=$(grep "NODE_ENV" "$PROD_ENV" | cut -d= -f2)
  PROD_PORT=$(grep "PORT" "$PROD_ENV" | cut -d= -f2)
  PROD_DB=$(grep "DATABASE_URL" "$PROD_ENV" | head -1)
  if [ -n "$PROD_DB" ]; then 
    PROD_DB_STATUS="${GREEN}✓${RESET}"
  else
    PROD_DB_STATUS="${RED}✗${RESET}"
  fi
else
  PROD_STATUS="${RED}✗ Nicht eingerichtet${RESET}"
  PROD_DB_STATUS="${RED}✗${RESET}"
fi

# Basic info
echo -e "${BOLD}Development:${RESET} $DEV_STATUS"
echo -e "${BOLD}Staging:${RESET}     $STAGING_STATUS"
echo -e "${BOLD}Production:${RESET}  $PROD_STATUS"

if [ "$SHOW_DETAILS" = true ]; then
  # Detaillierte Informationen anzeigen
  echo -e "\n${BOLD}Details:${RESET}"
  
  echo -e "\n${CYAN}Development${RESET}"
  if [ -f "$DEV_ENV" ]; then
    echo -e "  ${GRAY}Node ENV:${RESET}       $DEV_NODE_ENV"
    echo -e "  ${GRAY}Port:${RESET}           $DEV_PORT"
    echo -e "  ${GRAY}Datenbank:${RESET}      $DEV_DB_STATUS"
    
    # API Keys prüfen
    BREVO_KEY=$(grep "BREVO_API_KEY" "$DEV_ENV" | head -1)
    OPENAI_KEY=$(grep "OPENAI_API_KEY" "$DEV_ENV" | head -1)
    MAPBOX_KEY=$(grep "MAPBOX_ACCESS_TOKEN" "$DEV_ENV" | head -1)
    STRIPE_KEY=$(grep "STRIPE_SECRET_KEY" "$DEV_ENV" | head -1)
    
    echo -e "  ${GRAY}API-Schlüssel:${RESET}"
    echo -e "    ${GRAY}Brevo:${RESET}       " $([ -n "$BREVO_KEY" ] && echo "${GREEN}✓${RESET}" || echo "${RED}✗${RESET}")
    echo -e "    ${GRAY}OpenAI:${RESET}      " $([ -n "$OPENAI_KEY" ] && echo "${GREEN}✓${RESET}" || echo "${RED}✗${RESET}")
    echo -e "    ${GRAY}Mapbox:${RESET}      " $([ -n "$MAPBOX_KEY" ] && echo "${GREEN}✓${RESET}" || echo "${RED}✗${RESET}")
    echo -e "    ${GRAY}Stripe:${RESET}      " $([ -n "$STRIPE_KEY" ] && echo "${GREEN}✓${RESET}" || echo "${RED}✗${RESET}")
    
    # Email Konfiguration
    EMAIL_MODE=$(grep "EMAIL_DEV_MODE" "$DEV_ENV" | cut -d= -f2)
    EMAIL_STATUS="Produktionsmodus"
    if [ "$EMAIL_MODE" = "true" ]; then
      EMAIL_STATUS="Entwicklungsmodus (keine echten E-Mails)"
    fi
    echo -e "  ${GRAY}E-Mail:${RESET}         $EMAIL_STATUS"
  else
    echo -e "  ${RED}Keine Details verfügbar (Umgebung nicht eingerichtet)${RESET}"
  fi
  
  echo -e "\n${YELLOW}Staging${RESET}"
  if [ -f "$STAGING_ENV" ]; then
    echo -e "  ${GRAY}Node ENV:${RESET}       $STAGING_NODE_ENV"
    echo -e "  ${GRAY}Port:${RESET}           $STAGING_PORT"
    echo -e "  ${GRAY}Datenbank:${RESET}      $STAGING_DB_STATUS"
    
    # API Keys prüfen
    BREVO_KEY=$(grep "BREVO_API_KEY" "$STAGING_ENV" | head -1)
    OPENAI_KEY=$(grep "OPENAI_API_KEY" "$STAGING_ENV" | head -1)
    MAPBOX_KEY=$(grep "MAPBOX_ACCESS_TOKEN" "$STAGING_ENV" | head -1)
    STRIPE_KEY=$(grep "STRIPE_SECRET_KEY" "$STAGING_ENV" | head -1)
    
    echo -e "  ${GRAY}API-Schlüssel:${RESET}"
    echo -e "    ${GRAY}Brevo:${RESET}       " $([ -n "$BREVO_KEY" ] && echo "${GREEN}✓${RESET}" || echo "${RED}✗${RESET}")
    echo -e "    ${GRAY}OpenAI:${RESET}      " $([ -n "$OPENAI_KEY" ] && echo "${GREEN}✓${RESET}" || echo "${RED}✗${RESET}")
    echo -e "    ${GRAY}Mapbox:${RESET}      " $([ -n "$MAPBOX_KEY" ] && echo "${GREEN}✓${RESET}" || echo "${RED}✗${RESET}")
    echo -e "    ${GRAY}Stripe:${RESET}      " $([ -n "$STRIPE_KEY" ] && echo "${GREEN}✓${RESET}" || echo "${RED}✗${RESET}")
    
    # Email Konfiguration
    EMAIL_MODE=$(grep "EMAIL_DEV_MODE" "$STAGING_ENV" | cut -d= -f2)
    EMAIL_STATUS="Produktionsmodus"
    if [ "$EMAIL_MODE" = "true" ]; then
      EMAIL_STATUS="Entwicklungsmodus (keine echten E-Mails)"
    fi
    echo -e "  ${GRAY}E-Mail:${RESET}         $EMAIL_STATUS"
  else
    echo -e "  ${RED}Keine Details verfügbar (Umgebung nicht eingerichtet)${RESET}"
  fi
  
  echo -e "\n${RED}Production${RESET}"
  if [ -f "$PROD_ENV" ]; then
    echo -e "  ${GRAY}Node ENV:${RESET}       $PROD_NODE_ENV"
    echo -e "  ${GRAY}Port:${RESET}           $PROD_PORT"
    echo -e "  ${GRAY}Datenbank:${RESET}      $PROD_DB_STATUS"
    
    # API Keys prüfen
    BREVO_KEY=$(grep "BREVO_API_KEY" "$PROD_ENV" | head -1)
    OPENAI_KEY=$(grep "OPENAI_API_KEY" "$PROD_ENV" | head -1)
    MAPBOX_KEY=$(grep "MAPBOX_ACCESS_TOKEN" "$PROD_ENV" | head -1)
    STRIPE_KEY=$(grep "STRIPE_SECRET_KEY" "$PROD_ENV" | head -1)
    
    echo -e "  ${GRAY}API-Schlüssel:${RESET}"
    echo -e "    ${GRAY}Brevo:${RESET}       " $([ -n "$BREVO_KEY" ] && echo "${GREEN}✓${RESET}" || echo "${RED}✗${RESET}")
    echo -e "    ${GRAY}OpenAI:${RESET}      " $([ -n "$OPENAI_KEY" ] && echo "${GREEN}✓${RESET}" || echo "${RED}✗${RESET}")
    echo -e "    ${GRAY}Mapbox:${RESET}      " $([ -n "$MAPBOX_KEY" ] && echo "${GREEN}✓${RESET}" || echo "${RED}✗${RESET}")
    echo -e "    ${GRAY}Stripe:${RESET}      " $([ -n "$STRIPE_KEY" ] && echo "${GREEN}✓${RESET}" || echo "${RED}✗${RESET}")
    
    # Email Konfiguration
    EMAIL_MODE=$(grep "EMAIL_DEV_MODE" "$PROD_ENV" | cut -d= -f2)
    EMAIL_STATUS="Produktionsmodus"
    if [ "$EMAIL_MODE" = "true" ]; then
      EMAIL_STATUS="Entwicklungsmodus (keine echten E-Mails)"
    fi
    echo -e "  ${GRAY}E-Mail:${RESET}         $EMAIL_STATUS"
  else
    echo -e "  ${RED}Keine Details verfügbar (Umgebung nicht eingerichtet)${RESET}"
  fi
fi

echo -e "\n${BOLD}Verfügbare Aktionen:${RESET}"
echo -e "  ${GRAY}Umgebung einrichten:${RESET}        ./scripts/env-tools.sh setup <env>"
echo -e "  ${GRAY}Umgebung klonen:${RESET}            ./scripts/env-tools.sh clone <source> <target>"
echo -e "  ${GRAY}Klonen testen:${RESET}              ./scripts/env-tools.sh test <source> <target>"
echo -e "  ${GRAY}Anwendung starten:${RESET}          ./scripts/env-tools.sh start <env>"
echo -e "  ${GRAY}Details anzeigen:${RESET}           ./scripts/env-tools.sh list details"
echo -e ""