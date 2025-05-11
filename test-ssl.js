/**
 * SSL-Test-Skript für Bau-Structura
 * 
 * Dieses Skript testet, ob die SSL-Zertifikate richtig konfiguriert sind,
 * ohne den gesamten Server zu starten.
 */

const { checkCertificatesExist, createTestApp, startServer } = require('./server/ssl-setup');

// Testport (Standard: 8443)
const PORT = process.env.SSL_TEST_PORT || 8443;

console.log('===========================================');
console.log(' SSL-Zertifikatstest für Bau-Structura');
console.log('===========================================');
console.log();

// Einfache Test-App erstellen
const app = createTestApp();

// Versuche, den Server zu starten
try {
  console.log(`Starte Test-HTTPS-Server auf Port ${PORT}...`);
  const server = startServer(app, PORT);
  
  console.log('\nWenn der Server erfolgreich gestartet wurde:');
  console.log(`1. Öffnen Sie https://localhost:${PORT}/ im Browser`);
  console.log('2. Ignorieren Sie eventuelle Browserwarnungen im Testmodus');
  console.log('3. Sie sollten eine Erfolgsmeldung sehen');
  console.log('\nDrücken Sie Strg+C, um den Testserver zu beenden');
  
  // Bei SIGINT Server beenden
  process.on('SIGINT', () => {
    console.log('\nServer wird beendet...');
    server.close(() => {
      console.log('Server beendet.');
      process.exit(0);
    });
  });
} catch (error) {
  console.error('\nFehler beim Testen der SSL-Konfiguration:', error);
  process.exit(1);
}