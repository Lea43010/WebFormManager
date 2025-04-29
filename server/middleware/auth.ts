import { Request, Response, NextFunction } from 'express';

// Middleware zum Überprüfen, ob ein Benutzer authentifiziert ist
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ message: 'Nicht authentifiziert. Bitte melden Sie sich an.' });
}

// Middleware zum Loggen von Zugriffsversuchen
export function logAccessAttempt(req: Request, res: Response, next: NextFunction) {
  // Benutzer-ID erfassen (falls authentifiziert)
  const userId = req.user ? (req.user as any).id : null;
  const username = req.user ? (req.user as any).username : 'Nicht authentifiziert';
  
  console.log(`[${new Date().toISOString()}] Zugriffsversuch: ${req.method} ${req.originalUrl} - Benutzer: ${username} (ID: ${userId})`);
  
  // Zum nächsten Middleware weitergehen
  next();
}

// Mehrstufiges Authentifizierungs-Middleware
export function requireTwoFactor(req: Request, res: Response, next: NextFunction) {
  // Prüfen, ob der Benutzer angemeldet ist
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Nicht authentifiziert. Bitte melden Sie sich an.' });
  }
  
  // Typecasting für TypeScript
  type User = {
    id: number;
    username: string;
    twoFactorEnabled?: boolean;
    twoFactorVerified?: boolean;
  };
  
  const user = req.user as User;
  
  // Wenn 2FA aktiviert ist, aber nicht verifiziert
  if (user.twoFactorEnabled === true && user.twoFactorVerified !== true) {
    return res.status(403).json({ 
      message: 'Zweifaktor-Authentifizierung erforderlich.',
      requiresTwoFactor: true
    });
  }
  
  // Wenn alles in Ordnung ist
  next();
}