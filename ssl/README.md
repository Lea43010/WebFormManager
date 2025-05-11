# SSL-Zertifikate für Bau-Structura

In diesem Verzeichnis müssen folgende Zertifikatsdateien abgelegt werden:

1. `certificate.crt` - Das Haupt-SSL-Zertifikat für bau-structura.de
2. `private.key` - Der private Schlüssel für das Zertifikat
3. `ca_bundle.crt` - Optionales CA-Bundle (falls vorhanden)

Diese Dateien müssen direkt von Strato exportiert und hier abgelegt werden.

## Anleitung zum Exportieren der Zertifikate von Strato

1. Melden Sie sich in Ihrem Strato-Kundenbereich an
2. Navigieren Sie zu Ihren SSL-Zertifikaten
3. Wählen Sie das Zertifikat für bau-structura.de
4. Exportieren Sie die Zertifikatsdateien im PEM-Format
5. Benennen Sie die Dateien wie oben angegeben und speichern Sie sie in diesem Verzeichnis

## Hinweis zur Sicherheit

Diese Zertifikatsdateien sind vertraulich. Stellen Sie sicher, dass nur autorisierte Personen Zugriff auf dieses Verzeichnis haben.