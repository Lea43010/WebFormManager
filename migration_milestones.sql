-- Migration für Meilensteine-Tabellen
CREATE TABLE "tblmilestones" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL REFERENCES "tblproject"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "startKW" INTEGER NOT NULL,
  "endKW" INTEGER NOT NULL,
  "jahr" INTEGER NOT NULL,
  "color" VARCHAR(50),
  "type" VARCHAR(100),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "tblmilestonedetails" (
  "id" SERIAL PRIMARY KEY,
  "milestoneId" INTEGER NOT NULL REFERENCES "tblmilestones"("id") ON DELETE CASCADE,
  "kalenderwoche" INTEGER NOT NULL,
  "jahr" INTEGER NOT NULL,
  "text" VARCHAR(255),
  "supplementaryInfo" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Erstelle Indizes für bessere Performance
CREATE INDEX "idx_milestone_project" ON "tblmilestones"("projectId");
CREATE INDEX "idx_milestone_details_milestone" ON "tblmilestonedetails"("milestoneId");