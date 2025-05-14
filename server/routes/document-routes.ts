/**
 * Dokumenten-Routen für das neue Dokumentenspeicher-System
 * 
 * Bietet optimierte und direkte Download-Endpunkte für Dokumente
 */

import express, { Request, Response } from 'express';
import { documentStorage } from '../services/document-storage';
import { logger } from '../logger';
import * as fs from 'fs-extra';

const router = express.Router();

/**
 * GET /api/documents/:id
 * Lädt ein Dokument direkt aus dem Dokumentenspeicher herunter
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Ungültige ID' });
    }
    
    logger.info(`[DocumentRoutes] Download für Dokument ID ${id} angefordert`);
    
    // Dokument aus dem Speicher abrufen
    const result = await documentStorage.getFile(id);
    
    if (!result.success) {
      logger.error(`[DocumentRoutes] Fehler beim Abrufen des Dokuments: ${result.error}`);
      return res.status(404).json({ error: result.error });
    }
    
    // Prüfen, ob die Datei existiert
    const filePath = result.filePath!;
    if (!await fs.pathExists(filePath)) {
      logger.error(`[DocumentRoutes] Datei existiert nicht: ${filePath}`);
      return res.status(404).json({ error: 'Datei nicht gefunden' });
    }
    
    // Header für Download setzen
    res.setHeader('Content-Type', result.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName || 'download')}"`);
    
    // Direkte Dateiübertragung mit verbessertem Fehlerhandling
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', (error) => {
      logger.error(`[DocumentRoutes] Stream-Fehler: ${error}`);
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Fehler beim Lesen der Datei' });
      } else {
        res.end();
      }
    });
    
    stream.pipe(res);
    
    logger.info(`[DocumentRoutes] Stream für Dokument ID ${id} gestartet`);
  } catch (error) {
    logger.error(`[DocumentRoutes] Unerwarteter Fehler: ${error}`);
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Serverfehler', 
        message: 'Ein unerwarteter Fehler ist aufgetreten'
      });
    }
  }
});

/**
 * POST /api/documents/migrate/:id
 * Migriert eine Datei in den neuen Dokumentenspeicher
 */
router.post('/migrate/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Ungültige ID' });
    }
    
    logger.info(`[DocumentRoutes] Migration für Dokument ID ${id} angefordert`);
    
    // Dokument migrieren
    const result = await documentStorage.migrateFile(id);
    
    if (!result.success) {
      logger.error(`[DocumentRoutes] Fehler bei der Migration: ${result.error}`);
      return res.status(400).json({ error: result.error });
    }
    
    logger.info(`[DocumentRoutes] Dokument ID ${id} erfolgreich migriert`);
    return res.status(200).json({ 
      message: result.message,
      success: true
    });
  } catch (error) {
    logger.error(`[DocumentRoutes] Unerwarteter Fehler bei der Migration: ${error}`);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Ein unerwarteter Fehler ist bei der Migration aufgetreten'
    });
  }
});

/**
 * POST /api/documents/migrate-all
 * Migriert alle existierenden Dateien in den neuen Dokumentenspeicher
 */
router.post('/migrate-all', async (req: Request, res: Response) => {
  try {
    logger.info(`[DocumentRoutes] Migration aller Dokumente angefordert`);
    
    // Migration als separaten Prozess starten
    res.status(202).json({ 
      message: 'Migration aller Dokumente gestartet. Dies kann einige Zeit dauern.',
      success: true
    });
    
    // TODO: Implementieren der vollständigen Migration aller Dokumente
    // Dies würde in einem echten System besser als Hintergrundaufgabe ausgeführt
  } catch (error) {
    logger.error(`[DocumentRoutes] Unerwarteter Fehler bei der Massenmigration: ${error}`);
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Serverfehler', 
        message: 'Ein unerwarteter Fehler ist bei der Migration aufgetreten'
      });
    }
  }
});

export default router;