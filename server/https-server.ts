import { Server as HttpServer } from 'http';
import { Server as HttpsServer, createServer } from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';
import { logger } from './logger';

interface SSLOptions {
  certPath: string;
  keyPath: string;
  caPath?: string;
}

/**
 * Erstellt einen HTTPS-Server mit SSL-Zertifikaten
 */
export function createSecureServer(
  app: Express,
  options: SSLOptions
): HttpsServer | HttpServer {
  try {
    const { certPath, keyPath, caPath } = options;
    
    // Überprüfen, ob die Zertifikate existieren
    if (!fs.existsSync(certPath)) {
      throw new Error(`Zertifikat nicht gefunden: ${certPath}`);
    }
    
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Privater Schlüssel nicht gefunden: ${keyPath}`);
    }

    // SSL-Zertifikate laden
    const cert = fs.readFileSync(certPath, 'utf8');
    const key = fs.readFileSync(keyPath, 'utf8');
    
    // CA-Bundle laden (falls vorhanden)
    let ca: string | undefined;
    if (caPath && fs.existsSync(caPath)) {
      ca = fs.readFileSync(caPath, 'utf8');
    }
    
    // HTTPS-Server erstellen
    const httpsOptions: any = {
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
    
    logger.info('[HTTPS] SSL-Zertifikate erfolgreich geladen');
    return createServer(httpsOptions, app);
  } catch (error) {
    logger.error('[HTTPS] Fehler beim Erstellen des HTTPS-Servers:', error);
    logger.warn('[HTTPS] Fallback auf unsicheren HTTP-Server');
    return new HttpServer(app);
  }
}