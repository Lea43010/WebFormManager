import { Request, Response, NextFunction } from 'express';

// Middleware zur Überprüfung, ob der Benutzer Administrator ist
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      message: 'Nicht authentifiziert' 
    });
  }
  
  // @ts-ignore - Die Eigenschaft role existiert in req.user, auch wenn TypeScript das nicht kennt
  if (req.user && req.user.role === 'administrator') {
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    message: 'Keine Berechtigung. Diese Funktion erfordert Administrator-Rechte.' 
  });
}

// Middleware zur Überprüfung, ob der Benutzer Manager oder Administrator ist
export function isManagerOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      message: 'Nicht authentifiziert' 
    });
  }
  
  // @ts-ignore - Die Eigenschaft role existiert in req.user, auch wenn TypeScript das nicht kennt
  if (req.user && (req.user.role === 'administrator' || req.user.role === 'manager')) {
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    message: 'Keine Berechtigung. Diese Funktion erfordert Manager- oder Administrator-Rechte.' 
  });
}