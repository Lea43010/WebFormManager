import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
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
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  RefreshCw, 
  HardDrive,
  Download, 
  Upload,
  Trash2,
  CloudUpload,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Github,
  Database,
  Save
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";

interface BackupInfo {
  id: string;
  name: string;
  timestamp: string;
  size: number;
  type: "local" | "github";
  status: "success" | "failed" | "in-progress";
}

export default function BackupStatusPage() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);

  // Mock-Daten für die Backup-Historie
  const backupHistory: BackupInfo[] = [
    {
      id: "backup-1",
      name: "Tägliches Backup",
      timestamp: "2025-04-30T03:00:00Z",
      size: 1024 * 1024 * 15, // 15 MB
      type: "local",
      status: "success"
    },
    {
      id: "backup-2",
      name: "GitHub Backup",
      timestamp: "2025-04-30T03:05:12Z",
      size: 1024 * 1024 * 14.8, // 14.8 MB
      type: "github",
      status: "success"
    },
    {
      id: "backup-3",
      name: "Manuelles Backup",
      timestamp: "2025-04-29T14:32:45Z",
      size: 1024 * 1024 * 15.2, // 15.2 MB
      type: "local",
      status: "success"
    },
    {
      id: "backup-4",
      name: "GitHub Backup",
      timestamp: "2025-04-29T03:05:10Z",
      size: 1024 * 1024 * 14.9, // 14.9 MB
      type: "github",
      status: "success"
    },
    {
      id: "backup-5",
      name: "Tägliches Backup",
      timestamp: "2025-04-29T03:00:00Z",
      size: 1024 * 1024 * 14.7, // 14.7 MB
      type: "local",
      status: "success"
    },
    {
      id: "backup-6",
      name: "Systemänderung Backup",
      timestamp: "2025-04-28T16:15:22Z",
      size: 1024 * 1024 * 14.5, // 14.5 MB
      type: "local",
      status: "success"
    },
    {
      id: "backup-in-progress",
      name: "Manuelles Backup",
      timestamp: new Date().toISOString(),
      size: 0,
      type: "local",
      status: "in-progress"
    },
  ];

  // Gefilterte Backups basierend auf Typ-Filter
  const getFilteredBackups = () => {
    if (!selectedType || selectedType === 'all') {
      return backupHistory;
    }
    
    return backupHistory.filter(backup => backup.type === selectedType);
  };

  // Status-Badge für Backup-Status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Erfolgreich</span>
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>Fehlgeschlagen</span>
          </Badge>
        );
      case "in-progress":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>In Bearbeitung</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <span>{status}</span>
          </Badge>
        );
    }
  };

  // Status aktualisieren
  const refreshBackupStatus = () => {
    setIsLoading(true);
    
    // Simuliere API-Aufruf
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Backup-Status aktualisiert",
        description: "Die Backup-Informationen wurden erfolgreich aktualisiert."
      });
    }, 1000);
  };

  // Manuelles Backup erstellen
  const createManualBackup = () => {
    toast({
      title: "Backup gestartet",
      description: "Ein manuelles Backup wird erstellt. Dies kann einige Minuten dauern."
    });
    
    // Simuliere Abschluss nach Verzögerung
    setTimeout(() => {
      toast({
        title: "Backup abgeschlossen",
        description: "Das manuelle Backup wurde erfolgreich erstellt."
      });
      refreshBackupStatus();
    }, 3000);
  };

  // Backup löschen
  const deleteBackup = (id: string) => {
    toast({
      title: "Backup wird gelöscht",
      description: "Das ausgewählte Backup wird gelöscht."
    });
    
    // Simuliere Abschluss nach Verzögerung
    setTimeout(() => {
      toast({
        title: "Backup gelöscht",
        description: "Das Backup wurde erfolgreich gelöscht."
      });
      refreshBackupStatus();
    }, 1500);
  };

  // Backup wiederherstellen
  const restoreBackup = (id: string) => {
    setIsRestoring(true);
    setSelectedBackupId(id);
    
    toast({
      title: "Wiederherstellung gestartet",
      description: "Das ausgewählte Backup wird wiederhergestellt. Dies kann einige Minuten dauern."
    });
    
    // Simuliere Abschluss nach Verzögerung
    setTimeout(() => {
      setIsRestoring(false);
      setSelectedBackupId(null);
      
      toast({
        title: "Wiederherstellung abgeschlossen",
        description: "Die Datenbank wurde erfolgreich aus dem Backup wiederhergestellt."
      });
    }, 5000);
  };

  // Backup herunterladen
  const downloadBackup = (id: string) => {
    toast({
      title: "Download gestartet",
      description: "Das Backup wird zum Download vorbereitet."
    });
    
    // Simuliere Abschluss nach Verzögerung
    setTimeout(() => {
      toast({
        title: "Download bereit",
        description: "Der Download des Backups wurde gestartet."
      });
    }, 1500);
  };

  // Backup-Statistiken berechnen
  const statistics = {
    totalBackups: backupHistory.filter(b => b.status === "success").length,
    totalSize: backupHistory.reduce((sum, backup) => 
      backup.status === "success" ? sum + backup.size : sum, 0),
    githubBackups: backupHistory.filter(b => b.type === "github" && b.status === "success").length,
    localBackups: backupHistory.filter(b => b.type === "local" && b.status === "success").length,
    lastBackupTime: backupHistory
      .filter(b => b.status === "success")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp
  };

  return (
    <DashboardLayout title="Backup-Status" description="Überwachung und Verwaltung der Systembackups">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Backup-Verwaltung</h2>
            <p className="text-muted-foreground">
              Erstellen und verwalten Sie Ihre Systembackups
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={refreshBackupStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={createManualBackup}
            >
              <Save className="h-4 w-4" />
              Manuelles Backup
            </Button>
          </div>
        </div>

      {/* Backup-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Database className="h-4 w-4 mr-2 text-primary" />
              Gesamt-Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalBackups}</div>
            <p className="text-xs text-muted-foreground">
              Gesamtgröße: {formatBytes(statistics.totalSize)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <HardDrive className="h-4 w-4 mr-2 text-primary" />
              Lokale Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.localBackups}</div>
            <p className="text-xs text-muted-foreground">
              Auf dem Server gespeicherte Backups
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Github className="h-4 w-4 mr-2 text-primary" />
              GitHub-Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.githubBackups}</div>
            <p className="text-xs text-muted-foreground">
              Im GitHub-Repository gespeicherte Backups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backup-Historie */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Backup-Historie</CardTitle>
              <CardDescription>
                Historie aller Systembackups mit Details
              </CardDescription>
            </div>
            <Select 
              value={selectedType || "all"} 
              onValueChange={(value) => setSelectedType(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle Typen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="local">Lokale Backups</SelectItem>
                <SelectItem value="github">GitHub Backups</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Zeitpunkt</TableHead>
                <TableHead>Größe</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredBackups().map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">{backup.name}</TableCell>
                  <TableCell>
                    {format(new Date(backup.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell>
                    {backup.status === "in-progress" ? (
                      <div className="flex flex-col gap-1 w-24">
                        <Progress value={45} className="h-2" />
                        <span className="text-xs text-muted-foreground">In Bearbeitung</span>
                      </div>
                    ) : (
                      formatBytes(backup.size)
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {backup.type === "local" ? (
                        <HardDrive className="h-4 w-4 mr-1 text-slate-600" />
                      ) : (
                        <Github className="h-4 w-4 mr-1 text-slate-600" />
                      )}
                      <span>
                        {backup.type === "local" ? "Lokal" : "GitHub"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(backup.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {backup.status === "success" && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isRestoring}
                            onClick={() => downloadBackup(backup.id)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isRestoring}
                            onClick={() => restoreBackup(backup.id)}
                          >
                            {isRestoring && selectedBackupId === backup.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isRestoring}
                            onClick={() => deleteBackup(backup.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Letztes Backup: {statistics.lastBackupTime ? 
              format(new Date(statistics.lastBackupTime), 'dd.MM.yyyy HH:mm', { locale: de }) : 
              'Keine Backups verfügbar'}
          </p>
        </CardFooter>
      </Card>

      {/* Backup-Konfiguration */}
      <Card>
        <CardHeader>
          <CardTitle>Backup-Konfiguration</CardTitle>
          <CardDescription>
            Einstellungen für automatische Backups und Aufbewahrungsrichtlinien
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Automatische Backups</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tägliches Backup</span>
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Aktiv</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Jeden Tag um 03:00 Uhr
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Aufbewahrungsrichtlinie</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Aufbewahrungsdauer</span>
                  <span className="text-sm font-medium">30 Tage</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Backups älter als 30 Tage werden automatisch gelöscht
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>
  );
}