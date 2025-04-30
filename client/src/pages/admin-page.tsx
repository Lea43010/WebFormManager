import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/user-management";
import BackupManagement from "@/components/admin/backup-management";
import { DataQualityManagement } from "@/components/admin/data-quality-management";
import { SystemLogs } from "@/components/admin/system-logs";
import TrialManagement from "@/components/admin/trial-management";
import { useAuth } from "@/hooks/use-auth";
import { 
  ShieldAlert, Users, Database, BarChart, Settings, FileCode, 
  Mail, ActivityIcon, Clock, ServerCrash, HardDrive, CloudUpload
} from 'lucide-react';
import { Link } from "wouter";
import { useState, useEffect } from "react";
import BackupStatus from "@/components/admin/backup-status";

export default function AdminPage() {
  const { user } = useAuth();

  // Nur Administratoren können Login-Logs sehen
  const isAdmin = user?.role === 'administrator';
  
  // State für die aktive Kategorie
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ShieldAlert className="h-8 w-8 mr-2 text-primary" />
          <h1 className="text-4xl font-bold">Administration</h1>
        </div>
      </div>
      
      <Tabs defaultValue="users" className="space-y-4">
        {/* Hauptnavigation mit Kategorien */}
        <TabsList className="grid grid-cols-4 md:grid-cols-7 gap-2 text-xs md:text-sm">
          <TabsTrigger value="users" className="flex items-center gap-1 px-2 md:px-3 h-9">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Benutzer</span>
          </TabsTrigger>
          
          {isAdmin && (
            <>
              <TabsTrigger value="systemlogs" className="flex items-center gap-1 px-2 md:px-3 h-9">
                <ActivityIcon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Logs</span>
              </TabsTrigger>
              
              <TabsTrigger value="trials" className="flex items-center gap-1 px-2 md:px-3 h-9">
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Testphasen</span>
              </TabsTrigger>
              
              <TabsTrigger value="backups" className="flex items-center gap-1 px-2 md:px-3 h-9">
                <Database className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Backup</span>
              </TabsTrigger>

              <TabsTrigger value="backup_status" className="flex items-center gap-1 px-2 md:px-3 h-9">
                <ServerCrash className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Backup-Status</span>
              </TabsTrigger>
              
              <TabsTrigger value="dataquality" className="flex items-center gap-1 px-2 md:px-3 h-9">
                <BarChart className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Datenqualität</span>
              </TabsTrigger>
              
              <TabsTrigger value="emails" className="flex items-center gap-1 px-2 md:px-3 h-9" asChild>
                <a href="/admin/emails">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">E-Mails</span>
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
            
            <TabsContent value="backup_status" className="space-y-4">
              <BackupStatus />
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