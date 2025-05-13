# Bau-Structura Testkonzept

Dieses Dokument beschreibt die Testarchitektur und -strategie für die Bau-Structura Anwendung.

## Übersicht der Testumgebung

Für unsere Bau-Structura Anwendung verwenden wir folgendes Testing-Setup:

- **Jest**: Als Haupt-Test-Framework
- **React Testing Library**: Für benutzerorientierte Komponententests
- **Supertest**: Für API-Tests
- **Mocks**: Für die Isolierung von externen Abhängigkeiten

## Testarten

### 1. Komponententests (Unit Tests)

Testen einzelner React-Komponenten in Isolation.

**Implementierte Tests:**
- `client/src/components/pdf/__tests__/tiefbau-pdf-generator.test.tsx`: Tests für die PDF-Generator-Komponente
- `client/src/components/maps/__tests__/basic-google-map.test.tsx`: Tests für die Google Maps-Komponente
- `client/src/components/__tests__/tiefbau-navigation.test.tsx`: Tests für die Navigationskomponente
- `client/src/components/forms/__tests__/login-form.test.tsx`: Tests für das Login-Formular

### 2. API-Tests

Testen der Backend-API-Endpunkte.

**Implementierte Tests:**
- `server/__tests__/routes/bodenarten.test.ts`: Tests für die Bodenarten-API-Endpunkte

### 3. Service-Tests

Testen der Backend-Services.

**Implementierte Tests:**
- `server/__tests__/services/bodenarten-service.test.ts`: Tests für den Bodenarten-Service

## Installation und Setup

Vor dem Ausführen der Tests sollten Sie sicherstellen, dass alle Abhängigkeiten installiert sind:

```bash
npm install
```

## Ausführen der Tests

Tests können mit folgenden Befehlen ausgeführt werden:

```bash
# Alle Tests ausführen
npm test

# Oder mit unserem Skript (für farbige Ausgabe)
./run-tests.sh

# Nur Frontend-Tests ausführen
npx jest --config=jest.config.ts "client/src"

# Nur Backend-Tests ausführen
npx jest --config=jest.config.ts "server/__tests__"

# Einen spezifischen Test ausführen
npx jest --config=jest.config.ts "client/src/components/__tests__/tiefbau-navigation.test.tsx"

# Tests mit Überwachungsmodus (Watch-Modus)
npx jest --config=jest.config.ts --watch
```

## Besonderheiten der Testumgebung

### Mock-Setup für externe Abhängigkeiten

In der Datei `client/src/__tests__/setup.ts` werden globale Mocks für verschiedene externe Abhängigkeiten definiert:

- **Window-Objekte**: z.B. `matchMedia` und `localStorage`
- **Google Maps API**: Umfassende Mocks für die Google Maps API
- **Leaflet**: Mocks für die Leaflet-Bibliothek

### Hilfsfunktionen für Tests

Wir haben spezielle Hilfsfunktionen für bestimmte Testszenarien erstellt:

- **`renderWithForm`**: Zum Testen von Formularen mit React Hook Form und Zod-Validierung
  - Datei: `client/src/lib/__tests__/test-form-utils.tsx`

## Mock-Strategie

### React Components
- **Externe Libraries**: Wir mocken externe Libraries wie jsPDF, html2canvas, etc.
- **Context-Provider**: Wir mocken Context-Provider wie den Auth-Provider
- **Browser-APIs**: Wir mocken Browser-APIs wie localStorage, matchMedia, usw.

### Maps-API
Für Google Maps und Leaflet haben wir detaillierte Mock-Implementierungen erstellt:
- Mock-Klassen für `Map`, `Marker`, `LatLng`, `DirectionsService`, etc.
- Vollständige Event-Simulation für Karteninteraktionen

### Backend-Tests
- **Datenbank**: Wir mocken die SQL-Funktionen, um Datenbankanfragen zu simulieren
- **Authentifizierung**: Wir mocken Authentifizierungsmechanismen für API-Tests

## Best Practices

1. **Isolierte Tests**: Jeder Test sollte in Isolation laufen und keine Abhängigkeiten zu anderen Tests haben.
2. **User-Centric Testing**: Tests sollten das Verhalten simulieren, wie ein Benutzer mit der Anwendung interagieren würde.
3. **Keine Implementierungsdetails testen**: Tests sollten Verhalten testen, nicht Implementierungsdetails.
4. **Präzise Assertions**: Jeder Test sollte genau definieren, was getestet wird, und klare Assertions haben.
5. **Sinnvolle Beschreibungen**: Test-Beschreibungen sollten klar das erwartete Verhalten beschreiben.

## Fehlerbehandlung in Tests

Wenn Tests fehlschlagen, sollten folgende Schritte zur Fehlersuche durchgeführt werden:

1. **Test in Isolation ausführen**: Den fehlgeschlagenen Test einzeln ausführen
2. **Jest in Verbose-Modus starten**: `npx jest --verbose` für detailliertere Ausgabe
3. **Mocks überprüfen**: Sicherstellen, dass alle benötigten Mocks korrekt eingerichtet sind
4. **Umgebungsvariablen prüfen**: Ggf. benötigte Umgebungsvariablen für den Test setzen

## Zukünftige Erweiterungen

- **Snapshot-Tests**: Für UI-Komponenten
- **E2E-Tests**: Mit Cypress oder Playwright
- **Leistungstests**: Für kritische Anwendungsteile
- **CI-Integration**: Automatische Testausführung in der CI-Pipeline

## Test-Coverage erhöhen

Folgende Bereiche sollten in Zukunft mit Tests abgedeckt werden:

1. **Weitere UI-Komponenten**: Buttons, Formulare, Modal-Fenster, etc.
2. **Kernfunktionalitäten**: Benutzerauthentifizierung, Datenspeicherung, etc.
3. **Error Boundaries**: Tests für die Fehlerbehandlungsmechanismen
4. **Hooks**: Tests für Custom React Hooks

## Ressourcen

- [Jest-Dokumentation](https://jestjs.io/docs/getting-started)
- [Testing Library-Dokumentation](https://testing-library.com/docs/)
- [React Hook Form - Testing](https://react-hook-form.com/advanced-usage#TestingForm)