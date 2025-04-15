-- Füge enum für Dateikategorien hinzu, falls noch nicht vorhanden
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_category_enum') THEN
        CREATE TYPE file_category_enum AS ENUM (
            'Verträge', 'Rechnungen', 'Pläne', 'Protokolle', 'Genehmigungen', 'Fotos', 'Analysen', 'Andere'
        );
    END IF;
END 
$$;

-- Füge neue Spalten zur Tabelle tblattachment hinzu
ALTER TABLE tblattachment 
ADD COLUMN IF NOT EXISTS file_category file_category_enum,
ADD COLUMN IF NOT EXISTS tags VARCHAR(255);

-- Erstelle die Tabelle für Dateiorganisationsvorschläge, falls noch nicht vorhanden
CREATE TABLE IF NOT EXISTS tblfile_organization_suggestion (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES tblproject(id) ON DELETE CASCADE,
    suggested_category file_category_enum,
    suggested_tags VARCHAR(255),
    reason TEXT,
    confidence DECIMAL(5,2),
    is_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Erstelle Tabelle für die Verknüpfung zwischen Vorschlägen und Dateien
CREATE TABLE IF NOT EXISTS tblfile_suggestion_attachment (
    suggestion_id INTEGER REFERENCES tblfile_organization_suggestion(id) ON DELETE CASCADE,
    attachment_id INTEGER REFERENCES tblattachment(id) ON DELETE CASCADE,
    PRIMARY KEY (suggestion_id, attachment_id)
);