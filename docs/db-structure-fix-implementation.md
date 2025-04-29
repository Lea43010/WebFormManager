# Implementierung der Datenbankstruktur-Reparatur

Diese Dokumentation beschreibt die Implementierung des Systems zur Reparatur von Datenbankstrukturproblemen.

## Komponenten

### 1. db-structure-fix.ts

Diese Datei enthält die Hauptlogik zum Erkennen und Beheben von Datenbankstrukturproblemen. Die Hauptkomponenten sind:

- **fixDatabaseStructureIssues()** - Hauptfunktion, die den Reparaturprozess steuert
- **fixKnownSpecialCases()** - Behandelt bekannte Spezialfälle wie tblpermissions_backup und tbluser.created_by
- **fixMissingPrimaryKeys()** - Identifiziert und behebt Tabellen ohne Primärschlüssel
- **fixNullableForeignKeys()** - Identifiziert und behebt NULL-Werte in Fremdschlüsselspalten

### 2. run-db-fixes.ts

Dieses Skript führt die Reparaturen direkt aus, ohne auf eine Express-Route angewiesen zu sein. Es kann direkt mit `npx tsx server/run-db-fixes.ts` ausgeführt werden.

### 3. debug-routes.ts

Diese Datei enthält die Debug-API-Endpunkte, einschließlich eines Endpunkts zur Ausführung der Datenbankstruktur-Reparatur über HTTP.

## Implementierungsdetails

### Spezialfälle

Die Implementierung behandelt zwei spezielle Probleme:

1. **tblpermissions_backup**: Diese Tabelle hat bereits eine id-Spalte, aber keinen Primärschlüssel. Der Code prüft, ob die Tabelle existiert und ob sie einen Primärschlüssel hat, bevor er nur den PRIMARY KEY Constraint hinzufügt, ohne eine neue Spalte zu erstellen.

2. **tbluser.created_by**: Diese Spalte hat Foreign Key Constraints, was bedeutet, dass das Löschen von Zeilen mit NULL-Werten zu Integritätsproblemen führen würde. Der Code setzt stattdessen NULL-Werte auf 1 (Admin), um die Integrität zu wahren.

### Hilfsfunktionen

Die Implementierung enthält mehrere Hilfsfunktionen:

- **executeQuery()**: Führt SQL-Abfragen mit automatischen Wiederholungsversuchen aus
- **doesTableExist()**: Prüft, ob eine Tabelle existiert
- **hasTablePrimaryKey()**: Prüft, ob eine Tabelle einen Primärschlüssel hat
- **columnExists()**: Prüft, ob eine Spalte in einer Tabelle existiert
- **isColumnNullable()**: Prüft, ob eine Spalte NULL-Werte erlaubt
- **getTablesWithoutPrimaryKey()**: Gibt alle Tabellen ohne Primärschlüssel zurück
- **getNullableForeignKeys()**: Gibt alle Fremdschlüssel zurück, die NULL-Werte erlauben

## Erweiterbarkeit

Das System ist so konzipiert, dass es leicht um weitere Reparaturfunktionen erweitert werden kann:

1. Fügen Sie eine neue Funktion in db-structure-fix.ts hinzu, die ein bestimmtes Problem behebt
2. Rufen Sie die Funktion in fixDatabaseStructureIssues() auf
3. Stellen Sie sicher, dass die Funktion Fehler behandelt und Ergebnisse zum result-Objekt hinzufügt

## Protokollierung

Alle Reparaturaktionen werden ausführlich protokolliert. Das result-Objekt enthält:

- **fixes_applied**: Liste aller erfolgreich angewendeten Fixes
- **errors**: Liste aller aufgetretenen Fehler
- **success**: Boolean-Wert, der angibt, ob die Reparatur erfolgreich war

## Verwendung

```typescript
// Beispiel für die Verwendung in einer Route
app.post("/api/debug/db-structure/fix", async (req, res, next) => {
  try {
    const result = await fixDatabaseStructureIssues();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Beispiel für direkte Ausführung
import { fixDatabaseStructureIssues } from './db-structure-fix';

async function main() {
  try {
    const result = await fixDatabaseStructureIssues();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Fehler bei der Ausführung:", error);
  }
}

main();
```