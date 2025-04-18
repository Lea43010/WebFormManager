-- Erstelle den Enum-Typ für Login-Event-Typen
CREATE TYPE login_event_types AS ENUM ('login', 'logout', 'register', 'failed_login');

-- Erstelle die Login-Logs-Tabelle
CREATE TABLE IF NOT EXISTS tbllogin_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES tbluser(id),
    username VARCHAR(255) NOT NULL,
    event_type login_event_types NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT TRUE,
    fail_reason TEXT
);

-- Erstelle einen Index für schnelle Abfragen nach Benutzern
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON tbllogin_logs(user_id);

-- Erstelle einen Index für schnelle Abfragen nach Ereignistypen
CREATE INDEX IF NOT EXISTS idx_login_logs_event_type ON tbllogin_logs(event_type);

-- Erstelle einen Index für Zeitstempel-basierte Abfragen
CREATE INDEX IF NOT EXISTS idx_login_logs_timestamp ON tbllogin_logs(timestamp);