-- Erstelle Tabelle für Straßenschäden
CREATE TABLE IF NOT EXISTS tblroad_damages (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(50),
  damage_type VARCHAR(50),
  location VARCHAR(255),
  coordinates JSONB,
  image_url VARCHAR(1024),
  voice_note_url VARCHAR(1024),
  area_size REAL,
  repair_status VARCHAR(50) DEFAULT 'offen',
  estimated_repair_cost REAL,
  repair_due_date DATE,
  repair_priority INTEGER,
  created_by INTEGER,
  assigned_to INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  additional_data JSONB
);

-- Fremdschlüsselbeziehung zu Projekten hinzufügen
ALTER TABLE tblroad_damages 
ADD CONSTRAINT fk_road_damages_project 
FOREIGN KEY (project_id) 
REFERENCES tblprojects(id) 
ON DELETE CASCADE;

-- Indizes für verbesserte Performance
CREATE INDEX IF NOT EXISTS idx_road_damages_project_id ON tblroad_damages(project_id);
CREATE INDEX IF NOT EXISTS idx_road_damages_damage_type ON tblroad_damages(damage_type);
CREATE INDEX IF NOT EXISTS idx_road_damages_repair_status ON tblroad_damages(repair_status);
CREATE INDEX IF NOT EXISTS idx_road_damages_created_by ON tblroad_damages(created_by);
CREATE INDEX IF NOT EXISTS idx_road_damages_assigned_to ON tblroad_damages(assigned_to);