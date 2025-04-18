-- Erstelle EWB/FÖB-Enum
CREATE TYPE ewb_foeb_type AS ENUM ('EWB', 'FÖB', 'EWB,FÖB', 'keine');

-- Füge die neuen Spalten zur Tabelle hinzu
ALTER TABLE tblmilestonedetails
ADD COLUMN ewb_foeb ewb_foeb_type DEFAULT 'keine',
ADD COLUMN soll_menge NUMERIC(10, 2);