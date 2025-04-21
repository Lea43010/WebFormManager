-- Erweiterung der Benutzertabelle für Abonnement-Funktionalität
ALTER TABLE tbluser
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP;

-- Kommentar zum Änderungsprotokoll
COMMENT ON COLUMN tbluser.trial_end_date IS 'Enddatum der 4-wöchigen kostenlosen Testphase';
COMMENT ON COLUMN tbluser.subscription_status IS 'Status des Abonnements: trial, active, canceled, expired';
COMMENT ON COLUMN tbluser.stripe_customer_id IS 'Kunden-ID in Stripe';
COMMENT ON COLUMN tbluser.stripe_subscription_id IS 'Abonnement-ID in Stripe';
COMMENT ON COLUMN tbluser.last_payment_date IS 'Datum der letzten Zahlung';