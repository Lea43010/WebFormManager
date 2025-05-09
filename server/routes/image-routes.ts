import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import logger from '../logger';
import { browserSupportsWebP } from '../services/image-optimizer';

// Pfad für Uploads
const uploadsDir = path.join(process.cwd(), 'uploads');

/**
 * Cache für Bild-Metadaten
 * Key: Bild-ID oder Pfad, Value: Metadaten
 */
const imageMetadataCache = new Map<string, any>();

/**
 * Initialisiert die Bildrouten für den Express-Server
 */
export function setupImageRoutes(app: express.Express) {
  /**
   * Route für optimierte Bildauslieferung
   * Liefert automatisch WebP aus wenn unterstützt
   */
  app.get('/uploads/:filename(*)', (req, res, next) => {
    try {
      const filename = req.params.filename;
      
      // Vollständigen Pfad zur Datei ermitteln
      const filePath = path.join(uploadsDir, filename);
      
      // Prüfen ob die Datei existiert
      if (!fs.existsSync(filePath)) {
        return next(); // Weiter zur nächsten Middleware
      }
      
      // Prüfen ob es sich um ein Bild handelt
      const ext = path.extname(filePath).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      
      if (!isImage) {
        return next(); // Weiter zur nächsten Middleware
      }
      
      // Webp-Support prüfen und optimierte Version auswählen
      const acceptHeader = req.headers.accept || '';
      const supportsWebp = browserSupportsWebP(acceptHeader);
      
      // Optimierte Pfade berechnen
      const fileBaseName = path.basename(filePath, ext);
      const fileDirName = path.dirname(filePath);
      
      // Optimierte Pfade berechnen
      const optimizedPath = path.join(fileDirName, `${fileBaseName}-optimized${ext}`);
      const webpPath = path.join(fileDirName, `${fileBaseName}-optimized.webp`);
      
      // Bevorzugt WebP senden wenn unterstützt
      if (supportsWebp && fs.existsSync(webpPath)) {
        res.setHeader('Content-Type', 'image/webp');
        res.sendFile(webpPath);
      } 
      // Optimierte Originalversion senden wenn vorhanden
      else if (fs.existsSync(optimizedPath)) {
        const contentType = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp'
        }[ext] || 'application/octet-stream';
        
        res.setHeader('Content-Type', contentType);
        res.sendFile(optimizedPath);
      } 
      // Fallback zur Originaldatei
      else {
        next();
      }
    } catch (error) {
      logger.error(`Fehler beim Bereitstellen des optimierten Bildes: ${error}`);
      next();
    }
  });
  
  /**
   * API zur Bereitstellung von Bild-Metadaten (öffentlich zugänglich)
   * Gibt Informationen über Bildgröße und Blur-Hash zurück
   */
  app.get('/api/image-metadata/:filename(*)', async (req, res) => {
    try {
      const filename = req.params.filename;
      
      // Prüfen ob Metadaten im Cache sind
      if (imageMetadataCache.has(filename)) {
        return res.json(imageMetadataCache.get(filename));
      }
      
      // Vollständigen Pfad zur Datei ermitteln
      const filePath = path.join(uploadsDir, filename);
      
      // Prüfen ob die Datei existiert
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Bild nicht gefunden' });
      }
      
      // Prüfen ob es sich um ein Bild handelt
      const ext = path.extname(filePath).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      
      if (!isImage) {
        return res.status(400).json({ error: 'Die Datei ist kein Bild' });
      }
      
      // Optimierte Pfade berechnen
      const fileBaseName = path.basename(filePath, ext);
      const fileDirName = path.dirname(filePath);
      
      // Metadaten zusammenstellen
      const metadata: any = {
        original: filePath,
        width: 0,
        height: 0,
        blurHash: null,
        formats: {}
      };
      
      // Prüfen ob optimierte Versionen existieren
      const optimizedPath = path.join(fileDirName, `${fileBaseName}-optimized${ext}`);
      const webpPath = path.join(fileDirName, `${fileBaseName}-optimized.webp`);
      const thumbnailPath = path.join(fileDirName, `${fileBaseName}-thumb${ext}`);
      const thumbnailWebpPath = path.join(fileDirName, `${fileBaseName}-thumb.webp`);
      
      if (fs.existsSync(optimizedPath)) {
        metadata.formats.optimized = `/uploads/${path.relative(uploadsDir, optimizedPath)}`;
      }
      
      if (fs.existsSync(webpPath)) {
        metadata.formats.webp = `/uploads/${path.relative(uploadsDir, webpPath)}`;
      }
      
      if (fs.existsSync(thumbnailPath)) {
        metadata.formats.thumbnail = `/uploads/${path.relative(uploadsDir, thumbnailPath)}`;
      }
      
      if (fs.existsSync(thumbnailWebpPath)) {
        metadata.formats.thumbnailWebp = `/uploads/${path.relative(uploadsDir, thumbnailWebpPath)}`;
      }
      
      // Nach Blur-Hash im optimierten Bild suchen
      const blurPlaceholderPath = path.join(fileDirName, `${fileBaseName}-blur.txt`);
      if (fs.existsSync(blurPlaceholderPath)) {
        metadata.blurHash = fs.readFileSync(blurPlaceholderPath, 'utf8');
      }
      
      // Metadaten im Cache speichern
      imageMetadataCache.set(filename, metadata);
      
      res.json(metadata);
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Bildmetadaten: ${error}`);
      res.status(500).json({ error: 'Fehler beim Abrufen der Bildmetadaten' });
    }
  });
  
  /**
   * API zur Bereitstellung von Attachment-Metadaten (mit Authentifizierung)
   */
  app.get('/api/attachments/:id/metadata', isAuthenticated, async (req, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      
      // Prüfen ob Metadaten im Cache sind
      const cacheKey = `attachment-${attachmentId}`;
      if (imageMetadataCache.has(cacheKey)) {
        return res.json(imageMetadataCache.get(cacheKey));
      }
      
      // Attachment aus Datenbank abrufen
      const attachment = await storage.getAttachment(attachmentId);
      
      if (!attachment) {
        return res.status(404).json({ error: 'Anhang nicht gefunden' });
      }
      
      // Prüfen ob es sich um ein Bild handelt
      if (attachment.fileType !== 'image') {
        return res.status(400).json({ error: 'Der Anhang ist kein Bild' });
      }
      
      // Pfad prüfen
      if (!fs.existsSync(attachment.filePath)) {
        return res.status(404).json({ error: 'Bilddatei nicht gefunden' });
      }
      
      // Exakte Dateierweiterung aus dem Dateipfad ermitteln
      const ext = path.extname(attachment.filePath).toLowerCase();
      
      // Optimierte Pfade berechnen
      const fileBaseName = path.basename(attachment.filePath, ext);
      const fileDirName = path.dirname(attachment.filePath);
      
      // Metadaten zusammenstellen
      const metadata: any = {
        id: attachmentId,
        original: attachment.filePath,
        width: 0,
        height: 0,
        blurHash: null,
        formats: {}
      };
      
      // Prüfen ob optimierte Versionen existieren
      const optimizedPath = path.join(fileDirName, `${fileBaseName}-optimized${ext}`);
      const webpPath = path.join(fileDirName, `${fileBaseName}-optimized.webp`);
      const thumbnailPath = path.join(fileDirName, `${fileBaseName}-thumb${ext}`);
      const thumbnailWebpPath = path.join(fileDirName, `${fileBaseName}-thumb.webp`);
      
      // URL mit Token für sicheren Download
      metadata.formats.original = `/api/attachments/${attachmentId}/download`;
      
      if (fs.existsSync(optimizedPath)) {
        metadata.formats.optimized = `/api/attachments/${attachmentId}/optimized`;
      }
      
      if (fs.existsSync(webpPath)) {
        metadata.formats.webp = `/api/attachments/${attachmentId}/webp`;
      }
      
      if (fs.existsSync(thumbnailPath)) {
        metadata.formats.thumbnail = `/api/attachments/${attachmentId}/thumbnail`;
      }
      
      if (fs.existsSync(thumbnailWebpPath)) {
        metadata.formats.thumbnailWebp = `/api/attachments/${attachmentId}/thumbnail-webp`;
      }
      
      // Nach Blur-Hash im optimierten Bild suchen
      const blurPlaceholderPath = path.join(fileDirName, `${fileBaseName}-blur.txt`);
      if (fs.existsSync(blurPlaceholderPath)) {
        metadata.blurHash = fs.readFileSync(blurPlaceholderPath, 'utf8');
      }
      
      // Metadaten im Cache speichern
      imageMetadataCache.set(cacheKey, metadata);
      
      res.json(metadata);
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Attachment-Metadaten: ${error}`);
      res.status(500).json({ error: 'Fehler beim Abrufen der Attachment-Metadaten' });
    }
  });
  
  /**
   * Optimierte Versionen von Attachments bereitstellen
   */
  app.get('/api/attachments/:id/optimized', isAuthenticated, async (req, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const attachment = await storage.getAttachment(attachmentId);
      
      if (!attachment) {
        return res.status(404).json({ error: 'Anhang nicht gefunden' });
      }
      
      // Prüfen ob es sich um ein Bild handelt
      if (attachment.fileType !== 'image') {
        return res.status(400).json({ error: 'Der Anhang ist kein Bild' });
      }
      
      // Optimierte Version bereitstellen
      const ext = path.extname(attachment.filePath).toLowerCase();
      const fileBaseName = path.basename(attachment.filePath, ext);
      const fileDirName = path.dirname(attachment.filePath);
      const optimizedPath = path.join(fileDirName, `${fileBaseName}-optimized${ext}`);
      
      if (!fs.existsSync(optimizedPath)) {
        return res.status(404).json({ error: 'Optimierte Version nicht gefunden' });
      }
      
      const contentType = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      }[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.sendFile(optimizedPath);
      
    } catch (error) {
      logger.error(`Fehler beim Bereitstellen des optimierten Attachments: ${error}`);
      res.status(500).json({ error: 'Fehler beim Bereitstellen des optimierten Attachments' });
    }
  });
  
  /**
   * WebP-Version von Attachments bereitstellen
   */
  app.get('/api/attachments/:id/webp', isAuthenticated, async (req, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const attachment = await storage.getAttachment(attachmentId);
      
      if (!attachment) {
        return res.status(404).json({ error: 'Anhang nicht gefunden' });
      }
      
      // Prüfen ob es sich um ein Bild handelt
      if (attachment.fileType !== 'image') {
        return res.status(400).json({ error: 'Der Anhang ist kein Bild' });
      }
      
      // WebP-Version bereitstellen
      const ext = path.extname(attachment.filePath).toLowerCase();
      const fileBaseName = path.basename(attachment.filePath, ext);
      const fileDirName = path.dirname(attachment.filePath);
      const webpPath = path.join(fileDirName, `${fileBaseName}-optimized.webp`);
      
      if (!fs.existsSync(webpPath)) {
        return res.status(404).json({ error: 'WebP-Version nicht gefunden' });
      }
      
      res.setHeader('Content-Type', 'image/webp');
      res.sendFile(webpPath);
      
    } catch (error) {
      logger.error(`Fehler beim Bereitstellen der WebP-Version des Attachments: ${error}`);
      res.status(500).json({ error: 'Fehler beim Bereitstellen der WebP-Version des Attachments' });
    }
  });
  
  /**
   * Thumbnail-Version von Attachments bereitstellen
   */
  app.get('/api/attachments/:id/thumbnail', isAuthenticated, async (req, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const attachment = await storage.getAttachment(attachmentId);
      
      if (!attachment) {
        return res.status(404).json({ error: 'Anhang nicht gefunden' });
      }
      
      // Prüfen ob es sich um ein Bild handelt
      if (attachment.fileType !== 'image') {
        return res.status(400).json({ error: 'Der Anhang ist kein Bild' });
      }
      
      // Thumbnail-Version bereitstellen
      const ext = path.extname(attachment.filePath).toLowerCase();
      const fileBaseName = path.basename(attachment.filePath, ext);
      const fileDirName = path.dirname(attachment.filePath);
      const thumbnailPath = path.join(fileDirName, `${fileBaseName}-thumb${ext}`);
      
      if (!fs.existsSync(thumbnailPath)) {
        return res.status(404).json({ error: 'Thumbnail-Version nicht gefunden' });
      }
      
      const contentType = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      }[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.sendFile(thumbnailPath);
      
    } catch (error) {
      logger.error(`Fehler beim Bereitstellen des Thumbnails: ${error}`);
      res.status(500).json({ error: 'Fehler beim Bereitstellen des Thumbnails' });
    }
  });
  
  /**
   * WebP-Thumbnail-Version von Attachments bereitstellen
   */
  app.get('/api/attachments/:id/thumbnail-webp', isAuthenticated, async (req, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const attachment = await storage.getAttachment(attachmentId);
      
      if (!attachment) {
        return res.status(404).json({ error: 'Anhang nicht gefunden' });
      }
      
      // Prüfen ob es sich um ein Bild handelt
      if (attachment.fileType !== 'image') {
        return res.status(400).json({ error: 'Der Anhang ist kein Bild' });
      }
      
      // WebP-Thumbnail-Version bereitstellen
      const ext = path.extname(attachment.filePath).toLowerCase();
      const fileBaseName = path.basename(attachment.filePath, ext);
      const fileDirName = path.dirname(attachment.filePath);
      const thumbnailWebpPath = path.join(fileDirName, `${fileBaseName}-thumb.webp`);
      
      if (!fs.existsSync(thumbnailWebpPath)) {
        return res.status(404).json({ error: 'WebP-Thumbnail-Version nicht gefunden' });
      }
      
      res.setHeader('Content-Type', 'image/webp');
      res.sendFile(thumbnailWebpPath);
      
    } catch (error) {
      logger.error(`Fehler beim Bereitstellen des WebP-Thumbnails: ${error}`);
      res.status(500).json({ error: 'Fehler beim Bereitstellen des WebP-Thumbnails' });
    }
  });
}