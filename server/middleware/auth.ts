import { Request, Response, NextFunction } from 'express';

// Middleware zur Überprüfung, ob der Benutzer authentifiziert ist
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ 
    success: false, 
    message: 'Nicht authentifiziert' 
  });
}