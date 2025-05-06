import { Router } from "express";
import { sql, drizzleSql } from "../db";
import { requireAdmin } from "../middleware/role-check";
import { logActivity, ActionType, ActivityLogData } from "../activity-logger";
import logger from "../logger";

// Hilfsfunktion zum Ermitteln der IP-Adresse
const getIpAddress = (req: any): string => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         (req.connection.socket ? req.connection.socket.remoteAddress : null) || 
         'unbekannt';
};

const router = Router();

// Route zum Abrufen aller Benutzer (nur für Administratoren)
router.get("/users", requireAdmin(), async (req, res) => {
  try {
    // Umfassende Benutzerinformationen abrufen, sortiert nach ID
    const users = await sql`
      SELECT 
        id, 
        username, 
        user_name, 
        user_email, 
        role, 
        created_by, 
        gdpr_consent, 
        registration_date, 
        trial_end_date, 
        subscription_status,
        stripe_customer_id,
        stripe_subscription_id,
        last_payment_date,
        subscription_plan
      FROM tbluser 
      ORDER BY id ASC
    `;

    // Protokollieren der Benutzeraktivität
    try {
      await logActivity({
        userId: req.user?.id as number,
        component: 'Admin',
        actionType: ActionType.VIEW,
        entityType: 'user',
        ipAddress: getIpAddress(req),
        details: { message: "Benutzerliste abgerufen" }
      });
    } catch (error) {
      logger.error(`Fehler beim Protokollieren der Aktivität: ${error}`);
      // Wir werfen den Fehler nicht weiter, um die Hauptfunktionalität nicht zu beeinträchtigen
    }
    res.json(users);
  } catch (error) {
    logger.error(`Fehler beim Abrufen der Benutzerliste: ${error.message}`);
    res.status(500).json({ error: "Fehler beim Abrufen der Benutzerliste" });
  }
});

// Route zum Erstellen eines neuen Benutzers
router.post("/users", requireAdmin(), async (req, res) => {
  try {
    const { 
      username, 
      password, 
      user_name, 
      user_email, 
      role, 
      created_by, 
      gdpr_consent,
      trial_end_date,
      subscription_status 
    } = req.body;

    // Prüfen, ob Benutzername bereits existiert
    const existingUser = await sql`
      SELECT id FROM tbluser WHERE username = ${username}
    `;

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Benutzername bereits vergeben" });
    }

    // Standardwerte für Testlaufzeit festlegen, falls nicht angegeben
    const trialEndDate = trial_end_date || 
      new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 28 Tage ab heute
    
    const subscriptionStat = subscription_status || 'trial';

    // Benutzer in Datenbank anlegen
    const newUser = await sql`
      INSERT INTO tbluser (
        username, 
        password, 
        user_name, 
        user_email, 
        role, 
        created_by, 
        gdpr_consent,
        registration_date,
        trial_end_date,
        subscription_status
      ) 
      VALUES (
        ${username}, 
        ${password}, 
        ${user_name}, 
        ${user_email}, 
        ${role}::user_roles, 
        ${created_by}, 
        ${gdpr_consent},
        CURRENT_DATE,
        ${trialEndDate}::date,
        ${subscriptionStat}
      )
      RETURNING *
    `;

    try {
      await logActivity({
        userId: req.user?.id as number,
        component: 'Admin',
        actionType: ActionType.CREATE,
        entityType: 'user',
        entityId: newUser[0].id,
        ipAddress: getIpAddress(req),
        details: { message: `Benutzer erstellt: ${username}` }
      });
    } catch (error) {
      logger.error(`Fehler beim Protokollieren der Aktivität: ${error}`);
      // Wir werfen den Fehler nicht weiter, um die Hauptfunktionalität nicht zu beeinträchtigen
    }

    res.status(201).json(newUser[0]);
  } catch (error) {
    logger.error(`Fehler beim Erstellen eines Benutzers: ${error.message}`);
    res.status(500).json({ error: `Fehler beim Erstellen eines Benutzers: ${error.message}` });
  }
});

