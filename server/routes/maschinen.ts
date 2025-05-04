import express from 'express';
import { sql } from '../db';

const router = express.Router();

/**
 * GET /api/maschinen
 * 
 * Gibt alle verfügbaren Maschinen zurück
 */
router.get('/api/maschinen', async (req, res) => {
  try {
    const result = await sql`
      SELECT * FROM maschinen ORDER BY name ASC
    `;
    
    res.json(result);
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Maschinen:', error.message);
    res.status(500).json({ error: 'Fehler beim Abrufen der Maschinen', details: error.message });
  }
});

/**
 * GET /api/maschinen/:id
 * 
 * Gibt eine spezifische Maschine zurück
 */
router.get('/api/maschinen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await sql`
      SELECT * FROM maschinen WHERE id = ${id}
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Maschine nicht gefunden' });
    }
    
    res.json(result[0]);
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Maschine:', error.message);
    res.status(500).json({ error: 'Fehler beim Abrufen der Maschine', details: error.message });
  }
});

/**
 * GET /api/maschinen/bodenart/:bodenartId
 * 
 * Gibt alle Maschinen zurück, die für eine spezifische Bodenart geeignet sind,
 * sortiert nach Effizienz
 */
router.get('/api/maschinen/bodenart/:bodenartId', async (req, res) => {
  try {
    const { bodenartId } = req.params;
    
    const result = await sql`
      SELECT m.*, mb.effizienz_faktor, mb.bearbeitungszeit_pro_m2
      FROM maschinen m
      JOIN maschinen_bodenarten mb ON m.id = mb.maschine_id
      WHERE mb.bodenart_id = ${bodenartId}
      ORDER BY mb.effizienz_faktor DESC
    `;
    
    res.json(result);
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Maschinen für Bodenart:', error.message);
    res.status(500).json({ error: 'Fehler beim Abrufen der Maschinen für Bodenart', details: error.message });
  }
});

export default router;