-- Development Seed-Daten für Bau-Structura App
-- Diese Datei enthält Test-Daten für die Entwicklungsumgebung

-- Administrator-Benutzer (falls nicht vorhanden)
INSERT INTO "tbluser" ("username", "password", "user_name", "user_email", "role", "gdpr_consent", "trial_end_date", "subscription_status")
SELECT 'admin', 'f5b9768576ba8c13ec3a0415c3c4ff67a81c67a29cfffb5f095f641c39243ee7.36693cff6c9332fe2155760f8c53adcb', 'Administrator', 'admin@example.com', 'administrator', true, NULL, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM "tbluser" WHERE "username" = 'admin');

-- Test-Benutzer (falls nicht vorhanden)
INSERT INTO "tbluser" ("username", "password", "user_name", "user_email", "role", "gdpr_consent", "trial_end_date", "subscription_status")
SELECT 'test_manager', 'f5b9768576ba8c13ec3a0415c3c4ff67a81c67a29cfffb5f095f641c39243ee7.36693cff6c9332fe2155760f8c53adcb', 'Test Manager', 'manager@example.com', 'manager', true, CURRENT_DATE + INTERVAL '30 days', 'trial'
WHERE NOT EXISTS (SELECT 1 FROM "tbluser" WHERE "username" = 'test_manager');

INSERT INTO "tbluser" ("username", "password", "user_name", "user_email", "role", "gdpr_consent", "trial_end_date", "subscription_status")
SELECT 'test_user', 'f5b9768576ba8c13ec3a0415c3c4ff67a81c67a29cfffb5f095f641c39243ee7.36693cff6c9332fe2155760f8c53adcb', 'Test Benutzer', 'user@example.com', 'benutzer', true, CURRENT_DATE + INTERVAL '30 days', 'trial'
WHERE NOT EXISTS (SELECT 1 FROM "tbluser" WHERE "username" = 'test_user');

-- Test-Unternehmen
INSERT INTO "tblcompany" ("company_art", "company_name", "street", "house_number", "postal_code", "city", "country", "company_phone", "company_email")
VALUES 
('Generalunternehmen', 'Bau Müller GmbH', 'Hauptstraße', '10', 10115, 'Berlin', 'Deutschland', '+4930123456789', 'info@bau-mueller.example.com'),
('Subunternehmen', 'Schmidt Elektrotechnik', 'Industrieweg', '42', 10559, 'Berlin', 'Deutschland', '+4930987654321', 'info@schmidt-elektro.example.com')
ON CONFLICT DO NOTHING;

-- Test-Kunden
INSERT INTO "tblcustomer" ("customer_type", "first_name", "last_name", "street", "house_number", "postal_code", "city", "country", "customer_phone", "customer_email")
VALUES 
('Privat', 'Max', 'Mustermann', 'Musterstraße', '123', 10999, 'Berlin', 'Deutschland', '+49301234567', 'max@example.com'),
('Geschäft', 'Erika', 'Musterfrau', 'Geschäftsallee', '456', 10997, 'Berlin', 'Deutschland', '+49309876543', 'erika@example.com')
ON CONFLICT DO NOTHING;

-- Test-Projekte
INSERT INTO "tblproject" ("project_name", "project_art", "street", "house_number", "postal_code", "city", "country", "project_description", "project_start", "project_end")
VALUES 
('Neubau Mehrfamilienhaus', 'Neubau', 'Baustraße', '1', 10115, 'Berlin', 'Deutschland', 'Neubau eines Mehrfamilienhauses mit 12 Wohneinheiten', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '180 days'),
('Sanierung Altbau', 'Sanierung', 'Altbauweg', '7', 10559, 'Berlin', 'Deutschland', 'Energetische Sanierung eines Altbaus aus den 1930er Jahren', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '90 days'),
('Straßenbau Testprojekt', 'Straßenbau', 'Neue Straße', '1-10', 10115, 'Berlin', 'Deutschland', 'Erneuerung der Straßendecke und Infrastruktur', CURRENT_DATE, CURRENT_DATE + INTERVAL '45 days')
ON CONFLICT DO NOTHING;