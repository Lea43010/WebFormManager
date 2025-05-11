/**
 * Zentrales Sicherheitsmodul für die Bau-Structura-App
 * 
 * Dieses Modul exportiert alle Sicherheitsfunktionen und Dienstprogramme und
 * bietet eine zentrale Initialisierungsfunktion zur Aktivierung aller Sicherheitsfeatures.
 */

import { Express } from 'express';
import helmet from 'helmet';

// Sicherheitsmodule importieren
import * as encryption from './encryption';
import * as passwordManager from './password-manager';
import * as cookieManager from './cookie-manager';
import * as tlsManager from './tls-manager';
import * as gdprRightsManager from './gdpr-rights-manager';
import * as rateLimiter from './rate-limiter';
import * as jwtManager from './jwt-manager';
import * as twoFactorAuth from './two-factor-auth';

// Re-Export aller Module
export { 
  encryption,
  passwordManager,
  cookieManager,
  tlsManager,
  gdprRightsManager,
  rateLimiter,
  jwtManager,
  twoFactorAuth
};

/**
 * Initialisiert alle Sicherheitsmodule
 */
export async function initializeSecurity(app: Express): Promise<boolean> {
  console.log('[Sicherheit] Initialisierung der Sicherheitsmodule...');
  
  try {
    // 1. Helmet für Sicherheitsheader
    app.use(helmet());
    console.log('[Sicherheit] Helmet-Sicherheitsheader aktiviert');
    
    // 2. HTTPS/TLS-Konfiguration
    tlsManager.configureTls(app, {
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    });
    console.log('[Sicherheit] TLS-Konfiguration angewendet');
    
    // 3. Verschlüsselungstabelle initialisieren
    await encryption.initializeEncryptionTable();
    console.log('[Sicherheit] Verschlüsselungsdienst initialisiert');
    
    // 4. DSGVO-Anfragentabelle initialisieren
    await gdprRightsManager.initializeGdprRequestsTable();
    console.log('[Sicherheit] DSGVO-Rechte-Manager initialisiert');
    
    // 5. Rate-Limiter-Tabelle initialisieren
    await rateLimiter.initializeRateLimitTable();
    console.log('[Sicherheit] Rate-Limiter initialisiert');
    
    // 6. JWT-Token-Blacklist-Tabelle initialisieren
    await jwtManager.initializeTokenBlacklistTable();
    console.log('[Sicherheit] JWT-Token-Manager initialisiert');
    
    // 7. 2FA-Tabelle initialisieren
    await twoFactorAuth.initialize2FATable();
    console.log('[Sicherheit] 2-Faktor-Authentifizierung initialisiert');
    
    // 8. Blockierte IPs prüfen (falls zu viele Anfragen)
    app.use(rateLimiter.checkBlockedStatus());
    console.log('[Sicherheit] Prüfung auf blockierte IP-Adressen aktiviert');
    
    // 9. Cookie-Banner-Middleware hinzufügen
    app.use((req, res, next) => {
      // Wenn kein Einwilligungs-Cookie vorhanden ist, fügen wir Informationen zum Cookie-Banner hinzu
      if (!req.cookies[cookieManager.CONSENT_COOKIE_NAME]) {
        res.locals.showCookieBanner = true;
      }
      next();
    });
    console.log('[Sicherheit] Cookie-Einwilligungssystem initialisiert');
    
    // 10. Automatische Bereinigung (für Token-Blacklist, Rate-Limit-Einträge, etc.)
    // Führe alle 24 Stunden eine Bereinigung durch
    setInterval(async () => {
      try {
        const cleanedTokens = await jwtManager.cleanupBlacklistedTokens();
        console.log(`[Sicherheit] ${cleanedTokens} abgelaufene Tokens aus der Blacklist bereinigt`);
        
        await rateLimiter.cleanupRateLimitEntries();
        console.log('[Sicherheit] Alte Rate-Limit-Einträge bereinigt');
      } catch (error) {
        console.error('[Sicherheit] Fehler bei der automatischen Bereinigung:', error);
      }
    }, 24 * 60 * 60 * 1000);
    console.log('[Sicherheit] Automatische Bereinigungsaufgaben geplant');
    
    console.log('[Sicherheit] Alle Sicherheitsmodule erfolgreich initialisiert');
    return true;
  } catch (error) {
    console.error('[Sicherheit] Fehler bei der Initialisierung der Sicherheitsmodule:', error);
    return false;
  }
}

// Allgemeine Sicherheitsfunktionen

/**
 * Validiert eine E-Mail-Adresse
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validiert die Passwortstärke
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Mindestlänge
  if (password.length < 8) {
    feedback.push('Das Passwort sollte mindestens 8 Zeichen lang sein.');
  } else {
    score += 1;
  }
  
  // Großbuchstaben
  if (!/[A-Z]/.test(password)) {
    feedback.push('Das Passwort sollte mindestens einen Großbuchstaben enthalten.');
  } else {
    score += 1;
  }
  
  // Kleinbuchstaben
  if (!/[a-z]/.test(password)) {
    feedback.push('Das Passwort sollte mindestens einen Kleinbuchstaben enthalten.');
  } else {
    score += 1;
  }
  
  // Zahlen
  if (!/[0-9]/.test(password)) {
    feedback.push('Das Passwort sollte mindestens eine Zahl enthalten.');
  } else {
    score += 1;
  }
  
  // Sonderzeichen
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Das Passwort sollte mindestens ein Sonderzeichen enthalten.');
  } else {
    score += 1;
  }
  
  // Vermeidung häufiger Passwörter
  const commonPasswords = [
    'passwort', 'password', '123456', 'qwerty', 'admin', 'welcome', 
    'letmein', 'test', 'baustelle', 'baustelle123'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    feedback.push('Dieses Passwort ist zu häufig und leicht zu erraten.');
    score = 0;
  }
  
  return {
    isValid: score >= 3 && password.length >= 8,
    score,
    feedback
  };
}

/**
 * Sanitiert Eingabetext zur Vermeidung von XSS-Angriffen
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}