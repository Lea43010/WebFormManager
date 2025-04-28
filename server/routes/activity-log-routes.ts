/**
 * API-Routen für das Aktivitätsprotokoll
 */

import express from 'express';
import { ActionType, getActivityLogs, countActivityLogs, getDistinctComponents, getDistinctEntityTypes } from '../activity-logger';

// Middleware für Administrator-Berechtigung
const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Nicht autorisiert' });
  }
  
  const user = req.user as any;
  if (user.role !== 'administrator') {
    console.log(`Zugriff verweigert für Benutzer mit Rolle: ${user.role}`);
    return res.status(403).json({ 
      message: 'Keine ausreichenden Berechtigungen', 
      userRole: user.role,
      requiredRole: 'administrator'
    });
  }
  
  next();
};

export function setupActivityLogRoutes(app: express.Express) {
  // Aktivitätsprotokolle abrufen
  app.get('/api/admin/activity-logs', isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string || '50', 10);
      const offset = parseInt(req.query.offset as string || '0', 10);
      
      // Filter aus Query-Parametern extrahieren
      const filters: any = {};
      
      if (req.query.userId) {
        filters.userId = parseInt(req.query.userId as string, 10);
      }
      
      if (req.query.component) {
        filters.component = req.query.component;
      }
      
      if (req.query.actionType) {
        filters.actionType = req.query.actionType;
      }
      
      if (req.query.entityType) {
        filters.entityType = req.query.entityType;
      }
      
      if (req.query.dateFrom) {
        filters.dateFrom = req.query.dateFrom;
      }
      
      if (req.query.dateTo) {
        filters.dateTo = req.query.dateTo;
      }
      
      // Daten und Gesamtanzahl parallel abrufen
      const [logs, total] = await Promise.all([
        getActivityLogs(limit, offset, filters),
        countActivityLogs(filters)
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
    } catch (error) {
      console.error('Fehler beim Abrufen der Aktivitätsprotokolle:', error);
      res.status(500).json({ 
        message: 'Fehler beim Abrufen der Aktivitätsprotokolle', 
        error: (error as Error).message 
      });
    }
  });
  
  // Verfügbare Filter-Optionen abrufen
  app.get('/api/admin/activity-logs/filters', isAdmin, async (req, res) => {
    try {
      // Alle Filter-Optionen parallel abrufen
      const [components, entityTypes] = await Promise.all([
        getDistinctComponents(),
        getDistinctEntityTypes()
      ]);
      
      // ActionTypes sind Enum-Werte
      const actionTypes = Object.values(ActionType);
      
      res.json({
        components,
        actionTypes,
        entityTypes
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Filter-Optionen:', error);
      res.status(500).json({ 
        message: 'Fehler beim Abrufen der Filter-Optionen', 
        error: (error as Error).message 
      });
    }
  });
  
  // Anzahl der Aktivitätsprotokolle abfragen (für Dashboards und Übersichten)
  app.get('/api/admin/activity-logs/count', isAdmin, async (req, res) => {
    try {
      const count = await countActivityLogs({});
      res.json({ count });
    } catch (error) {
      console.error('Fehler beim Zählen der Aktivitätsprotokolle:', error);
      res.status(500).json({ 
        message: 'Fehler beim Zählen der Aktivitätsprotokolle', 
        error: (error as Error).message 
      });
    }
  });
  
  console.log('[INFO] [activity-log] Aktivitätsprotokoll-API-Endpunkte eingerichtet');
}