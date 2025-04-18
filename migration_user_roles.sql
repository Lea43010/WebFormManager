-- Rollen-Enum erstellen
CREATE TYPE user_roles AS ENUM ('administrator', 'manager', 'benutzer');

-- Spalten zur Benutzer-Tabelle hinzufügen
ALTER TABLE "tbluser" 
  ADD COLUMN IF NOT EXISTS "role" user_roles DEFAULT 'benutzer',
  ADD COLUMN IF NOT EXISTS "created_by" INTEGER REFERENCES "tbluser"("id");

-- Setze initiale Rolle für benutzer leazimmer auf administrator
UPDATE "tbluser" SET "role" = 'administrator' WHERE "username" = 'leazimmer';

-- Spalten zur Projekt-Tabelle hinzufügen
ALTER TABLE "tblproject"
  ADD COLUMN IF NOT EXISTS "created_by" INTEGER REFERENCES "tbluser"("id"),
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Setze alle existierenden Projekte als von leazimmer erstellt
UPDATE "tblproject" SET "created_by" = (SELECT id FROM "tbluser" WHERE "username" = 'leazimmer');