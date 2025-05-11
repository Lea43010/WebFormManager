/**
 * JWT-Token-Manager für sichere API-Zugriffe
 * 
 * Dieser Dienst ermöglicht die Verwaltung von JWT-Tokens für API-Zugriffe
 * und bietet Funktionen zur Erstellung, Validierung und Erneuerung von Tokens.
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

// Standard-Gültigkeitsdauer für Tokens
const DEFAULT_TOKEN_EXPIRY = '1h';  // 1 Stunde
const DEFAULT_REFRESH_TOKEN_EXPIRY = '7d';  // 7 Tage

// Geheimschlüssel für JWT-Signierung - wird beim Start generiert
let JWT_SECRET = process.env.JWT_SECRET;
let REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Wenn keine Geheimnisse definiert sind, generiere neue
if (!JWT_SECRET) {
  JWT_SECRET = crypto.randomBytes(64).toString('hex');
  console.warn('[JWT-Manager] Kein JWT_SECRET in Umgebungsvariablen gefunden. Ein temporärer Schlüssel wurde generiert.');
  console.warn('[JWT-Manager] Warnung: Bei Neustart des Servers werden alle bestehenden Tokens ungültig!');
}

if (!REFRESH_TOKEN_SECRET) {
  REFRESH_TOKEN_SECRET = crypto.randomBytes(64).toString('hex');
  console.warn('[JWT-Manager] Kein REFRESH_TOKEN_SECRET in Umgebungsvariablen gefunden. Ein temporärer Schlüssel wurde generiert.');
}

// Token-Typen
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET_PASSWORD = 'reset_password',
  ACCOUNT_VERIFICATION = 'account_verification',
  API_KEY = 'api_key'
}

// Token-Payload-Interface
export interface TokenPayload {
  id: number;
  email?: string;
  role?: string;
  permissions?: string[];
  type: TokenType;
  [key: string]: any;
}

/**
 * Initialisiert die Token-Blacklist-Tabelle
 */
export async function initializeTokenBlacklistTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id SERIAL PRIMARY KEY,
        token_id VARCHAR(255) NOT NULL,
        user_id INTEGER,
        expiry TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reason VARCHAR(255),
        UNIQUE(token_id)
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_token_blacklist_token_id ON token_blacklist(token_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_token_blacklist_expiry ON token_blacklist(expiry)
    `);

    console.log('[JWT-Manager] Token-Blacklist-Tabelle initialisiert');
    return true;
  } catch (error) {
    console.error('[JWT-Manager] Fehler bei der Initialisierung der Token-Blacklist-Tabelle:', error);
    return false;
  }
}

/**
 * Erstellt ein neues JWT-Token
 */
export function generateToken(payload: Omit<TokenPayload, 'type'>, type: TokenType = TokenType.ACCESS, expiresIn: string = DEFAULT_TOKEN_EXPIRY): string {
  const tokenPayload: TokenPayload = {
    ...payload,
    type,
    jti: crypto.randomBytes(16).toString('hex'), // Eindeutige Token-ID für Blacklisting
    iat: Math.floor(Date.now() / 1000)
  };

  // Wähle das richtige Geheimnis basierend auf dem Token-Typ
  const secret = type === TokenType.REFRESH ? REFRESH_TOKEN_SECRET : JWT_SECRET;
  
  return jwt.sign(
    tokenPayload,
    secret,
    { expiresIn }
  );
}

/**
 * Erstellt ein neues Refresh-Token
 */
export function generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
  return generateToken(payload, TokenType.REFRESH, DEFAULT_REFRESH_TOKEN_EXPIRY);
}

/**
 * Validiert ein JWT-Token
 */
export function verifyToken(token: string, type: TokenType = TokenType.ACCESS): Promise<TokenPayload> {
  return new Promise((resolve, reject) => {
    const secret = type === TokenType.REFRESH ? REFRESH_TOKEN_SECRET : JWT_SECRET;
    
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      
      const payload = decoded as TokenPayload;
      
      // Überprüfe, ob der Token-Typ übereinstimmt
      if (payload.type !== type) {
        return reject(new Error('Ungültiger Token-Typ'));
      }
      
      resolve(payload);
    });
  });
}

/**
 * Fügt ein Token zur Blacklist hinzu (z.B. bei Logout)
 */
export async function blacklistToken(token: string, reason: string = 'logout'): Promise<boolean> {
  try {
    // Token decodieren, ohne die Signatur zu überprüfen
    const decoded = jwt.decode(token) as TokenPayload;
    
    if (!decoded || !decoded.jti) {
      return false;
    }
    
    const tokenId = decoded.jti;
    const userId = decoded.id;
    
    // Berechne den Ablaufzeitpunkt aus dem Token
    const expiry = new Date(decoded.exp * 1000);
    
    // Füge den Token zur Blacklist hinzu
    await db.execute(sql`
      INSERT INTO token_blacklist (token_id, user_id, expiry, reason)
      VALUES (${tokenId}, ${userId}, ${expiry.toISOString()}, ${reason})
      ON CONFLICT (token_id) DO NOTHING
    `);
    
    return true;
  } catch (error) {
    console.error('[JWT-Manager] Fehler beim Blacklisting des Tokens:', error);
    return false;
  }
}

/**
 * Prüft, ob ein Token auf der Blacklist steht
 */
export async function isTokenBlacklisted(tokenId: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT id FROM token_blacklist WHERE token_id = ${tokenId}
    `);
    
    return result.length > 0;
  } catch (error) {
    console.error('[JWT-Manager] Fehler beim Prüfen der Blacklist:', error);
    return true; // Im Zweifelsfall Token als ungültig betrachten
  }
}

