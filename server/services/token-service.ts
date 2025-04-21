/**
 * Token-Service für sicheren Dateizugriff
 * 
 * Dieser Service ermöglicht die Erstellung und Überprüfung von Zugriffstokens für Dateidownloads.
 * Dadurch wird verhindert, dass Nutzer direkt über URLs auf Dateien zugreifen können.
 */

import crypto from 'crypto';
import { User } from '@shared/schema';
import config from '../../config';

// Cache für ausgestellte Tokens
interface TokenEntry {
  token: string;
  fileId: number;
  userId: number;
  expiry: Date;
}

// Sicherheitskonfiguration für Tokens
const tokenConfig = {
  expiryMinutes: 30,  // Tokens laufen nach 30 Minuten ab
  secret: process.env.SESSION_SECRET || 'test-secret',
  tokenLength: 64,
  tokenCache: new Map<string, TokenEntry>()
};

/**
 * Generiert ein temporäres Download-Token für eine Datei
 * 
 * @param fileId Die ID der Datei
 * @param user Der anfragende Benutzer
 * @returns Ein Token für den Dateizugriff
 */
export function generateDownloadToken(fileId: number, user: User): string {
  // Aktuellen Zeitstempel für Tokenerstellung
  const now = new Date();
  
  // Ablaufdatum des Tokens berechnen
  const expiry = new Date(now);
  expiry.setMinutes(expiry.getMinutes() + tokenConfig.expiryMinutes);
  
  // Daten für den Token
  const tokenData = `${fileId}-${user.id}-${now.getTime()}-${expiry.getTime()}`;
  
  // Token mit HMAC-SHA256 signieren
  const hmac = crypto.createHmac('sha256', tokenConfig.secret);
  hmac.update(tokenData);
  
  // Zufallskomponente hinzufügen
  const randomBytes = crypto.randomBytes(16).toString('hex');
  
  // Token generieren
  const token = `${hmac.digest('hex')}-${randomBytes}`;
  
  // Token im Cache speichern
  const tokenEntry: TokenEntry = {
    token,
    fileId,
    userId: user.id,
    expiry
  };
  
  tokenConfig.tokenCache.set(token, tokenEntry);
  
  // Token bereinigen - alte Tokens entfernen
  cleanupExpiredTokens();
  
  return token;
}

/**
 * Überprüft die Gültigkeit eines Download-Tokens
 * 
 * @param token Das zu überprüfende Token
 * @param fileId Die ID der Datei
 * @param userId Die ID des Benutzers
 * @returns true wenn das Token gültig ist, sonst false
 */
export function verifyDownloadToken(token: string, fileId: number, userId: number): boolean {
  // Token im Cache suchen
  const tokenEntry = tokenConfig.tokenCache.get(token);
  
  // Prüfen, ob das Token existiert und die Daten übereinstimmen
  if (!tokenEntry) {
    return false;
  }
  
  // Prüfen, ob das Token abgelaufen ist
  const now = new Date();
  if (tokenEntry.expiry < now) {
    // Abgelaufenes Token aus dem Cache entfernen
    tokenConfig.tokenCache.delete(token);
    return false;
  }
  
  // Prüfen, ob das Token für die angegebene Datei und den Benutzer gültig ist
  if (tokenEntry.fileId !== fileId || tokenEntry.userId !== userId) {
    return false;
  }
  
  return true;
}

/**
 * Nicht verwendete Tokens, die abgelaufen sind, aus dem Cache entfernen
 */
function cleanupExpiredTokens(): void {
  const now = new Date();
  
  // Verwende Array.from, um Iterator-Probleme zu vermeiden
  Array.from(tokenConfig.tokenCache.entries()).forEach(([token, entry]) => {
    if (entry.expiry < now) {
      tokenConfig.tokenCache.delete(token);
    }
  });
}

/**
 * Invalidiert ein Token nach der Verwendung
 * 
 * @param token Das zu invalidierende Token
 */
export function invalidateToken(token: string): void {
  tokenConfig.tokenCache.delete(token);
}