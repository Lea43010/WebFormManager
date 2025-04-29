# Backup vom 29.04.2025

## Geänderte Dateien

### server/routes.ts
- POST-Route für `/api/companies` mit `requireManagerOrAbove`-Middleware versehen
- POST-Route für `/api/customers` mit `requireManagerOrAbove`-Middleware versehen
- POST-Route für `/api/projects` mit `requireManagerOrAbove`-Middleware versehen
- Authentifizierungslogik vereinfacht, da die Middleware bereits die Authentifizierung prüft
- Logger-Ausgaben hinzugefügt, um den Benutzer und die Rolle bei Erstellungen zu protokollieren

### server/middleware/role-check.ts
- Keine Änderungen nötig, da die bestehende Middleware `requireManagerOrAbove` bereits korrekt implementiert war

## Beschreibung der Änderungen

Diese Änderungen ermöglichen es Benutzern mit der Rolle "Manager", Firmen, Kunden und Projekte zu erstellen. 
Vorher war die Berechtigung für diese Aktionen nicht korrekt implementiert, was dazu führte, dass Manager keine 
neuen Einträge erstellen konnten, obwohl die Dokumentation und das Benutzerhandbuch dies als Funktionalität beschreiben.

Die Änderungen nutzen die bestehende Middleware-Funktionalität `requireManagerOrAbove`, die sowohl Administratoren 
als auch Manager Zugriff gewährt, für die entsprechenden POST-Routen.