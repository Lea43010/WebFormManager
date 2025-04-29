import { Request, Response, Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { isAdmin } from './middleware/role-check';
import { isAuthenticated } from './middleware/auth';
import pg from 'pg';

const router = Router();

// Verbindung zur Datenbank herstellen
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Hilfsfunktion für Datenbankabfragen
const query = async (text: string, params?: any[]): Promise<pg.QueryResult> => {
  return pool.query(text, params);
};

// Sicherstellen, dass das Verzeichnis existiert
const REPORT_DIR = path.resolve(process.cwd(), 'data_quality_reports');
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Datenqualitätsprüfung starten
router.post('/data-quality/run', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  const { table, profile = true, outliers = true, validate = true, limit } = req.body;
  
  try {
    // Parameter für das Python-Skript vorbereiten
    const args = ['scripts/run_quality_check.py'];
    
    if (table) {
      args.push('--table', table);
    }
    
    if (profile) {
      args.push('--profile');
    }
    
    if (outliers) {
      args.push('--outliers');
    }
    
    if (validate) {
      args.push('--validate');
    }
    
    if (limit) {
      args.push('--limit', limit.toString());
    }
    
    console.log(`Starte Datenqualitätsprüfung mit Argumenten: ${args.join(' ')}`);
    
    // Erstelle ein neues DataQualityRun in der Datenbank, wenn eine entsprechende Tabelle existiert
    let runId: number | null = null;
    try {
      // Prüfe, ob die Tabelle existiert (könnte in einer Migration hinzugefügt werden)
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'data_quality_runs'
        );
      `);
      
      if (result.rows[0].exists) {
        const insertResult = await query(`
          INSERT INTO data_quality_runs 
          (started_at, started_by, table_name, status, parameters) 
          VALUES 
          (NOW(), $1, $2, 'running', $3) 
          RETURNING id
        `, [
          req.user?.id || 'system', 
          table || 'all', 
          JSON.stringify({ profile, outliers, validate, limit })
        ]);
        runId = insertResult.rows[0].id;
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des DataQualityRun-Eintrags:', error);
      // Nichtvorhandensein der Tabelle ist kein kritischer Fehler
    }
    
    // Python-Skript asynchron starten
    const pythonProcess = spawn('python', args);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log(`[Datenqualität] ${chunk.trim()}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      console.error(`[Datenqualität-Fehler] ${chunk.trim()}`);
    });
    
    pythonProcess.on('close', async (code) => {
      console.log(`Datenqualitätsprüfung beendet mit Code ${code}`);
      
      // Aktualisiere den Run-Status, wenn eine ID vorhanden ist
      if (runId !== null) {
        try {
          await query(`
            UPDATE data_quality_runs 
            SET 
              ended_at = NOW(), 
              status = $1, 
              output = $2, 
              error_output = $3
            WHERE id = $4
          `, [
            code === 0 ? 'completed' : 'failed',
            output,
            errorOutput,
            runId
          ]);
        } catch (error) {
          console.error('Fehler beim Aktualisieren des DataQualityRun-Eintrags:', error);
        }
      }
    });
    
    // Sofortige Antwort senden, da das Skript im Hintergrund läuft
    return res.status(202).json({
      success: true,
      message: 'Datenqualitätsprüfung wurde gestartet',
      runId,
      args
    });
    
  } catch (error) {
    console.error('Fehler beim Starten der Datenqualitätsprüfung:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Starten der Datenqualitätsprüfung',
      error: String(error)
    });
  }
});

// Liste der vorhandenen Berichte abrufen
router.get('/data-quality/reports', isAuthenticated, isAdmin, (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(REPORT_DIR)) {
      return res.status(200).json({
        success: true,
        reports: []
      });
    }
    
    const files = fs.readdirSync(REPORT_DIR);
    
    // Dateien nach Typ und Zeitstempel gruppieren
    const reports = files.map(file => {
      const stats = fs.statSync(path.join(REPORT_DIR, file));
      const type = getReportType(file);
      
      return {
        filename: file,
        type,
        createdAt: stats.ctime,
        size: stats.size,
        path: `/api/data-quality/reports/${file}`
      };
    });
    
    // Nach Erstellungsdatum sortieren (neueste zuerst)
    reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return res.status(200).json({
      success: true,
      reports
    });
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Datenqualitätsberichte:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Datenqualitätsberichte',
      error: String(error)
    });
  }
});

// Einen bestimmten Bericht abrufen
router.get('/data-quality/reports/:filename', isAuthenticated, isAdmin, (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(REPORT_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Bericht nicht gefunden'
      });
    }
    
    // Dateityp ermitteln
    const contentType = getContentType(filename);
    res.setHeader('Content-Type', contentType);
    
    // Datei streamen
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Fehler beim Abrufen des Berichts:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen des Berichts',
      error: String(error)
    });
  }
});

// Einen bestimmten Bericht löschen
router.delete('/data-quality/reports/:filename', isAuthenticated, isAdmin, (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(REPORT_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Bericht nicht gefunden'
      });
    }
    
    fs.unlinkSync(filePath);
    
    return res.status(200).json({
      success: true,
      message: 'Bericht wurde gelöscht'
    });
    
  } catch (error) {
    console.error('Fehler beim Löschen des Berichts:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen des Berichts',
      error: String(error)
    });
  }
});

// Liste der verfügbaren Tabellen in der Datenbank abrufen
router.get('/data-quality/tables', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    // Tabellen aus der Datenbank abrufen
    const result = await query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name=t.table_name) AS column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE 'sql_%'
      ORDER BY table_name
    `);
    
    return res.status(200).json({
      success: true,
      tables: result.rows
    });
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Tabellenliste:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Tabellenliste',
      error: String(error)
    });
  }
});

// Hilfsfunktionen

function getReportType(filename: string): string {
  if (filename.startsWith('profil_')) {
    return 'profile';
  } else if (filename.startsWith('ausreisser_')) {
    return 'outlier';
  } else if (filename.startsWith('erwartungen_')) {
    return 'expectations';
  } else if (filename.startsWith('validierung_')) {
    return 'validation';
  } else if (filename.startsWith('qualitaetspruefung_')) {
    return 'summary';
  } else {
    return 'unknown';
  }
}

function getContentType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  
  switch (extension) {
    case '.html':
      return 'text/html';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}

export default router;