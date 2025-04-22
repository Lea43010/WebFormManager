# E-Mail-Simulation für Bau-Structura

## Überblick
In diesem Dokument werden die E-Mail-Simulationen für die Bau-Structura App beschrieben, die verwendet werden, wenn kein gültiger Brevo API-Schlüssel vorhanden ist oder wenn Sie in Entwicklungsumgebung arbeiten.

## E-Mail-Konfiguration

Die Bau-Structura App verwendet folgende E-Mail-Konfiguration:

- **Absender**: Bau-Structura <info@bau-structura.de>
- **Domain**: bau-structura.de (authentifiziert bei Brevo)
- **E-Mail-Service**: Brevo (ehemals Sendinblue)

## Typische E-Mails

### 1. Willkommens-E-Mail bei Benutzer-Registrierung

**Betreff**: Willkommen bei Bau-Structura App - Ihre Zugangsdaten

**Inhalt**:
- Begrüßung und Willkommen
- Zugangsdaten (Benutzername, temporäres Passwort)
- Login-URL (https://bau-structura.de)
- Wichtige Funktionen im Überblick
- Hilfe und Support

### 2. Passwort-Zurücksetzen

**Betreff**: Passwort zurücksetzen - Bau-Structura App

**Inhalt**:
- Verifizierungscode (6-stellig)
- Direkter Link zum Zurücksetzen
- Gültigkeitsdauer (30 Minuten)
- Sicherheitshinweis

### 3. Verifizierungscode

**Betreff**: Ihr Anmeldecode - Bau-Structura App

**Inhalt**:
- 6-stelliger Verifizierungscode
- Gültigkeitsdauer (30 Minuten)
- Hinweis bei nicht beantragter Anmeldung

## Produktionsumgebung

In der Produktionsumgebung werden alle E-Mails über den Brevo-API-Dienst mit Ihrer authentifizierten Domain versendet. Dies gewährleistet:

1. Hohe Zustellungsraten
2. Vermeidung von Spam-Filtern
3. Professionelles Erscheinungsbild
4. Tracking-Möglichkeiten

## Einrichtung für Produktionsumgebung

Um E-Mails in der Produktionsumgebung zu versenden:

1. Stellen Sie sicher, dass die Domain "bau-structura.de" bei Brevo authentifiziert ist (✓ ERLEDIGT)
2. Setzen Sie einen gültigen BREVO_API_KEY in den Umgebungsvariablen
3. Setzen Sie NODE_ENV=production für die Produktionsumgebung

## Fehlerbehebung

Häufige Probleme und Lösungen:

- **Ungültiger API-Schlüssel**: Generieren Sie einen neuen API-Schlüssel im Brevo-Dashboard
- **Domain nicht verifiziert**: Stellen Sie sicher, dass Ihre Domain verifiziert ist
- **E-Mail-Limits überschritten**: Prüfen Sie Ihr Brevo-Kontingent und erweitern Sie es bei Bedarf