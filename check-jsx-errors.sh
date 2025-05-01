#!/bin/bash

# Farben für eine bessere Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Banner für das Skript
echo -e "${GREEN}"
echo " _____ ______   ___    _   _____         _            "
echo "|_   _/ ___\ \ / / |  | | |  ___|__ _ __| | ___  _ __ "
echo "  | | \___ \\ V /| |  | | | |_ / _ \ '__| |/ _ \| '__|"
echo "  | |  ___) || | | |__| | |  _|  __/ |  | | (_) | |   "
echo "  |_| |____/ |_|  \____/  |_|  \___|_|  |_|\___/|_|   "
echo -e "${NC}"
echo "JSX Fehler-Checker für Bau-Structura App"
echo ""

# Muster für häufige JSX-Fehler
echo -e "${YELLOW}Überprüfe auf häufige JSX-Fehler...${NC}"

# 1. Verschachtelte <a>-Tags
echo -e "\n${GREEN}1. Suche nach verschachtelten <a>-Tags:${NC}"
grep -r --include="*.tsx" --include="*.jsx" -n "<Link.*>.*<a.*>.*</a>.*</Link>" client/src/ || echo "✓ Keine verschachtelten Link-zu-a-Tags gefunden."
grep -r --include="*.tsx" --include="*.jsx" -n "<a.*>.*<Link.*>.*</Link>.*</a>" client/src/ || echo "✓ Keine verschachtelten a-zu-Link-Tags gefunden."
grep -r --include="*.tsx" --include="*.jsx" -n "<a.*>.*<a.*>.*</a>.*</a>" client/src/ || echo "✓ Keine verschachtelten a-zu-a-Tags gefunden."

# 2. Nicht geschlossene Tags
echo -e "\n${GREEN}2. Suche nach potenziell nicht geschlossenen Tags:${NC}"
grep -r --include="*.tsx" --include="*.jsx" -n "<div[^>]*>[^<]*$" client/src/ || echo "✓ Keine nicht geschlossenen div-Tags gefunden."
grep -r --include="*.tsx" --include="*.jsx" -n "<span[^>]*>[^<]*$" client/src/ || echo "✓ Keine nicht geschlossenen span-Tags gefunden."

# 3. Falsch formatierte JSX-Ausdrücke
echo -e "\n${GREEN}3. Suche nach falsch formatierten JSX-Ausdrücken:${NC}"
grep -r --include="*.tsx" --include="*.jsx" -n "{.*{.*}.*}" client/src/ || echo "✓ Keine verschachtelten JSX-Ausdrücke gefunden."

# 4. JSX-Attribute ohne Werte
echo -e "\n${GREEN}4. Suche nach JSX-Attributen ohne Werte:${NC}"
grep -r --include="*.tsx" --include="*.jsx" -n "=[^\"'{}]*[ >]" client/src/ | grep -v "={" || echo "✓ Keine JSX-Attribute ohne Werte gefunden."

# 5. Fehlende key-Props in Listen
echo -e "\n${GREEN}5. Überprüfe auf fehlende key-Props in map()-Funktionen:${NC}"
grep -r --include="*.tsx" --include="*.jsx" -n "\.map\((.*) =>" client/src/ | grep -v "key=" || echo "✓ Keine offensichtlich fehlenden key-Props gefunden."

# 6. Fragment-Syntax-Fehler
echo -e "\n${GREEN}6. Suche nach potenziellen Fragment-Syntax-Fehlern:${NC}"
grep -r --include="*.tsx" --include="*.jsx" -n "<>.*<\/div>" client/src/ || echo "✓ Keine Fragment-Syntax-Fehler gefunden."
grep -r --include="*.tsx" --include="*.jsx" -n "<div.*<\/>" client/src/ || echo "✓ Keine Fragment-Syntax-Fehler gefunden."

# 7. Problematische Inline-Styles
echo -e "\n${GREEN}7. Überprüfe auf problematische Inline-Styles:${NC}"
grep -r --include="*.tsx" --include="*.jsx" -n "style=\"" client/src/ || echo "✓ Keine HTML-Style-Attribute gefunden (gut!)."
grep -r --include="*.tsx" --include="*.jsx" -n "style={[^{]" client/src/ | grep -v "style={.*}" || echo "✓ Keine problematischen Inline-Styles gefunden."

# 8. Fehlende import React bei JSX-Verwendung (für ältere React-Versionen)
echo -e "\n${GREEN}8. Überprüfe auf React-Import in JSX-Dateien:${NC}"
files_with_jsx=$(grep -l --include="*.tsx" --include="*.jsx" -r "<[A-Z]" client/src/)
for file in $files_with_jsx; do
  if ! grep -q "import.*React.*from.*'react'" "$file"; then
    echo -e "${YELLOW}Warnung: Keine React-Import gefunden in $file${NC}"
  fi
done
echo "✓ React-Import-Prüfung abgeschlossen."

# 9. Doppelte id-Attribute
echo -e "\n${GREEN}9. Suche nach möglicherweise doppelten id-Attributen:${NC}"
grep -r --include="*.tsx" --include="*.jsx" -n "id=\"[^\"]*\"" client/src/ | sort | uniq -d || echo "✓ Keine offensichtlich doppelten IDs gefunden."

# 10. TypeScript-spezifische Fehler
echo -e "\n${GREEN}10. Überprüfe auf typische TypeScript-JSX-Fehler:${NC}"
grep -r --include="*.tsx" -n "<.*\?.*>" client/src/ || echo "✓ Keine problematischen bedingten Typen in JSX gefunden."
grep -r --include="*.tsx" -n "(React\.)?FC\<.*\>[^{=]*=[^{=]*{" client/src/ | grep -v "=>.*{" || echo "✓ Keine problematischen FC-Deklarationen gefunden."

echo -e "\n${GREEN}JSX-Fehler-Prüfung abgeschlossen.${NC}"

# Fazit
echo -e "\n${YELLOW}Hinweis:${NC} Dies ist eine einfache statische Prüfung und kann nicht alle JSX-Fehler finden."
echo "Für eine gründlichere Prüfung verwende das run-lint.sh-Skript oder führe die ESLint-Prüfung direkt aus."
echo "Die integrierten React-Entwicklungswerkzeuge (im Browser) sind ebenfalls hilfreich, um Rendering-Probleme zu finden."