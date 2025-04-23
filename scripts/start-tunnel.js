const localtunnel = require('localtunnel');
const { logger } = require('../server/logger');

// Konfiguration
const PORT = parseInt(process.env.PORT || '5001', 10);
const SUBDOMAIN = 'bau-structura-test';

// Funktion zum Starten des Tunnels
async function startTunnel() {
  try {
    logger.info(`Starte localtunnel für Port ${PORT} mit Subdomain ${SUBDOMAIN}...`);
    
    const tunnel = await localtunnel({ 
      port: PORT,
      subdomain: SUBDOMAIN
    });
    
    logger.info(`✅ Tunnel gestartet! Öffentliche URL: ${tunnel.url}`);
    console.log(`\n\x1b[32m✅ Öffentliche Test-URL: ${tunnel.url}\x1b[0m\n`);
    
    tunnel.on('close', () => {
      logger.warn('Tunnel wurde geschlossen, versuche Neustart...');
      setTimeout(startTunnel, 5000);
    });
    
    tunnel.on('error', (err) => {
      logger.error('Tunnel-Fehler aufgetreten:', err);
      tunnel.close();
      setTimeout(startTunnel, 10000);
    });
    
    // Tunnel alle 8 Stunden neu starten, um Verbindungsprobleme zu vermeiden
    setTimeout(() => {
      logger.info('Geplanter Tunnel-Neustart nach 8 Stunden...');
      tunnel.close();
    }, 8 * 60 * 60 * 1000);
    
    return tunnel;
  } catch (error) {
    logger.error('Fehler beim Starten des Tunnels:', error);
    console.error('⚠️ Tunnel konnte nicht gestartet werden:', error.message);
    
    // Versuche, den Tunnel nach 30 Sekunden erneut zu starten
    setTimeout(startTunnel, 30000);
    return null;
  }
}

// Hauptausführung: Starte den Tunnel
startTunnel();

// Handler für sauberes Beenden
process.on('SIGINT', () => {
  logger.info('Beende Tunnel aufgrund von SIGINT...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Beende Tunnel aufgrund von SIGTERM...');
  process.exit(0);
});