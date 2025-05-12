import { useAuth } from './use-auth';

type Role = 'administrator' | 'manager' | 'user';

/**
 * Hook zum Prüfen von Berechtigungen basierend auf Benutzerrollen
 */
export function usePermission() {
  const { user } = useAuth();
  
  /**
   * Prüft, ob der aktuelle Benutzer eine bestimmte Rolle hat
   * @param role - Die erforderliche Rolle oder ein Array von Rollen (eine davon muss vorhanden sein)
   * @returns true wenn der Benutzer die erforderliche Rolle hat, sonst false
   */
  const hasRole = (role: Role | Role[]): boolean => {
    // Wenn kein Benutzer vorhanden oder keine Rolle definiert ist: keine Berechtigung
    if (!user || !user.role) return false;
    
    // Prüfe gegen ein Array von Rollen
    if (Array.isArray(role)) {
      return role.includes(user.role as Role);
    }
    
    // Prüfe gegen eine einzelne Rolle
    return user.role === role;
  };
  
  /**
   * Prüft, ob der aktuelle Benutzer Administrator ist
   * @returns true wenn der Benutzer Administrator ist, sonst false
   */
  const isAdmin = (): boolean => {
    return hasRole('administrator');
  };
  
  /**
   * Prüft, ob der aktuelle Benutzer Administrator oder Manager ist
   * @returns true wenn der Benutzer Administrator oder Manager ist, sonst false
   */
  const isManagerOrAbove = (): boolean => {
    return hasRole(['administrator', 'manager']);
  };
  
  /**
   * Prüft, ob ein Element für den aktuellen Benutzer sichtbar sein sollte
   * @param requiredRole - Die für die Anzeige erforderliche Rolle oder Rollen
   * @returns true wenn das Element angezeigt werden sollte, sonst false
   */
  const canView = (requiredRole: Role | Role[]): boolean => {
    return hasRole(requiredRole);
  };
  
  return {
    hasRole,
    isAdmin,
    isManagerOrAbove,
    canView
  };
}