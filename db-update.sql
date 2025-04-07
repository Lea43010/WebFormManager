-- Erstelle Enum-Typen, falls sie noch nicht existieren
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bodenklassen') THEN
        CREATE TYPE bodenklassen AS ENUM ('BK1', 'BK2', 'BK3', 'BK4', 'BK5', 'BK6', 'BK7', 'unbekannt');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bodentragfaehigkeitsklassen') THEN
        CREATE TYPE bodentragfaehigkeitsklassen AS ENUM ('F1', 'F2', 'F3', 'unbekannt');
    END IF;
END$$;

-- Füge neue Spalten zur tblsurface_analysis Tabelle hinzu, falls sie noch nicht existieren
ALTER TABLE tblsurface_analysis
ADD COLUMN IF NOT EXISTS bodenklasse bodenklassen,
ADD COLUMN IF NOT EXISTS bodentragfaehigkeitsklasse bodentragfaehigkeitsklassen,
ADD COLUMN IF NOT EXISTS ground_image_file_path VARCHAR(1000),
ADD COLUMN IF NOT EXISTS ground_confidence DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS ground_analyse_details TEXT;

-- Erstelle neue Tabelle für Bodenreferenzdaten
CREATE TABLE IF NOT EXISTS tblsoil_reference_data (
    id SERIAL PRIMARY KEY,
    bodenklasse bodenklassen NOT NULL,
    bezeichnung VARCHAR(255) NOT NULL,
    beschreibung TEXT,
    korngroesse VARCHAR(100),
    durchlaessigkeit VARCHAR(100),
    tragfaehigkeit bodentragfaehigkeitsklassen,
    empfohlene_verdichtung VARCHAR(255),
    empfohlene_belastungsklasse belastungsklassen,
    eigenschaften TEXT,
    referenzbild_path VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Füge Referenzdaten hinzu, falls die Tabelle leer ist
INSERT INTO tblsoil_reference_data (bodenklasse, bezeichnung, beschreibung, korngroesse, durchlaessigkeit, tragfaehigkeit, empfohlene_verdichtung, empfohlene_belastungsklasse, eigenschaften)
SELECT 'BK1', 'Fels / Felsartiger Boden', 'Felsiger Untergrund, sehr hart und stabil', 'Massives Gestein', 'Sehr gering', 'F1', 'Keine spezielle Verdichtung erforderlich', 'Bk100', 'Sehr hohe Tragfähigkeit, ideal für schwere Belastung'
WHERE NOT EXISTS (SELECT 1 FROM tblsoil_reference_data WHERE bodenklasse = 'BK1');

INSERT INTO tblsoil_reference_data (bodenklasse, bezeichnung, beschreibung, korngroesse, durchlaessigkeit, tragfaehigkeit, empfohlene_verdichtung, empfohlene_belastungsklasse, eigenschaften)
SELECT 'BK2', 'Kies / Sand', 'Grobkörniger Boden mit guter Drainage', '2-63 mm (Kies) / 0.063-2 mm (Sand)', 'Hoch', 'F1', 'Vibrationsverdichtung', 'Bk32', 'Gute Tragfähigkeit, hohe Stabilität bei ausreichender Verdichtung'
WHERE NOT EXISTS (SELECT 1 FROM tblsoil_reference_data WHERE bodenklasse = 'BK2');

INSERT INTO tblsoil_reference_data (bodenklasse, bezeichnung, beschreibung, korngroesse, durchlaessigkeit, tragfaehigkeit, empfohlene_verdichtung, empfohlene_belastungsklasse, eigenschaften)
SELECT 'BK3', 'Gemischter Boden', 'Mischung aus Sand, Schluff und Ton', 'Variabel', 'Mittel', 'F2', 'Schichtverdichtung mit Walzen', 'Bk10', 'Moderate Tragfähigkeit, gut geeignet für mittlere Belastung'
WHERE NOT EXISTS (SELECT 1 FROM tblsoil_reference_data WHERE bodenklasse = 'BK3');

INSERT INTO tblsoil_reference_data (bodenklasse, bezeichnung, beschreibung, korngroesse, durchlaessigkeit, tragfaehigkeit, empfohlene_verdichtung, empfohlene_belastungsklasse, eigenschaften)
SELECT 'BK4', 'Schluffiger Boden', 'Feinkörniger Boden mit niedriger Plastizität', '0.002-0.063 mm', 'Niedrig bis mittel', 'F2', 'Stampfverdichtung, Walzen', 'Bk3.2', 'Mäßige Tragfähigkeit, anfällig für Frostschäden'
WHERE NOT EXISTS (SELECT 1 FROM tblsoil_reference_data WHERE bodenklasse = 'BK4');

INSERT INTO tblsoil_reference_data (bodenklasse, bezeichnung, beschreibung, korngroesse, durchlaessigkeit, tragfaehigkeit, empfohlene_verdichtung, empfohlene_belastungsklasse, eigenschaften)
SELECT 'BK5', 'Toniger Boden', 'Feinkörniger Boden mit hoher Plastizität', '<0.002 mm', 'Sehr niedrig', 'F3', 'Spezielle Verdichtung mit angepasster Feuchtigkeit', 'Bk1.8', 'Niedrige Tragfähigkeit, empfindlich gegenüber Wassergehalt'
WHERE NOT EXISTS (SELECT 1 FROM tblsoil_reference_data WHERE bodenklasse = 'BK5');

INSERT INTO tblsoil_reference_data (bodenklasse, bezeichnung, beschreibung, korngroesse, durchlaessigkeit, tragfaehigkeit, empfohlene_verdichtung, empfohlene_belastungsklasse, eigenschaften)
SELECT 'BK6', 'Organischer Boden', 'Enthält signifikante Mengen organischer Substanzen', 'Variabel', 'Variabel', 'F3', 'Bodenaustausch empfohlen', 'Bk1.0', 'Sehr niedrige Tragfähigkeit, nicht für direkte Belastung geeignet'
WHERE NOT EXISTS (SELECT 1 FROM tblsoil_reference_data WHERE bodenklasse = 'BK6');

INSERT INTO tblsoil_reference_data (bodenklasse, bezeichnung, beschreibung, korngroesse, durchlaessigkeit, tragfaehigkeit, empfohlene_verdichtung, empfohlene_belastungsklasse, eigenschaften)
SELECT 'BK7', 'Auffüllboden', 'Künstlich aufgeschütteter Boden', 'Variabel', 'Variabel', 'F2', 'Schichtweise Verdichtung mit Qualitätskontrolle', 'Bk3.2', 'Tragfähigkeit abhängig von der Qualität und Verdichtung'
WHERE NOT EXISTS (SELECT 1 FROM tblsoil_reference_data WHERE bodenklasse = 'BK7');