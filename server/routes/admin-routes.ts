import { Router } from "express";
import { sql } from "../db";
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

    logActivity({
      userId: req.user?.id as number,
      component: 'Admin',
      actionType: ActionType.VIEW,
      entityType: 'user',
      ipAddress: getIpAddress(req),
      details: { message: "Benutzerliste abgerufen" }
    });
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

    logActivity({
      userId: req.user?.id,
      ipAddress: getIpAddress(req),
      entityType: 'user',
      entityId: newUser[0].id,
      description: `Benutzer erstellt: ${username}`
    });

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
      subscription_plan
    } = req.body;

    // Aktualisierte Felder sammeln
    const updates = [];
    const values = {};

    if (user_name !== undefined) {
      updates.push("user_name = ${user_name}");
      values.user_name = user_name;
    }

    if (user_email !== undefined) {
      updates.push("user_email = ${user_email}");
      values.user_email = user_email;
    }

    if (role !== undefined) {
      updates.push("role = ${role}::user_roles");
      values.role = role;
    }

    if (trial_end_date !== undefined) {
      updates.push("trial_end_date = ${trial_end_date}::date");
      values.trial_end_date = trial_end_date;
    }

    if (subscription_status !== undefined) {
      updates.push("subscription_status = ${subscription_status}");
      values.subscription_status = subscription_status;
    }

    if (subscription_plan !== undefined) {
      updates.push("subscription_plan = ${subscription_plan}::subscription_plans");
      values.subscription_plan = subscription_plan;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Keine Felder zum Aktualisieren angegeben" });
    }

    // Aktualisieren des Benutzers
    const updateQuery = `
      UPDATE tbluser 
      SET ${updates.join(", ")} 
      WHERE id = ${userId} 
      RETURNING *
    `;

    const updatedUser = await sql.unsafe(updateQuery, { ...values, userId });

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    logActivity({
      userId: req.user?.id,
      ipAddress: getIpAddress(req),
      entityType: 'user',
      entityId: userId,
      description: `Benutzer aktualisiert: ID ${userId}`
    });

    res.json(updatedUser[0]);
  } catch (error) {
    logger.error(`Fehler beim Aktualisieren eines Benutzers: ${error.message}`);
    res.status(500).json({ error: `Fehler beim Aktualisieren eines Benutzers: ${error.message}` });
  }
});

// Export des Routers
export default router;