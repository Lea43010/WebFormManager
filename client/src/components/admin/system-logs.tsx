/**
 * System-Logs-Komponente
 * Kombinierte Anzeige von Login-Logs und Aktivitätsprotokollen
 */

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  RotateCw, 
  Search, 
  X, 
  Clock, 
  ActivityIcon,
  LogIn,
  LogOut,
  AlertTriangle,
  UserPlus,
  FileText,
  Settings,
  Eye,
  Edit,
  Trash,
  DownloadCloud,
  UploadCloud,
  Mail,
  Check,
  XCircle,
  CheckCircle,
  Users
} from "lucide-react";

import { LoginLogsManagement } from "./login-logs-management";
import { ActivityLogs } from "./activity-logs";

export function SystemLogs() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  
  // Aktivitätsmetadaten abrufen für die Zusammenfassung
  const { 
    data: loginLogsCount, 
    isLoading: loginLogsLoading 
  } = useQuery({
    queryKey: ['/api/admin/login-logs/count'],
    queryFn: async () => {
      const response = await fetch('/api/admin/login-logs/count');
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Login-Log-Anzahl');
      }
      return response.json();
    }
  });
  
  // Aktivitätsmetadaten abrufen für die Zusammenfassung
  const { 
    data: activityLogsCount, 
    isLoading: activityLogsLoading 
  } = useQuery({
    queryKey: ['/api/admin/activity-logs/count'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/activity-logs/count');
        if (!response.ok) {
          return { count: 0 };
        }
        return response.json();
      } catch (error) {
        return { count: 0 };
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System-Logs</CardTitle>
            <CardDescription>
              Übersicht aller System- und Benutzeraktivitäten
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Zusammenfassung */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <LogIn className="h-4 w-4 mr-2 text-primary" />
                Login-Protokolle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loginLogsLoading ? (
                  <span className="text-muted-foreground text-sm">Wird geladen...</span>
                ) : (
                  <span>{loginLogsCount?.count || 0}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Aufzeichnungen von Anmeldungen und Abmeldungen
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <ActivityIcon className="h-4 w-4 mr-2 text-primary" />
                Aktivitätsprotokolle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activityLogsLoading ? (
                  <span className="text-muted-foreground text-sm">Wird geladen...</span>
                ) : (
                  <span>{activityLogsCount?.count || 0}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Aufzeichnungen von Benutzeraktionen im System
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                Gesamtaktivitäten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loginLogsLoading || activityLogsLoading ? (
                  <span className="text-muted-foreground text-sm">Wird geladen...</span>
                ) : (
                  <span>{(loginLogsCount?.count || 0) + (activityLogsCount?.count || 0)}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Gesamtanzahl aller protokollierten Aktivitäten
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs für Login-Logs und Aktivitätsprotokolle */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="login" className="flex items-center">
              <LogIn className="h-4 w-4 mr-2" />
              Login-Protokoll
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center">
              <ActivityIcon className="h-4 w-4 mr-2" />
              Aktivitätsprotokolle
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginLogsManagement />
          </TabsContent>
          
          <TabsContent value="activity">
            <ActivityLogs />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}