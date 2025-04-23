import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Download, FileIcon, FileText, FileImage, FileSpreadsheet, ArrowLeft, Plus, Upload, Camera, BarChart4, Sparkles, FolderInput } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Attachment, Project } from "@shared/schema";
import AttachmentUploadForm from "@/components/attachment/attachment-upload-form";
import EnhancedUploadForm from "@/components/attachment/enhanced-upload-form";
import AsphaltAnalysis from "@/components/attachment/asphalt-analysis";
import { FileOrganizationSuggestions } from "@/components/attachment/file-organization-suggestions";
import { Badge } from "@/components/ui/badge";
import ResponsiveImage from "@/components/ui/responsive-image";
import Base64Image from "@/components/ui/base64-image";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import MobileFriendlyButton from "@/components/ui/mobile-friendly-button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

export default function AttachmentPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"regular" | "camera">("regular");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Projekte laden
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 60 * 1000, // 60 Sekunden
  });

  // Anhänge laden mit verbesserter Fehlerbehandlung
  const { data: attachments, isLoading, error, refetch } = useQuery<Attachment[]>({
    queryKey: ["/api/attachments"],
    staleTime: 10 * 1000, // 10 Sekunden
    retry: 3, // Bei Fehlern bis zu 3 Mal versuchen
    refetchOnWindowFocus: false, // Nicht automatisch bei Fokuswechsel neu laden
    onError: (error) => {
      console.error("Fehler beim Laden der Anhänge:", error);
      // Wir zeigen den Fehler nicht in der UI an, sondern nur in der Konsole
    }
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

  // Finde Projektname basierend auf der Projekt-ID
  const getProjectName = (projectId: number) => {
    const project = projects?.find(p => p.id === projectId);
    return project ? project.projectName : `Projekt ${projectId}`;
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
              onClick={() => {
                setUploadMode("regular");
                setUploadDialogOpen(true);
              }}
              className="bg-[#6a961f] hover:bg-[#5a8418] text-white flex-1 sm:flex-none h-10 text-xs sm:text-sm"
            >
              <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Datei hochladen
            </Button>
            
            <Button 
              onClick={() => {
                setUploadMode("camera");
                setUploadDialogOpen(true);
              }}
              variant="outline"
              className="flex-1 sm:flex-none h-10 text-xs sm:text-sm"
            >
              <Camera className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Kamera
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4 sm:mb-6 w-full overflow-x-auto flex-nowrap whitespace-nowrap h-9 sm:h-10 p-0.5 sm:p-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3 h-8 truncate">Alle Anhänge</TabsTrigger>
            <TabsTrigger value="byProject" className="text-xs sm:text-sm px-2 sm:px-3 h-8 truncate">Nach Projekt</TabsTrigger>
            <TabsTrigger value="organization" className="text-xs sm:text-sm px-2 sm:px-3 h-8 truncate">Smart Organisation</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <LoadingOverlay 
                isLoading={true}
                variant="skeleton" 
                text="Anhänge werden geladen..." 
                className="my-12"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="overflow-hidden opacity-50">
                      <CardHeader className="p-4 bg-gray-50 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent className="p-4 flex items-center justify-center h-40">
                        <div className="text-center animate-pulse">
                          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto"></div>
                          <div className="h-3 bg-gray-200 rounded w-16 mx-auto mt-2"></div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 bg-gray-50 animate-pulse">
                        <div className="flex flex-wrap gap-2">
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                          <div className="h-8 bg-gray-200 rounded w-24"></div>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </LoadingOverlay>
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
                  <Card key={attachment.id} className="overflow-hidden">
                    <CardHeader className="p-4 bg-gray-50">
                      <CardTitle className="text-sm font-medium truncate">{attachment.fileName}</CardTitle>
                      <CardDescription className="text-xs">
                        {attachment.projectId ? getProjectName(attachment.projectId) : "Kein Projekt"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 flex items-center justify-center">
                      <div className="text-center">
                        {attachment.fileType === 'image' ? (
                          <div className="relative w-full h-40 overflow-hidden rounded-md">
                            <Base64Image
                              attachmentId={attachment.id}
                              alt={attachment.fileName}
                              className="object-cover w-full h-full"
                              placeholderColor="#f3f4f6"
                              lazyLoad={true}
                            />
                          </div>
                        ) : (
                          getFileIcon(attachment.fileType)
                        )}
                        <p className="mt-2 text-sm text-gray-500">
                          {(attachment.fileSize / 1024).toFixed(2)} KB
                        </p>
                        {attachment.fileCategory && attachment.fileCategory !== "Andere" && (
                          <Badge variant="secondary" className="mt-2">{attachment.fileCategory}</Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 bg-gray-50 flex justify-between">
                      <div className="flex flex-wrap gap-2">
                        <MobileFriendlyButton
                          variant="outline"
                          size="sm"
                          className="px-2 py-1 h-8 text-xs"
                          touchClassName="active:bg-gray-200"
                          onClick={() => openDeleteDialog(attachment)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Löschen
                        </MobileFriendlyButton>
                        
                        <MobileFriendlyButton
                          variant="outline"
                          size="sm"
                          className="px-2 py-1 h-8 text-xs"
                          touchClassName="active:bg-gray-200"
                          onClick={() => handleDownload(attachment)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </MobileFriendlyButton>
                        
                        {attachment.fileType === 'image' && (
                          <AsphaltAnalysis attachment={attachment} />
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="byProject">
            {isLoading ? (
              <LoadingOverlay 
                isLoading={true}
                variant="skeleton" 
                text="Projektgruppierer werden geladen..." 
                className="my-12"
              >
                <div className="space-y-8">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden opacity-50">
                      <div className="bg-gray-100 p-4 border-b animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {[...Array(3)].map((_, j) => (
                          <Card key={j} className="overflow-hidden animate-pulse">
                            <CardHeader className="p-3 bg-gray-50">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </CardHeader>
                            <CardContent className="p-3 flex items-center justify-center h-32">
                              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            </CardContent>
                            <CardFooter className="p-3 bg-gray-50">
                              <div className="flex flex-wrap gap-2 w-full">
                                <div className="h-8 bg-gray-200 rounded w-20"></div>
                                <div className="h-8 bg-gray-200 rounded w-24"></div>
                              </div>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </LoadingOverlay>
            ) : error ? (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>
                  Fehler beim Laden der Anhänge: {error instanceof Error ? error.message : "Unbekannter Fehler"}
                </AlertDescription>
              </Alert>
            ) : Object.keys(attachmentsByProject).length === 0 ? (
              <div className="text-center my-12">
                <p className="text-lg text-gray-500">Keine Anhänge gefunden.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(attachmentsByProject).map(([projectId, projectAttachments]) => (
                  <div key={projectId} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 p-4 border-b">
                      <h3 className="text-lg font-medium">
                        {parseInt(projectId) === 0 ? "Ohne Projektzuweisung" : getProjectName(parseInt(projectId))}
                      </h3>
                      <p className="text-sm text-gray-500">{projectAttachments.length} Anhänge</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {projectAttachments.map((attachment) => (
                        <Card key={attachment.id} className="overflow-hidden">
                          <CardHeader className="p-3 bg-gray-50">
                            <CardTitle className="text-sm font-medium truncate">{attachment.fileName}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 flex items-center justify-center">
                            <div className="text-center">
                              {attachment.fileType === 'image' ? (
                                <div className="relative w-full h-32 overflow-hidden rounded-md">
                                  <Base64Image
                                    attachmentId={attachment.id}
                                    alt={attachment.fileName}
                                    className="object-cover w-full h-full"
                                    placeholderColor="#f3f4f6"
                                    lazyLoad={true}
                                  />
                                </div>
                              ) : (
                                getFileIcon(attachment.fileType)
                              )}
                              <p className="mt-2 text-xs text-gray-500">
                                {(attachment.fileSize / 1024).toFixed(2)} KB
                              </p>
                              {attachment.fileCategory && attachment.fileCategory !== "Andere" && (
                                <Badge variant="secondary" className="mt-2">{attachment.fileCategory}</Badge>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="p-3 bg-gray-50">
                            <div className="flex flex-wrap gap-2 w-full">
                              <MobileFriendlyButton
                                variant="outline"
                                size="sm"
                                className="px-2 py-1 h-8 text-xs"
                                touchClassName="active:bg-gray-200"
                                onClick={() => openDeleteDialog(attachment)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Löschen
                              </MobileFriendlyButton>
                              
                              <MobileFriendlyButton
                                variant="outline"
                                size="sm"
                                className="px-2 py-1 h-8 text-xs"
                                touchClassName="active:bg-gray-200"
                                onClick={() => handleDownload(attachment)}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </MobileFriendlyButton>
                              
                              {attachment.fileType === 'image' && (
                                <AsphaltAnalysis attachment={attachment} />
                              )}
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="organization">
            <div className="mb-8">
              <div className="mb-6 rounded-lg border p-4 bg-muted/20">
                <h2 className="text-xl font-semibold mb-2">Intelligente Dateiorganisation</h2>
                <p className="text-muted-foreground mb-6">
                  Mit unserer KI-gestützten Dateiorganisation können Sie Ihre Projektdateien automatisch nach Kategorien 
                  und Eigenschaften sortieren lassen. Wählen Sie ein Projekt und erhalten Sie Vorschläge, wie 
                  Ihre Dateien am besten organisiert werden können.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium mb-2 block">Projekt auswählen</label>
                    <Select
                      value={selectedProjectId?.toString() || ""}
                      onValueChange={(value) => setSelectedProjectId(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Projekt auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingProjects ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Lade Projekte...</span>
                          </div>
                        ) : (
                          projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.projectName || `Projekt ${project.id}`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <div className="space-y-2 w-full">
                      <p className="text-sm text-muted-foreground">
                        Die KI analysiert automatisch Ihre Dateien und erkennt Muster und Zusammenhänge, um optimale Kategorien vorzuschlagen.
                      </p>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">KI-gesteuerte Analyse</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedProjectId ? (
                <FileOrganizationSuggestions projectId={selectedProjectId} />
              ) : (
                <div className="text-center p-12 border border-dashed rounded-lg bg-muted/10">
                  <FolderInput className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Bitte wählen Sie ein Projekt</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Um Vorschläge zur Dateiorganisation zu erhalten, wählen Sie bitte zuerst ein Projekt aus der Liste aus.
                  </p>
                </div>
              )}
            </div>
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
                  Projekt: {selectedAttachment.projectId ? getProjectName(selectedAttachment.projectId) : "Kein Projekt"} • 
                  Größe: {(selectedAttachment.fileSize / 1024).toFixed(2)} KB
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
          <DialogContent className="sm:max-w-[800px] md:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-xl">
                {uploadMode === "camera" ? "Kamerafoto hochladen" : "Dateien hochladen"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {uploadMode === "camera" 
                  ? "Nehmen Sie ein Foto mit Ihrer Kamera auf oder wählen Sie ein bestehendes Foto aus."
                  : "Wählen Sie ein Projekt und laden Sie Dateien hoch. Sie können auch Dateien per Drag & Drop hinzufügen."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <EnhancedUploadForm 
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