import express from 'express';
import axios from 'axios';

const router = express.Router();

interface ElevationPoint {
  elevation: number;
  location: {
    lat: number;
    lng: number;
  };
  resolution: number;
}

interface ElevationStats {
  minElevation: number;
  maxElevation: number;
  totalAscent: number;
  totalDescent: number;
  elevationDifference: number;
}

interface ElevationResponse {
  elevation: ElevationPoint[];
  stats: ElevationStats;
}

/**
 * POST /api/elevation
 * 
 * Ruft Höhendaten von der Google Elevation API ab und berechnet Statistiken
 * 
 * Body:
 * - path: Array von {lat, lng} Punkten
 * - samples: Anzahl der Samples (optional, default: 100)
 */
router.post('/api/elevation', async (req, res) => {
  try {
    // Validiere Request Body
    const { path, samples = 100 } = req.body;
    
    if (!path || !Array.isArray(path) || path.length < 2) {
      return res.status(400).json({ error: 'Es müssen mindestens zwei Punkte angegeben werden.' });
    }
    
    // Google Maps API Key aus Environment laden
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API Key ist nicht konfiguriert.' });
    }
    
    // Formatiere die Punkte wie von der Elevation API benötigt
    const pathString = path.map(point => `${point.lat},${point.lng}`).join('|');
    
    // Rufe die Google Elevation API auf
    const response = await axios.get('https://maps.googleapis.com/maps/api/elevation/json', {
      params: {
        path: pathString,
        samples: samples,
        key: apiKey
      }
    });
    
    // Prüfe API-Antwort
    if (response.data.status !== 'OK') {
      return res.status(500).json({ 
        error: `Google API-Fehler: ${response.data.status}`, 
        details: response.data.error_message 
      });
    }
    
    // Extrahiere Höhendaten
    const elevationResults = response.data.results.map((result: any) => ({
      elevation: result.elevation,
      location: result.location,
      resolution: result.resolution
    }));
    
    // Berechne Statistiken
    const stats = calculateElevationStats(elevationResults);
    
    // Baue Antwort
    const elevationResponse: ElevationResponse = {
      elevation: elevationResults,
      stats
    };
    
    res.json(elevationResponse);
  } catch (error: any) {
    console.error('Elevation API Fehler:', error.message);
    res.status(500).json({ error: 'Fehler beim Abrufen der Höhendaten', details: error.message });
  }
});

/**
 * Berechnet Statistiken für Höhendaten
 */
function calculateElevationStats(elevationPoints: ElevationPoint[]): ElevationStats {
  if (!elevationPoints || elevationPoints.length < 2) {
    throw new Error('Es müssen mindestens zwei Höhenpunkte übergeben werden.');
  }
  
  // Extrahiere Höhenwerte
  const elevations = elevationPoints.map(point => point.elevation);
  
  // Berechne Min/Max
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const elevationDifference = maxElevation - minElevation;
  
  // Berechne Gesamtanstieg/abstieg
  let totalAscent = 0;
  let totalDescent = 0;
  
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i-1];
    if (diff > 0) {
      totalAscent += diff;
    } else {
      totalDescent += Math.abs(diff);
    }
  }
  
  return {
    minElevation,
    maxElevation,
    totalAscent,
    totalDescent,
    elevationDifference
  };
}

export default router;