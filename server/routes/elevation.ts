import express, { Request, Response } from 'express';
import axios from 'axios';
import { isAuthenticated } from '../middleware/auth';
import logger from '../logger';

const router = express.Router();

// Verwende den Google Maps API Key aus der Umgebungsvariable
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

interface ElevationRequest {
  path: Array<{ lat: number; lng: number }>;
  samples?: number;
}

// Endpunkt zum Abrufen von Höhendaten für eine Route
router.post('/api/elevation', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { path, samples = 256 } = req.body as ElevationRequest;
    
    if (!path || !Array.isArray(path) || path.length < 2) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage: Pfad muss mindestens 2 Koordinaten enthalten' 
      });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      logger.error('Google Maps API-Schlüssel nicht konfiguriert');
      return res.status(500).json({ 
        error: 'Elevation API nicht konfiguriert' 
      });
    }

    // Formatiere den Pfad für die Google Elevation API
    const pathString = path.map(point => `${point.lat},${point.lng}`).join('|');
    
    // Anfrage an die Google Elevation API
    const response = await axios.get('https://maps.googleapis.com/maps/api/elevation/json', {
      params: {
        path: pathString,
        samples,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      logger.error(`Elevation API Fehler: ${response.data.status}`, { 
        error: response.data.error_message 
      });
      return res.status(500).json({ 
        error: `Fehler beim Abrufen der Höhendaten: ${response.data.status}` 
      });
    }

    // Berechne zusätzliche Informationen für das Höhenprofil
    const elevationData = response.data.results;
    
    let minElevation = Number.MAX_VALUE;
    let maxElevation = Number.MIN_VALUE;
    let totalAscent = 0;
    let totalDescent = 0;
    
    for (let i = 0; i < elevationData.length; i++) {
      const elevation = elevationData[i].elevation;
      
      // Min/Max Höhe aktualisieren
      minElevation = Math.min(minElevation, elevation);
      maxElevation = Math.max(maxElevation, elevation);
      
      // Berechne Auf- und Abstiege
      if (i > 0) {
        const elevationDiff = elevation - elevationData[i-1].elevation;
        if (elevationDiff > 0) {
          totalAscent += elevationDiff;
        } else {
          totalDescent += Math.abs(elevationDiff);
        }
      }
    }

    // Sende die Höhendaten und zusätzliche Informationen zurück
    return res.status(200).json({
      elevation: elevationData,
      stats: {
        minElevation,
        maxElevation,
        totalAscent,
        totalDescent,
        elevationDifference: maxElevation - minElevation
      }
    });

  } catch (error) {
    logger.error('Fehler beim Abrufen der Höhendaten', { error });
    
    if (axios.isAxiosError(error)) {
      return res.status(500).json({ 
        error: `Fehler bei der Anfrage an die Elevation API: ${error.message}` 
      });
    }
    
    return res.status(500).json({ 
      error: 'Unerwarteter Fehler beim Abrufen der Höhendaten' 
    });
  }
});

export default router;