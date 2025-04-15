import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Download, FileIcon, FileText, FileImage, FileSpreadsheet, ArrowLeft, Plus, Upload, Camera, BarChart4, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Attachment } from "@shared/schema";
import AttachmentUploadForm from "@/components/attachment/attachment-upload-form";
import AsphaltAnalysis from "@/components/attachment/asphalt-analysis";
import { FileOrganizationSuggestions } from "@/components/attachment/file-organization-suggestions";

export default function AttachmentPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"regular" | "camera">("regular");

  // Anhänge laden
  const { data: attachments, isLoading, error, refetch } = useQuery<Attachment[]>({
    queryKey: ["/api/attachments"],
    staleTime: 10 * 1000, // 10 Sekunden
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

  const handleDownload = (attachment: Attachment) => {
    window.open(`/api/attachments/${attachment.id}/download`, "_blank");
  };

  const openDeleteDialog = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedAttachment) {
      deleteAttachmentMutation.mutate(selectedAttachment.id);
    }
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

  // Gruppiere Anhänge nach Projekten
  const attachmentsByProject = attachments?.reduce((acc, attachment) => {
    const projectId = attachment.projectId || 0;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(attachment);
    return acc;
  }, {} as Record<number, Attachment[]>) || {};

  const handleUploadSuccess = () => {
    setUploadDialogOpen(false);
    refetch();
    toast({
      title: "Erfolg",
      description: "Anhang erfolgreich hochgeladen.",
    });
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
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div className="flex space-x-4 mb-4 md:mb-0">
            <Button 
              onClick={() => {
                setUploadMode("regular");
                setUploadDialogOpen(true);
              }}
              className="bg-[#6a961f] hover:bg-[#5a8418] text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Datei hochladen
            </Button>
            
            <Button 
              onClick={() => {
                setUploadMode("camera");
                setUploadDialogOpen(true);
              }}
              variant="outline"
            >
              <Camera className="mr-2 h-4 w-4" />
              Kamera
            </Button>
            
            <Button
              onClick={() => {
                const activeProjectId = Object.keys(attachmentsByProject)[0]; 
                if (activeProjectId) {
                  apiRequest('POST', `/api/file-organization/suggestions/generate`, { 
                    projectId: parseInt(activeProjectId) 
                  })
                  .then(() => {
                    toast({
                      title: "Vorschläge werden generiert",
                      description: "Die Vorschläge werden jetzt erstellt und in Kürze angezeigt.",
                    });
                    queryClient.invalidateQueries({ queryKey: ['/api/file-organization/suggestions'] });
                  })
                  .catch(error => {
                    toast({
                      title: "Fehler",
                      description: "Fehler beim Generieren der Vorschläge: " + error.message,
                      variant: "destructive",
                    });
                  });
                } else {
                  toast({
                    title: "Keine Projekte gefunden",
                    description: "Es wurden keine Projekte mit Anhängen gefunden.",
                    variant: "destructive",
                  });
                }
              }}
              variant="outline"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Vorschläge generieren
            </Button>
          </div>
        </div>

        <Tabs defaultValue="organization">
          <TabsList className="mb-6">
            <TabsTrigger value="organization">Dateiorganisation</TabsTrigger>
          </TabsList>


          <TabsContent value="organization">
            {isLoading ? (
              <div className="flex justify-center my-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : Object.keys(attachmentsByProject).length === 0 ? (
              <div className="text-center my-12">
                <p className="text-lg text-gray-500">Keine Projekte gefunden für Dateiorganisation.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.keys(attachmentsByProject).map((projectId) => (
                  <div key={projectId} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">Projekt {projectId}</h3>
                        <p className="text-sm text-gray-500">{attachmentsByProject[parseInt(projectId)].length} Anhänge</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <FileOrganizationSuggestions projectId={parseInt(projectId)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Anhang löschen</DialogTitle>
              <DialogDescription>
                Möchten Sie diesen Anhang wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </DialogDescription>
            </DialogHeader>
            {selectedAttachment && (
              <div className="my-4">
                <p className="font-medium">{selectedAttachment.fileName}</p>
                <p className="text-sm text-gray-500">
                  Projekt: {selectedAttachment.projectId} • Größe: {(selectedAttachment.fileSize / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteAttachmentMutation.isPending}
              >
                {deleteAttachmentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Löschen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {uploadMode === "camera" ? "Kamerafoto hochladen" : "Anhang hochladen"}
              </DialogTitle>
              <DialogDescription>
                {uploadMode === "camera" 
                  ? "Nehmen Sie ein Foto mit Ihrer Kamera auf oder wählen Sie ein bestehendes Foto aus."
                  : "Wählen Sie ein Projekt und laden Sie eine Datei hoch."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <AttachmentUploadForm 
                onUploadSuccess={handleUploadSuccess}
                mode={uploadMode}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}