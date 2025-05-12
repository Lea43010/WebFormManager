import React from 'react';
import { RoleBasedPermissionExample } from '@/examples/role-based-permission-example';
import { SidebarWithPermissions } from '@/examples/sidebar-with-permissions';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ShieldCheck } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';

/**
 * Demo-Seite für die Vorstellung des rollenbasierten Berechtigungssystems
 */
export default function PermissionsDemoPage() {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Rollenbasierte Berechtigungen</h1>
      </div>
      
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Benutzerinformation</AlertTitle>
        <AlertDescription>
          Sie sind angemeldet als: <strong>{user?.username}</strong> mit der Rolle <strong>{user?.role || 'Keine Rolle'}</strong>.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="examples">
        <TabsList className="mb-2">
          <TabsTrigger value="examples">UI-Komponenten</TabsTrigger>
          <TabsTrigger value="sidebar">Sidebar-Beispiel</TabsTrigger>
          <TabsTrigger value="about">Über Berechtigungen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="examples">
          <RoleBasedPermissionExample />
        </TabsContent>
        
        <TabsContent value="sidebar">
          <div className="border rounded-lg overflow-hidden">
            <SidebarWithPermissions />
          </div>
        </TabsContent>
        
        <TabsContent value="about">
          <div className="p-6 bg-white rounded-lg border">
            <h2 className="text-2xl font-bold mb-4">Über rollenbasierte Berechtigungen</h2>
            
            <div className="prose max-w-none">
              <p>
                Das rollenbasierte Berechtigungssystem in Bau-Structura bietet eine flexible und sichere Methode, 
                um den Zugriff auf Funktionen und Inhalte basierend auf Benutzerrollen zu steuern.
              </p>
              
              <h3>Verfügbare Rollen</h3>
              <ul>
                <li><strong>Administrator:</strong> Vollständiger Zugriff auf alle Funktionen und Daten</li>
                <li><strong>Manager:</strong> Zugriff auf Management-Funktionen, aber eingeschränkter Zugriff auf Systemeinstellungen</li>
                <li><strong>Benutzer:</strong> Grundlegender Zugriff auf Projekte und ihre eigenen Daten</li>
              </ul>
              
              <h3>Implementierte Komponenten</h3>
              <ul>
                <li><code>usePermission</code> Hook für programmatische Berechtigungsprüfungen</li>
                <li><code>PermissionGate</code> Komponente für bedingte UI-Darstellung</li>
                <li><code>AdminOnly</code> und <code>ManagerOrAbove</code> Hilfskomponenten</li>
                <li><code>RoleProtectedRoute</code> für rollenbasierte Routenschutz</li>
              </ul>
              
              <h3>Verwendung im Code</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
{`// Mit Hook
const { isAdmin, hasRole } = usePermission();
if (isAdmin()) {
  // Administratorfunktionen ausführen
}

// Mit PermissionGate
<PermissionGate requiredRole="administrator">
  <AdminComponent />
</PermissionGate>

// Mit RoleProtectedRoute
<RoleProtectedRoute 
  path="/admin" 
  component={AdminPage} 
  requiredRole="administrator" 
/>`}
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}