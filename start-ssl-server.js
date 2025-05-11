/**
 * Produktions-Server-Start mit SSL-Unterstützung
 * 
 * Dieses Skript startet den Produktionsserver mit SSL-Unterstützung
 * für die Bau-Structura-Anwendung.
 */

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');

// Standardport
const PORT = process.env.PORT || 443;

console.log('Starte Bau-Structura Produktionsserver mit SSL-Unterstützung...');
console.log(`Port: ${PORT}`);

// Umgebungsvariable setzen
process.env.NODE_ENV = 'production';
process.env.USE_SSL = 'true';

// Pfade prüfen
const CERT_PATH = path.join(__dirname, 'ssl/certificate.crt');
const KEY_PATH = path.join(__dirname, 'ssl/private.key');
const CA_PATH = path.join(__dirname, 'ssl/ca_bundle.crt');

let certExists = fs.existsSync(CERT_PATH);
let keyExists = fs.existsSync(KEY_PATH);
let caExists = fs.existsSync(CA_PATH);

console.log('\nZertifikatstatus:');
console.log(`- Zertifikat (certificate.crt): ${certExists ? '✅ Gefunden' : '❌ Nicht gefunden'}`);
console.log(`- Privater Schlüssel (private.key): ${keyExists ? '✅ Gefunden' : '❌ Nicht gefunden'}`);
console.log(`- CA-Bundle (ca_bundle.crt): ${caExists ? '✅ Optional - Gefunden' : '⚠️ Optional - Nicht gefunden'}`);

if (!certExists || !keyExists) {
  console.error('\n❌ SSL-Zertifikate fehlen. Server kann nicht im SSL-Modus gestartet werden.');
  console.log('\nBitte stellen Sie die folgenden Dateien in den "ssl"-Ordner:');
  console.log('1. certificate.crt - Das Strato-Zertifikat');
  console.log('2. private.key - Der private Schlüssel');
  console.log('3. ca_bundle.crt - Optional: Das CA-Bundle (falls vorhanden)');
  process.exit(1);
}

console.log('\n✅ SSL-Zertifikate gefunden. Server wird mit HTTPS gestartet...\n');

// Server mit nodejs starten
try {
  const server = childProcess.spawn('node', ['server/app.js'], {
    env: process.env,
    stdio: 'inherit'
  });
  
  server.on('close', (code) => {
    console.log(`Der Server wurde mit Exit-Code ${code} beendet.`);
  });
  
  // Bei SIGINT oder SIGTERM den Kindprozess beenden
  process.on('SIGINT', () => {
    console.log('SIGINT empfangen. Server wird heruntergefahren...');
    server.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('SIGTERM empfangen. Server wird heruntergefahren...');
    server.kill('SIGTERM');
  });
} catch (error) {
  console.error('Fehler beim Starten des Servers:', error);
  process.exit(1);
}