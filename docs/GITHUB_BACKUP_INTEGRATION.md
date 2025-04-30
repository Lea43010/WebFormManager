# GitHub-Backup-Integration für Bau-Structura

## Überblick

Die GitHub-Backup-Integration erweitert das bestehende Backup-System von Bau-Structura, um eine zusätzliche Sicherheitsebene zu bieten. Diese Integration ermöglicht:

- Automatisches Hochladen von Datenbank-Backups zu einem privaten GitHub-Repository
- Zugriff auf Backups auch bei Serverausfall
- Verwaltung und Wiederherstellung von Backups über die Admin-Benutzeroberfläche
- Verschlüsselungsoption für besonders sensible Daten (optional)

Die Integration verwendet den GitHub-Token des Benutzers, um Backups in einem privaten Repository zu speichern und bei Bedarf wiederherzustellen.

## Technische Details

### Komponenten

Die Integration besteht aus mehreren Komponenten:

1. **GitHub-Backup-Modul** (`server/github-backup.ts`): 
   - Stellt Funktionen für den Upload und Download von Backups bereit
   - Verwaltet das GitHub-Repository und seinen Inhalt
   - Konfiguriert die GitHub-Integration basierend auf Umgebungsvariablen

2. **Backup-Cron-Job** (`server/cron-jobs/backup.ts`):
   - Führt regelmäßige Backups der Datenbank durch
   - Lädt Backups automatisch zu GitHub hoch, wenn konfiguriert
   - Bereinigt alte Backups basierend auf Konfigurationseinstellungen

3. **GitHub-Backup-API** (`server/github-backup-routes.ts`):
   - Stellt REST-Endpunkte für die Verwaltung von GitHub-Backups bereit
   - Ermöglicht das Abrufen, Herunterladen und Hochladen von Backups
   - Bietet Konfigurationsmöglichkeiten für Administratoren

4. **Initialisierungslogik** (`server/backup.ts`):
   - Initialisiert das Backup-System einschließlich GitHub-Integration
   - Registriert die API-Routen für Backups und GitHub-Backups

### Konfiguration

Die GitHub-Backup-Integration wird über die folgenden Umgebungsvariablen konfiguriert:

| Variable | Beschreibung | Standardwert |
|----------|-------------|--------------|
| `GITHUB_TOKEN` | Der GitHub Personal Access Token mit Repo-Berechtigungen | - |
| `GITHUB_REPO_OWNER` | Der Besitzer des GitHub-Repositories | Automatisch aus dem Token abgeleitet |
| `GITHUB_REPO_NAME` | Der Name des GitHub-Repositories | `bau-structura-backups` |
| `GITHUB_REPO_BRANCH` | Der Branch, in dem Backups gespeichert werden | `main` |
| `GITHUB_BACKUP_PATH` | Der Pfad im Repository für Backups | `backups` |
| `GITHUB_BACKUP_ENABLED` | Aktiviert/deaktiviert die GitHub-Integration | `true` |
| `GITHUB_ENCRYPT_BACKUPS` | Aktiviert/deaktiviert die Verschlüsselung | `false` |
| `GITHUB_BACKUP_ENCRYPTION_KEY` | Schlüssel für die Backup-Verschlüsselung | - |

## API-Endpunkte

Die folgenden API-Endpunkte stehen für die Verwaltung von GitHub-Backups zur Verfügung:

| Endpunkt | Methode | Beschreibung | Erforderliche Berechtigung |
|----------|---------|-------------|----------------------------|
| `/api/admin/github-backups/config` | GET | Aktuelle GitHub-Backup-Konfiguration abrufen | Administrator |
| `/api/admin/github-backups/config` | POST | GitHub-Backup-Konfiguration aktualisieren | Administrator |
| `/api/admin/github-backups` | GET | Liste aller verfügbaren GitHub-Backups abrufen | Administrator |
| `/api/admin/github-backups/download/:path` | GET | Ein Backup von GitHub herunterladen | Administrator |
| `/api/admin/github-backups/upload` | POST | Ein lokales Backup zu GitHub hochladen | Administrator |

## Aufbewahrungsrichtlinie

Die Aufbewahrungsrichtlinie für Backups wird durch folgende Konfigurationen gesteuert:

- `MAX_BACKUPS`: Maximale Anzahl von Backups, die lokal aufbewahrt werden (Standard: 10)
- `BACKUP_RETENTION_DAYS`: Anzahl der Tage, für die Backups aufbewahrt werden (Standard: 30)

Das System löscht automatisch alte Backups, die eines der beiden Kriterien überschreiten, behält aber die Backups in GitHub entsprechend der verfügbaren Speicherkapazität des Repositories.

## Fehlerbehebung

### Häufige Probleme

1. **Backup-Upload schlägt fehl**:
   - Überprüfen Sie den GitHub-Token auf korrekte Berechtigungen (Repo-Zugriff)
   - Stellen Sie sicher, dass das Repository existiert und der Benutzer Schreibzugriff hat
   - Überprüfen Sie die Dateigröße (GitHub hat Größenbeschränkungen für einzelne Dateien)

2. **Repository kann nicht erstellt werden**:
   - Stellen Sie sicher, dass der GitHub-Token die Berechtigung zum Erstellen von Repositories hat
   - Überprüfen Sie, ob bereits ein Repository mit demselben Namen existiert

3. **Backups werden nicht automatisch hochgeladen**:
   - Überprüfen Sie, ob `GITHUB_BACKUP_ENABLED` auf `true` gesetzt ist
   - Stellen Sie sicher, dass der Cron-Job für Backups konfiguriert und aktiv ist

### Logs prüfen

Bei Problemen mit der GitHub-Integration sollten Sie die Protokolle überprüfen:

```javascript
// In der Serveranwendung:
logger.createLogger('github-backup').error('Fehler beim Hochladen des Backups zu GitHub:', error);
```

## Sicherheitshinweise

- Der GitHub-Token sollte immer sicher aufbewahrt und niemals in Protokollen oder Antworten offengelegt werden.
- Verwenden Sie ein privates Repository für Backups, um den Zugriff zu beschränken.
- Aktivieren Sie die Verschlüsselung für besonders sensible Daten, wenn erforderlich.
- Stellen Sie sicher, dass nur Administratoren Zugriff auf die Backup-Verwaltung haben.

## Zukünftige Erweiterungen

- Implementierung einer erweiterten Verschlüsselungsfunktion
- Automatische Prüfung der Backup-Integrität
- Zeitplan-basierte GitHub-Backup-Konfiguration
- Unterstützung für differenzielle Backups zur Reduzierung des Speicherbedarfs