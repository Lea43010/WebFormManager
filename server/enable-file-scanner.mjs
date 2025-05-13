/**
 * Hilfsfunktion zum Einbinden des Datei-Scanners
 * Diese Datei wird im Hauptprogramm importiert
 */

// Direkt den Router importieren
import fileScannerRouter from './routes/file-scanner.js';

// Funktion zum Registrieren des Routers
function enableFileScanner(app) {
  // Pfad festlegen und Router einbinden
  app.use('/api/files/scan', fileScannerRouter);
  console.log('Datei-Scanner-API aktiviert unter /api/files/scan');
  
  return fileScannerRouter;
}

// Funktion exportieren
export default enableFileScanner;