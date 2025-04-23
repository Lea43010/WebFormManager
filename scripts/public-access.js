/**
 * Einfaches Zugangsskript für Bau-Structura
 * Dieses Skript erstellt eine öffentliche URL für die Anwendung
 */

import http from 'http';
import localtunnel from 'localtunnel';

const PORT = parseInt(process.env.PORT || '5001', 10);
const SUBDOMAIN = 'bau-structura-app';

// Simpler HTTP-Server für den Anwendungsstatus
const server = http.createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'online',
      message: 'Bau-Structura Test-Server läuft',
      tunnelUrl: latestTunnelUrl || 'Wird erstellt...'
    }));
  } else {
    res.writeHead(302, { 'Location': 'http://localhost:5001' + req.url });
    res.end();
  }
});

// Speichert die aktuelle Tunnel-URL
let latestTunnelUrl = null;

// Server auf einem eigenen Port starten
const STATUS_PORT = 7000;
server.listen(STATUS_PORT, '127.0.0.1', () => {
  console.log(`Status-Server läuft auf http://localhost:${STATUS_PORT}/status`);
});

// Direkter Tunnel-Start ohne Umwege
async function createDirectTunnel() {
  try {
    console.log(`Direkter Tunnel wird für Port ${PORT} gestartet...`);
    
    // Tunnel für den Hauptserver erstellen
    const tunnel = await localtunnel({
      port: PORT,
      subdomain: SUBDOMAIN,
      local_host: '127.0.0.1'
    });
    
    latestTunnelUrl = tunnel.url;
    console.log(`\n-------------------------------------------------`);
    console.log(`✅ TUNNEL AKTIV: ${tunnel.url}`);
    console.log(`-------------------------------------------------\n`);
    
    // Tunnel-Events
    tunnel.on('close', () => {
      console.log('Tunnel geschlossen, starte neu...');
      setTimeout(createDirectTunnel, 3000);
    });
    
    tunnel.on('error', (err) => {
      console.error('Tunnel-Fehler:', err);
      tunnel.close();
    });
    
  } catch (error) {
    console.error('Tunnel-Fehler:', error.message);
    setTimeout(createDirectTunnel, 5000);
  }
}

// Starten
createDirectTunnel();

// Sauberes Beenden
process.on('SIGINT', () => {
  console.log('Beende Tunnel und Server...');
  server.close();
  process.exit(0);
});