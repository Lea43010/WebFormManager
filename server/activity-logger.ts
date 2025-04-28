/**
 * Activity Logger Service für die Bau-Structura App
 * Protokolliert Benutzeraktivitäten in der Datenbank
 */

import { Request } from 'express';
import { pool } from './db';

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
    
    const query = `
      INSERT INTO tblactivity_logs 
      (user_id, component, action_type, entity_type, entity_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    const values = [
      userId,
      component,
      actionType,
      entityType,
      entityId || null,
      details ? JSON.stringify(details) : null,
      ipAddress || null
    ];
    
    await pool.query(query, values);
    
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
    // Wir bauen die WHERE-Bedingungen und Parameter dynamisch auf
    let conditions: string[] = [];
    let params: any[] = [limit, offset];
    let paramIndex = 3; // Beginnen mit dem dritten Parameter ($3)
    
    if (filters.userId !== undefined) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(filters.userId);
    }
    
    if (filters.component) {
      conditions.push(`component = $${paramIndex++}`);
      params.push(filters.component);
    }
    
    if (filters.actionType) {
      conditions.push(`action_type = $${paramIndex++}`);
      params.push(filters.actionType);
    }
    
    if (filters.entityType) {
      conditions.push(`entity_type = $${paramIndex++}`);
      params.push(filters.entityType);
    }
    
    if (filters.dateFrom) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(filters.dateFrom);
    }
    
    if (filters.dateTo) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(filters.dateTo);
    }
    
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';
    
    const query = `
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
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
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
    // Wir bauen die WHERE-Bedingungen und Parameter dynamisch auf
    let conditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;
    
    if (filters.userId !== undefined) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(filters.userId);
    }
    
    if (filters.component) {
      conditions.push(`component = $${paramIndex++}`);
      params.push(filters.component);
    }
    
    if (filters.actionType) {
      conditions.push(`action_type = $${paramIndex++}`);
      params.push(filters.actionType);
    }
    
    if (filters.entityType) {
      conditions.push(`entity_type = $${paramIndex++}`);
      params.push(filters.entityType);
    }
    
    if (filters.dateFrom) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(filters.dateFrom);
    }
    
    if (filters.dateTo) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(filters.dateTo);
    }
    
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';
    
    const query = `
      SELECT COUNT(*) as total
      FROM tblactivity_logs
      ${whereClause}
    `;
    
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].total, 10);
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
    const query = `
      SELECT DISTINCT component 
      FROM tblactivity_logs 
      ORDER BY component
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => row.component);
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
    const query = `
      SELECT DISTINCT entity_type 
      FROM tblactivity_logs 
      ORDER BY entity_type
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => row.entity_type);
  } catch (error) {
    console.error('Fehler beim Abrufen der Entitätstypen:', error);
    throw error;
  }
}