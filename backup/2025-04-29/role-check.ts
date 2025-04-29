import { Request, Response, NextFunction } from 'express';

// Middleware zum Prüfen, ob der Benutzer eine spezifische Rolle hat
export function requireRole(role: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Prüfen, ob der Benutzer eingeloggt ist
    if (!req.user) {
      return res.status(401).json({ message: 'Nicht authentifiziert. Bitte melden Sie sich an.' });
    }

    // Typecasting für TypeScript
    type User = {
      id: number;
      username: string;
      role?: string;
    };
    
    const user = req.user as User;

    // Prüfen, ob der Benutzer die erforderliche Rolle hat
    if (Array.isArray(role)) {
      // Mehrere mögliche Rollen
      if (!user.role || !role.includes(user.role)) {
        return res.status(403).json({ 
          message: 'Zugriff verweigert. Sie haben nicht die erforderlichen Berechtigungen.',
          requiredRoles: role
        });
      }
    } else {
      // Einzelne erforderliche Rolle
      if (!user.role || user.role !== role) {
        return res.status(403).json({ 
          message: 'Zugriff verweigert. Sie haben nicht die erforderlichen Berechtigungen.',
          requiredRole: role 
        });
      }
    }

    // Wenn alles in Ordnung ist, zum nächsten Middleware/Controller weitergehen
    next();
  };
}

// Spezielles Middleware für Administratoren
export function requireAdmin() {
  return requireRole('administrator');
}

// Middleware für Manager oder höher
export function requireManagerOrAbove() {
  return requireRole(['administrator', 'manager']);
}

// Middleware für Benutzer mit beliebiger Rolle (muss nur eingeloggt sein)
export function requireAnyRole() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Nicht authentifiziert. Bitte melden Sie sich an.' });
    }
    next();
  };
}