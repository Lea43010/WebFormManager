/**
 * SSL-Setup-Skript für die Bau-Structura Anwendung
 * 
 * Dieses Skript richtet einen HTTPS-Server für die Produktion ein,
 * der die Strato-SSL-Zertifikate verwendet.
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const express = require('express');
const path = require('path');

// Zertifikatspfade
const CERT_PATH = path.join(__dirname, '../ssl/certificate.crt');
const KEY_PATH = path.join(__dirname, '../ssl/private.key');
const CA_PATH = path.join(__dirname, '../ssl/ca_bundle.crt');

/**
 * Prüft, ob die SSL-Zertifikatsdateien vorhanden sind
 */
function checkCertificatesExist() {
  let certExists = fs.existsSync(CERT_PATH);
  let keyExists = fs.existsSync(KEY_PATH);
  let caExists = fs.existsSync(CA_PATH);
  
  console.log(`Zertifikat: ${certExists ? 'Gefunden' : 'Nicht gefunden'}`);
  console.log(`Privater Schlüssel: ${keyExists ? 'Gefunden' : 'Nicht gefunden'}`);
  console.log(`CA-Bundle: ${caExists ? 'Gefunden' : 'Nicht gefunden'}`);
  
  return certExists && keyExists;
}

/**
 * Erstellt eine einfache Express-App für Tests
 */
function createTestApp() {
  const app = express();
  
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>SSL-Test für Bau-Structura</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #76a730; }
            .success { color: green; }
            .info { color: #0066cc; }
          </style>
        </head>
        <body>
          <h1>SSL-Test für Bau-Structura</h1>
          <p class="success">✅ HTTPS-Verbindung erfolgreich hergestellt</p>
          <p>Protokoll: ${req.protocol}</p>
          <p>Host: ${req.hostname}</p>
          <hr>
          <p class="info">Wenn Sie diese Seite sehen, sind die SSL-Zertifikate korrekt konfiguriert.</p>
        </body>
      </html>
    `);
  });
  
  return app;
}

/**
 * Erstellt einen HTTPS-Server mit den angegebenen Zertifikaten
 */
function createHttpsServer(app) {
  try {
    // SSL-Zertifikate laden
    const cert = fs.readFileSync(CERT_PATH, 'utf8');
    const key = fs.readFileSync(KEY_PATH, 'utf8');
    
    // CA-Bundle laden (falls vorhanden)
    let ca;
    if (fs.existsSync(CA_PATH)) {
      ca = fs.readFileSync(CA_PATH, 'utf8');
    }
    
    // HTTPS-Optionen
    const httpsOptions = {
      key,
      cert,
      secureOptions: require('constants').SSL_OP_NO_TLSv1 | require('constants').SSL_OP_NO_TLSv1_1,
      ciphers: [
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256'
      ].join(':')
    };
    
    // CA-Bundle hinzufügen (falls vorhanden)
    if (ca) {
      httpsOptions.ca = ca;
    }
    
    return https.createServer(httpsOptions, app);
  } catch (error) {
    console.error('Fehler beim Erstellen des HTTPS-Servers:', error);
    return null;
  }
}

/**
 * Startet einen HTTPS-Server auf dem angegebenen Port
 */
function startServer(app, port = 443) {
  // Zertifikate prüfen
  if (!checkCertificatesExist()) {
    console.error('SSL-Zertifikate fehlen. HTTPS-Server kann nicht gestartet werden.');
    console.log('Bitte platzieren Sie die Zertifikatsdateien im Verzeichnis "ssl".');
    process.exit(1);
  }
  
  // HTTPS-Server erstellen
  const httpsServer = createHttpsServer(app);
  
  if (!httpsServer) {
    console.error('HTTPS-Server konnte nicht erstellt werden. Programm wird beendet.');
    process.exit(1);
  }
  
  // HTTPS-Server starten
  httpsServer.listen(port, () => {
    console.log(`HTTPS-Server läuft auf Port ${port}`);
    console.log('SSL-Zertifikate erfolgreich geladen');
    console.log('Strato-SSL-Integration für bau-structura.de abgeschlossen');
  });
  
  return httpsServer;
}

// Export für Verwendung in anderen Modulen
module.exports = {
  checkCertificatesExist,
  createHttpsServer,
  startServer,
  createTestApp
};

// Direkte Ausführung des Skripts zum Testen
if (require.main === module) {
  const app = createTestApp();
  const port = process.env.PORT || 443;
  startServer(app, port);
}