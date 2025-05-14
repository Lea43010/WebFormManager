/**
 * Bodenanalyse-API-Routen
 * 
 * Diese Datei stellt API-Endpunkte für die Bodenanalyse-Funktionalität bereit.
 * Die Bodenanalyse basiert auf BGR-WFS-Anfragen und unterstützt sowohl Einzelpunkt-
 * als auch Batch-Abfragen von Bodenarten.
 */

import express from 'express';
import multer from 'multer';
import { queryBGRWfs, queryBGRWfsPoints } from '../services/bodenanalyse-service';
import logger from '../logger';
import { isAuthenticated as validateToken } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Konfiguration für temporäre Datei-Uploads
const upload = multer({
  dest: 'uploads/temp/', 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB maximale Dateigröße
});

const router = express.Router();

// Authentifizierung für alle Routen erzwingen
router.use(validateToken);

/**
 * @route GET /api/soil-analysis/point
 * @description Einzelpunkt-Bodenanalyse basierend auf Koordinaten
 * @param {float} lat - Breitengrad (WGS84)
 * @param {float} lng - Längengrad (WGS84)
 * @returns {object} Bodenanalyse-Ergebnisse
 */
router.get('/point', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude und Longitude müssen angegeben werden"
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: "Latitude und Longitude müssen gültige Zahlen sein"
      });
    }

    // BGR-WFS-Abfrage ausführen
    const result = await queryBGRWfs(latitude, longitude);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`Fehler bei Bodenanalyse-Punktabfrage: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Fehler bei der Bodenanalyse",
      error: error.message
    });
  }
});

/**
 * @route POST /api/soil-analysis/batch
 * @description Batch-Bodenanalyse basierend auf einer Liste von Koordinaten
 * @body {array} points - Array von Koordinaten-Objekten mit lat und lng
 * @returns {object} Bodenanalyse-Ergebnisse für alle Punkte
 */
router.post('/batch', async (req, res) => {
  try {
    const { points } = req.body;
    
    if (!points || !Array.isArray(points)) {
      return res.status(400).json({
        success: false,
        message: "Ein gültiges Array von Punkten muss übermittelt werden"
      });
    }
    
    // Validierung der Eingabedaten
    const validPoints = points.filter(point => 
      point && typeof point === 'object' && 
      'lat' in point && 'lng' in point &&
      !isNaN(parseFloat(point.lat)) && !isNaN(parseFloat(point.lng))
    );
    
    if (validPoints.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Keine gültigen Koordinaten gefunden"
      });
    }
    
    // Batch-Abfrage für alle Punkte ausführen
    const results = await queryBGRWfsPoints(validPoints);
    
    return res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Fehler bei Bodenanalyse-Batch-Abfrage: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Fehler bei der Batch-Bodenanalyse",
      error: error.message
    });
  }
});

/**
 * @route POST /api/soil-analysis/upload
 * @description CSV-Upload mit Koordinaten für Batch-Bodenanalyse
 * @param {file} csv - CSV-Datei mit Koordinaten (lat,lng Format)
 * @returns {object} Bodenanalyse-Ergebnisse für alle Punkte in der CSV
 */
router.post('/upload', upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Keine CSV-Datei hochgeladen"
      });
    }
    
    // CSV-Datei lesen
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    
    // CSV parsen
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    // Temporäre Datei löschen
    fs.unlinkSync(req.file.path);
    
    if (!records || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Keine gültigen Datensätze in der CSV-Datei gefunden"
      });
    }
    
    // Punkte aus CSV extrahieren
    const points = records.map(record => {
      // Verschiedene Spaltenbenennungen unterstützen
      const lat = record.lat || record.latitude || record.breitengrad;
      const lng = record.lng || record.lon || record.longitude || record.laengengrad;
      
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
    }).filter(point => !isNaN(point.lat) && !isNaN(point.lng));
    
    if (points.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Keine gültigen Koordinaten in der CSV-Datei gefunden"
      });
    }
    
    // Batch-Abfrage für alle Punkte ausführen
    const results = await queryBGRWfsPoints(points);
    
    return res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Fehler bei Bodenanalyse-CSV-Upload: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Fehler bei der Verarbeitung der CSV-Datei",
      error: error.message
    });
  }
});

export default router;