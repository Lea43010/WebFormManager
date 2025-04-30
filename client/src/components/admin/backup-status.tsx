import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  HardDrive, 
  CloudUpload, 
  Check, 
  Timer, 
  XCircle, 
  RefreshCw,
  AlertCircle,
  Download,
  ExternalLink
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface BackupInfo {
  id: string;
  name: string;
  timestamp: string;
  size: number;
  type: "local" | "github";
  status: "success" | "failed" | "in-progress";
}

export default function BackupStatus() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [localBackups, setLocalBackups] = useState<BackupInfo[]>([]);
  const [githubBackups, setGithubBackups] = useState<BackupInfo[]>([]);
  const [lastBackupDate, setLastBackupDate] = useState<Date | null>(null);
  const [nextBackupDate, setNextBackupDate] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "failed">("synced");
  const [refreshing, setRefreshing] = useState(false);

  // Funktion zum Formatieren der Dateigröße
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return sizeInBytes + ' B';
    } else if (sizeInBytes < 1024 * 1024) {
      return (sizeInBytes / 1024).toFixed(2) + ' KB';
    } else if (sizeInBytes < 1024 * 1024 * 1024) {
      return (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
  };

  // Mockdaten für Entwicklungszwecke
  const mockLocalBackups: BackupInfo[] = [
    {
      id: "backup_2025-04-30_03-00-00.sql",
      name: "Tägliches Backup",
      timestamp: "2025-04-30T03:00:00.000Z",
      size: 52428800, // 50 MB
      type: "local",
      status: "success"
    },
    {
      id: "backup_2025-04-29_03-00-00.sql",
      name: "Tägliches Backup",
      timestamp: "2025-04-29T03:00:00.000Z",
      size: 50331648, // 48 MB
      type: "local",
      status: "success"
    },
    {
      id: "backup_2025-04-28_03-00-00.sql",
      name: "Tägliches Backup",
      timestamp: "2025-04-28T03:00:00.000Z",
      size: 49152000, // 46.9 MB
      type: "local",
      status: "success"
    }
  ];

  const mockGithubBackups: BackupInfo[] = [
    {
      id: "backup_2025-04-30_03-00-00.sql",
      name: "GitHub Backup",
      timestamp: "2025-04-30T03:01:32.000Z",
      size: 52428800, // 50 MB
      type: "github",
      status: "success"
    },
    {
      id: "backup_2025-04-29_03-00-00.sql",
      name: "GitHub Backup",
      timestamp: "2025-04-29T03:01:45.000Z",
      size: 50331648, // 48 MB
      type: "github",
      status: "success"
    },
    {
      id: "backup_2025-04-28_03-00-00.sql",
      name: "GitHub Backup",
      timestamp: "2025-04-28T03:02:12.000Z",
      size: 49152000, // 46.9 MB
      type: "github",
      status: "success"
    }
  ];

  // Daten laden (mit Mock-Implementierung)
  const loadBackupStatus = async () => {
    try {
      setIsLoading(true);
      
      // Hier würde normaler API-Aufruf stehen
      // const response = await fetch("/api/admin/backups/status");
      // const data = await response.json();
      
      // Mock-Daten laden
      setTimeout(() => {
        setLocalBackups(mockLocalBackups);
        setGithubBackups(mockGithubBackups);
        
        // Letztes Backup-Datum aus dem neuesten Backup
        if (mockLocalBackups.length > 0) {
          setLastBackupDate(new Date(mockLocalBackups[0].timestamp));
        }
        
        // Nächstes Backup-Datum berechnen (3:00 Uhr am nächsten Tag)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(3, 0, 0, 0);
        setNextBackupDate(tomorrow);
        
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Fehler beim Laden der Backup-Statusdaten:", error);
      setIsLoading(false);
      toast({
        title: "Fehler",
        description: "Die Backup-Statusdaten konnten nicht geladen werden.",
        variant: "destructive"
      });
    }
  };

  // Beim ersten Laden Daten abrufen
  useEffect(() => {
    loadBackupStatus();
  }, []);

  // Refresh-Funktion mit Verzögerung
  const refreshStatus = async () => {
    setRefreshing(true);
    await loadBackupStatus();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // GitHub-Status manuell aktualisieren
  const syncWithGitHub = async () => {
    try {
      setSyncStatus("syncing");
      
      // Hier würde normaler API-Aufruf stehen
      // await fetch("/api/admin/backups/github/sync", { method: "POST" });
      
      // Mock-Erfolg nach kurzer Verzögerung
      setTimeout(() => {
        setSyncStatus("synced");
        toast({
          title: "Synchronisierung erfolgreich",
          description: "Die Backup-Daten wurden erfolgreich mit GitHub synchronisiert."
        });
      }, 2000);
    } catch (error) {
      console.error("Fehler bei der GitHub-Synchronisierung:", error);
      setSyncStatus("failed");
      toast({
        title: "Synchronisierungsfehler",
        description: "Die Backup-Daten konnten nicht mit GitHub synchronisiert werden.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-36">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-sm text-muted-foreground">Backup-Status wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Backup-Status</h2>
          <p className="text-muted-foreground">
            Übersicht über lokale und GitHub-Backups
          </p>
        </div>
        <Button 
          onClick={refreshStatus} 
          variant="outline" 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup-Statusübersicht */}
        <Card>
          <CardHeader>
            <CardTitle>Backup-Zusammenfassung</CardTitle>
            <CardDescription>Aktueller Status der Datensicherungen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                <span>Lokale Backups</span>
              </div>
              <Badge variant="outline">{localBackups.length}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CloudUpload className="h-5 w-5 text-green-500" />
                <span>GitHub-Backups</span>
              </div>
              <Badge variant="outline">{githubBackups.length}</Badge>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Letztes Backup</span>
              </div>
              <span className="text-sm font-medium">
                {lastBackupDate 
                  ? format(lastBackupDate, 'dd.MM.yyyy, HH:mm', { locale: de })
                  : "Nie"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-orange-500" />
                <span>Nächstes Backup</span>
              </div>
              <span className="text-sm font-medium">
                {nextBackupDate 
                  ? `${format(nextBackupDate, 'dd.MM.yyyy, HH:mm', { locale: de })} (in ${formatDistanceToNow(nextBackupDate, { locale: de })})`
                  : "Nicht geplant"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {syncStatus === "synced" && <Check className="h-5 w-5 text-green-500" />}
                {syncStatus === "syncing" && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
                {syncStatus === "failed" && <XCircle className="h-5 w-5 text-red-500" />}
                <span>GitHub-Synchronisierung</span>
              </div>
              <Button 
                size="sm" 
                variant={syncStatus === "failed" ? "destructive" : "outline"} 
                onClick={syncWithGitHub}
                disabled={syncStatus === "syncing"}
              >
                {syncStatus === "syncing" ? "Wird synchronisiert..." : "Synchronisieren"}
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/api/admin/backups/download/latest" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                Neuestes Backup herunterladen
              </a>
            </Button>
          </CardFooter>
        </Card>

        {/* GitHub-Repository-Status */}
        <Card>
          <CardHeader>
            <CardTitle>GitHub-Repository</CardTitle>
            <CardDescription>Status der offsite Backups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Repository</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">bau-structura-backups</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                  <a 
                    href="https://github.com/Lea43010/bau-structura-backups" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Letzter Sync</span>
              <span className="text-sm">
                {githubBackups.length > 0 
                  ? format(new Date(githubBackups[0].timestamp), 'dd.MM.yyyy, HH:mm:ss', { locale: de })
                  : "Nie"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Speichernutzung</span>
              <div className="flex items-center gap-2">
                <Progress value={65} className="w-24 h-2" />
                <span className="text-sm">65%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Verfügbarkeit</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Online
              </Badge>
            </div>

            {/* Meldung mit wichtiger Information */}
            <div className="flex p-3 mt-4 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p>Backups sind auch bei Serverausfall über das GitHub-Repository verfügbar. 
                Letzte erfolgreiche Sicherung vor {formatDistanceToNow(new Date(githubBackups[0]?.timestamp || Date.now()), { locale: de })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup-Historie */}
      <Card>
        <CardHeader>
          <CardTitle>Backup-Historie</CardTitle>
          <CardDescription>Die letzten 5 Backups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm">Backup-Datei</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Datum</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Größe</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Typ</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {[...localBackups, ...githubBackups]
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 5)
                  .map((backup, index) => (
                    <tr key={`${backup.id}-${backup.type}-${index}`} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">{backup.id}</td>
                      <td className="py-3 px-4 text-sm">
                        {format(new Date(backup.timestamp), 'dd.MM.yyyy, HH:mm:ss', { locale: de })}
                      </td>
                      <td className="py-3 px-4 text-sm">{formatFileSize(backup.size)}</td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant="outline" className={backup.type === "github" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}>
                          {backup.type === "github" ? "GitHub" : "Lokal"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-1">
                          {backup.status === "success" && <Check className="h-4 w-4 text-green-500" />}
                          {backup.status === "failed" && <XCircle className="h-4 w-4 text-red-500" />}
                          {backup.status === "in-progress" && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                          <span className={
                            backup.status === "success" ? "text-green-600" : 
                            backup.status === "failed" ? "text-red-600" : "text-blue-600"
                          }>
                            {backup.status === "success" ? "Erfolgreich" : 
                             backup.status === "failed" ? "Fehlgeschlagen" : "In Bearbeitung"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <Button size="sm" variant="outline" className="h-8" asChild>
                          <a 
                            href={`/api/admin/backups/download/${backup.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            <span>Herunterladen</span>
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">Zeigt die 5 neuesten Backups an. Gehen Sie zu Datensicherung für mehr Details.</p>
          <Button variant="link" asChild>
            <a href="/admin#backups" className="flex items-center gap-1">
              <span>Alle Backups anzeigen</span>
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}