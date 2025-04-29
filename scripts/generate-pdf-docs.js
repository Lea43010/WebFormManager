import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// __dirname Äquivalent für ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prüfen, ob die notwendigen Pakete installiert sind, andernfalls installieren
function checkAndInstallDependencies() {
  try {
    // In ES Modules können wir nicht require.resolve verwenden, 
    // aber wir können davon ausgehen, dass das Paket bereits installiert ist
    // oder verwenden import.meta.resolve in Zukunft
    console.log('Überprüfe markdown-pdf Paket...');
  } catch (err) {
    console.log('Installiere markdown-pdf Paket...');
    execSync('npm install markdown-pdf --no-save');
  }
}

// PDF-Generierungsfunktion
async function generatePDF() {
  checkAndInstallDependencies();
  
  // Import dynamisch laden, da wir in einem ES Module sind
  const markdownPdf = (await import('markdown-pdf')).default;
  const sourcePath = path.join(__dirname, '../docs/datenqualitaet-dokumentation.md');
  const outputDir = path.join(__dirname, '../public/docs');
  const outputPath = path.join(outputDir, 'datenqualitaet-dokumentation.pdf');
  
  // Sicherstellen, dass das Ausgabeverzeichnis existiert
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Verzeichnis erstellt: ${outputDir}`);
  }
  
  // CSS für besseres Styling
  const cssPath = path.join(__dirname, '../docs/pdf-style.css');
  if (!fs.existsSync(cssPath)) {
    const css = `
      body {
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #333;
      }
      h1 {
        color: #2563eb;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.5em;
      }
      h2 {
        color: #1d4ed8;
        margin-top: 1.5em;
      }
      h3 {
        color: #3b82f6;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
      }
      th {
        background-color: #f3f4f6;
        text-align: left;
        padding: 8px;
        border: 1px solid #e5e7eb;
      }
      td {
        padding: 8px;
        border: 1px solid #e5e7eb;
      }
      pre {
        background-color: #f3f4f6;
        padding: 1em;
        border-radius: 4px;
        overflow-x: auto;
      }
      code {
        font-family: monospace;
        background-color: #f3f4f6;
        padding: 2px 4px;
        border-radius: 2px;
      }
    `;
    fs.writeFileSync(cssPath, css);
    console.log(`CSS-Datei erstellt: ${cssPath}`);
  }
  
  const options = {
    cssPath: cssPath,
    paperFormat: 'A4',
    paperOrientation: 'portrait',
    paperBorder: '1cm',
    renderDelay: 1000
  };
  
  console.log(`Konvertiere ${sourcePath} zu PDF...`);
  
  return new Promise((resolve, reject) => {
    markdownPdf(options)
      .from(sourcePath)
      .to(outputPath, (err) => {
        if (err) {
          console.error('Fehler bei der PDF-Generierung:', err);
          reject(err);
          return;
        }
        console.log(`PDF erfolgreich erstellt: ${outputPath}`);
        resolve(outputPath);
      });
  });
}

// Führe die PDF-Generierung aus
generatePDF().catch(err => {
  console.error('Fehler:', err);
  process.exit(1);
});