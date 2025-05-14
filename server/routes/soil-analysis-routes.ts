/**
 * Bodenanalyse API-Routen
 */
import { Router } from 'express';
import soilAnalysisService from '../services/soil-analysis-service';

const router = Router();

/**
 * GET /api/soil-analysis/classifications
 * Liefert alle verfügbaren Bodenklassifikationen
 */
router.get('/classifications', (req, res) => {
  const classifications = Object.entries(soilAnalysisService.classifySoilType).map(([key, _]) => key);
  res.json({ classifications });
});

/**
 * GET /api/soil-analysis/color-mapping
 * Gibt die Farbzuordnung für Bodenklassifikationen zurück
 */
router.get('/color-mapping', (req, res) => {
  res.json({ colorMapping: soilAnalysisService.getColorMapping() });
});

/**
 * GET /api/soil-analysis
 * Analysiert eine einzelne Koordinate
 * Query-Parameter:
 * - lon: Längengrad (erforderlich)
 * - lat: Breitengrad (erforderlich)
 */
router.get('/', async (req, res) => {
  const { lon, lat } = req.query;
  
  // Parameter validieren
  if (!lon || !lat) {
    return res.status(400).json({ 
      error: 'Fehlende Parameter', 
      message: 'Sowohl Längengrad (lon) als auch Breitengrad (lat) müssen angegeben werden' 
    });
  }
  
  // Koordinaten in Zahlen umwandeln
  const longitude = parseFloat(lon as string);
  const latitude = parseFloat(lat as string);
  
  // Gültigkeitsbereich für Deutschland prüfen
  if (longitude < 5.0 || longitude > 16.0 || latitude < 47.0 || latitude > 56.0) {
    return res.status(400).json({ 
      error: 'Ungültige Koordinaten', 
      message: 'Die Koordinaten liegen außerhalb des gültigen Bereichs für Deutschland' 
    });
  }
  
  try {
    const result = await soilAnalysisService.getSoilTypeByCoordinates(longitude, latitude);
    res.json(result);
  } catch (error: unknown) {
    console.error('Fehler bei der Bodenanalyse:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist bei der Bodenanalyse aufgetreten';
    
    res.status(500).json({ 
      error: 'Analysefehler', 
      message: errorMessage 
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
router.post('/batch', async (req, res) => {
  const { coordinates, maxPoints = 100 } = req.body;
  
  // Parameter validieren
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    return res.status(400).json({ 
      error: 'Ungültige Eingabe', 
      message: 'Ein Array von Koordinaten muss angegeben werden' 
    });
  }
  
  // Prüfen, ob alle Koordinaten gültig sind
  const isValid = coordinates.every(coord => 
    typeof coord.lon === 'number' && 
    typeof coord.lat === 'number' &&
    coord.lon >= 5.0 && 
    coord.lon <= 16.0 && 
    coord.lat >= 47.0 && 
    coord.lat <= 56.0
  );
  
  if (!isValid) {
    return res.status(400).json({ 
      error: 'Ungültige Koordinaten', 
      message: 'Eine oder mehrere Koordinaten liegen außerhalb des gültigen Bereichs für Deutschland' 
    });
  }
  
  try {
    const results = await soilAnalysisService.processBatchCoordinates(coordinates, maxPoints);
    res.json(results);
  } catch (error: unknown) {
    console.error('Fehler bei der Batch-Bodenanalyse:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist bei der Batch-Bodenanalyse aufgetreten';
    
    res.status(500).json({ 
      error: 'Analysefehler', 
      message: errorMessage 
    });
  }
});

export default router;