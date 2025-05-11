# SSL-Zertifikate für Bau-Structura

Dieses Verzeichnis ist für die Strato SSL-Zertifikate bestimmt, die für die sichere HTTPS-Verbindung der Bau-Structura-Anwendung benötigt werden.

## Erforderliche Dateien

Für eine erfolgreiche SSL-Konfiguration müssen folgende Dateien in diesem Verzeichnis platziert werden:

1. **certificate.crt**: Das Strato-SSL-Zertifikat
2. **private.key**: Der private Schlüssel
3. **ca_bundle.crt**: Optional - Das CA-Bundle (falls vorhanden)

## Anweisungen

### 1. SSL-Zertifikate von Strato erhalten:

- Loggen Sie sich in Ihr Strato-Konto ein
- Navigieren Sie zum SSL-Bereich
- Laden Sie die benötigten Zertifikate und Schlüssel herunter

### 2. Zertifikate platzieren:

Platzieren Sie die Zertifikatsdateien in diesem Verzeichnis (`/ssl/`). Achten Sie darauf, die Dateien genau mit den oben angegebenen Namen zu speichern.

### 3. Berechtigungen prüfen:

Stellen Sie sicher, dass die Dateien die richtigen Berechtigungen haben:
- Die Zertifikatsdateien (`.crt`) sollten für alle lesbar sein
- Der private Schlüssel (`.key`) sollte NUR für den Server-Prozess lesbar sein

### 4. Anwendung mit SSL starten:

Verwenden Sie das spezielle SSL-Start-Skript:

```
node start-ssl-server.js
```

## Überprüfung der Installation

Sie können die SSL-Konfiguration testen mit:

```
node test-ssl.js
```

## Sicherheitshinweise

- Teilen Sie **niemals** den privaten Schlüssel
- Fügen Sie die Zertifikatsdateien **nicht** zur Versionskontrolle hinzu
- Erstellen Sie regelmäßige Backups der Zertifikate an einem sicheren Ort

## Fehlerbehebung

Bei Problemen mit der SSL-Konfiguration:

1. Prüfen Sie, ob alle Dateien vorhanden sind und die korrekten Namen haben
2. Stellen Sie sicher, dass die Zertifikate vom richtigen Aussteller und für die richtige Domain sind
3. Überprüfen Sie das Ablaufdatum der Zertifikate
4. Prüfen Sie die Server-Logs auf spezifische SSL-Fehler

## Support

Bei Fragen zur SSL-Konfiguration wenden Sie sich an den technischen Support oder den Systemadministrator.