-- Migration für die Erweiterung des Dokumentenspeichers
-- Fügt neue Spalten zur tblattachment-Tabelle hinzu

-- Hinzufügen der file_storage-Spalte
ALTER TABLE tblattachment ADD COLUMN IF NOT EXISTS file_storage VARCHAR(50);

-- Hinzufügen der is_public-Spalte mit Standardwert false
ALTER TABLE tblattachment ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Aktualisieren der vorhandenen Datensätze
UPDATE tblattachment SET file_storage = 'uploads' WHERE file_storage IS NULL;

-- Logmeldung
DO $$
BEGIN
    RAISE NOTICE 'Migration für Dokumentenspeicher-Erweiterung abgeschlossen';
END $$;