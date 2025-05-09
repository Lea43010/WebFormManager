import { Request, Response, NextFunction } from 'express';

// Middleware zum Überprüfen, ob ein Benutzer authentifiziert ist
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ message: 'Nicht authentifiziert. Bitte melden Sie sich an.' });
}

// Alternative Middleware-Implementierungen wurden zusammengeführt
// Die aktuelle Version verwendet verifySubscriptionStatus und ist weiter unten definiert

// Middleware zum Loggen von Zugriffsversuchen
export function logAccessAttempt(req: Request, res: Response, next: NextFunction) {
  // Benutzer-ID erfassen (falls authentifiziert)
  const userId = req.user ? (req.user as any).id : null;
  const username = req.user ? (req.user as any).username : 'Nicht authentifiziert';
  
  console.log(`[${new Date().toISOString()}] Zugriffsversuch: ${req.method} ${req.originalUrl} - Benutzer: ${username} (ID: ${userId})`);
  
  // Zum nächsten Middleware weitergehen
  next();
}

// Middleware zur Überprüfung des Abonnementstatus
export function checkSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Nicht authentifiziert" });
  }
  
  const result = verifySubscriptionStatus(req);
  
  if (!result.isValid) {
    return res.status(403).json({ 
      message: "Abonnement abgelaufen",
      subscriptionExpired: true,
      errorDetails: result.errorMessage 
    });
  }
  
  // Wenn alles in Ordnung ist
  next();
}

// Helper-Funktion zur Überprüfung des Abonnementstatus (kann auch direkt in Routen verwendet werden)
export function verifySubscriptionStatus(req: Request): {isValid: boolean, errorMessage?: string} {
  // Typecasting für TypeScript
  type User = {
    id: number;
    username: string;
    role?: string;
    subscriptionStatus?: string;
    trialEndDate?: Date | string | null;
  };
  
  const user = req.user as User;
  
  // Administratoren haben immer Zugriff
  if (user.role === 'administrator') {
    return { isValid: true };
  }
  
  // Wenn der Benutzer ein aktives Abonnement hat
  if (user.subscriptionStatus === 'active') {
    return { isValid: true };
  }
  
  // Wenn der Benutzer in der Testphase ist, prüfen wir das Ablaufdatum
  if (user.subscriptionStatus === 'trial' && user.trialEndDate) {
    try {
      const trialEndDate = new Date(user.trialEndDate);
      const today = new Date();
      
      // Wenn die Testphase noch nicht abgelaufen ist
      if (trialEndDate >= today) {
        return { isValid: true };
      } else {
        return { 
          isValid: false, 
          errorMessage: 'Ihre Testphase ist abgelaufen. Bitte verlängern Sie Ihr Abonnement.' 
        };
      }
    } catch (error) {
      // Wenn es ein Problem beim Parsen des Datums gibt, erlauben wir den Zugriff als Vorsichtsmaßnahme,
      // aber protokollieren das Problem
      console.error(`Fehler beim Parsen des Testphasen-Enddatums für Benutzer ${user.id}:`, error);
      return { 
        isValid: true,
        errorMessage: 'Warnung: Probleme bei der Überprüfung Ihres Abonnementstatus. Bitte kontaktieren Sie den Support.' 
      };
    }
  }
  
  // In allen anderen Fällen (kein Abonnement, abgelaufener Status, etc.)
  return { 
    isValid: false, 
    errorMessage: 'Ihr Zugang ist abgelaufen oder ungültig. Bitte verlängern Sie Ihr Abonnement.'
  };
}

// Admin-Rolle prüfen
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Nicht authentifiziert. Bitte melden Sie sich an.' });
  }
  
  const user = req.user as any;
  
  if (user.role !== 'administrator') {
    return res.status(403).json({ message: 'Keine ausreichenden Berechtigungen. Administratorzugriff erforderlich.' });
  }
  
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