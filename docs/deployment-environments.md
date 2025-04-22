# Deployment-Umgebungen für Bau-Structura App

Dieses Dokument beschreibt die Einrichtung und Verwaltung verschiedener Deployment-Umgebungen (Development, Staging, Production) für die Bau-Structura App.

## Übersicht

Die Bau-Structura App unterstützt drei verschiedene Umgebungen:

1. **Development** (Entwicklung): Lokale Entwicklungsumgebung für Entwickler
2. **Staging** (Testumgebung): Vorproduktive Umgebung für Tests und Abnahmen
3. **Production** (Produktion): Live-Umgebung für Endbenutzer

Jede Umgebung hat ihre eigene Konfiguration, Datenbank und kann unabhängig betrieben werden.

## Umgebungsspezifische Konfigurationen

Die Konfigurationsdateien befinden sich unter:

- `.env.development` - Konfiguration für die Entwicklungsumgebung
- `.env.staging` - Konfiguration für die Staging-Umgebung
- `.env.production` - Konfiguration für die Produktionsumgebung

Diese Dateien enthalten umgebungsspezifische Einstellungen wie Datenbank-URLs, API-Schlüssel und andere Konfigurationsparameter.

## Umgebung einrichten

Verwenden Sie das Einrichtungsskript, um eine neue Umgebung zu konfigurieren und zu initialisieren:

```bash
./scripts/run-env-setup.sh <environment>
```

Beispiel:
```bash
./scripts/run-env-setup.sh development
```

Das Skript führt folgende Aktionen aus:
- Überprüft die Umgebungskonfiguration
- Initialisiert die Datenbank-Schemas
- Führt Migrationen aus
- Lädt Seed-Daten (nur in Development und Staging)

## Umgebung klonen

Mit dem Klonierungsskript können Sie eine Umgebung in eine andere klonen (z.B. von Development nach Staging oder von Staging nach Production):

```bash
./scripts/run-env-clone.sh <source-environment> <target-environment>
```

Beispiele:
```bash
./scripts/run-env-clone.sh development staging
./scripts/run-env-clone.sh staging production
```

Das Skript führt folgende Aktionen aus:
- Erstellt einen Backup-Dump der Quelldatenbank
- Überschreibt die Zieldatenbank mit der Quelldatenbank
- Aktualisiert die Umgebungsvariablen unter Beibehaltung kritischer Parameter
- Passt umgebungsspezifische Einstellungen an

## Starten verschiedener Umgebungen

Um die verschiedenen Umgebungen zu starten, verwenden Sie die entsprechenden Startskripte:

```bash
# Entwicklungsumgebung starten
NODE_ENV=development npm run dev

# Staging-Umgebung starten
NODE_ENV=staging npm run dev

# Produktionsumgebung starten
NODE_ENV=production npm run start
```

## Umgebungsspezifische Anpassungen

Jede Umgebung kann spezifisch angepasst werden:

### Development-Umgebung
- Ausführliche Logs
- Erweiterte Fehlermeldungen
- Test-Daten werden automatisch geladen
- Günstigere/schnellere KI-Modelle
- Mock-Dienste für externe APIs

### Staging-Umgebung
- Ähnlich zur Produktionsumgebung, aber mit Testdaten
- Warnungen und Fehler werden geloggt
- Zugangsbeschränkungen für autorisierte Tester

### Produktionsumgebung
- Optimierte Leistung
- Minimale Logs (nur Warnungen und Fehler)
- Keine detaillierten Fehlermeldungen an Endbenutzer
- Volle Sicherheitsmaßnahmen aktiviert
- Produktions-API-Schlüssel

## Best Practices

- **Entwickeln Sie in Development**: Alle neuen Funktionen sollten zuerst in der Entwicklungsumgebung implementiert werden.
- **Testen Sie in Staging**: Staging sollte für Integrationstests und Benutzerakzeptanztests verwendet werden.
- **Klonen nach Production**: Klonen Sie die Umgebung erst nach Freigabe in die Produktionsumgebung.
- **Sichern vor dem Klonen**: Erstellen Sie immer ein Backup, bevor Sie eine Umgebung klonen.
- **Überschreiben kritischer Variablen vermeiden**: Bei Umgebungsklonen werden bestimmte kritische Variablen (wie NODE_ENV, DATABASE_URL) nicht überschrieben.

## Fehlersuche

Falls Probleme auftreten, prüfen Sie:

1. **Umgebungsvariablen**: Stellen Sie sicher, dass alle erforderlichen Umgebungsvariablen in der entsprechenden .env-Datei definiert sind.
2. **Datenbankverbindung**: Überprüfen Sie, ob die Datenbank-URL korrekt ist und die Datenbank erreichbar ist.
3. **Berechtigungen**: Stellen Sie sicher, dass die erforderlichen Berechtigungen für Datenbankvorgänge vorhanden sind.
4. **Logs**: Überprüfen Sie die Anwendungslogs auf Fehler oder Warnungen.

## Sicherheitshinweise

- **Produktionsumgebung**: Schützen Sie die Produktionsumgebung und deren Zugangsdaten besonders.
- **API-Schlüssel**: Verwenden Sie unterschiedliche API-Schlüssel für verschiedene Umgebungen.
- **Datenschutz**: In Staging und Development sollten keine echten personenbezogenen Daten verwendet werden.

---

Bei Fragen oder Problemen wenden Sie sich an das Entwicklungsteam.