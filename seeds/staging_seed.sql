-- Staging Seed-Daten für Bau-Structura App
-- Diese Datei enthält minimale Test-Daten für die Staging-Umgebung

-- Administrator-Benutzer (falls nicht vorhanden)
INSERT INTO "tbluser" ("username", "password", "user_name", "user_email", "role", "gdpr_consent", "trial_end_date", "subscription_status")
SELECT 'staging_admin', 'f5b9768576ba8c13ec3a0415c3c4ff67a81c67a29cfffb5f095f641c39243ee7.36693cff6c9332fe2155760f8c53adcb', 'Staging Admin', 'admin@staging.example.com', 'administrator', true, NULL, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM "tbluser" WHERE "username" = 'staging_admin');

-- Test-Benutzer (Manager und normaler Benutzer)
INSERT INTO "tbluser" ("username", "password", "user_name", "user_email", "role", "gdpr_consent", "trial_end_date", "subscription_status")
SELECT 'staging_manager', 'f5b9768576ba8c13ec3a0415c3c4ff67a81c67a29cfffb5f095f641c39243ee7.36693cff6c9332fe2155760f8c53adcb', 'Staging Manager', 'manager@staging.example.com', 'manager', true, CURRENT_DATE + INTERVAL '30 days', 'trial'
WHERE NOT EXISTS (SELECT 1 FROM "tbluser" WHERE "username" = 'staging_manager');

INSERT INTO "tbluser" ("username", "password", "user_name", "user_email", "role", "gdpr_consent", "trial_end_date", "subscription_status")
SELECT 'staging_user', 'f5b9768576ba8c13ec3a0415c3c4ff67a81c67a29cfffb5f095f641c39243ee7.36693cff6c9332fe2155760f8c53adcb', 'Staging User', 'user@staging.example.com', 'benutzer', true, CURRENT_DATE + INTERVAL '30 days', 'trial'
WHERE NOT EXISTS (SELECT 1 FROM "tbluser" WHERE "username" = 'staging_user');

-- Ein Test-Unternehmen
INSERT INTO "tblcompany" ("company_art", "company_name", "street", "house_number", "postal_code", "city", "country", "company_phone", "company_email")
VALUES 
('Generalunternehmen', 'Staging Bau GmbH', 'Teststraße', '1', 10115, 'Berlin', 'Deutschland', '+4930111222333', 'info@staging-bau.example.com')
ON CONFLICT DO NOTHING;

-- Ein Test-Kunde
INSERT INTO "tblcustomer" ("customer_type", "first_name", "last_name", "street", "house_number", "postal_code", "city", "country", "customer_phone", "customer_email")
VALUES 
('Geschäft', 'Staging', 'Kunde', 'Testweg', '42', 10115, 'Berlin', 'Deutschland', '+4930444555666', 'kunde@staging.example.com')
ON CONFLICT DO NOTHING;

-- Ein Test-Projekt
INSERT INTO "tblproject" ("project_name", "project_art", "street", "house_number", "postal_code", "city", "country", "project_description", "project_start", "project_end")
VALUES 
('Staging Testprojekt', 'Neubau', 'Staging-Straße', '100', 10115, 'Berlin', 'Deutschland', 'Ein Testprojekt für die Staging-Umgebung', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days')
ON CONFLICT DO NOTHING;