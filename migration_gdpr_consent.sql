-- DSGVO-Zustimmung für Benutzerregistrierung
ALTER TABLE "tbluser" ADD COLUMN IF NOT EXISTS "gdpr_consent" BOOLEAN DEFAULT FALSE;