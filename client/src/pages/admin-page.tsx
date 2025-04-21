import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/user-management";
import { LoginLogsManagement } from "@/components/admin/login-logs-management";
import BackupManagement from "@/components/admin/backup-management";
import { DataQualityManagement } from "@/components/admin/data-quality-management";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert, Users, Clock, Database, BarChart } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();

  // Nur Administratoren können Login-Logs sehen
  const isAdmin = user?.role === 'administrator';

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
            <>
              <TabsTrigger value="loginlogs" className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Login-Protokoll
              </TabsTrigger>
              
              <TabsTrigger value="backups" className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Datensicherung
              </TabsTrigger>
              
              <TabsTrigger value="dataquality" className="flex items-center">
                <BarChart className="h-4 w-4 mr-2" />
                Datenqualität
              </TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>
        
        {isAdmin && (
          <>
            <TabsContent value="loginlogs" className="space-y-4">
              <LoginLogsManagement />
            </TabsContent>

            <TabsContent value="backups" className="space-y-4">
              <BackupManagement />
            </TabsContent>
            
            <TabsContent value="dataquality" className="space-y-4">
              <DataQualityManagement />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}