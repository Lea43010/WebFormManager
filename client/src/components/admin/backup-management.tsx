import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Database,
  DownloadCloud,
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';

// Typen für die Backup-Daten
interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  created: string;
  tables: number;
}

interface BackupListResponse {
  backups: BackupInfo[];
  backupDirectory: string;
  autoBackupEnabled: boolean;
  nextScheduledBackup?: string;
}

/**
 * Formatiert die Dateigröße in menschenlesbare Form
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Backup-Management-Komponente für Administratoren
 */
export function BackupManagement() {
  const { toast } = useToast();
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Query zum Laden aller Backups
  const { 
    data: backupData, 
    isLoading: isLoadingBackups, 
    isError: isBackupsError,
    refetch: refetchBackups
  } = useQuery<BackupListResponse>({
    queryKey: ['/api/admin/backups'],
    refetchInterval: 30000, // Automatisches Neuladen alle 30 Sekunden
  });

  // Mutation zum Erstellen eines neuen Backups
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      try {
        const res = await apiRequest('POST', '/api/admin/backups');
        return await res.json();
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Backup erstellt',
        description: 'Das Datenbank-Backup wurde erfolgreich erstellt.',
        variant: 'default',
      });
      refetchBackups();
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: `Backup konnte nicht erstellt werden: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation zum Löschen eines Backups
  const deleteBackupMutation = useMutation({
    mutationFn: async (filename: string) => {
      const res = await apiRequest('DELETE', `/api/admin/backups/${filename}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Backup gelöscht',
        description: 'Das Backup wurde erfolgreich gelöscht.',
        variant: 'default',
      });
      refetchBackups();
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: `Backup konnte nicht gelöscht werden: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation zum Wiederherstellen eines Backups
  const restoreBackupMutation = useMutation({
    mutationFn: async (filename: string) => {
      setIsLoading(true);
      try {
        const res = await apiRequest('POST', `/api/admin/backups/${filename}/restore`, {
          confirmationToken: 'CONFIRM_RESTORE'
        });
        return await res.json();
      } finally {
        setIsLoading(false);
        setIsRestoreDialogOpen(false);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Wiederherstellung erfolgreich',
        description: 'Die Datenbank wurde erfolgreich aus dem Backup wiederhergestellt.',
        variant: 'default',
      });
      refetchBackups();
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: `Wiederherstellung fehlgeschlagen: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Funktion zum Starten eines Backups
  const handleCreateBackup = () => {
    createBackupMutation.mutate();
  };

  // Funktion zum Löschen eines Backups
  const handleDeleteBackup = (backup: BackupInfo) => {
    if (confirm(`Sind Sie sicher, dass Sie das Backup "${backup.filename}" löschen möchten?`)) {
      deleteBackupMutation.mutate(backup.filename);
    }
  };

  // Funktion zum Öffnen des Wiederherstellungs-Dialogs
  const handleOpenRestoreDialog = (backup: BackupInfo) => {
    setSelectedBackup(backup);
    setIsRestoreDialogOpen(true);
  };

  // Funktion zum Wiederherstellen eines Backups
  const handleRestoreBackup = () => {
    if (selectedBackup) {
      restoreBackupMutation.mutate(selectedBackup.filename);
    }
  };

  // Funktion zum Herunterladen eines Backups
  const handleDownloadBackup = (filename: string) => {
    window.location.href = `/api/admin/backups/${filename}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Datenbank-Backup</h2>
          <p className="text-muted-foreground">
            Erstellen und verwalten Sie Sicherungen der Datenbank.
          </p>
        </div>
        <Button 
          onClick={handleCreateBackup}
          disabled={createBackupMutation.isPending || isLoading}
        >
          {createBackupMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Backup wird erstellt...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Backup erstellen
            </>
          )}
        </Button>
      </div>

      <Separator />

      {isBackupsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>
            Beim Laden der Backups ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.
          </AlertDescription>
        </Alert>
      )}

      {isLoadingBackups ? (
        <div className="py-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Backups werden geladen...</p>
        </div>
      ) : backupData?.backups && backupData.backups.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Vorhandene Backups</CardTitle>
            <CardDescription>
              Backup-Verzeichnis: {backupData.backupDirectory}
              {backupData.autoBackupEnabled && (
                <div className="mt-2">
                  <Badge variant="outline" className="bg-green-50">
                    <Check className="h-3 w-3 mr-1" />
                    Automatische Backups aktiviert
                  </Badge>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Liste aller verfügbaren Datenbank-Backups</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Dateiname</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead>Größe</TableHead>
                  <TableHead>Tabellen</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupData.backups.map((backup) => (
                  <TableRow key={backup.filename}>
                    <TableCell className="font-medium">
                      {backup.filename}
                    </TableCell>
                    <TableCell>
                      {format(new Date(backup.created), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell>{formatFileSize(backup.size)}</TableCell>
                    <TableCell>{backup.tables}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadBackup(backup.filename)}
                          title="Backup herunterladen"
                        >
                          <DownloadCloud className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenRestoreDialog(backup)}
                          title="Backup wiederherstellen"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBackup(backup)}
                          title="Backup löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Keine Backups vorhanden</CardTitle>
            <CardDescription>
              Es wurden bisher keine Datenbank-Backups erstellt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Klicken Sie auf "Backup erstellen", um Ihre erste Datenbanksicherung zu erstellen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bestätigungsdialog für die Wiederherstellung */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup wiederherstellen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie die Datenbank aus diesem Backup wiederherstellen möchten?
              Dies wird alle aktuellen Daten überschreiben.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Backup-Datei:</p>
                  <p className="text-sm text-muted-foreground">{selectedBackup.filename}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Erstellt am:</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedBackup.created), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Größe:</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedBackup.size)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tabellen:</p>
                  <p className="text-sm text-muted-foreground">{selectedBackup.tables}</p>
                </div>
              </div>
              
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Achtung: Dieser Vorgang kann nicht rückgängig gemacht werden!</AlertTitle>
                <AlertDescription>
                  Die Wiederherstellung überschreibt alle aktuellen Daten in der Datenbank.
                  Stellen Sie sicher, dass alle Benutzer sich ausgeloggt haben, bevor Sie fortfahren.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {isLoading && (
            <div className="py-4">
              <p className="text-sm text-center mb-2">Wiederherstellung läuft...</p>
              <Progress value={75} className="w-full" />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRestoreBackup}
              disabled={!selectedBackup || isLoading || restoreBackupMutation.isPending}
            >
              {restoreBackupMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Wird wiederhergestellt...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Wiederherstellen bestätigen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BackupManagement;