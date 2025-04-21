import { useAuth } from "@/hooks/use-auth";
import { Loader2, Shield } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Benutzer ist nicht eingeloggt
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
  
  // Benutzer ist eingeloggt, aber nicht Administrator
  if (user.role !== 'administrator' && user.role !== 'manager') {
    return (
      <Route path={path}>
        <div className="container mx-auto py-10">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Shield className="h-6 w-6 text-orange-500" />
              <div>
                <CardTitle>Keine Berechtigung</CardTitle>
                <CardDescription>
                  Sie haben keine Berechtigung, diese Seite zu sehen.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </Route>
    );
  }

  // Administrator hat Zugriff
  return <Route path={path} component={Component} />;
}