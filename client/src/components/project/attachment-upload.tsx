import { useState, useRef, ChangeEvent } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Attachment } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { FileText, File, Loader2, Plus, Trash2, Image as ImageIcon, Download } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';

interface AttachmentUploadProps {
  projectId: number;
}

export default function AttachmentUpload({ projectId }: AttachmentUploadProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch project attachments
  const { data: attachments, isLoading } = useQuery<Attachment[]>({
    queryKey: [`/api/projects/${projectId}/attachments`],
    enabled: !!projectId,
  });

  // Handle file change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Delete attachment mutation
  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete attachment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/attachments`] });
      toast({
        title: 'Erfolg',
        description: 'Anhang wurde gelöscht',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Löschen: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (attachment: Attachment) => {
    if (confirm(`Möchten Sie wirklich "${attachment.fileName}" löschen?`)) {
      deleteMutation.mutate(attachment.id);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie eine Datei aus',
        variant: 'destructive',
      });
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId.toString());
      if (description) {
        formData.append('description', description);
      }
      
      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload fehlgeschlagen');
      }
      
      toast({
        title: 'Erfolg',
        description: 'Datei wurde hochgeladen',
      });
      
      // Reset form
      setFile(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Close dialog and refresh data
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/attachments`] });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: `Upload fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Get file icon based on filename
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-6 h-6 text-blue-500" />;
    } else if (['pdf'].includes(ext || '')) {
      return <FileText className="w-6 h-6 text-red-500" />;
    } else {
      return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Projektanhänge</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Datei hochladen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Datei hochladen</DialogTitle>
              <DialogDescription>
                Laden Sie eine Datei zum Projekt hoch
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="file">Datei</Label>
                  <Input
                    id="file"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="description">Beschreibung (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Beschreibung der Datei..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={uploading}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={!file || uploading}>
                  {uploading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Hochladen
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !attachments || attachments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Keine Anhänge vorhanden. Klicken Sie auf "Datei hochladen", um zu beginnen.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attachments.map((attachment) => (
            <Card 
              key={attachment.id} 
              className={`overflow-hidden hover:shadow-md transition-shadow ${attachment.fileMissing ? 'border-amber-400 bg-amber-50' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="pt-1">
                    {attachment.fileMissing ? (
                      <div className="relative">
                        {getFileIcon(attachment.fileName)}
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                          <span className="text-[10px]">!</span>
                        </div>
                      </div>
                    ) : (
                      getFileIcon(attachment.fileName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.fileName}
                      {attachment.fileMissing && (
                        <span className="ml-1 text-xs text-amber-600 font-normal">
                          (Datei nicht verfügbar)
                        </span>
                      )}
                    </p>
                    {attachment.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {attachment.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {attachment.createdAt && new Date(attachment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={attachment.fileMissing} // Deaktivieren bei fehlender Datei
                      title={attachment.fileMissing ? "Datei nicht mehr verfügbar" : "Datei herunterladen"}
                      onClick={async () => {
                        try {
                          // Prüfen, ob die Datei fehlt
                          if (attachment.fileMissing) {
                            toast({
                              title: "Datei nicht verfügbar",
                              description: "Diese Datei ist nicht mehr auf dem Server verfügbar.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          // Verbesserte direkte Download-Methode mit neuer API
                          console.log(`Starte Download für Anhang ID: ${attachment.id}`);
                          
                          // Wir verwenden jetzt unseren neuen verbesserten Download-Endpunkt
                          const downloadUrl = `/api/download/${attachment.id}`;
                          
                          // Direktes Öffnen in neuem Fenster für robustere Kompatibilität
                          window.open(downloadUrl, '_blank');
                          
                          toast({
                            title: "Download gestartet",
                            description: "Der Download wurde in einem neuen Tab gestartet",
                          });
                        } catch (error) {
                          toast({
                            title: "Download-Fehler",
                            description: error instanceof Error ? error.message : "Unbekannter Fehler beim Download",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Download className={`h-4 w-4 ${attachment.fileMissing ? 'text-gray-400' : 'text-green-600'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(attachment)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}