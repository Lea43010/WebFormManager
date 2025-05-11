import { Router } from "express";
import { sql, drizzleSql } from "../db";
import { requireAdmin } from "../middleware/role-check";
import { logActivity, ActionType, ActivityLogData } from "../activity-logger";
import logger from "../logger";
import { cronJobManager } from "../cron-jobs";

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
    // Optimierte Abfrage für bessere Performance
    const users = await sql`
      SELECT 
        id, 
        username, 
        user_name AS name, 
        user_email AS email, 
        role, 
        gdpr_consent AS gdprConsent, 
        trial_end_date AS "trialEndDate", 
        subscription_status AS "subscriptionStatus",
        registration_date AS "registrationDate"
      FROM tbluser 
      ORDER BY id ASC
      LIMIT 50 -- Beschränkung der Ergebnisse für bessere Performance
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
  } catch (error: unknown) {
    logger.error(`Fehler beim Abrufen der Benutzerliste: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ 
      error: "Fehler beim Abrufen der Benutzerliste",
      details: error instanceof Error ? error.message : String(error)
    });
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Fehler beim Erstellen eines Benutzers: ${errorMessage}`);
    res.status(500).json({ 
      error: "Fehler beim Erstellen eines Benutzers", 
      details: errorMessage 
    });
  }
});

// Route zum Aktualisieren eines Benutzers
router.patch("/users/:id", requireAdmin(), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Ungültige Benutzer-ID" });
    }

    // Frontend sendet camelCase, wir benötigen snake_case in der DB
    const { 
      name: user_name, 
      email: user_email, 
      role, 
      trialEndDate: trial_end_date, 
      subscriptionStatus: subscription_status,
      subscriptionPlan: subscription_plan,
      gdprConsent: gdpr_consent
    } = req.body;

    // Sammle alle Aktualisierungs-Parameter
    const updateParams: any = {};
    
    if (user_name !== undefined) {
      updateParams.user_name = user_name;
    }

    if (user_email !== undefined) {
      updateParams.user_email = user_email;
    }

    if (role !== undefined) {
      updateParams.role = role;
    }

    if (trial_end_date !== undefined) {
      updateParams.trial_end_date = trial_end_date;
    }

    if (subscription_status !== undefined) {
      updateParams.subscription_status = subscription_status;
    }

    if (subscription_plan !== undefined) {
      updateParams.subscription_plan = subscription_plan;
    }
    
    if (gdpr_consent !== undefined) {
      updateParams.gdpr_consent = gdpr_consent;
    }

    if (Object.keys(updateParams).length === 0) {
      return res.status(400).json({ error: "Keine Felder zum Aktualisieren angegeben" });
    }

    // Aktualisieren des Benutzers mit einem dynamisch erstellten SQL-Query
    const setClauses: string[] = [];
    const queryValues: any[] = [userId]; // Erste Position für die WHERE-Bedingung reservieren
    let paramIndex = 2; // Wir beginnen mit $2 da $1 für die user_id verwendet wird
    
    // Für jeden Parameter einen SET-Eintrag erstellen
    for (const [key, value] of Object.entries(updateParams)) {
      if (key === 'role') {
        setClauses.push(`${key} = $${paramIndex}::user_roles`);
      } else if (key === 'trial_end_date') {
        setClauses.push(`${key} = $${paramIndex}::date`);
      } else if (key === 'subscription_plan') {
        setClauses.push(`${key} = $${paramIndex}::subscription_plans`);
      } else {
        setClauses.push(`${key} = $${paramIndex}`);
      }
      queryValues.push(value);
      paramIndex++;
    }
    
    const queryText = `
      UPDATE tbluser 
      SET ${setClauses.join(', ')} 
      WHERE id = $1 
      RETURNING *
    `;
    
    const updatedUser = await sql(queryText, queryValues);

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

// Route zum manuellen Ausführen der Testphasen-Überprüfung
router.post("/run-trial-expiration-check", requireAdmin(), async (req, res) => {
  try {
    logger.info("Administrator hat manuelle Überprüfung der ablaufenden Testphasen gestartet");
    
    // Protokollieren der Administratoraktivität
    try {
      await logActivity({
        userId: req.user?.id as number,
        component: 'Admin',
        actionType: ActionType.EXECUTE,
        entityType: 'system',
        ipAddress: getIpAddress(req),
        details: { message: "Manuelle Überprüfung der ablaufenden Testphasen gestartet" }
      });
    } catch (error) {
      logger.error(`Fehler beim Protokollieren der Aktivität: ${error}`);
    }
    
    // Trial-Expiration-Check manuell ausführen
    await cronJobManager.runTrialExpirationCheck();
    
    res.status(200).json({ 
      success: true, 
      message: "Überprüfung der ablaufenden Testphasen erfolgreich durchgeführt" 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Fehler bei der manuellen Überprüfung der ablaufenden Testphasen: ${errorMessage}`);
    res.status(500).json({ 
      success: false, 
      message: "Fehler bei der Überprüfung der ablaufenden Testphasen", 
      error: errorMessage
    });
  }
});

// Export des Routers
export default router;