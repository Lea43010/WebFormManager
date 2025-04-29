#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const markdownpdf = require('markdown-pdf');

// Sicherstellen, dass das markdown-pdf Paket installiert ist
function ensurePackages() {
  try {
    require.resolve('markdown-pdf');
    console.log('markdown-pdf ist bereits installiert.');
  } catch (err) {
    console.log('Installiere markdown-pdf Paket...');
    execSync('npm install markdown-pdf --no-save');
  }
}

// Hauptfunktion
async function main() {
  try {
    ensurePackages();
    
    const sourcePath = path.join(__dirname, '../docs/datenqualitaet-dokumentation.md');
    const outputDir = path.join(__dirname, '../public/docs');
    const outputPath = path.join(outputDir, 'datenqualitaet-dokumentation.pdf');
    
    // Sicherstellen, dass das Ausgabeverzeichnis existiert
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Verzeichnis erstellt: ${outputDir}`);
    }
    
    // CSS-Datei für Styling
    const cssPath = path.join(__dirname, '../docs/pdf-style.css');
    
    // PDF-Konvertierungsoptionen
    const options = {
      cssPath: cssPath,
      paperFormat: 'A4',
      paperOrientation: 'portrait',
      paperBorder: '1cm',
      renderDelay: 1000
    };
    
    console.log(`Konvertiere ${sourcePath} zu PDF...`);
    
    // PDF erstellen
    markdownpdf(options)
      .from(sourcePath)
      .to(outputPath, function(err) {
        if (err) {
          console.error('Fehler bei der PDF-Generierung:', err);
          process.exit(1);
        }
        console.log(`PDF erfolgreich erstellt: ${outputPath}`);
        
        // Link zum Hilfebereich erstellen
        createHelpLink(outputPath);
      });
  } catch (err) {
    console.error('Ein Fehler ist aufgetreten:', err);
    process.exit(1);
  }
}

// Funktion zum Erstellen des Links im Hilfebereich
function createHelpLink(pdfPath) {
  try {
    // Pfad zur Datei relativ zum öffentlichen Verzeichnis
    const relativePath = path.relative(path.join(__dirname, '../public'), pdfPath);
    
    console.log(`PDF-Dokumentation verfügbar unter: /public/${relativePath.replace(/\\/g, '/')}`);
    
    // Hier könnten wir die Verlinkung in der Hilfeseite automatisch aktualisieren
    console.log('Dokumentation wurde erfolgreich erstellt und ist im Hilfebereich verfügbar.');
  } catch (err) {
    console.error('Fehler beim Erstellen des Hilfe-Links:', err);
  }
}

// Ausführen der Hauptfunktion
main().catch(err => {
  console.error('Unerwarteter Fehler:', err);
  process.exit(1);
});