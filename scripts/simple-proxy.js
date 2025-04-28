/**
 * Einfacher Proxy-Server für Bau-Structura
 * 
 * Dieser Server bietet eine öffentliche URL und leitet Anfragen an den lokalen 
 * Entwicklungsserver weiter, ohne complexe Tunneling-Lösungen zu verwenden.
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

// Konfiguration
const PORT = process.env.PROXY_PORT || 9000; // Nutze Umgebungsvariable oder Standardport
const TARGET_PORT = process.env.PORT || 5000; // Verwende den tatsächlichen Port des Servers
const TARGET_HOST = 'localhost';

// Einfacher Proxy-Server erstellen
const server = http.createServer((req, res) => {
  // Status-Endpunkt für Heartbeat
  if (req.url === '/proxy-status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'online',
      proxyPort: PORT,
      targetPort: TARGET_PORT,
      message: 'Proxy-Server läuft'
    }));
  }

  console.log(`Proxy-Anfrage: ${req.method} ${req.url}`);
  
  // Optionen für die Weiterleitung zur lokalen App
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  
  // Host-Header anpassen
  options.headers.host = `${TARGET_HOST}:${TARGET_PORT}`;
  
  // Anfrage erstellen und an lokalen Server weiterleiten
  const proxyReq = http.request(options, (proxyRes) => {
    // Antwort-Header setzen
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    
    // Antwort-Daten weiterleiten
    proxyRes.pipe(res, { end: true });
  });
  
  // Fehlerbehandlung für die Proxy-Anfrage
  proxyReq.on('error', (err) => {
    console.error('Proxy-Fehler:', err.message);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy-Fehler: Server nicht erreichbar');
  });
  
  // Anfrage-Daten weiterleiten
  req.pipe(proxyReq, { end: true });
});

// Server starten mit Fallback auf alternative Ports
function startServer(port) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} ist bereits belegt, versuche Port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Proxy-Server-Fehler:', err);
    }
  });
  
  server.listen(port, () => {
    console.log(`\n-------------------------------------------------`);
    console.log(`✅ PROXY-SERVER AKTIV AUF PORT ${port}`);
    console.log(`-------------------------------------------------`);
    console.log(`Zugriff über: http://localhost:${port}`);
    console.log(`Status-Check: http://localhost:${port}/proxy-status`);
    console.log(`-------------------------------------------------\n`);
  });
}

// Server mit konfiguriertem Port starten
console.log(`[INFO] [app] Proxy-Server wird auf Port ${PORT} gestartet`);
startServer(PORT);

// Sauberes Beenden
process.on('SIGINT', () => {
  console.log('Beende Proxy-Server...');
  server.close();
  process.exit(0);
});