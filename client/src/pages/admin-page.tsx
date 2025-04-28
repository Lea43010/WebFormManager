import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/user-management";
import { LoginLogsManagement } from "@/components/admin/login-logs-management";
import BackupManagement from "@/components/admin/backup-management";
import { DataQualityManagement } from "@/components/admin/data-quality-management";
import { ActivityLogs } from "@/components/admin/activity-logs";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert, Users, Clock, Database, BarChart, Settings, FileCode, Mail, ActivityIcon } from 'lucide-react';
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
        
        {isAdmin && (
          <div className="flex items-center space-x-2">
            <Link href="/admin/users">
              <a className="flex items-center px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-md text-primary transition-colors">
                <Users className="h-4 w-4 mr-2" />
                <span>Benutzerverwaltung</span>
              </a>
            </Link>
            <Link href="/admin/deployment-docs">
              <a className="flex items-center px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-md text-primary transition-colors">
                <Settings className="h-4 w-4 mr-2" />
                <span>Deployment</span>
              </a>
            </Link>
          </div>
        )}
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
              
              <TabsTrigger value="activitylogs" className="flex items-center">
                <ActivityIcon className="h-4 w-4 mr-2" />
                Aktivitätsprotokolle
              </TabsTrigger>
              
              <TabsTrigger value="emails" className="flex items-center" asChild>
                <Link href="/admin/emails">
                  <Mail className="h-4 w-4 mr-2" />
                  E-Mails
                </Link>
              </TabsTrigger>

              <TabsTrigger value="deployment" className="flex items-center" asChild>
                <Link href="/admin/deployment-docs">
                  <FileCode className="h-4 w-4 mr-2" />
                  Deployment
                </Link>
              </TabsTrigger>
              
              <TabsTrigger value="user-management" className="flex items-center" asChild>
                <Link href="/admin/users">
                  <Users className="h-4 w-4 mr-2" />
                  Benutzerverwaltung
                </Link>
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
            
            <TabsContent value="activitylogs" className="space-y-4">
              <ActivityLogs />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}