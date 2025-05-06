import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  ActivityIcon, 
  Search, 
  RefreshCw, 
  Download, 
  AlertCircle,
  Info,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "debug";
  source: string;
  message: string;
  user?: string;
  details?: string;
}

export default function SystemLogsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("activity");
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock-Daten für Aktivitätslogs
  const activityLogs: LogEntry[] = [
    {
      id: "1",
      timestamp: "2025-04-30T05:43:12Z",
      level: "info",
      source: "authentication",
      message: "Benutzer angemeldet",
      user: "admin",
    },
    {
      id: "2",
      timestamp: "2025-04-30T05:40:51Z",
      level: "warning",
      source: "projects",
      message: "Projekt-Update mit fehlenden Feldwerten",
      user: "manager",
      details: "Projekt-ID: 123, Fehlende Felder: Meilenstein-Datum, Budget"
    },
    {
      id: "3",
      timestamp: "2025-04-30T05:38:22Z",
      level: "error",
      source: "database",
      message: "Datenbankabfrage fehlgeschlagen",
      details: "Error: Zeitüberschreitung der Verbindung"
    },
    {
      id: "4",
      timestamp: "2025-04-30T05:35:10Z",
      level: "info",
      source: "backup",
      message: "Backup erfolgreich abgeschlossen",
    },
    {
      id: "5",
      timestamp: "2025-04-30T05:33:01Z",
      level: "debug",
      source: "api",
      message: "API Anfrage verarbeitet",
      user: "system",
      details: "GET /api/projects/123"
    },
  ];

  // Mock-Daten für Login-Logs
  const loginLogs: LogEntry[] = [
    {
      id: "l1",
      timestamp: "2025-04-30T05:43:12Z",
      level: "info",
      source: "authentication",
      message: "Erfolgreiche Anmeldung",
      user: "admin",
      details: "IP: 192.168.1.1, Browser: Chrome"
    },
    {
      id: "l2",
      timestamp: "2025-04-30T04:35:45Z",
      level: "warning",
      source: "authentication",
      message: "Mehrere fehlgeschlagene Anmeldeversuche",
      user: "benutzer2",
      details: "IP: 192.168.1.5, Browser: Firefox, 3 Versuche"
    },
    {
      id: "l3",
      timestamp: "2025-04-30T03:22:18Z",
      level: "info",
      source: "authentication",
      message: "Erfolgreiche Anmeldung",
      user: "manager",
      details: "IP: 192.168.1.10, Browser: Safari"
    },
    {
      id: "l4",
      timestamp: "2025-04-29T15:47:32Z",
      level: "error",
      source: "authentication",
      message: "Zugriffsversuch mit gesperrtem Konto",
      user: "gesperrt_user",
      details: "IP: 192.168.1.15, Browser: Edge"
    },
    {
      id: "l5",
      timestamp: "2025-04-29T14:12:05Z",
      level: "info",
      source: "authentication",
      message: "Abmeldung",
      user: "admin",
      details: "IP: 192.168.1.1, Browser: Chrome"
    },
  ];

  // Gefilterte Logs auf Basis von Suchbegriff und Level
  const getFilteredLogs = () => {
    let logs = activeTab === "activity" ? activityLogs : loginLogs;
    
    if (filterLevel && filterLevel !== '_all') {
      logs = logs.filter(log => log.level === filterLevel);
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(search) ||
        (log.user && log.user.toLowerCase().includes(search)) ||
        (log.details && log.details.toLowerCase().includes(search))
      );
    }
    
    return logs;
  };

  // Anzeigen des entsprechenden Icons für Log-Level
  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "debug":
        return <CheckCircle className="h-4 w-4 text-slate-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Status aktualisieren
  const refreshLogs = () => {
    setIsLoading(true);
    
    // Simuliere API-Aufruf
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Logs aktualisiert",
        description: "Die Systemlogs wurden erfolgreich aktualisiert."
      });
    }, 1000);
  };

  // Logs exportieren
  const exportLogs = () => {
    toast({
      title: "Export gestartet",
      description: "Die Logs werden als CSV-Datei exportiert."
    });
    
    // Simuliere Download-Verzögerung
    setTimeout(() => {
      toast({
        title: "Export abgeschlossen",
        description: "Die Logs wurden erfolgreich exportiert."
      });
    }, 1500);
  };

  return (
    <DashboardLayout title="Systemlogs" description="Überwachung der Systemaktivitäten und Benutzerinteraktionen">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Log-Verwaltung</h2>
            <p className="text-muted-foreground">
              Verwalten und analysieren Sie die Systemlogs
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={refreshLogs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={exportLogs}
            >
              <Download className="h-4 w-4" />
              Exportieren
            </Button>
          </div>
        </div>

        <Tabs 
          defaultValue="activity" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-4"
        >
        <TabsList>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <ActivityIcon className="h-4 w-4" />
            Aktivitätslogs
          </TabsTrigger>
          <TabsTrigger value="login" className="flex items-center gap-2">
            <ActivityIcon className="h-4 w-4" />
            Login-Logs
          </TabsTrigger>
        </TabsList>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Logs durchsuchen..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select 
            value={filterLevel || ""} 
            onValueChange={(value) => setFilterLevel(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Nach Level filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Alle Level</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warnung</SelectItem>
              <SelectItem value="error">Fehler</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Systemaktivitäten</CardTitle>
              <CardDescription>
                Protokoll aller Systemaktivitäten und -ereignisse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeitpunkt</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Quelle</TableHead>
                    <TableHead>Nachricht</TableHead>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredLogs().map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getLevelIcon(log.level)}
                          <Badge 
                            variant={
                              log.level === "error" ? "destructive" : 
                              log.level === "warning" ? "default" : 
                              log.level === "info" ? "secondary" : 
                              "outline"
                            }
                          >
                            {log.level === "error" ? "Fehler" : 
                             log.level === "warning" ? "Warnung" : 
                             log.level === "info" ? "Info" : 
                             "Debug"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{log.source}</TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell>{log.user || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.details || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Anmelde-Aktivitäten</CardTitle>
              <CardDescription>
                Protokoll aller Anmelde- und Authentifizierungsereignisse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeitpunkt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>Nachricht</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredLogs().map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getLevelIcon(log.level)}
                          <Badge 
                            variant={
                              log.level === "error" ? "destructive" : 
                              log.level === "warning" ? "default" : 
                              "secondary"
                            }
                          >
                            {log.level === "error" ? "Fehler" : 
                             log.level === "warning" ? "Warnung" : 
                             "Erfolg"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{log.user || "-"}</TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.details || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </DashboardLayout>
  );
}