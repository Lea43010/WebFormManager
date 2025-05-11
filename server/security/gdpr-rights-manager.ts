/**
 * DSGVO-Rechte-Manager
 * 
 * Dieser Dienst bietet Funktionen zur Verwaltung von Benutzerrechten gemäß der DSGVO,
 * einschließlich Auskunftsrecht, Recht auf Vergessenwerden, Datenportabilität und mehr.
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

// Typen von DSGVO-Anfragen
export enum GdprRequestType {
  ACCESS = 'access',                // Auskunftsrecht
  ERASURE = 'erasure',              // Recht auf Vergessenwerden
  RECTIFICATION = 'rectification',  // Recht auf Berichtigung
  PORTABILITY = 'portability',      // Recht auf Datenportabilität
  RESTRICTION = 'restriction',      // Recht auf Einschränkung der Verarbeitung
  OBJECTION = 'objection'           // Widerspruchsrecht
}

// Status einer DSGVO-Anfrage
export enum GdprRequestStatus {
  PENDING = 'pending',      // Ausstehend
  PROCESSING = 'processing', // In Bearbeitung
  COMPLETED = 'completed',  // Abgeschlossen
  REJECTED = 'rejected'     // Abgelehnt
}

// DSGVO-Anfrage
interface GdprRequest {
  id: number;
  userId: number;
  type: GdprRequestType;
  status: GdprRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  data?: any;
}

/**
 * Initialisiert die DSGVO-Anfragentabelle
 */
export async function initializeGdprRequestsTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gdpr_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES tbluser(id),
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        data JSONB
      )
    `);
    
    // Index für die Benutzer-ID hinzufügen
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_requests(user_id)
    `);
    
    console.log('[DSGVO-Manager] DSGVO-Anfragentabelle initialisiert');
    return true;
  } catch (error) {
    console.error('[DSGVO-Manager] Fehler bei der Initialisierung der DSGVO-Anfragentabelle:', error);
    return false;
  }
}

/**
 * Erstellt eine neue DSGVO-Anfrage
 */
export async function createGdprRequest(
  userId: number,
  type: GdprRequestType,
  data?: any
): Promise<number | null> {
  try {
    const result = await db.execute(sql`
      INSERT INTO gdpr_requests (user_id, type, data)
      VALUES (${userId}, ${type}, ${data ? JSON.stringify(data) : null})
      RETURNING id
    `);
    
    console.log(`[DSGVO-Manager] DSGVO-Anfrage vom Typ ${type} für Benutzer ${userId} erstellt`);
    return result[0]?.id || null;
  } catch (error) {
    console.error('[DSGVO-Manager] Fehler beim Erstellen der DSGVO-Anfrage:', error);
    return null;
  }
}

/**
 * Aktualisiert den Status einer DSGVO-Anfrage
 */
export async function updateGdprRequestStatus(
  requestId: number,
  status: GdprRequestStatus,
  data?: any
): Promise<boolean> {
  try {
    // SQL-Abfrage je nach Status
    let query;
    if (status === GdprRequestStatus.COMPLETED) {
      query = sql`
        UPDATE gdpr_requests
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP, data = ${data ? JSON.stringify(data) : sql`data`}
        WHERE id = ${requestId}
      `;
    } else {
      query = sql`
        UPDATE gdpr_requests
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP, data = ${data ? JSON.stringify(data) : sql`data`}
        WHERE id = ${requestId}
      `;
    }
    
    await db.execute(query);
    console.log(`[DSGVO-Manager] Status der DSGVO-Anfrage ${requestId} auf ${status} aktualisiert`);
    return true;
  } catch (error) {
    console.error('[DSGVO-Manager] Fehler beim Aktualisieren des Status der DSGVO-Anfrage:', error);
    return false;
  }
}

/**
 * Verarbeitet eine Auskunftsanfrage (Recht auf Auskunft)
 * Sammelt alle Daten zu einem Benutzer und gibt sie als JSON zurück
 */
export async function processAccessRequest(userId: number, requestId: number): Promise<string | null> {
  try {
    updateGdprRequestStatus(requestId, GdprRequestStatus.PROCESSING);
    
    // Benutzerdaten abrufen
    const userData = await getUserData(userId);
    
    // Status aktualisieren und Daten zurückgeben
    await updateGdprRequestStatus(requestId, GdprRequestStatus.COMPLETED);
    
    return JSON.stringify(userData, null, 2);
  } catch (error) {
    console.error('[DSGVO-Manager] Fehler bei der Verarbeitung der Auskunftsanfrage:', error);
    await updateGdprRequestStatus(requestId, GdprRequestStatus.REJECTED, { error: error.message });
    return null;
  }
}

/**
 * Verarbeitet eine Löschanfrage (Recht auf Vergessenwerden)
 * Löscht oder anonymisiert alle Benutzerdaten
 */
