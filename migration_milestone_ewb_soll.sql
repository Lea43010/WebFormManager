-- Zum Hinzufügen der ewb_foeb und soll_menge Felder zur tblmilestones Tabelle
ALTER TABLE tblmilestones 
ADD COLUMN IF NOT EXISTS ewb_foeb ewb_foeb_type DEFAULT 'keine',
ADD COLUMN IF NOT EXISTS soll_menge NUMERIC(10,2);