// Route zum Aktualisieren eines Benutzers
router.patch("/users/:id", requireAdmin(), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Ungültige Benutzer-ID" });
    }

    const { 
      user_name, 
      user_email, 
      role, 
      trial_end_date, 
      subscription_status,
      subscription_plan,
      gdpr_consent
    } = req.body;

    // Aktualisierte Felder sammeln
    const updates = [];
    const values = {};

    if (user_name !== undefined) {
      updates.push(`user_name = ${sql.unsafe('${user_name}')}`);
      values.user_name = user_name;
    }

    if (user_email !== undefined) {
      updates.push(`user_email = ${sql.unsafe('${user_email}')}`);
      values.user_email = user_email;
    }

    if (role !== undefined) {
      updates.push(`role = ${sql.unsafe('${role}')}::user_roles`);
      values.role = role;
    }

    if (trial_end_date !== undefined) {
      updates.push(`trial_end_date = ${sql.unsafe('${trial_end_date}')}::date`);
      values.trial_end_date = trial_end_date;
    }

    if (subscription_status !== undefined) {
      updates.push(`subscription_status = ${sql.unsafe('${subscription_status}')}`);
      values.subscription_status = subscription_status;
    }

    if (subscription_plan !== undefined) {
      updates.push(`subscription_plan = ${sql.unsafe('${subscription_plan}')}::subscription_plans`);
      values.subscription_plan = subscription_plan;
    }
    
    if (gdpr_consent !== undefined) {
      updates.push(`gdpr_consent = ${sql.unsafe('${gdpr_consent}')}`);
      values.gdpr_consent = gdpr_consent;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Keine Felder zum Aktualisieren angegeben" });
    }

    // Aktualisieren des Benutzers
    // Da wir in dieser Version der Datenbank-Bibliothek keine direkte Unterstützung für 
    // dynamische Spalten-Updates mit sql tag templates haben, verwenden wir eine 
    // andere Methode zur Aktualisierung
    let queryText = `UPDATE tbluser SET `;
    queryText += updates.join(", ");
    queryText += ` WHERE id = $1 RETURNING *`;
    
    const updatedUser = await sql(queryText, [userId]);

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    try {
      await logActivity({
        userId: req.user?.id as number,
        component: 'Admin',
        actionType: ActionType.UPDATE,
        entityType: 'user',
        entityId: userId,
        ipAddress: getIpAddress(req),
        details: { message: `Benutzer aktualisiert: ID ${userId}` }
      });
    } catch (error) {
      logger.error(`Fehler beim Protokollieren der Aktivität: ${error}`);
      // Wir werfen den Fehler nicht weiter, um die Hauptfunktionalität nicht zu beeinträchtigen
    }

    res.json(updatedUser[0]);
  } catch (error) {
    logger.error(`Fehler beim Aktualisieren eines Benutzers: ${error.message}`);
    res.status(500).json({ error: `Fehler beim Aktualisieren eines Benutzers: ${error.message}` });
  }
});

// Route zum Löschen eines Benutzers
router.delete("/users/:id", requireAdmin(), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Ungültige Benutzer-ID" });
    }
    
    // Verhindere, dass Administratoren sich selbst löschen
    if (userId === req.user?.id) {
      return res.status(400).json({
        message: "Sie können Ihren eigenen Benutzer nicht löschen."
      });
    }
    
    // Prüfe, ob der zu löschende Benutzer existiert
    const userExists = await sql`SELECT COUNT(*) FROM tbluser WHERE id = ${userId}`;
    
    if (userExists[0].count === '0') {
      return res.status(404).json({
        message: "Benutzer nicht gefunden."
      });
    }
    
    // Lösche den Benutzer
    await sql`DELETE FROM tbluser WHERE id = ${userId}`;
    
    try {
      await logActivity({
        userId: req.user?.id as number,
        component: 'Admin',
        actionType: ActionType.DELETE,
        entityType: 'user',
        entityId: userId,
        ipAddress: getIpAddress(req),
        details: { message: `Benutzer gelöscht: ID ${userId}` }
      });
    } catch (error) {
      logger.error(`Fehler beim Protokollieren der Aktivität: ${error}`);
      // Wir werfen den Fehler nicht weiter, um die Hauptfunktionalität nicht zu beeinträchtigen
    }
    
    res.status(200).json({ message: "Benutzer erfolgreich gelöscht." });
  } catch (error) {
    logger.error(`Fehler beim Löschen eines Benutzers: ${error.message}`);
    res.status(500).json({ error: `Fehler beim Löschen eines Benutzers: ${error.message}` });
  }
});

// Export des Routers
export default router;