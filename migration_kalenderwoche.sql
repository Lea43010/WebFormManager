-- Migration: Add kalenderwoche and jahr columns to tblBedarfKapa
ALTER TABLE "tblBedarfKapa"
ADD COLUMN IF NOT EXISTS "kalenderwoche" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "jahr" INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);