/**
 * 2-Faktor-Authentifizierung (2FA)
 * 
 * Dieser Dienst ermöglicht die Implementierung von 2FA mittels TOTP
 * (Time-based One-Time Password) nach dem RFC-6238-Standard.
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

// Konfiguration für den Authenticator
authenticator.options = {
  digits: 6,
  window: 1, // Erlaubt einen Token-Zeitraum vor/nach dem aktuellen (für Uhrzeitsynchronisationsprobleme)
};

// Name der Anwendung für die TOTP-URI
const APP_NAME = 'Bau-Structura';

/**
 * Initialisiert die 2FA-Tabelle
 */
export async function initialize2FATable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS two_factor_auth (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        secret VARCHAR(255) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT false,
        backup_codes TEXT,
        last_used TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES tbluser(id) ON DELETE CASCADE
      )
    `);

    console.log('[2FA] 2FA-Tabelle initialisiert');
    return true;
  } catch (error) {
    console.error('[2FA] Fehler bei der Initialisierung der 2FA-Tabelle:', error);
    return false;
  }
}

/**
 * Erstellt ein neues 2FA-Secret für einen Benutzer
 */
export async function generateUserSecret(userId: number, userEmail: string) {
  try {
    // Generiere ein neues Secret
    const secret = authenticator.generateSecret();
    
    // Erzeuge Backup-Codes
    const backupCodes = generateBackupCodes();
    
    // Überprüfe, ob bereits ein Eintrag existiert
    const existingRecord = await db.execute(sql`
      SELECT id FROM two_factor_auth WHERE user_id = ${userId}
    `);
    
    // Aktualisiere oder erstelle einen neuen Eintrag
    if (existingRecord.length > 0) {
      await db.execute(sql`
        UPDATE two_factor_auth
        SET secret = ${secret},
            backup_codes = ${JSON.stringify(backupCodes)},
            enabled = false,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
      `);
    } else {
      await db.execute(sql`
        INSERT INTO two_factor_auth
        (user_id, secret, backup_codes, enabled)
        VALUES (${userId}, ${secret}, ${JSON.stringify(backupCodes)}, false)
      `);
    }
    
    // Erstelle die TOTP-URI für QR-Codes
    const otpauth = authenticator.keyuri(userEmail, APP_NAME, secret);
    
    // Generiere den QR-Code als Data-URL
    const qrCodeDataURL = await QRCode.toDataURL(otpauth);
    
    return {
      secret,
      otpauth,
      qrCodeDataURL,
      backupCodes
    };
  } catch (error) {
    console.error('[2FA] Fehler beim Generieren des 2FA-Secrets:', error);
    throw error;
  }
}

/**
 * Generiert Backup-Codes für den Fall, dass der Benutzer sein Gerät verliert
 */
function generateBackupCodes(count: number = 10, codeLength: number = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generiere einen zufälligen Code aus Buchstaben und Zahlen
    const code = crypto.randomBytes(codeLength)
      .toString('hex')
      .slice(0, codeLength)
      .toUpperCase();
    
    // Formatiere den Code in Gruppen von 4 Zeichen
    const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;
    
    codes.push(formattedCode);
  }
  
  return codes;
}

/**
 * Verifiziert einen TOTP-Code für einen Benutzer
 */
export async function verifyUserToken(userId: number, token: string): Promise<boolean> {
  try {
    // Hole das Secret des Benutzers
    const result = await db.execute(sql`
      SELECT secret, backup_codes, enabled
      FROM two_factor_auth
      WHERE user_id = ${userId}
    `);
    
    if (result.length === 0 || !result[0].enabled) {
      return false;
    }
    
    const { secret, backup_codes } = result[0];
    
    // Überprüfe den Code zuerst gegen TOTP
    let isValid = authenticator.verify({ token, secret });
    
    // Wenn der TOTP-Code ungültig ist, überprüfe Backup-Codes
    if (!isValid && backup_codes) {
      const backupCodesList = JSON.parse(backup_codes) as string[];
      
      // Entferne Bindestriche für den Vergleich
      const normalizedToken = token.replace(/-/g, '');
      
      const backupCodeIndex = backupCodesList.findIndex(code => 
        code.replace(/-/g, '') === normalizedToken
      );
      
      if (backupCodeIndex >= 0) {
        isValid = true;
        
        // Entferne den verwendeten Backup-Code
        backupCodesList.splice(backupCodeIndex, 1);
        
        // Aktualisiere die Backup-Codes in der Datenbank
        await db.execute(sql`
          UPDATE two_factor_auth
          SET backup_codes = ${JSON.stringify(backupCodesList)},
              last_used = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
        `);
      }
    }
    
    // Aktualisiere das "last_used"-Datum, wenn der Code gültig ist
    if (isValid) {
      await db.execute(sql`
        UPDATE two_factor_auth
        SET last_used = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
      `);
    }
    
    return isValid;
  } catch (error) {
    console.error('[2FA] Fehler bei der Verifizierung des 2FA-Tokens:', error);
    return false;
  }
}

/**
 * Aktiviert 2FA für einen Benutzer
 */
export async function enable2FA(userId: number, token: string): Promise<boolean> {
  try {
    // Hole das Secret des Benutzers
    const result = await db.execute(sql`
      SELECT secret FROM two_factor_auth WHERE user_id = ${userId}
    `);
    
    if (result.length === 0) {
      return false;
    }
    
    const { secret } = result[0];
    
    // Verifiziere den Token
    const isValid = authenticator.verify({ token, secret });
    
    if (!isValid) {
      return false;
    }
    
    // Aktiviere 2FA für den Benutzer
    await db.execute(sql`
      UPDATE two_factor_auth
      SET enabled = true, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `);
    
    return true;
  } catch (error) {
    console.error('[2FA] Fehler beim Aktivieren von 2FA:', error);
    return false;
  }
}

/**
 * Deaktiviert 2FA für einen Benutzer
 */
export async function disable2FA(userId: number, token: string): Promise<boolean> {
  try {
    // Verifiziere zuerst den Token
    const isValid = await verifyUserToken(userId, token);
    
    if (!isValid) {
      return false;
    }
    
    // Deaktiviere 2FA für den Benutzer
    await db.execute(sql`
      UPDATE two_factor_auth
      SET enabled = false, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `);
    
    return true;
  } catch (error) {
    console.error('[2FA] Fehler beim Deaktivieren von 2FA:', error);
    return false;
  }
}

/**
 * Middleware zum Prüfen von 2FA
 */
export function require2FA() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Prüfe, ob der Benutzer authentifiziert ist
      if (!req.isAuthenticated() || !(req.user as any)?.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Nicht authentifiziert'
        });
      }
      
      const userId = (req.user as any).id;
      
      // Prüfe, ob 2FA für den Benutzer aktiviert ist
      const result = await db.execute(sql`
        SELECT enabled FROM two_factor_auth
        WHERE user_id = ${userId}
      `);
      
      // Wenn 2FA nicht aktiviert ist oder keine Einträge gefunden wurden, überspringe die 2FA-Prüfung
      if (result.length === 0 || !result[0].enabled) {
        return next();
      }
      
      // Überprüfe, ob die aktuelle Session bereits 2FA-verifiziert ist
      if ((req.session as any).twoFactorVerified === userId) {
        return next();
      }
      
      // Wenn die Anfrage einen 2FA-Token enthält, verifiziere ihn
      if (req.body.twoFactorToken) {
        const isValid = await verifyUserToken(userId, req.body.twoFactorToken);
        
        if (isValid) {
          // Markiere die Session als 2FA-verifiziert
          (req.session as any).twoFactorVerified = userId;
          return next();
        } else {
          return res.status(401).json({
            status: 'error',
            message: 'Ungültiger 2FA-Code',
            code: 'invalid_2fa_token'
          });
        }
      }
      
      // Wenn kein Token vorhanden ist, fordere einen an
      return res.status(403).json({
        status: 'error',
        message: '2FA-Code erforderlich',
        code: '2fa_required'
      });
    } catch (error) {
      console.error('[2FA] Fehler in der 2FA-Middleware:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Interner Server-Fehler bei der 2FA-Überprüfung'
      });
    }
  };
}

/**
 * Prüft, ob 2FA für einen Benutzer aktiviert ist
 */
export async function is2FAEnabled(userId: number): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT enabled FROM two_factor_auth
      WHERE user_id = ${userId}
    `);
    
    return result.length > 0 && result[0].enabled;
  } catch (error) {
    console.error('[2FA] Fehler beim Prüfen des 2FA-Status:', error);
    return false;
  }
}