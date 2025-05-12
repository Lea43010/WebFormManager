import { useAuth } from "@/hooks/use-auth";
import { usePermission } from "@/hooks/use-permission";
import { Loader2, Shield } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Role = 'administrator' | 'manager' | 'user';

interface RoleProtectedRouteProps {
  path: string;
  component: React.ComponentType<any> | (() => React.JSX.Element);
  requiredRole: Role | Role[];
  fallbackPath?: string; // Optionaler Pfad, zu dem bei fehlender Berechtigung umgeleitet wird
}

/**
 * Eine Route-Komponente, die sowohl Authentifizierung als auch Rollenberechtigungen prüft
 */
export function RoleProtectedRoute({
  path,
  component: Component,
  requiredRole,
  fallbackPath = "/",
}: RoleProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { hasRole } = usePermission();
  
  // Während des Ladens wird ein Spinner angezeigt
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Wenn nicht angemeldet, zur Anmeldeseite umleiten
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
  
  // Wenn angemeldet, aber ohne die erforderliche Rolle,
  // wird eine Meldung über fehlende Berechtigung angezeigt oder zum fallbackPath umgeleitet
  if (!hasRole(requiredRole)) {
    return (
      <Route path={path}>
        {fallbackPath ? (
          <Redirect to={fallbackPath} />
        ) : (
          <div className="container mx-auto py-10">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Shield className="h-6 w-6 text-orange-500" />
                <div>
                  <CardTitle>Keine Berechtigung</CardTitle>
                  <CardDescription>
                    Sie haben keine Berechtigung, diese Seite zu sehen. 
                    {typeof requiredRole === 'string' 
                      ? ` Diese Seite erfordert die Rolle "${requiredRole}".`
                      : ` Diese Seite erfordert eine der folgenden Rollen: ${requiredRole.join(', ')}.`
                    }
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}
      </Route>
    );
  }

  // Benutzer hat die erforderliche Rolle, die Komponente anzeigen
  return <Route path={path} component={Component} />;
}