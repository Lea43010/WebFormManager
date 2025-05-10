-- Migration für Bildoptimierungsfelder in der Anhänge-Tabelle
ALTER TABLE tblattachment 
  ADD COLUMN IF NOT EXISTS original_size INTEGER,
  ADD COLUMN IF NOT EXISTS optimized_size INTEGER,
  ADD COLUMN IF NOT EXISTS optimization_savings INTEGER,
  ADD COLUMN IF NOT EXISTS original_format VARCHAR(20),
  ADD COLUMN IF NOT EXISTS webp_path VARCHAR(1000),
  ADD COLUMN IF NOT EXISTS is_optimized BOOLEAN DEFAULT FALSE;

-- Kommentar zur Migration
COMMENT ON COLUMN tblattachment.original_size IS 'Originalgröße des Bildes in Bytes vor der Optimierung';
COMMENT ON COLUMN tblattachment.optimized_size IS 'Größe des Bildes in Bytes nach der Optimierung';
COMMENT ON COLUMN tblattachment.optimization_savings IS 'Eingesparte Bytes durch die Optimierung';
COMMENT ON COLUMN tblattachment.original_format IS 'Originalformat des Bildes (z.B. jpeg, png)';
COMMENT ON COLUMN tblattachment.webp_path IS 'Pfad zur optimierten WebP-Version des Bildes';
COMMENT ON COLUMN tblattachment.is_optimized IS 'Flag, ob das Bild optimiert wurde';