import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/user-management";
import { LoginLogsManagement } from "@/components/admin/login-logs-management";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Clock, ShieldAlert } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();

  // Berechtigungsprüfung
  if (!user || (user.role !== 'administrator' && user.role !== 'manager')) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Keine Berechtigung</CardTitle>
            <CardDescription>
              Sie haben keine Berechtigung, diese Seite zu sehen.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Nur Administratoren können Login-Logs sehen
  const isAdmin = user.role === 'administrator';

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <ShieldAlert className="h-8 w-8 mr-2 text-primary" />
        <h1 className="text-4xl font-bold">Administration</h1>
      </div>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Benutzer
          </TabsTrigger>
          
          {isAdmin && (
            <TabsTrigger value="loginlogs" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Login-Protokoll
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="loginlogs" className="space-y-4">
            <LoginLogsManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}