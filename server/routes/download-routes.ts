/**
 * Verbesserte Download-Routen für die Bau-Structura-App
 * Verwenden Sie diese optimierte Version anstelle der Standard-Routes
 */

import express from "express";
import * as fs from "fs-extra";
import * as path from "path";
import { storage } from "../storage";
import { findFile } from "../file-utils";

// Token-Funktionen aus dem Hauptsystem (müssen später refaktorisiert werden)
let downloadTokens: Record<string, { attachmentId: number, userId: number, timestamp: number }> = {};

// Token für den Download generieren
export function generateDownloadToken(attachmentId: number, user: any): string {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  downloadTokens[token] = {
    attachmentId,
    userId: user.id,
    timestamp: Date.now()
  };
  
  // Token-Bereinigung (entferne Token die älter als 1 Stunde sind)
  const now = Date.now();
  Object.keys(downloadTokens).forEach(t => {
    if (now - downloadTokens[t].timestamp > 60 * 60 * 1000) {
      delete downloadTokens[t];
    }
  });
  
  return token;
}

// Token prüfen
export function verifyDownloadToken(token: string, attachmentId: number, userId: number): boolean {
  const tokenData = downloadTokens[token];
  
  if (!tokenData) return false;
  
  // Prüfen, ob das Token zum Anhang und Benutzer passt
  if (tokenData.attachmentId !== attachmentId || tokenData.userId !== userId) return false;
  
  // Prüfen, ob das Token noch gültig ist (1 Stunde Gültigkeit)
  if (Date.now() - tokenData.timestamp > 60 * 60 * 1000) {
    delete downloadTokens[token];
    return false;
  }
  
  return true;
}

// Token invalidieren
export function invalidateToken(token: string): void {
  delete downloadTokens[token];
}

// Download-Routen einrichten
export function setupEnhancedDownloadRoutes(app: express.Express): void {
  // Erstellt ein Token für den Download einer Datei
  app.get("/api/attachments/:id/token", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const id = parseInt(req.params.id);
      const attachment = await storage.getAttachment(id);
      
      if (!attachment) {
        return res.status(404).json({ message: "Anhang nicht gefunden" });
      }
      
      // Projekt des Anhangs abrufen, um die Berechtigung zu prüfen
      if (attachment.projectId === null) {
        return res.status(400).json({ message: "Anhang ist keinem Projekt zugeordnet" });
      }
      
      const project = await storage.getProject(attachment.projectId);
      if (!project) {
        return res.status(404).json({ message: "Zugehöriges Projekt nicht gefunden" });
      }
      
      // Prüfen, ob der Benutzer diesen Anhang herunterladen darf
      if (req.user.role !== 'administrator' && req.user.role !== 'manager' && project.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung, um diesen Anhang herunterzuladen" });
      }
      
      // Token generieren
      const token = generateDownloadToken(id, req.user);
      
      // Token zurückgeben
      res.json({ token });
    } catch (error) {
      console.error("Error generating download token:", error);
      next(error);
    }
  });
  
  // Download einer Datei mit Token
  app.get("/api/attachments/:id/download", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const token = req.query.token as string;
      
      // Wenn kein Token angegeben, Benutzer zur Token-Anforderung umleiten
      if (!token) {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }
        
        // Umleitung zur Token-Anforderung
        return res.status(403).json({ 
          message: "Token erforderlich für den Dateizugriff", 
          tokenUrl: `/api/attachments/${id}/token` 
        });
      }
      
      // Prüfen, ob der Benutzer authentifiziert ist (für die Token-Validierung)
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Token validieren
      if (!verifyDownloadToken(token, id, req.user.id)) {
        return res.status(403).json({ message: "Ungültiges oder abgelaufenes Token" });
      }
      
      const attachment = await storage.getAttachment(id);
      
      if (!attachment) {
        return res.status(404).json({ message: "Anhang nicht gefunden" });
      }
      
      // Verwende die verbesserte Dateisuche aus file-utils
      console.log(`Suche nach Datei für Anhang mit ID ${id}, Original-Pfad: ${attachment.filePath}, WebP-Pfad: ${attachment.webpPath || "nicht vorhanden"}`);
      
      const foundFilePath = await findFile(attachment.filePath, attachment.webpPath);
      
      if (!foundFilePath) {
        console.error(`Datei konnte unter keinem Pfad gefunden werden.`);
        
        // Markiere den Anhang als "Datei fehlt" in der Datenbank
        try {
          const updatedAttachment = await storage.markAttachmentFileMissing(id);
          console.log(`Anhang mit ID ${id} wurde als fehlend markiert`);
        } catch (markingError) {
          console.error(`Fehler beim Markieren des Anhangs als fehlend:`, markingError);
        }
        
        return res.status(404).json({ 
          message: "Datei konnte nicht gefunden werden",
          details: "Die Datei existiert nicht mehr auf dem Server. Der Anhang wurde als fehlend markiert."
        });
      }
      
      console.log(`Datei gefunden unter: ${foundFilePath}`);
      
      // Nach erfolgreicher Validierung das Token invalidieren
      invalidateToken(token);
      
      // Absoluten Pfad sicherstellen
      const absoluteFilePath = path.resolve(foundFilePath);
      console.log(`Sende Datei mit absolutem Pfad: ${absoluteFilePath}`);
      
      // Korrekte Header für den Download setzen
      const fileName = encodeURIComponent(attachment.fileName);
      res.setHeader("Content-Type", attachment.fileType === "pdf" ? "application/pdf" : 
                                   attachment.fileType === "excel" ? "application/vnd.ms-excel" : 
                                   attachment.fileType === "image" ? "image/jpeg" : "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      
      // Versuchen, die Datei mit umfassendem Error-Handling zu senden
      try {
        const stat = await fs.stat(absoluteFilePath);
        
        // Content-Length setzen
        res.setHeader("Content-Length", stat.size);
        
        // Datei-Stream erstellen und an die Response pipen
        const fileStream = fs.createReadStream(absoluteFilePath);
        
        // Error-Handler für den Stream
        fileStream.on('error', (streamError) => {
          console.error(`Stream-Fehler: ${streamError.message}`);
          if (!res.headersSent) {
            res.status(500).json({ message: "Fehler beim Streamen der Datei" });
          } else {
            res.end();
          }
        });
        
        // Stream an die Response anhängen
        fileStream.pipe(res);
        
        console.log(`Stream-basierter Download gestartet: ${absoluteFilePath}`);
      } catch (error) {
        console.error(`Fehler beim Download-Prozess:`, error);
        if (!res.headersSent) {
          return res.status(500).json({ message: "Datei konnte nicht bereitgestellt werden" });
        }
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      next(error);
    }
  });
}