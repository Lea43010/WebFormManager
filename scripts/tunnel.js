/**
 * Tunnel-Skript für Bau-Structura
 * 
 * Dieses Skript erstellt einen öffentlichen Tunnel mit localtunnel.
 * Es wird als separater Prozess ausgeführt und bietet Zugriff auf die Anwendung über das Internet.
 */

import localtunnel from 'localtunnel';

// Konfiguration
const PORT = parseInt(process.env.PORT || '5001', 10);
const SUBDOMAIN = 'bau-structura-test';

// Funktion zum Starten des Tunnels
async function startTunnel() {
  try {
    console.log(`Starte localtunnel für Port ${PORT} mit Subdomain ${SUBDOMAIN}...`);
    
    const tunnel = await localtunnel({ 
      port: PORT,
      subdomain: SUBDOMAIN
    });
    
    console.log(`\n✅ Tunnel gestartet! Öffentliche URL: ${tunnel.url}\n`);
    
    tunnel.on('close', () => {
      console.warn('Tunnel wurde geschlossen, versuche Neustart...');
      setTimeout(startTunnel, 5000);
    });
    
    tunnel.on('error', (err) => {
      console.error('Tunnel-Fehler aufgetreten:', err);
      tunnel.close();
      setTimeout(startTunnel, 10000);
    });
    
    // Tunnel alle 8 Stunden neu starten, um Verbindungsprobleme zu vermeiden
    setTimeout(() => {
      console.info('Geplanter Tunnel-Neustart nach 8 Stunden...');
      tunnel.close();
    }, 8 * 60 * 60 * 1000);
    
    return tunnel;
  } catch (error) {
    console.error('Fehler beim Starten des Tunnels:', error);
    
    // Versuche, den Tunnel nach 30 Sekunden erneut zu starten
    setTimeout(startTunnel, 30000);
    return null;
  }
}

// Hauptausführung: Starte den Tunnel
startTunnel();

// Handler für sauberes Beenden
process.on('SIGINT', () => {
  console.info('Beende Tunnel aufgrund von SIGINT...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.info('Beende Tunnel aufgrund von SIGTERM...');
  process.exit(0);
});