/**
 * Activity Logger Service für die Bau-Structura App
 * Protokolliert Benutzeraktivitäten in der Datenbank
 */

import { Request } from 'express';
import { db } from './db';
import { sql } from 'drizzle-orm';

// Typen für die Aktivitätsprotokolle
export enum ActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT'
}

export interface ActivityLogData {
  userId: number;
  component: string;
  actionType: ActionType;
  entityType: string;
  entityId?: number;
  details?: any;
  ipAddress?: string;
}

/**
 * Protokolliert eine Benutzeraktivität in der Datenbank
 */
export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    const { userId, component, actionType, entityType, entityId, details, ipAddress } = data;
    
    // Direkte SQL-Ausführung mit Drizzle
    await db.execute(sql`
      INSERT INTO tblactivity_logs 
      (user_id, component, action_type, entity_type, entity_id, details, ip_address)
      VALUES (${userId}, ${component}, ${actionType}, ${entityType}, ${entityId || null}, 
              ${details ? JSON.stringify(details) : null}, ${ipAddress || null})
    `);
    
    console.log(`[ActivityLogger] ${actionType} auf ${component} (${entityType} ID: ${entityId}) durch Benutzer ${userId}`);
  } catch (error) {
    console.error('Fehler beim Protokollieren der Aktivität:', error);
    // Wir werfen den Fehler nicht weiter, da das Loggen nicht den Hauptprozess stören sollte
  }
}

/**
 * Hilfsfunktion zum Extrahieren der IP-Adresse aus der Anfrage
 */
export function getIpAddress(req: Request): string {
  return req.ip || 
    (req.headers['x-forwarded-for'] as string) || 
    req.socket.remoteAddress || 
    'unbekannt';
}

/**
 * Holt die neuesten Aktivitätsprotokolle aus der Datenbank
 */
export async function getActivityLogs(
  limit: number = 100, 
  offset: number = 0, 
  filters: Partial<{ 
    userId: number, 
    component: string, 
    actionType: ActionType, 
    entityType: string,
    dateFrom: string,
    dateTo: string
  }> = {}
): Promise<any[]> {
  try {
    // Dynamisch erstellte WHERE-Kondition
    let whereConditions = [];
    
    if (filters.userId !== undefined) {
      whereConditions.push(sql`al.user_id = ${filters.userId}`);
    }
    
    if (filters.component) {
      whereConditions.push(sql`al.component = ${filters.component}`);
    }
    
    if (filters.actionType) {
      whereConditions.push(sql`al.action_type = ${filters.actionType}`);
    }
    
    if (filters.entityType) {
      whereConditions.push(sql`al.entity_type = ${filters.entityType}`);
    }
    
    if (filters.dateFrom) {
      whereConditions.push(sql`al.created_at >= ${filters.dateFrom}`);
    }
    
    if (filters.dateTo) {
      whereConditions.push(sql`al.created_at <= ${filters.dateTo}`);
    }
    
    // Basisabfrage ohne WHERE-Klausel
    let baseQuery = sql`
      SELECT 
        al.id, 
        al.user_id, 
        u.username,
        u.user_name,
        al.component, 
        al.action_type, 
        al.entity_type, 
        al.entity_id, 
        al.details, 
        al.created_at, 
        al.ip_address
      FROM tblactivity_logs al
      LEFT JOIN tbluser u ON al.user_id = u.id
    `;
    
    // WHERE-Klausel hinzufügen, wenn Filter vorhanden sind
    if (whereConditions.length > 0) {
      const whereClause = sql.join(whereConditions, sql` AND `);
      baseQuery = sql`${baseQuery} WHERE ${whereClause}`;
    }
    
    // Sortierung und Limit hinzufügen
    const query = sql`${baseQuery} ORDER BY al.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    // Ausführen der Abfrage
    const result = await db.execute(query);
    
    if (!result || !result.rows) {
      return [];
    }
    
    return result.rows as any[];
  } catch (error) {
    console.error('Fehler beim Abrufen der Aktivitätsprotokolle:', error);
    throw error;
  }
}

/**
 * Zählt die Gesamtanzahl der Aktivitätsprotokolle für die Paginierung
 */
export async function countActivityLogs(
  filters: Partial<{ 
    userId: number, 
    component: string, 
    actionType: ActionType, 
    entityType: string,
    dateFrom: string,
    dateTo: string
  }> = {}
): Promise<number> {
  try {
    // Dynamisch erstellte WHERE-Kondition
    let whereConditions = [];
    
    if (filters.userId !== undefined) {
      whereConditions.push(sql`user_id = ${filters.userId}`);
    }
    
    if (filters.component) {
      whereConditions.push(sql`component = ${filters.component}`);
    }
    
    if (filters.actionType) {
      whereConditions.push(sql`action_type = ${filters.actionType}`);
    }
    
    if (filters.entityType) {
      whereConditions.push(sql`entity_type = ${filters.entityType}`);
    }
    
    if (filters.dateFrom) {
      whereConditions.push(sql`created_at >= ${filters.dateFrom}`);
    }
    
    if (filters.dateTo) {
      whereConditions.push(sql`created_at <= ${filters.dateTo}`);
    }
    
    // Basisabfrage ohne WHERE-Klausel
    let countQuery = sql`SELECT COUNT(*) as total FROM tblactivity_logs`;
    
    // WHERE-Klausel hinzufügen, wenn Filter vorhanden sind
    if (whereConditions.length > 0) {
      const whereClause = sql.join(whereConditions, sql` AND `);
      countQuery = sql`${countQuery} WHERE ${whereClause}`;
    }
    
    // Ausführen der Abfrage
    const result = await db.execute(countQuery);
    
    if (!result || !result.rows || result.rows.length === 0) {
      return 0; // Falls keine Ergebnisse, geben wir 0 zurück
    }
    
    // Wir müssen auf das erste Element in den rows zugreifen
    const total = result.rows[0].total;
    return parseInt(typeof total === 'string' ? total : String(total), 10);
  } catch (error) {
    console.error('Fehler beim Zählen der Aktivitätsprotokolle:', error);
    throw error;
  }
}

/**
 * Holt die verfügbaren Komponenten für Filter-Dropdowns
 */
export async function getDistinctComponents(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT component 
      FROM tblactivity_logs 
      ORDER BY component
    `);
    
    if (!result || !result.rows) {
      return [];
    }
    
    return result.rows.map(row => String(row.component));
  } catch (error) {
    console.error('Fehler beim Abrufen der Komponenten:', error);
    throw error;
  }
}

/**
 * Holt die verfügbaren Entitätstypen für Filter-Dropdowns
 */
export async function getDistinctEntityTypes(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT entity_type 
      FROM tblactivity_logs 
      ORDER BY entity_type
    `);
    
    if (!result || !result.rows) {
      return [];
    }
    
    return result.rows.map(row => String(row.entity_type || ''));
  } catch (error) {
    console.error('Fehler beim Abrufen der Entitätstypen:', error);
    throw error;
  }
}