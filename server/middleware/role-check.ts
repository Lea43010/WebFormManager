import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }
  
  const user = req.user as any;
  if (user.role !== 'administrator') {
    console.log(`Zugriff verweigert für Benutzer mit Rolle: ${user.role}`);
    return res.status(403).json({ 
      message: 'Keine ausreichenden Berechtigungen', 
      userRole: user.role,
      requiredRole: 'administrator'
    });
  }
  
  next();
};

export const isManager = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }
  
  const user = req.user as any;
  if (user.role !== 'administrator' && user.role !== 'manager') {
    console.log(`Zugriff verweigert für Benutzer mit Rolle: ${user.role}`);
    return res.status(403).json({ 
      message: 'Keine ausreichenden Berechtigungen', 
      userRole: user.role,
      requiredRole: 'manager oder administrator'
    });
  }
  
  next();
};