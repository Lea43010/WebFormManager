import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarClock, Database, Download, FileArchive, HardDrive, History, RotateCcw, Trash2, Upload } from "lucide-react";
import { formatRelative, parseISO } from "date-fns";
import { de } from "date-fns/locale";

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
  path: string;
}

export default function BackupManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("files");

  // Abrufen der vorhandenen Backups
  const { data: backups, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/backups"],
    retry: false,
  });

  // Mutation zum manuellen Erstellen eines Backups
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/backups/create");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup erstellt",
        description: "Das Datenbank-Backup wurde erfolgreich erstellt.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Erstellen des Backups: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation zum Wiederherstellen eines Backups
  const restoreBackupMutation = useMutation({
    mutationFn: async (filename: string) => {
      const res = await apiRequest("POST", `/api/admin/backups/restore/${filename}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup wiederhergestellt",
        description: "Die Datenbank wurde erfolgreich wiederhergestellt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Fehler bei der Wiederherstellung: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation zum Löschen eines Backups
  const deleteBackupMutation = useMutation({
    mutationFn: async (filename: string) => {
      const res = await apiRequest("DELETE", `/api/admin/backups/${filename}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup gelöscht",
        description: "Das Backup wurde erfolgreich gelöscht.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen des Backups: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Download-Funktion für Backups
  const downloadBackup = (filename: string) => {
    window.open(`/api/admin/backups/download/${filename}`, '_blank');
  };

  // Status des automatischen Backup-Dienstes
  const { data: backupServiceStatus } = useQuery({
    queryKey: ["/api/admin/backups/service-status"],
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Datenbank-Backup</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Datenbanksicherungen und stellen Sie sicher, dass keine Daten verloren gehen.
          </p>
        </div>
        <Button
          onClick={() => createBackupMutation.mutate()}
          disabled={createBackupMutation.isPending}
          className="w-full sm:w-auto"
        >
          {createBackupMutation.isPending ? (
            <>Backup wird erstellt...</>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Backup jetzt erstellen
            </>
          )}
        </Button>
      </div>

      {backupServiceStatus?.active && (
        <Alert>
          <CalendarClock className="h-4 w-4" />
          <AlertTitle>Automatische Backups aktiv</AlertTitle>
          <AlertDescription>
            Tägliche Backups werden automatisch um {backupServiceStatus.scheduleTime || "3:00 Uhr"} erstellt. 
            Die Backups werden für {backupServiceStatus.retentionDays || 30} Tage aufbewahrt.
          </AlertDescription>
        </Alert>
      )}

      <Tabs 
        defaultValue="files" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="files" className="flex items-center">
            <FileArchive className="mr-2 h-4 w-4" />
            Backup-Dateien
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <HardDrive className="mr-2 h-4 w-4" />
            Einstellungen
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <History className="mr-2 h-4 w-4" />
            Verlauf
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verfügbare Backup-Dateien</CardTitle>
              <CardDescription>
                Liste aller verfügbaren Backups der Datenbank
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTitle>Fehler beim Laden der Backups</AlertTitle>
                  <AlertDescription>
                    {(error as Error).message}
                  </AlertDescription>
                </Alert>
              ) : !backups || backups.length === 0 ? (
                <div className="text-center py-8">
                  <FileArchive className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">Keine Backup-Dateien gefunden</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Erstellen Sie Ihr erstes Backup mit der Schaltfläche "Backup jetzt erstellen".
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {backups.map((backup: BackupFile) => (
                    <div key={backup.filename} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{backup.filename}</p>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <HardDrive className="h-3 w-3 mr-1" />
                          <span>{(backup.size / (1024 * 1024)).toFixed(2)} MB</span>
                          <span className="mx-2">•</span>
                          <CalendarClock className="h-3 w-3 mr-1" />
                          <span>{formatRelative(parseISO(backup.createdAt), new Date(), { locale: de })}</span>
                        </div>
                      </div>
                      <div className="flex mt-3 sm:mt-0 space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadBackup(backup.filename)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          <span className="sr-only sm:not-sr-only">Download</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Sind Sie sicher, dass Sie dieses Backup wiederherstellen möchten? Dies überschreibt alle aktuellen Daten.')) {
                              restoreBackupMutation.mutate(backup.filename);
                            }
                          }}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          <span className="sr-only sm:not-sr-only">Wiederherstellen</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Sind Sie sicher, dass Sie dieses Backup löschen möchten?')) {
                              deleteBackupMutation.mutate(backup.filename);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="sr-only sm:not-sr-only">Löschen</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                {backups?.length || 0} Backup(s) verfügbar
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => refetch()}
              >
                Aktualisieren
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automatische Backup-Einstellungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie die automatischen Backup-Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="font-medium">Status des Backup-Dienstes</p>
                <div className="flex items-center">
                  <Badge variant={backupServiceStatus?.active ? "default" : "outline"}>
                    {backupServiceStatus?.active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {backupServiceStatus?.active 
                      ? "Tägliche Backups werden automatisch erstellt" 
                      : "Der automatische Backup-Dienst ist derzeit nicht aktiv"}
                  </span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-1">
                <p className="font-medium">Backup-Zeitplan</p>
                <p className="text-sm text-muted-foreground">
                  Backups werden täglich um {backupServiceStatus?.scheduleTime || "3:00 Uhr"} erstellt.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-medium">Aufbewahrungsrichtlinie</p>
                <p className="text-sm text-muted-foreground">
                  Backups werden für {backupServiceStatus?.retentionDays || 30} Tage aufbewahrt 
                  und danach automatisch gelöscht.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-medium">Speicherort</p>
                <p className="text-sm text-muted-foreground">
                  Backups werden im Verzeichnis <code>./backups</code> gespeichert.
                </p>
              </div>

              <Alert>
                <AlertTitle>Hinweis zur Konfiguration</AlertTitle>
                <AlertDescription>
                  Um die Backup-Einstellungen zu ändern, bearbeiten Sie die Datei <code>scripts/backup-database.sh</code> und starten Sie den Backup-Service neu.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup-Verlauf</CardTitle>
              <CardDescription>
                Verlauf aller durchgeführten Backup-Operationen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Der detaillierte Backup-Verlauf wird in einer späteren Version verfügbar sein.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}