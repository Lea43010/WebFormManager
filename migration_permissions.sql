-- Erstellen der Genehmigungstabelle
CREATE TABLE tblpermissions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES tblproject(id) ON DELETE CASCADE,
  permission_type VARCHAR(100) NOT NULL,
  permission_authority VARCHAR(100) NOT NULL,
  permission_date DATE,
  permission_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);