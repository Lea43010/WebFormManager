import express from 'express';
import { BodenartService } from '../services/bodenarten-service';

const router = express.Router();

/**
 * GET /api/bodenarten
 * 
 * Gibt alle verfügbaren Bodenarten zurück
 */
router.get('/api/bodenarten', async (req, res) => {
  try {
    const bodenarten = await BodenartService.getAll();
    res.json(bodenarten);
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
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Ungültige ID' });
    }
    
    const bodenart = await BodenartService.getById(id);
    
    if (!bodenart) {
      return res.status(404).json({ error: 'Bodenart nicht gefunden' });
    }
    
    res.json(bodenart);
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Bodenart:', error.message);
    res.status(500).json({ error: 'Fehler beim Abrufen der Bodenart', details: error.message });
  }
});

/**
 * POST /api/bodenarten
 * 
 * Erstellt eine neue Bodenart
 */
router.post('/api/bodenarten', async (req, res) => {
  try {
    const { name, klasse, beschreibung, kosten_pro_m2 } = req.body;
    
    // Validierung
    if (!name || !klasse || !beschreibung || kosten_pro_m2 === undefined) {
      return res.status(400).json({ 
        error: 'Fehlende Pflichtfelder', 
        details: 'Name, Klasse, Beschreibung und Kosten pro m² sind erforderlich' 
      });
    }
    
    const newBodenart = await BodenartService.create({
      name,
      klasse,
      beschreibung,
      kosten_pro_m2: Number(kosten_pro_m2)
    });
    
    res.status(201).json(newBodenart);
  } catch (error: any) {
    console.error('Fehler beim Erstellen der Bodenart:', error.message);
    res.status(500).json({ error: 'Fehler beim Erstellen der Bodenart', details: error.message });
  }
});

/**
 * PUT /api/bodenarten/:id
 * 
 * Aktualisiert eine Bodenart
 */
router.put('/api/bodenarten/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Ungültige ID' });
    }
    
    const { name, klasse, beschreibung, kosten_pro_m2 } = req.body;
    
    // Bereite Update-Daten vor
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (klasse !== undefined) updateData.klasse = klasse;
    if (beschreibung !== undefined) updateData.beschreibung = beschreibung;
    if (kosten_pro_m2 !== undefined) updateData.kosten_pro_m2 = Number(kosten_pro_m2);
    
    // Keine Daten zum Aktualisieren
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Keine Daten zum Aktualisieren angegeben' });
    }
    
    const updatedBodenart = await BodenartService.update(id, updateData);
    
    if (!updatedBodenart) {
      return res.status(404).json({ error: 'Bodenart nicht gefunden' });
    }
    
    res.json(updatedBodenart);
  } catch (error: any) {
    console.error('Fehler beim Aktualisieren der Bodenart:', error.message);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Bodenart', details: error.message });
  }
});

/**
 * DELETE /api/bodenarten/:id
 * 
 * Löscht eine Bodenart
 */
router.delete('/api/bodenarten/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Ungültige ID' });
    }
    
    const deleted = await BodenartService.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Bodenart nicht gefunden' });
    }
    
    res.status(204).end();
  } catch (error: any) {
    console.error('Fehler beim Löschen der Bodenart:', error.message);
    res.status(500).json({ error: 'Fehler beim Löschen der Bodenart', details: error.message });
  }
});

export default router;