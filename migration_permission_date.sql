-- Hinzufügen des Genehmigungsdatums zur Projekttabelle
ALTER TABLE tblproject
ADD COLUMN permission_date DATE;