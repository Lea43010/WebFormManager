import React, { ReactNode } from 'react';
import { usePermission } from '@/hooks/use-permission';

type Role = 'administrator' | 'manager' | 'user';

type PermissionGateProps = {
  /**
   * Die für die Anzeige erforderliche Rolle oder Rollen (eine davon muss vorhanden sein)
   */
  requiredRole: Role | Role[];
  
  /**
   * Die Komponenten oder Elemente, die angezeigt werden sollen, wenn der Benutzer
   * die erforderliche Rolle hat
   */
  children: ReactNode;
  
  /**
   * Optionale Komponenten oder Elemente, die angezeigt werden sollen, wenn der Benutzer
   * die erforderliche Rolle NICHT hat (Fallback-Inhalt)
   */
  fallback?: ReactNode;
};

/**
 * Komponente zum bedingten Rendern von Inhalten basierend auf Benutzerrollen
 * 
 * Beispiel:
 * ```tsx
 * <PermissionGate requiredRole="administrator">
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * <PermissionGate requiredRole={['administrator', 'manager']} fallback={<AccessDeniedMessage />}>
 *   <ManagerTools />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({ requiredRole, children, fallback = null }: PermissionGateProps) {
  const { canView } = usePermission();
  
  // Prüfen, ob der Benutzer die erforderliche Rolle hat
  if (canView(requiredRole)) {
    return <>{children}</>;
  }
  
  // Fallback-Inhalt oder null zurückgeben
  return <>{fallback}</>;
}

/**
 * Komponente für Inhalte, die nur Administratoren sehen können
 */
export function AdminOnly({ children, fallback = null }: Omit<PermissionGateProps, 'requiredRole'>) {
  return (
    <PermissionGate requiredRole="administrator" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Komponente für Inhalte, die nur Manager oder Administratoren sehen können
 */
export function ManagerOrAbove({ children, fallback = null }: Omit<PermissionGateProps, 'requiredRole'>) {
  return (
    <PermissionGate requiredRole={['administrator', 'manager']} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}