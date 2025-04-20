-- Erstellen der Genehmigungstabelle
CREATE TABLE tblpermissions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES tblproject(id) ON DELETE CASCADE,
  permission_name VARCHAR(100) NOT NULL,
  permission_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);