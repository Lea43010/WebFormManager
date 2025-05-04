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
    
    // Verbesserte Validierung der Eingabeparameter
    if (!path || !Array.isArray(path)) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage: Pfad muss ein Array von Koordinaten sein' 
      });
    }
    
    if (path.length < 2) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage: Pfad muss mindestens 2 Koordinaten enthalten' 
      });
    }
    
    // Prüfung auf gültige Koordinaten
    for (const point of path) {
      if (typeof point.lat !== 'number' || typeof point.lng !== 'number' ||
          isNaN(point.lat) || isNaN(point.lng) ||
          point.lat < -90 || point.lat > 90 || point.lng < -180 || point.lng > 180) {
        return res.status(400).json({ 
          error: 'Ungültige Koordinaten: Breiten- und Längengrade müssen gültige Zahlen sein' 
        });
      }
    }
    
    // Begrenzung der Samples
    const validatedSamples = Math.min(Math.max(2, samples), 512); // Mindestens 2, maximal 512

    if (!GOOGLE_MAPS_API_KEY) {
      logger.error('Google Maps API-Schlüssel nicht konfiguriert');
      return res.status(500).json({ 
        error: 'Elevation API nicht konfiguriert' 
      });
    }

    // Formatiere den Pfad für die Google Elevation API
    const pathString = path.map(point => `${point.lat},${point.lng}`).join('|');
    
    // Anfrage an die Google Elevation API mit Timeout und Retry-Logik
    let response: any = null;
    let retryCount = 0;
    const maxRetries = 2;
    const timeout = 10000; // 10 Sekunden Timeout
    
    while (retryCount <= maxRetries) {
      try {
        logger.info(`Elevation API Anfrage: ${validatedSamples} Samples, Versuch ${retryCount + 1}/${maxRetries + 1}`);
        response = await axios.get('https://maps.googleapis.com/maps/api/elevation/json', {
          params: {
            path: pathString,
            samples: validatedSamples,
            key: GOOGLE_MAPS_API_KEY
          },
          timeout: timeout
        });
        
        if (response && response.data) {
          break; // Bei erfolgreicher Antwort die Schleife verlassen
        }
      } catch (axiosError) {
        retryCount++;
        
        // Wenn alle Versuche fehlgeschlagen sind, werfen wir den Fehler weiter
        if (retryCount > maxRetries) {
          logger.error(`Elevation API nicht erreichbar nach ${maxRetries + 1} Versuchen`);
          throw axiosError;
        }
        
        // Bei Timeout oder Netzwerkfehlern erneut versuchen
        logger.warn(`Elevation API Anfrage fehlgeschlagen, Versuch ${retryCount}/${maxRetries + 1}`);
        
        // Kurze Pause vor dem nächsten Versuch
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Stellen Sie sicher, dass die Antwort definiert ist
    if (!response || !response.data) {
      logger.error('Keine gültige Antwort von der Elevation API erhalten');
      return res.status(500).json({ 
        error: 'Keine gültige Antwort von der Elevation API erhalten' 
      });
    }
    
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
      // Spezifischere Fehlermeldungen basierend auf dem Fehlertyp
      if (error.code === 'ECONNABORTED') {
        return res.status(504).json({ 
          error: 'Zeitüberschreitung bei der Anfrage an die Elevation API. Bitte versuchen Sie es später erneut.' 
        });
      }
      
      if (error.response) {
        // Der Server hat mit einem Fehlerstatuscode geantwortet
        const status = error.response.status;
        const errorMessage = error.response.data?.error_message || error.message;
        
        if (status === 400) {
          return res.status(400).json({ 
            error: `Ungültige Anfrage an die Elevation API: ${errorMessage}` 
          });
        } else if (status === 403 || status === 401) {
          return res.status(500).json({ 
            error: 'Authentifizierungsfehler bei der Elevation API. Bitte prüfen Sie den API-Schlüssel.' 
          });
        } else if (status === 429) {
          return res.status(429).json({ 
            error: 'Anfragelimit der Elevation API überschritten. Bitte versuchen Sie es später erneut.' 
          });
        }
      }
      
      // Allgemeiner Axios-Fehler
      return res.status(500).json({ 
        error: `Fehler bei der Anfrage an die Elevation API: ${error.message}` 
      });
    }
    
    // Unbekannter Fehler
    return res.status(500).json({ 
      error: 'Unerwarteter Fehler beim Abrufen der Höhendaten' 
    });
  }
});

export default router;