export async function processErasureRequest(userId: number, requestId: number): Promise<boolean> {
  try {
    await updateGdprRequestStatus(requestId, GdprRequestStatus.PROCESSING);
    
    // 1. Benutzerdaten abrufen (für das Protokoll)
    const userData = await getUserData(userId);
    
    // 2. Protokolleintrag erstellen
    await db.execute(sql`
      INSERT INTO activity_logs (user_id, action, description, data)
      VALUES (${userId}, 'gdpr_erasure', 'DSGVO Löschanfrage durchgeführt', ${JSON.stringify({
        requestId,
        timestamp: new Date(),
        type: 'erasure'
      })})
    `);
    
    // 3. Anonymisieren statt Löschen (bessere Praxis für Datenkonsistenz)
    // Beachten Sie, dass wir keinen tatsächlichen DELETE verwenden, sondern die Daten anonymisieren
    
    // Benutzerdaten anonymisieren
    await db.execute(sql`
      UPDATE tbluser
      SET 
        username = 'deleted_user_' || id,
        password = NULL,
        user_name = 'Gelöschter Benutzer',
        user_email = NULL,
        user_phone = NULL,
        user_avatar = NULL,
        gdpr_consent = FALSE,
        deleted_at = CURRENT_TIMESTAMP,
        is_deleted = TRUE
      WHERE id = ${userId}
    `);
    
    // Andere verknüpfte Daten anonymisieren (Beispiele)
    
    // Bautagebuch-Einträge
    await db.execute(sql`
      UPDATE construction_diary
      SET 
        creator_user_id = NULL,
        anonymized = TRUE,
        anonymized_at = CURRENT_TIMESTAMP
      WHERE creator_user_id = ${userId}
    `);
    
    // Nachrichten
    await db.execute(sql`
      UPDATE messages
      SET 
        sender_id = NULL,
        content = '[Inhalt gemäß DSGVO-Anfrage entfernt]',
        anonymized = TRUE,
        anonymized_at = CURRENT_TIMESTAMP
      WHERE sender_id = ${userId}
    `);
    
    // Status der Anfrage aktualisieren
    await updateGdprRequestStatus(requestId, GdprRequestStatus.COMPLETED, {
      completed: true,
      anonymizedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('[DSGVO-Manager] Fehler bei der Verarbeitung der Löschanfrage:', error);
    await updateGdprRequestStatus(requestId, GdprRequestStatus.REJECTED, { error: error.message });
    return false;
  }
}

/**
 * Verarbeitet eine Datenportabilitätsanfrage
 * Exportiert alle Benutzerdaten in einem maschinenlesbaren Format (JSON)
 */
export async function processPortabilityRequest(
  userId: number, 
  requestId: number,
  res: Response
): Promise<boolean> {
  try {
    await updateGdprRequestStatus(requestId, GdprRequestStatus.PROCESSING);
    
    // Temporäres Verzeichnis für den Export
    const exportDir = path.join(__dirname, '../../temp', `gdpr_export_${userId}_${Date.now()}`);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Benutzerdaten abrufen
    const userData = await getUserData(userId);
    
    // Daten in Dateien speichern
    fs.writeFileSync(
      path.join(exportDir, 'user.json'),
      JSON.stringify(userData.user, null, 2),
      'utf8'
    );
    
    fs.writeFileSync(
      path.join(exportDir, 'projects.json'),
      JSON.stringify(userData.projects, null, 2),
      'utf8'
    );
    
    fs.writeFileSync(
      path.join(exportDir, 'construction_diary.json'),
      JSON.stringify(userData.constructionDiary, null, 2),
      'utf8'
    );
    
    // Export als ZIP-Datei
    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = fs.createWriteStream(path.join(exportDir, 'data_export.zip'));
    
    output.on('close', async () => {
      // ZIP-Datei an den Client senden
      res.download(
        path.join(exportDir, 'data_export.zip'),
        `bau_structura_daten_export_${new Date().toISOString().slice(0, 10)}.zip`,
        async (err) => {
          // Temporäres Verzeichnis aufräumen
          if (fs.existsSync(exportDir)) {
            fs.rmSync(exportDir, { recursive: true, force: true });
          }
          
          if (err) {
            console.error('[DSGVO-Manager] Fehler beim Senden der Exportdatei:', err);
            await updateGdprRequestStatus(requestId, GdprRequestStatus.REJECTED, { error: err.message });
          } else {
            await updateGdprRequestStatus(requestId, GdprRequestStatus.COMPLETED, {
              exportedAt: new Date(),
              fileSize: archive.pointer()
            });
          }
        }
      );
    });
    
    archive.pipe(output);
    archive.directory(exportDir, false);
    archive.finalize();
    
    return true;
  } catch (error) {
    console.error('[DSGVO-Manager] Fehler bei der Verarbeitung der Datenportabilitätsanfrage:', error);
    await updateGdprRequestStatus(requestId, GdprRequestStatus.REJECTED, { error: error.message });
    return false;
  }
}

/**
 * Hilfsfunktion: Benutzerinformationen zusammentragen
 */
async function getUserData(userId: number): Promise<any> {
  // Benutzerdaten
  const userResult = await db.execute(sql`
    SELECT 
      id, username, user_name, user_email, user_phone, user_role, 
      created_at, last_login, gdpr_consent
    FROM tbluser 
    WHERE id = ${userId}
  `);
  
  // Projektbeteiligungen
  const projectsResult = await db.execute(sql`
    SELECT p.* 
    FROM projects p 
    JOIN project_users pu ON p.id = pu.project_id 
    WHERE pu.user_id = ${userId}
  `);
  
  // Bautagebuch-Einträge
  const diaryResult = await db.execute(sql`
    SELECT * 
    FROM construction_diary 
    WHERE creator_user_id = ${userId}
  `);
  
  // Weitere relevante Daten...
  
  return {
    user: userResult[0] || {},
    projects: projectsResult || [],
    constructionDiary: diaryResult || [],
    // Weitere Daten...
  };
}