/**
 * Bereinigt abgelaufene Tokens aus der Blacklist
 */
export async function cleanupBlacklistedTokens(): Promise<number> {
  try {
    const result = await db.execute(sql`
      DELETE FROM token_blacklist
      WHERE expiry < CURRENT_TIMESTAMP
      RETURNING id
    `);
    
    return result.length;
  } catch (error) {
    console.error('[JWT-Manager] Fehler bei der Bereinigung der Blacklist:', error);
    return 0;
  }
}

/**
 * Middleware zur JWT-Authentifizierung für API-Routen
 */
export function authenticateJWT(requiredPermissions: string[] = []) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Hole den Token aus dem Authorization-Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Kein gültiger Authentifizierungs-Token gefunden'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verifiziere den Token
      const payload = await verifyToken(token);
      
      // Prüfe, ob der Token auf der Blacklist steht
      if (await isTokenBlacklisted(payload.jti)) {
        return res.status(401).json({
          status: 'error',
          message: 'Token wurde widerrufen'
        });
      }
      
      // Wenn bestimmte Berechtigungen erforderlich sind, prüfe diese
      if (requiredPermissions.length > 0) {
        const userPermissions = payload.permissions || [];
        const hasPermission = requiredPermissions.every(perm => 
          userPermissions.includes(perm)
        );
        
        if (!hasPermission) {
          return res.status(403).json({
            status: 'error',
            message: 'Unzureichende Berechtigungen für diese Aktion'
          });
        }
      }
      
      // Speichere den decodierten Token im Request-Objekt für spätere Verwendung
      (req as any).jwtPayload = payload;
      
      next();
    } catch (error) {
      // Unterscheide zwischen verschiedenen Token-Fehlern
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          status: 'error',
          message: 'Token ist abgelaufen',
          code: 'token_expired'
        });
      } else if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          status: 'error',
          message: 'Ungültiger Token',
          code: 'invalid_token'
        });
      } else {
        console.error('[JWT-Manager] Token-Validierungsfehler:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Interner Server-Fehler bei der Token-Validierung'
        });
      }
    }
  };
}

/**
 * Middleware zum Erneuern eines abgelaufenen Tokens mittels Refresh-Token
 */
export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh-Token erforderlich'
      });
    }
    
    // Validiere den Refresh-Token
    const payload = await verifyToken(refreshToken, TokenType.REFRESH);
    
    // Prüfe, ob der Token auf der Blacklist steht
    if (await isTokenBlacklisted(payload.jti)) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh-Token wurde widerrufen'
      });
    }
    
    // Setze den alten Refresh-Token auf die Blacklist
    await blacklistToken(refreshToken, 'refreshed');
    
    // Erstelle neue Tokens mit aktualisierter Gültigkeitsdauer
    const { jti, iat, exp, type, ...tokenData } = payload;
    const newAccessToken = generateToken(tokenData);
    const newRefreshToken = generateRefreshToken(tokenData);
    
    return res.json({
      status: 'success',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh-Token ist abgelaufen, bitte erneut anmelden',
        code: 'refresh_token_expired'
      });
    } else {
      console.error('[JWT-Manager] Fehler beim Token-Refresh:', error);
      return res.status(401).json({
        status: 'error',
        message: 'Ungültiger Refresh-Token',
        code: 'invalid_refresh_token'
      });
    }
  }
}