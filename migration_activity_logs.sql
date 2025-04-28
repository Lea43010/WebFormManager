-- Aktivitätslogs-Tabelle für die Nachverfolgung von Benutzeraktionen
CREATE TABLE IF NOT EXISTS tblactivity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tbluser(id),
    component VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

-- Erstellen von Indizes für schnelle Suche und Filterung
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON tblactivity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_component ON tblactivity_logs(component);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON tblactivity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON tblactivity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON tblactivity_logs(created_at);

-- Beschreibung des Tabellenkonzepts:
-- user_id: ID des Benutzers, der die Aktion ausgeführt hat
-- component: Betroffene Komponente (z.B. Projekt, Kunde, Bautagebuch)
-- action_type: Art der Aktion (z.B. erstellen, aktualisieren, löschen, anzeigen)
-- entity_type: Art der betroffenen Entität (z.B. Projekt, Kunde, Bautagebuch)
-- entity_id: ID der betroffenen Entität
-- details: Zusätzliche Details im JSON-Format (z.B. geänderte Felder)
-- created_at: Zeitstempel der Aktion
-- ip_address: IP-Adresse des Benutzers

-- Typische Aktionstypen als Kommentar zur Dokumentation:
-- CREATE: Neues Element erstellt
-- UPDATE: Element aktualisiert
-- DELETE: Element gelöscht
-- VIEW: Element angezeigt
-- LOGIN: Benutzer hat sich angemeldet
-- LOGOUT: Benutzer hat sich abgemeldet
-- EXPORT: Daten exportiert
-- IMPORT: Daten importiert