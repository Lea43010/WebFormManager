# Benutzerhandbuch Bau - Structura App

## Inhaltsverzeichnis

1. [Einführung](#einführung)
2. [Anmeldung und Registrierung](#anmeldung-und-registrierung)
3. [Hauptfunktionen](#hauptfunktionen)
   - [Dashboard](#dashboard)
   - [Projekte verwalten](#projekte-verwalten)
   - [Bautagebuch](#bautagebuch)
   - [Meilensteine](#meilensteine)
   - [Oberflächenanalyse](#oberflächenanalyse)
   - [Bedarfs- und Kapazitätsplanung](#bedarfs--und-kapazitätsplanung)
   - [Kostenkalkulation](#kostenkalkulation)
   - [Dokumenten-Management](#dokumenten-management)
   - [Straßenbau-Module](#straßenbau-module)
   - [Tiefbau-Erweiterung](#tiefbau-erweiterung)
   - [Bodenanalyse](#bodenanalyse)
4. [Administration](#administration)
   - [Benutzerverwaltung](#benutzerverwaltung)
   - [System-Logs](#system-logs)
   - [Testphasen-Management](#testphasen-management)
   - [Datensicherung](#datensicherung)
   - [Datenqualität](#datenqualität)
5. [Abonnement und Bezahlung](#abonnement-und-bezahlung)
6. [Häufig gestellte Fragen (FAQ)](#häufig-gestellte-fragen-faq)
7. [Support und Kontakt](#support-und-kontakt)

## Einführung

Die Bau - Structura App ist eine umfassende Lösung für die Verwaltung von Baustellen und Straßenbauprojekten. Sie bietet moderne Werkzeuge für Projektmanagement, Dokumentation, Analyse und Planung und ist speziell auf die Bedürfnisse der Baubranche zugeschnitten.

### Systemanforderungen

- **Browser**: Moderne Browser wie Chrome, Firefox, Edge oder Safari
- **Endgeräte**: Unterstützung für Desktop-PCs, Tablets und Smartphones
- **Internet**: Stabile Internetverbindung

## Anmeldung und Registrierung

### Erste Anmeldung

1. Öffnen Sie die Anwendung in Ihrem Browser
2. Geben Sie Ihre Zugangsdaten (Benutzername und Passwort) ein
3. Bei erstmaliger Anmeldung werden Sie aufgefordert, Ihr Passwort zu ändern
4. Akzeptieren Sie die Datenschutzerklärung (DSGVO-Einwilligung)

### Passwort vergessen

1. Klicken Sie auf der Login-Seite auf "Passwort vergessen"
2. Geben Sie Ihren Benutzernamen oder Ihre E-Mail-Adresse ein
3. Sie erhalten einen Wiederherstellungscode per SMS
4. Geben Sie den Code ein und setzen Sie ein neues Passwort

## Hauptfunktionen

### Dashboard

Das Dashboard bietet eine Übersicht über:

- Aktuelle Projekte mit Status
- Anstehende Termine und Meilensteine
- Neueste Bautagebuch-Einträge
- Schnellzugriff auf häufig verwendete Funktionen

### Projekte verwalten

#### Neues Projekt anlegen

1. Klicken Sie auf "Neues Projekt" im Dashboard
2. Füllen Sie die Pflichtfelder aus:
   - Projektname
   - Projektart (Straßenbau, Tiefbau, etc.)
   - Startdatum und geplantes Enddatum
   - Kunde (auswählen oder neu anlegen)
3. Zusätzliche Informationen (optional):
   - Projektstandort mit Geodaten
   - Projektbeschreibung
   - Fotos oder Dokumente
4. Klicken Sie auf "Speichern"

#### Projekt bearbeiten

1. Öffnen Sie das Projekt aus der Projektliste
2. Wählen Sie "Bearbeiten"
3. Aktualisieren Sie die gewünschten Informationen
4. Speichern Sie die Änderungen

#### Projektdetails

Auf der Projektdetailseite finden Sie:

- Allgemeine Projektinformationen
- Zugehörige Kunden und Unternehmen
- Verknüpfte Dokumente
- Bautagebuch-Einträge
- Meilensteine und Termine
- Oberflächenanalysen

### Bautagebuch

Das digitale Bautagebuch ist das zentrale Dokumentationstool der App. Hier werden alle Aktivitäten auf der Baustelle dokumentiert.

#### Neuen Eintrag erstellen

1. Wählen Sie das entsprechende Projekt
2. Gehen Sie zum Reiter "Bautagebuch"
3. Klicken Sie auf "Neuer Eintrag"
4. Füllen Sie die Felder aus:
   - Datum
   - Mitarbeiter
   - Aktivität/Tätigkeit
   - Arbeitsbeginn und -ende
   - Arbeitsstunden (wird automatisch berechnet)
   - Materialverwendung (optional)
   - Bemerkungen (optional)
   - Vorfalltyp (bei besonderen Ereignissen)
5. Speichern Sie den Eintrag

#### Einträge anzeigen und filtern

- Alle Einträge werden chronologisch angezeigt
- Nutzen Sie die Filterfunktion nach Datum, Mitarbeiter oder Aktivität
- Exportieren Sie Einträge als PDF oder Excel für Berichterstellung

### Meilensteine

Die Meilenstein-Funktion hilft bei der Terminplanung und Projektverfolgung.

#### Meilensteine erstellen

1. Gehen Sie zum Reiter "Meilensteine" im Projekt
2. Klicken Sie auf "Neuer Meilenstein"
3. Definieren Sie:
   - Name des Meilensteins
   - Start-Kalenderwoche
   - End-Kalenderwoche
   - Jahr
   - Farbe (für visuelle Unterscheidung)
   - Typ
   - EWB/FÖB-Zuordnung
   - Bauphase
   - Sollmenge
4. Speichern Sie den Meilenstein

#### Meilensteindetails bearbeiten

- Klicken Sie auf einen Meilenstein, um Details zu bearbeiten
- Fügen Sie wöchentliche Detailinformationen hinzu
- Aktualisieren Sie den Status

### Oberflächenanalyse

Die KI-gestützte Oberflächenanalyse ermöglicht die Bewertung von Asphalt- und Bodenflächen.

#### Neue Analyse erstellen

1. Gehen Sie zum Reiter "Oberflächenanalyse"
2. Klicken Sie auf "Neue Analyse"
3. Wählen Sie den Analysetyp (Asphalt oder Boden)
4. Erfassen Sie:
   - Standort (manuell oder über GPS)
   - Foto (über Kamera oder Upload)
5. Die KI analysiert das Bild und bestimmt:
   - Bei Asphalt: Belastungsklasse und Asphalttyp
   - Bei Boden: Bodenklasse und Tragfähigkeitsklasse
6. Überprüfen Sie die Ergebnisse und speichern Sie die Analyse

#### Analyseergebnisse

Die Ergebnisse zeigen:
- Visuelle Darstellung mit Markierungen
- Technische Details zur Oberfläche
- Empfehlungen für die Bauausführung

### Bedarfs- und Kapazitätsplanung

Diese Funktion unterstützt die Ressourcenplanung für Projekte.

#### Ressourcenplanung erstellen

1. Wählen Sie das Projekt aus
2. Gehen Sie zum Reiter "Bedarfs- und Kapazitätsplanung"
3. Klicken Sie auf "Neuer Eintrag"
4. Definieren Sie:
   - Ressourcenname
   - Benötigte Anzahl
   - Kalenderwoche
   - Jahr
5. Speichern Sie den Eintrag

#### Ressourcenübersicht

- Sehen Sie die Ressourcenauslastung über Wochen hinweg
- Identifizieren Sie Engpässe
- Planen Sie vorausschauend

### Kostenkalkulation

Die Kostenkalkulation ermöglicht eine detaillierte Berechnung der Projektkosten im Tiefbau.

#### Berechnung durchführen

1. Navigieren Sie zur "Kostenkalkulation"-Seite
2. Wählen Sie eine Strecke aus der Liste der verfügbaren Routen
3. Wählen Sie die Bodenart für das Projekt
4. Wählen Sie die benötigte Maschine
5. Passen Sie die Parameter an:
   - Breite (in Metern)
   - Tiefe (in Metern)
   - Arbeitsstunden pro Tag
   - Personalkosten pro Stunde
   - Anzahl des Personals
   - Zusatzkosten-Prozentsatz
6. Klicken Sie auf "Kalkulation berechnen"

#### Ergebnisse der Kostenkalkulation

Die Ergebnisse zeigen detaillierte Berechnungen für:
- Materialkosten basierend auf Fläche und Bodenart
- Maschinenkosten basierend auf Maschinenwahl und Dauer
- Personalkosten basierend auf Arbeitsstunden und Personaleinsatz
- Kraftstoffkosten basierend auf Maschinenverbrauch
- Zusatzkosten als prozentualer Aufschlag
- Gesamtkosten und Kosten pro Meter

#### PDF-Export der Kostenkalkulation

1. Führen Sie eine Kalkulation durch
2. Klicken Sie auf den Button "Als PDF exportieren"
3. Das PDF wird automatisch mit folgenden Informationen erstellt:
   - Projektname und aktuelle Datum
   - Streckendetails (Länge, Breite, Tiefe)
   - Ausgewählte Bodenart und Maschine
   - Detaillierte Kostenaufstellung in tabellarischer Form
   - Gesamtkosten und Kosten pro Meter
4. Das PDF wird im Browser zum Download angeboten
5. Der Dateiname enthält automatisch den Projektnamen und das aktuelle Datum

### Dokumenten-Management

Verwalten Sie alle projektbezogenen Dokumente zentral.

#### Dokument hochladen

1. Gehen Sie zum Reiter "Dokumente" im Projekt
2. Klicken Sie auf "Dokument hochladen"
3. Wählen Sie eine Datei aus
4. Fügen Sie Metadaten hinzu:
   - Beschreibung
   - Kategorie (Pläne, Verträge, Fotos, etc.)
   - Tags für bessere Auffindbarkeit
5. Laden Sie die Datei hoch

#### Kamera-Integration

1. Klicken Sie auf den "Kamera"-Button in der Dokumentenansicht
2. Erlauben Sie den Kamerazugriff, wenn Sie dazu aufgefordert werden
3. Machen Sie ein Foto oder wählen Sie ein vorhandenes Bild aus Ihrer Galerie
4. Das aufgenommene Bild wird automatisch in die App hochgeladen
5. Fügen Sie Metadaten wie bei regulären Dokumenten hinzu

#### KI-basierte Bildklassifizierung

Die App verwendet KI zur automatischen Analyse und Kategorisierung von Bildern:

1. Laden Sie ein Foto hoch (über Hochladen oder Kamera)
2. Die KI analysiert das Bild automatisch und schlägt vor:
   - Geeignete Kategorie basierend auf dem Bildinhalt
   - Schlagworte für eine bessere Auffindbarkeit
   - Potenzielle Verbindungen zu bestehenden Projekten
3. Sie können die KI-Vorschläge akzeptieren oder anpassen

#### Dokumente organisieren

- Nutzen Sie die KI-gestützte Kategorisierungsvorschläge
- Suchen Sie nach Dokumenten mit Volltextsuche
- Filtern Sie nach Kategorien und Tags
- Nutzen Sie die verbesserte Suchfunktion mit Vorschau der Suchergebnisse

## Administration

### Benutzerverwaltung

#### Benutzer anlegen (nur für Administratoren)

1. Gehen Sie zur "Administration"
2. Wählen Sie "Benutzerverwaltung"
3. Klicken Sie auf "Neuer Benutzer"
4. Füllen Sie die Benutzerinformationen aus:
   - Benutzername
   - Name
   - E-Mail
   - Rolle (Benutzer, Manager, Administrator)
5. Der Benutzer erhält eine E-Mail mit Zugangsdaten

#### Benutzer bearbeiten

- Ändern Sie Benutzerinformationen
- Setzen Sie Passwörter zurück
- Deaktivieren Sie Benutzerkonten bei Bedarf

### System-Logs

Im Bereich System-Logs können Administratoren die Aktivitäten in der Anwendung überwachen:

- **Login-Logs**: Anmeldeversuche und -erfolge
- **Aktivitäts-Logs**: Wichtige Systemaktionen wie Änderungen an Projekten oder Benutzern

### Testphasen-Management

Administratoren können Testphasen für neue Benutzer verwalten:

- Übersicht über aktuelle Testphasen
- Manuelles Senden von Benachrichtigungen
- Umstellung von Testphasen auf aktive Abonnements

### Datensicherung

Der Datensicherungsbereich ermöglicht:

- Einsicht in automatische tägliche Backups
- Manuelles Erstellen von Backups
- Wiederherstellung aus Backups bei Bedarf

### Datenqualität

Die Datenqualitätsprüfung zeigt:

- Strukturprüfung der Datenbank
- Konsistenzprüfungen
- Verbesserungsvorschläge

Die verbesserte Datenqualitätsansicht bietet jetzt:
- Echtzeit-Überwachung der Datenintegrität
- Grafische Darstellung von Datenqualitätsmetriken
- Automatische Benachrichtigungen bei kritischen Qualitätsproblemen
- Exportierbaren Datenqualitätsbericht im PDF-Format

## Abonnement und Bezahlung

Die Bau-Structura App bietet drei verschiedene Abonnement-Modelle, um den unterschiedlichen Anforderungen gerecht zu werden.

### Verfügbare Abonnement-Modelle

1. **Basic (24€/Monat)**
   - Grundlegende Projektverwaltung
   - Bautagebuch
   - Dokumentenmanagement (begrenzt)

2. **Professional (49€/Monat)**
   - Alle Funktionen des Basic-Pakets
   - Unbegrenzte Dokumentenverwaltung
   - Meilensteinverwaltung
   - Kapazitätsplanung
   - Kostenkalkulation mit PDF-Export

3. **Enterprise (69€/Monat)**
   - Alle Funktionen des Professional-Pakets
   - KI-basierte Oberflächenanalyse
   - Tiefbau-Erweiterung
   - Erweiterte Datenqualitätsfunktionen
   - Multi-User-Management
   - Prioritäts-Support

### Abonnement verwalten

1. Gehen Sie zum Menüpunkt "Abonnement" im Benutzermenü
2. Hier können Sie:
   - Ihr aktuelles Abonnement einsehen
   - Auf ein höheres Paket upgraden
   - Zahlungsmethoden verwalten
   - Rechnungen einsehen und herunterladen

### Zahlungsmethoden

Die folgenden Zahlungsmethoden werden unterstützt:
- Kreditkarte (Visa, Mastercard)
- SEPA-Lastschrift
- PayPal
- Rechnung (nur für Enterprise-Kunden)

### Testphase

Neue Benutzer erhalten automatisch eine 14-tägige Testphase mit Zugriff auf alle Funktionen des Professional-Pakets. Kurz vor Ablauf der Testphase werden Sie benachrichtigt, um ein Abonnement auszuwählen.

## Straßenbau-Module

Das Straßenbau-Modul bietet spezialisierte Funktionen für Straßenbauprojekte.

### Belastungsklassen nach RStO 12

Der Bereich enthält:
- Tabellen mit Belastungsklassen (Bk0.3 bis Bk100)
- Zuordnung von Belastungsklassen zu Bauklassen
- Empfohlene Schichtstärken für jede Belastungsklasse

### Streckenmessung

1. Wählen Sie auf der Karte den Messungsmodus aus
2. Setzen Sie Messpunkte auf der Karte, um eine Strecke zu definieren
3. Die Anwendung berechnet automatisch:
   - Gesamtlänge der Strecke
   - Anzahl der Messpunkte
   - Länge der einzelnen Abschnitte

### Flächenmessung

1. Aktivieren Sie den Flächenmessmodus
2. Definieren Sie die zu messende Fläche durch Setzen von Punkten auf der Karte
3. Die Anwendung berechnet automatisch:
   - Gesamtfläche in Quadratmetern
   - Umfang der markierten Fläche

## Tiefbau-Erweiterung

Die Tiefbau-Erweiterung bietet spezialisierte Tools für Tiefbauprojekte.

### Maschinenauswahl

1. Navigieren Sie zur "Maschinenauswahl"-Seite
2. Hier finden Sie eine Übersicht aller verfügbaren Baumaschinen
3. Filtern Sie nach:
   - Maschinentyp (Bagger, Walzen, Fräsen, etc.)
   - Leistungsparametern
   - Verfügbarkeit
4. Wählen Sie eine Maschine für detaillierte Informationen aus

### Bodenanalyse

Die Bodenanalyse hilft bei der Klassifizierung und Bewertung von Bodenmaterialien.

1. Navigieren Sie zur "Bodenanalyse"-Seite
2. Sie können Bodenarten:
   - Aus einer Datenbank auswählen
   - Durch Bodenproben fotografieren und automatisch klassifizieren lassen
   - Manuell erfassen und kategorisieren
3. Für jede Bodenart werden technische Parameter angezeigt:
   - Tragfähigkeit
   - Dichte
   - Material-Kosten
   - Verarbeitungsempfehlungen

## Häufig gestellte Fragen (FAQ)

### Allgemein

**F: Wie kann ich mein Passwort ändern?**  
A: Klicken Sie auf Ihren Benutzernamen in der oberen rechten Ecke und wählen Sie "Profil". Dort können Sie Ihr Passwort ändern.

**F: Ist die App auf mobilen Geräten nutzbar?**  
A: Ja, die Bau - Structura App ist responsiv gestaltet und funktioniert auf Smartphones und Tablets.

### Technische Fragen

**F: Meine Seite lädt nicht richtig. Was kann ich tun?**  
A: Versuchen Sie, Ihren Browser-Cache zu leeren und die Seite neu zu laden. Falls das Problem weiterhin besteht, kontaktieren Sie den Support.

**F: Kann ich Daten aus der App exportieren?**  
A: Ja, viele Bereiche bieten Export-Funktionen für PDF, Excel oder CSV. Die neue PDF-Export-Funktion für Kostenkalkulationen steht im Professional- und Enterprise-Abonnement zur Verfügung.

**F: Wie kann ich die Kostenkalkulation als PDF exportieren?**  
A: Nach Durchführung einer Kalkulation klicken Sie einfach auf den Button "Als PDF exportieren" am unteren Rand der Ergebnisseite. Die Datei wird automatisch mit Projektname und Datum generiert und zum Download angeboten.

**F: Welche Neuerungen wurden in der Dokumentenverwaltung eingeführt?**  
A: Die Dokumentenverwaltung wurde um eine Kamera-Integration und KI-basierte Bildklassifizierung erweitert. Sie können jetzt Fotos direkt in der App aufnehmen und automatisch kategorisieren lassen.

**F: Was beinhaltet die neue Tiefbau-Erweiterung?**  
A: Die Tiefbau-Erweiterung umfasst spezielle Module für Bodenanalyse, Maschinenauswahl und detaillierte RStO 12-Belastungsklassen, die für Tiefbauprojekte optimiert sind.

**F: Wie funktioniert die verbesserte Datenqualitätsansicht?**  
A: Die verbesserte Datenqualitätsansicht bietet Echtzeit-Überwachung, grafische Darstellungen und exportierbare Berichte, um die Integrität Ihrer Projektdaten zu gewährleisten.

## Support und Kontakt

Bei Fragen oder Problemen stehen wir Ihnen gerne zur Verfügung:

- **E-Mail**: info@example.com (ersetzen Sie diese Adresse mit Ihrer tatsächlichen Kontakt-E-Mail)
- **Telefon**: +49 (0) 15233531845
- **Geschäftszeiten**: Mo-Fr 8:00 - 17:00 Uhr

Für Feature-Anfragen oder Feedback nutzen Sie bitte die Feedback-Funktion in der App oder kontaktieren Sie direkt unseren Support.

---

**Letzte Aktualisierung:** 10.05.2025