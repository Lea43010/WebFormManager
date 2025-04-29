-- Create road_damage_type enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'road_damage_type') THEN
        CREATE TYPE road_damage_type AS ENUM (
            'riss',
            'schlagloch',
            'netzriss',
            'verformung',
            'ausbruch',
            'abplatzung',
            'kantenschaden',
            'fugenausbruch',
            'abnutzung',
            'sonstiges'
        );
    END IF;
END $$;

-- Create damage_severity enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'damage_severity') THEN
        CREATE TYPE damage_severity AS ENUM (
            'leicht',
            'mittel',
            'schwer',
            'kritisch'
        );
    END IF;
END $$;

-- Create road damages table if it doesn't exist
CREATE TABLE IF NOT EXISTS tblroad_damages (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    damage_type road_damage_type NOT NULL DEFAULT 'sonstiges',
    severity damage_severity NOT NULL DEFAULT 'mittel',
    position TEXT,
    description TEXT NOT NULL,
    recommended_action TEXT,
    image_url TEXT,
    audio_url TEXT,
    audio_transcription TEXT,
    estimated_repair_cost INTEGER,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);