import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/user-management";
import BackupManagement from "@/components/admin/backup-management";
import { DataQualityManagement } from "@/components/admin/data-quality-management";
import { SystemLogs } from "@/components/admin/system-logs";
import TrialManagement from "@/components/admin/trial-management";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert, Users, Database, BarChart, Settings, FileCode, Mail, ActivityIcon, Clock } from 'lucide-react';
import { Link } from "wouter";

export default function AdminPage() {
  const { user } = useAuth();

  // Nur Administratoren können Login-Logs sehen
  const isAdmin = user?.role === 'administrator';

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ShieldAlert className="h-8 w-8 mr-2 text-primary" />
          <h1 className="text-4xl font-bold">Administration</h1>
        </div>
      </div>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Benutzerverwaltung
          </TabsTrigger>
          
          {isAdmin && (
            <>
              <TabsTrigger value="systemlogs" className="flex items-center">
                <ActivityIcon className="h-4 w-4 mr-2" />
                System-Logs
              </TabsTrigger>
              
              <TabsTrigger value="trials" className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Testphasen
              </TabsTrigger>
              
              <TabsTrigger value="backups" className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Datensicherung
              </TabsTrigger>
              
              <TabsTrigger value="dataquality" className="flex items-center">
                <BarChart className="h-4 w-4 mr-2" />
                Datenqualität
              </TabsTrigger>
              
              <TabsTrigger value="emails" className="flex items-center" asChild>
                <a href="/admin/emails">
                  <Mail className="h-4 w-4 mr-2" />
                  E-Mails
                </a>
              </TabsTrigger>

              <TabsTrigger value="deployment" className="flex items-center" asChild>
                <a href="/admin/deployment-docs">
                  <FileCode className="h-4 w-4 mr-2" />
                  Deployment
                </a>
              </TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>
        
        {isAdmin && (
          <>
            <TabsContent value="systemlogs" className="space-y-4">
              <SystemLogs />
            </TabsContent>

            <TabsContent value="trials" className="space-y-4">
              <TrialManagement />
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