-- Erstellung einer neuen Tabelle für Bautagebuch-Mitarbeiter
CREATE TABLE IF NOT EXISTS "tblconstruction_diary_employees" (
  "id" SERIAL PRIMARY KEY,
  "construction_diary_id" INTEGER NOT NULL REFERENCES "tblconstruction_diary"("id") ON DELETE CASCADE,
  "first_name" VARCHAR(255) NOT NULL,
  "last_name" VARCHAR(255) NOT NULL,
  "position" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "created_by" INTEGER
);

-- Index für schnellere Abfragen
CREATE INDEX IF NOT EXISTS "idx_construction_diary_employees_diary_id" ON "tblconstruction_diary_employees"("construction_diary_id");