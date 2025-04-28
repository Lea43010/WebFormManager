-- Hinzufügen einer Spalte für das Registrierungsdatum
ALTER TABLE tbluser ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT NULL;

-- Bestehende Benutzer: Registrierungsdatum auf das aktuelle Datum setzen, falls NULL
UPDATE tbluser SET registration_date = CURRENT_DATE WHERE registration_date IS NULL;

-- Existierende trial_end_date aktualisieren, falls noch nicht gesetzt
-- Setzt trial_end_date auf registration_date + 14 Tage, wenn nicht bereits gesetzt
UPDATE tbluser 
SET trial_end_date = registration_date + INTERVAL '14 days' 
WHERE trial_end_date IS NULL AND registration_date IS NOT NULL;

-- Sicherstellen, dass bei neuen Benutzern das Registrierungsdatum automatisch gesetzt wird
ALTER TABLE tbluser ALTER COLUMN registration_date SET DEFAULT CURRENT_DATE;

-- Anpassen der subscription_status Spalte für die Testphase
-- Wenn die Spalte existiert, ändern wir nichts an der Struktur, aber fügen sicher, dass sie die richtigen Werte enthält
UPDATE tbluser 
SET subscription_status = 'trial' 
WHERE subscription_status IS NULL OR subscription_status = '';

-- Bei bestehenden Benutzern mit abgelaufener Testphase den Status auf 'expired' setzen
UPDATE tbluser 
SET subscription_status = 'expired' 
WHERE trial_end_date < CURRENT_DATE AND (subscription_status = 'trial' OR subscription_status IS NULL);

-- Bei bestehenden Benutzern mit Zahlungsdatum den Status auf 'active' setzen
UPDATE tbluser 
SET subscription_status = 'active' 
WHERE last_payment_date IS NOT NULL AND subscription_status = 'trial';