-- Erstellen der verification_types ENUM (nur wenn nicht vorhanden)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_types') THEN
        CREATE TYPE verification_types AS ENUM ('login', 'password_reset');
    END IF;
END$$;

-- Erstellen der Tabelle für Verifizierungscodes
CREATE TABLE IF NOT EXISTS tblverification_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES tbluser(id),
  code VARCHAR(10) NOT NULL,
  type verification_types DEFAULT 'login',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  is_valid BOOLEAN DEFAULT TRUE
);

-- Index für schnelle Abfragen nach Codes
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON tblverification_codes(code);

-- Index für Benutzer-IDs
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON tblverification_codes(user_id);