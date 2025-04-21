-- Bautagebuch (Konstruktionstagebuch) Tabelle für das Projekt erstellen
CREATE TABLE IF NOT EXISTS tblconstruction_diary (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES tblproject(id),
  date DATE NOT NULL,
  employee VARCHAR(255) NOT NULL,
  activity VARCHAR(500) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  work_hours NUMERIC(5,2) NOT NULL,
  material_usage VARCHAR(500),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES tbluser(id)
);

-- Indizes für effiziente Abfragen
CREATE INDEX IF NOT EXISTS construction_diary_project_id_idx ON tblconstruction_diary(project_id);
CREATE INDEX IF NOT EXISTS construction_diary_date_idx ON tblconstruction_diary(date);
CREATE INDEX IF NOT EXISTS construction_diary_employee_idx ON tblconstruction_diary(employee);

-- Text hinzufügen zur Dokumentation
COMMENT ON TABLE tblconstruction_diary IS 'Enthält alle Einträge des Bautagebuchs für Projekte';
COMMENT ON COLUMN tblconstruction_diary.project_id IS 'Referenz zum zugehörigen Projekt';
COMMENT ON COLUMN tblconstruction_diary.date IS 'Datum des Eintrags';
COMMENT ON COLUMN tblconstruction_diary.employee IS 'Name des Mitarbeiters';
COMMENT ON COLUMN tblconstruction_diary.activity IS 'Durchgeführte Tätigkeit';
COMMENT ON COLUMN tblconstruction_diary.start_time IS 'Startzeit der Tätigkeit';
COMMENT ON COLUMN tblconstruction_diary.end_time IS 'Endzeit der Tätigkeit';
COMMENT ON COLUMN tblconstruction_diary.work_hours IS 'Gesamte Arbeitsstunden (automatisch berechnet aus Start- und Endzeit oder manuell eingetragen)';
COMMENT ON COLUMN tblconstruction_diary.material_usage IS 'Verwendete Materialien';
COMMENT ON COLUMN tblconstruction_diary.remarks IS 'Zusätzliche Bemerkungen';
COMMENT ON COLUMN tblconstruction_diary.created_at IS 'Zeitpunkt der Erstellung des Eintrags';
COMMENT ON COLUMN tblconstruction_diary.created_by IS 'Benutzer, der den Eintrag erstellt hat';