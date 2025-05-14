/**
 * Bodenanalyse API-Routen
 */
import express from 'express';
import bodenanalyseService from '../services/bodenanalyse-service';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate-Limiting für BGR-API-Anfragen
const soilAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // 100 Anfragen pro IP innerhalb des Zeitfensters
  message: {
    status: 429,
    message: 'Zu viele Anfragen, bitte versuchen Sie es später erneut.'
  }
});

/**
 * GET /api/soil-analysis/classifications
 * Liefert alle verfügbaren Bodenklassifikationen
 */
router.get('/classifications', (req, res) => {
  try {
    const classifications = Object.keys(bodenanalyseService.getColorMapping().colorMapping);
    res.json({ classifications });
  } catch (error) {
    console.error('Fehler beim Abrufen der Klassifikationen:', error);
    res.status(500).json({ 
      message: 'Fehler beim Abrufen der Klassifikationen',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * GET /api/soil-analysis/color-mapping
 * Gibt die Farbzuordnung für Bodenklassifikationen zurück
 */
router.get('/color-mapping', (req, res) => {
  try {
    const colorMapping = bodenanalyseService.getColorMapping();
    res.json(colorMapping);
  } catch (error) {
    console.error('Fehler beim Abrufen der Farbzuordnung:', error);
    res.status(500).json({ 
      message: 'Fehler beim Abrufen der Farbzuordnung',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * GET /api/soil-analysis
 * Analysiert eine einzelne Koordinate
 * Query-Parameter:
 * - lon: Längengrad (erforderlich)
 * - lat: Breitengrad (erforderlich)
 */
router.get('/', soilAnalysisLimiter, async (req, res) => {
  try {
    const { lon, lat } = req.query;
    
    // Validiere Koordinaten
    if (!lon || !lat) {
      return res.status(400).json({ message: 'Längen- und Breitengrad sind erforderlich' });
    }
    
    const longitude = parseFloat(lon as string);
    const latitude = parseFloat(lat as string);
    
    if (isNaN(longitude) || isNaN(latitude)) {
      return res.status(400).json({ message: 'Koordinaten müssen numerisch sein' });
    }
    
    // Validiere Längen- und Breitengrade für Deutschland (ungefähre Grenzen)
    if (longitude < 5.0 || longitude > 16.0 || latitude < 47.0 || latitude > 56.0) {
      return res.status(400).json({ 
        message: 'Koordinaten außerhalb des gültigen Bereichs für Deutschland' 
      });
    }
    
    const result = await bodenanalyseService.getSoilTypeByCoordinates(longitude, latitude);
    res.json(result);
  } catch (error) {
    console.error('Fehler bei der Bodenanalyse:', error);
    res.status(500).json({ 
      message: 'Fehler bei der Bodenanalyse',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * POST /api/soil-analysis/batch
 * Analysiert mehrere Koordinaten als Batch
 * Body-Format:
 * {
 *   coordinates: [{ lon: number, lat: number }, ...],
 *   maxPoints?: number
 * }
 */
router.post('/batch', soilAnalysisLimiter, async (req, res) => {
  try {
    const { coordinates, maxPoints } = req.body;
    
    // Validiere Eingaben
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
      return res.status(400).json({ message: 'Koordinaten-Array ist erforderlich' });
    }
    
    // Validiere jede Koordinate
    const invalidCoords = coordinates.filter(coord => {
      if (!coord || typeof coord !== 'object') return true;
      if (coord.lon === undefined || coord.lat === undefined) return true;
      
      const lon = parseFloat(coord.lon as any);
      const lat = parseFloat(coord.lat as any);
      
      if (isNaN(lon) || isNaN(lat)) return true;
      
      // Validiere für Deutschland
      if (lon < 5.0 || lon > 16.0 || lat < 47.0 || lat > 56.0) return true;
      
      return false;
    });
    
    if (invalidCoords.length > 0) {
      return res.status(400).json({ 
        message: `${invalidCoords.length} ungültige Koordinaten gefunden` 
      });
    }
    
    // Verarbeite Batch mit optionaler Begrenzung
    const result = await bodenanalyseService.processBatchCoordinates(
      coordinates,
      maxPoints || 100 // Standard: maximal 100 Punkte
    );
    
    res.json(result);
  } catch (error) {
    console.error('Fehler bei der Batch-Verarbeitung:', error);
    res.status(500).json({ 
      message: 'Fehler bei der Batch-Verarbeitung',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

export default router;