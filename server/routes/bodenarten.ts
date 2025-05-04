import express from 'express';
import { sql } from '../db';

const router = express.Router();

/**
 * GET /api/bodenarten
 * 
 * Gibt alle verfügbaren Bodenarten zurück
 */
router.get('/api/bodenarten', async (req, res) => {
  try {
    const result = await sql`
      SELECT * FROM bodenarten ORDER BY name ASC
    `;
    
    res.json(result);
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Bodenarten:', error.message);
    res.status(500).json({ error: 'Fehler beim Abrufen der Bodenarten', details: error.message });
  }
});

/**
 * GET /api/bodenarten/:id
 * 
 * Gibt eine spezifische Bodenart zurück
 */
router.get('/api/bodenarten/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await sql`
      SELECT * FROM bodenarten WHERE id = ${id}
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Bodenart nicht gefunden' });
    }
    
    res.json(result[0]);
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Bodenart:', error.message);
    res.status(500).json({ error: 'Fehler beim Abrufen der Bodenart', details: error.message });
  }
});

export default router;