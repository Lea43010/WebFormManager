-- Hinzufügen der incident_type Spalte zur construction_diary Tabelle
ALTER TABLE tblconstruction_diary ADD COLUMN IF NOT EXISTS incident_type "incident_types";