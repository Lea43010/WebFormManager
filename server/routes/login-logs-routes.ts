/**
 * API-Routen für das Login-Logs-Protokoll
 */

import express from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// Middleware für Administrator-Berechtigung
function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Nicht authentifiziert" });
  }
  
  const user = req.user as { role?: string };
  if (user.role !== 'administrator') {
    return res.status(403).json({ message: "Keine Berechtigung. Diese Funktion steht nur Administratoren zur Verfügung." });
  }
  
  next();
}

/**
 * Login-Logs abfragen mit Paginierung und Filtern
 */
async function getLoginLogs(
  limit: number = 100, 
  offset: number = 0, 
  filters: Record<string, any> = {}
): Promise<any[]> {
  try {
    // Basisabfrage
    let query = sql`
      SELECT *
      FROM tbllogin_logs
      ORDER BY timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const result = await db.execute(query);
    return result.rows || [];
  } catch (error: unknown) {
    console.error('Fehler beim Abrufen der Login-Logs:', error);
    throw error;
  }
}

/**
 * Anzahl der Login-Logs abfragen für Paginierung
 */
async function countLoginLogs(filters: Record<string, any> = {}): Promise<number> {
  try {
    // Basisabfrage für die Gesamtanzahl
    const countQuery = sql`SELECT COUNT(*) as count FROM tbllogin_logs`;
    
    const result = await db.execute(countQuery);
    const count = result.rows?.[0]?.count;
    return parseInt(count ? count.toString() : '0', 10);
  } catch (error: unknown) {
    console.error('Fehler beim Zählen der Login-Logs:', error);
    throw error;
  }
}

// Login-Logs API-Routes einrichten
export function setupLoginLogsRoutes(app: express.Express) {
  // Login-Logs abfragen
  app.get('/api/admin/login-logs', isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string || '50', 10);
      const offset = parseInt(req.query.offset as string || '0', 10);
      
      // Filter aus Query-Parametern extrahieren
      const filters: any = {};
      
      // Daten und Gesamtanzahl parallel abrufen
      const [logs, total] = await Promise.all([
        getLoginLogs(limit, offset, filters),
        countLoginLogs(filters)
      ]);
      
      res.json({
        logs,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error: unknown) {
      console.error('Fehler beim Abrufen der Login-Logs:', error);
      res.status(500).json({ 
        message: 'Fehler beim Abrufen der Login-Logs', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Anzahl der Login-Logs abfragen (für Dashboards und Übersichten)
  app.get('/api/admin/login-logs/count', isAdmin, async (req, res) => {
    try {
      const filters: Record<string, any> = {};
      const count = await countLoginLogs(filters);
      res.json({ count });
    } catch (error: unknown) {
      console.error('Fehler beim Zählen der Login-Logs:', error);
      res.status(500).json({ 
        message: 'Fehler beim Zählen der Login-Logs', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  console.log('[INFO] [login-logs] Login-Logs-API-Endpunkte eingerichtet');
}