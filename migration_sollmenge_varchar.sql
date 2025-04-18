-- Ändern Sie den Datentyp der sollMenge-Spalte in tblmilestones zu VARCHAR
ALTER TABLE tblmilestones 
ALTER COLUMN soll_menge TYPE VARCHAR(20);

-- Ändern Sie den Datentyp der sollMenge-Spalte in tblmilestonedetails zu VARCHAR
ALTER TABLE tblmilestonedetails 
ALTER COLUMN soll_menge TYPE VARCHAR(20);