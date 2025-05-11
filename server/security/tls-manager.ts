/**
 * TLS/SSL-Manager
 * 
 * Dieser Dienst hilft bei der Konfiguration von HTTPS und TLS-Sicherheitsoptionen
 * für die Express-Server-Anwendung und bietet Anleitungen zur Integration mit verschiedenen
 * SSL-Zertifikatsanbietern wie Let's Encrypt.
 */

import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import helmet from 'helmet';

// TLS-Konfigurationsoptionen
interface TlsOptions {
  // Umgebung
  environment: 'development' | 'staging' | 'production';
  
  // SSL-Zertifikatspfade
  certPath?: string;
  keyPath?: string;
  
  // Content Security Policy
  enableCsp?: boolean;
  cspOptions?: Record<string, any>;
  
  // HTTP Strict Transport Security
  enableHsts?: boolean;
  hstsMaxAge?: number;
  
  // Andere Sicherheitsoptionen
  enableXssProtection?: boolean;
  enableFrameGuard?: boolean;
}

// Standard-TLS-Optionen
const defaultTlsOptions: TlsOptions = {
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  enableCsp: true,
  enableHsts: true,
  hstsMaxAge: 15552000, // 180 Tage
  enableXssProtection: true,
  enableFrameGuard: true
};

/**
 * Konfiguriert einen Express-Server mit TLS/SSL und anderen Sicherheitsoptionen
 */
export function configureTls(app: express.Express, options: Partial<TlsOptions> = {}): void {
  // Optionen mit Standardwerten zusammenführen
  const tlsOptions: TlsOptions = {
    ...defaultTlsOptions,
    ...options
  };
  
  // Helmet für Sicherheitsheader konfigurieren
  const helmetOptions: helmet.HelmetOptions = {
    contentSecurityPolicy: tlsOptions.enableCsp === false ? false : {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'https://api.mapbox.com', 'https://api.stripe.com'],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: tlsOptions.environment === 'production' ? [] : null,
        ...tlsOptions.cspOptions
      }
    },
    
    // HTTP Strict Transport Security
    hsts: tlsOptions.enableHsts === false ? false : {
      maxAge: tlsOptions.hstsMaxAge,
      includeSubDomains: true,
      preload: tlsOptions.environment === 'production'
    },
    
    // XSS-Schutz
    xssFilter: tlsOptions.enableXssProtection !== false,
    
    // Clickjacking-Schutz
    frameguard: tlsOptions.enableFrameGuard === false ? false : { 
      action: 'deny' 
    },
    
    // Weitere Standardoptionen
    dnsPrefetchControl: { allow: false },
    hidePoweredBy: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  };
  
  // Helmet-Middleware anwenden
  app.use(helmet(helmetOptions));
  
  // Redirect von HTTP zu HTTPS in Produktion erzwingen
  if (tlsOptions.environment === 'production' || tlsOptions.environment === 'staging') {
    app.use((req, res, next) => {
      if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect(301, `https://${req.get('host')}${req.url}`);
      }
      next();
    });
  }
}

/**
 * Erstellt einen HTTPS-Server mit SSL-Zertifikaten
 */
export function createHttpsServer(
  app: express.Express, 
  options: Partial<TlsOptions> = {}
): HttpsServer | HttpServer {
  // Optionen mit Standardwerten zusammenführen
  const tlsOptions: TlsOptions = {
    ...defaultTlsOptions,
    ...options
  };
  
  // TLS-Sicherheitsoptionen konfigurieren
  configureTls(app, tlsOptions);
  
  // In der Entwicklungsumgebung keinen HTTPS-Server erstellen
  if (tlsOptions.environment === 'development') {
    console.log('[TLS-Manager] Entwicklungsmodus: Kein HTTPS-Server erstellt');
    return new HttpServer(app);
  }
  
  try {
    // Prüfen, ob Zertifikat und Schlüssel vorhanden sind
    if (!tlsOptions.certPath || !tlsOptions.keyPath) {
      throw new Error('Zertifikats- oder Schlüsselpfad nicht angegeben');
    }
    
    // Zertifikat und Schlüssel laden
    const cert = fs.readFileSync(tlsOptions.certPath);
    const key = fs.readFileSync(tlsOptions.keyPath);
    
    // HTTPS-Server erstellen
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
    
    return new HttpsServer(httpsOptions, app);
  } catch (error) {
    console.error('[TLS-Manager] Fehler beim Erstellen des HTTPS-Servers:', error);
    console.warn('[TLS-Manager] Fallback auf unsicheren HTTP-Server');
    return new HttpServer(app);
  }
}

/**
 * Bietet Informationen zur Let's Encrypt-Integration
 */
export function getLetsEncryptInstructions(): string {
  return `
# Let's Encrypt-Integration mit Certbot

Folgen Sie diesen Schritten, um ein kostenloses SSL-Zertifikat von Let's Encrypt zu erhalten:

## 1. Installation von Certbot

### Auf Ubuntu/Debian:
\`\`\`bash
sudo apt update
sudo apt install certbot
\`\`\`

### Auf CentOS/RHEL:
\`\`\`bash
sudo yum install certbot
\`\`\`

## 2. Zertifikat anfordern

### Standalone-Modus (Server muss gestoppt sein):
\`\`\`bash
sudo certbot certonly --standalone -d example.com -d www.example.com
\`\`\`

### Webroot-Modus (Server kann weiterlaufen):
\`\`\`bash
sudo certbot certonly --webroot -w /path/to/public -d example.com -d www.example.com
\`\`\`

## 3. Zertifikatspfade einrichten

Die Zertifikate werden unter \`/etc/letsencrypt/live/example.com/\` gespeichert:
- fullchain.pem: Das vollständige Zertifikat
- privkey.pem: Der private Schlüssel

## 4. Node.js-Server mit den Zertifikaten konfigurieren

\`\`\`typescript
import * as express from 'express';
import { createHttpsServer } from './server/security/tls-manager';

const app = express();
// ... App-Konfiguration ...

const httpsServer = createHttpsServer(app, {
  environment: 'production',
  certPath: '/etc/letsencrypt/live/example.com/fullchain.pem',
  keyPath: '/etc/letsencrypt/live/example.com/privkey.pem'
});

httpsServer.listen(443, () => {
  console.log('HTTPS-Server gestartet auf Port 443');
});
\`\`\`

## 5. Automatische Erneuerung einrichten

Let's Encrypt-Zertifikate sind 90 Tage gültig. Richten Sie einen Cron-Job ein:

\`\`\`bash
sudo crontab -e
\`\`\`

Fügen Sie diese Zeile hinzu, um zweimal täglich zu prüfen:

\`\`\`
0 0,12 * * * certbot renew --post-hook "systemctl restart yourservice"
\`\`\`
  `;
}