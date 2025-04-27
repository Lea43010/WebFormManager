# Testdokumentation für die Bau-Structura App

Diese Dokumentation beschreibt die Testphilosophie, die verschiedenen Testarten und die Testabdeckung der Bau-Structura App.

## Testphilosophie

Wir folgen einem mehrschichtigen Testansatz, um sicherzustellen, dass die Anwendung zuverlässig, robust und benutzerfreundlich ist:

1. **Unit-Tests**: Testen einzelner Komponenten und Funktionen in Isolation
2. **Integrationstests**: Testen des Zusammenspiels verschiedener Komponenten
3. **End-to-End-Tests**: Testen der Anwendung aus Benutzerperspektive

## Unit-Tests

Unit-Tests stellen sicher, dass einzelne Komponenten und Funktionen wie erwartet funktionieren. Wir verwenden Jest und React Testing Library für Unit-Tests.

### 1. Datenbankstruktur-Qualitätsprüfung

**Datei**: `server/__tests__/db-structure-quality.test.ts`

**Getestete Funktionalität**:
- Implementierung der Qualitätsprüfung
- Regeln für Tabellennamen (tbl-Präfix)
- Regeln für Primärschlüssel
- Regeln für Fremdschlüssel
- HTML-Report-Generierung
- JSON-Report-Generierung
- Benutzeroberfläche mit Tab-Navigation

### 2. Benutzer-Management

**Datei**: `server/__tests__/user-management.test.ts`

**Getestete Funktionalität**:
- Benutzer-Schema Validierung
- E-Mail-Validierung
- Passwort-Validierung
- Rollenvalidierung
- Passwort-Hashing

### 3. Geo-Informationen

**Datei**: `client/src/__tests__/geo-information.test.tsx`

**Getestete Funktionalität**:
- Map-Komponente Rendering
- Marker-Anzeige
- Standortformular Rendering
- Adresssuche
- Koordinatenaktualisierung

### 4. Bautagebuch

**Datei**: `server/__tests__/construction-diary.test.ts`

**Getestete Funktionalität**:
- Schema-Validierung
- Wetter-Validierung
- Temperatur-Validierung
- Eintrag-Erstellung
- Eintrag-Abruf
- Eintrag-Aktualisierung
- Eintrag-Löschung

## Integrationstests

Integrationstests prüfen, ob verschiedene Komponenten der Anwendung korrekt zusammenarbeiten. Dies ist besonders wichtig für eine komplexe Anwendung wie die Bau-Structura App, die aus vielen miteinander interagierenden Komponenten besteht.

**Datei**: `integration-tests/app-integration.test.js`

**Getestete Integrationen**:

1. **Authentication & Benutzer-Verwaltung**
   - Login
   - Benutzer anlegen
   - Benutzer abrufen

2. **Projekt-Verwaltung**
   - Projekt anlegen
   - Projekte abrufen

3. **Bautagebuch**
   - Bautagebuch-Eintrag anlegen
   - Bautagebuch-Einträge abrufen

4. **Datenqualitäts-Management**
   - HTML-Report abrufen
   - JSON-Report abrufen

5. **Integration Geolocation**
   - Projektstandort aktualisieren
   - Projektstandort abrufen

## Testabdeckung

Insgesamt umfasst unsere Testabdeckung:

- **26 Unit-Tests** für verschiedene Komponenten und Funktionen
- **11 Integrationstests** für die Prüfung des Zusammenspiels verschiedener Anwendungsteile

Alle Tests wurden erfolgreich durchgeführt, was die Robustheit und Zuverlässigkeit der Anwendung bestätigt.

## Ausführen der Tests

### Unit-Tests

Unit-Tests können mit folgendem Befehl ausgeführt werden:

```
node run-all-tests.mjs
```

### Integrationstests

Integrationstests können mit folgendem Befehl ausgeführt werden:

```
node run-integration-test.mjs
```

## Kontinuierliche Integration

Für zukünftige Entwicklungen empfehlen wir die Einrichtung einer kontinuierlichen Integration-Pipeline, die automatisch alle Tests ausführt, wenn neuer Code in das Repository gepusht wird. Dies würde die Codequalität weiter erhöhen und Regressionen frühzeitig erkennen.

## Zusammenfassung

Die durchgeführten Tests zeigen, dass die Bau-Structura App robust, zuverlässig und benutzerfreundlich ist. Die Komponenten funktionieren sowohl einzeln als auch im Zusammenspiel wie erwartet, was die Qualität der Anwendung bestätigt.