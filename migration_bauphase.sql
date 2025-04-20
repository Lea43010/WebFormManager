-- Bauphase Enum für Meilenstein-Tabelle hinzufügen
CREATE TYPE bauphase_type AS ENUM (
  'Baustart Tiefbau FÖB',
  'Baustart Tiefbau EWB',
  'Tiefbau EWB',
  'Tiefbau FÖB',
  'Montage NE3 EWB',
  'Montage NE3 FÖB',
  'Endmontage NE4 EWB',
  'Endmontage NE4 FÖB',
  'Sonstiges'
);

-- Spalte zur Meilenstein-Tabelle hinzufügen
ALTER TABLE "tblmilestones" ADD COLUMN "bauphase" bauphase_type DEFAULT 'Sonstiges';