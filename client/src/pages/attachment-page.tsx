import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Download, FileIcon, FileText, FileImage, FileSpreadsheet, Upload } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Attachment } from "@shared/schema";
import AttachmentUploadForm from "@/components/attachment/attachment-upload-form";

export default function AttachmentPage() {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Anhänge laden mit verbesserter Fehlerbehandlung
  const { data: attachments, isLoading, error, refetch } = useQuery<Attachment[]>({
    queryKey: ["/api/attachments"],
    staleTime: 10 * 1000, // 10 Sekunden
    retry: 3, // Bei Fehlern bis zu 3 Mal versuchen
    refetchOnWindowFocus: false // Nicht automatisch bei Fokuswechsel neu laden
  });

  // Löschen eines Anhangs
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/attachments/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Anhang gelöscht",
        description: "Der Anhang wurde erfolgreich gelöscht.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attachments"] });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Löschen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openDeleteDialog = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedAttachment) {
      deleteAttachmentMutation.mutate(selectedAttachment.id);
    }
  };
  
  // Token-basierter Download mit Fehlerbehandlung
  const handleDownload = async (attachment: Attachment) => {
    try {
      // Token anfordern (für den Download-Endpunkt, nicht für die Anzeige)
      const response = await fetch(`/api/attachments/${attachment.id}/token`);
      
      if (!response.ok) {
        throw new Error("Fehler beim Anfordern des Download-Tokens");
      }
      
      const data = await response.json();
      
      // Erzeugt einen temporären Link zum Herunterladen
      const link = document.createElement('a');
      link.href = `/api/attachments/${attachment.id}/download?token=${data.token}`;
      link.setAttribute('download', attachment.fileName || 'download');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Download-Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler beim Download",
        variant: "destructive",
      });
    }
  };

  // Erfolgreich hochgeladen behandeln
  const handleUploadSuccess = () => {
    setUploadDialogOpen(false);
    refetch();
    toast({
      title: "Erfolg",
      description: "Anhang erfolgreich hochgeladen.",
    });
  };

  // Dateityp-Icons
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="w-12 h-12 text-red-500" />;
      case "excel":
        return <FileSpreadsheet className="w-12 h-12 text-green-500" />;
      case "image":
        return <FileImage className="w-12 h-12 text-blue-500" />;
      default:
        return <FileIcon className="w-12 h-12 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout
      title={
        <div className="flex items-center space-x-4">
          <span>Dokumente</span>
        </div>
      }
    >
      <div className="container p-4">
        <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto mb-2 sm:mb-0">
            <Button 
              onClick={() => setUploadDialogOpen(true)}
              className="bg-[#6a961f] hover:bg-[#5a8418] text-white flex-1 sm:flex-none h-10 text-xs sm:text-sm"
            >
              <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Datei hochladen
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center my-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-lg text-gray-500">Anhänge werden geladen...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Fehler beim Laden der Anhänge: {error instanceof Error ? error.message : "Unbekannter Fehler"}
            </AlertDescription>
          </Alert>
        ) : attachments?.length === 0 ? (
          <div className="text-center my-12">
            <p className="text-lg text-gray-500">Keine Anhänge gefunden.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attachments?.map((attachment) => (
              <Card 
                key={attachment.id} 
                className={`overflow-hidden ${attachment.fileMissing ? 'border-amber-400' : ''}`}
              >
                <CardHeader className={`p-4 ${attachment.fileMissing ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <CardTitle className="text-sm font-medium truncate">
                    {attachment.fileName}
                    {attachment.fileMissing && (
                      <span className="ml-1 text-xs text-amber-600 font-normal">
                        (nicht verfügbar)
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {attachment.projectId ? `Projekt ${attachment.projectId}` : "Kein Projekt"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 flex items-center justify-center">
                  <div className="text-center">
                    {attachment.fileMissing ? (
                      <div className="relative inline-block">
                        {getFileIcon(attachment.fileType)}
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                          <span className="text-[10px]">!</span>
                        </div>
                      </div>
                    ) : (
                      getFileIcon(attachment.fileType)
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      {(attachment.fileSize / 1024).toFixed(2)} KB
                    </p>
                    {attachment.fileMissing && (
                      <Badge variant="outline" className="mt-2 text-[10px] border-amber-500 text-amber-700">
                        Datei fehlt
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 bg-gray-50 flex justify-between">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2 py-1 h-8 text-xs"
                      onClick={() => openDeleteDialog(attachment)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Löschen
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className={`px-2 py-1 h-8 text-xs ${attachment.fileMissing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={attachment.fileMissing}
                      onClick={() => {
                        if (attachment.fileMissing) {
                          toast({
                            title: "Datei nicht verfügbar",
                            description: "Diese Datei ist nicht mehr auf dem Server verfügbar.",
                            variant: "destructive",
                          });
                          return;
                        }
                        handleDownload(attachment);
                      }}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Löschdialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Anhang löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie diesen Anhang löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="bg-gray-100 p-2 rounded">
              {selectedAttachment?.fileType === 'image' ? (
                <FileImage className="w-8 h-8 text-blue-500" />
              ) : selectedAttachment?.fileType === 'pdf' ? (
                <FileText className="w-8 h-8 text-red-500" />
              ) : selectedAttachment?.fileType === 'excel' ? (
                <FileSpreadsheet className="w-8 h-8 text-green-500" />
              ) : (
                <FileIcon className="w-8 h-8 text-gray-500" />
              )}
            </div>
            <div>
              <p className="font-medium">{selectedAttachment?.fileName}</p>
              <p className="text-sm text-gray-500">
                {selectedAttachment?.fileSize ? (selectedAttachment.fileSize / 1024).toFixed(2) + ' KB' : 'Unbekannte Größe'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteAttachmentMutation.isPending}
            >
              {deleteAttachmentMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Anhang hinzufügen</DialogTitle>
            <DialogDescription>
              Laden Sie eine Datei hoch, um sie als Anhang hinzuzufügen.
            </DialogDescription>
          </DialogHeader>
          
          <AttachmentUploadForm onUploadSuccess={handleUploadSuccess} />
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}