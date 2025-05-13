import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Camera } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CameraUpload } from "@/components/ui/camera-upload";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Project } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Definieren des Schemas für das Upload-Formular
const uploadSchema = z.object({
  projectId: z.string().optional(), // Projektauswahl ist optional
  // Kein File-Feld, da wir das separat behandeln
});

type UploadFormValues = z.infer<typeof uploadSchema>;

interface AttachmentUploadFormProps {
  onUploadSuccess?: () => void;
  initialProjectId?: string;
  mode?: "regular" | "camera";
}

export default function AttachmentUploadForm({ 
  onUploadSuccess, 
  initialProjectId,
  mode = "regular"
}: AttachmentUploadFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      projectId: initialProjectId || "none",
    },
  });

  // Projekte für das Dropdown laden
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 10 * 1000, // 10 Sekunden
  });

  // Datei-Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Debug-Ausgaben
      console.log('Sende Datei zum Upload:', selectedFile);
      console.log('Formular-Daten:', Object.fromEntries(data.entries()));
      
      try {
        const response = await fetch("/api/attachments", {
          method: "POST",
          body: data,
          credentials: "include"
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server-Antwort bei Fehler:', errorText);
          throw new Error(`Upload fehlgeschlagen: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error('Fehler beim Datei-Upload:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log('Upload erfolgreich:', result);
      toast({
        title: "Anhang hochgeladen",
        description: "Der Anhang wurde erfolgreich hochgeladen",
      });
      form.reset();
      setSelectedFile(null);
      setFilePreview(null);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    },
    onError: (error: Error) => {
      console.error('Upload-Fehler:', error);
      toast({
        title: "Fehler beim Hochladen",
        description: error.message || "Unbekannter Fehler beim Datei-Upload",
        variant: "destructive",
      });
    },
  });

  // Datei-Auswahl-Handler
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      console.log('Keine Datei ausgewählt');
      return;
    }
    
    console.log('Datei ausgewählt:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    // Prüfe, ob die Datei zu groß ist (25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Die maximale Dateigröße beträgt 25MB",
        variant: "destructive",
      });
      return;
    }
    
    // Prüfe, ob der Dateityp unterstützt wird
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 
      'application/pdf',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
      console.warn('Unbekannter Dateityp, aber Verarbeitung wird fortgesetzt:', file.type);
    }
    
    setSelectedFile(file);
    
    // Vorschau für Bilder
    if (file.type.startsWith('image/')) {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.onerror = (e) => {
          console.error('Fehler beim Lesen der Datei:', e);
          setFilePreview(null);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Fehler beim Erstellen der Vorschau:', error);
        setFilePreview(null);
      }
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Für PDFs verwende ein PDF-Icon
      setFilePreview('/static/pdf-icon.png');
    } else {
      // Für andere Dateitypen verwende ein generisches Dokument-Icon
      setFilePreview('/static/document-icon.png');
    }
  };

  // Formular-Absenden-Handler
  const onSubmit = (values: UploadFormValues) => {
    if (!selectedFile) {
      toast({
        title: "Keine Datei ausgewählt",
        description: "Bitte wählen Sie eine Datei zum Hochladen aus",
        variant: "destructive",
      });
      return;
    }

    try {
      // FormData erstellen und Felder hinzufügen
      const formData = new FormData();
      formData.append("file", selectedFile, selectedFile.name);
      
      // Nur projectId hinzufügen, wenn ein gültiger Wert vorhanden ist (nicht "none")
      if (values.projectId && values.projectId !== "none") {
        formData.append("projectId", values.projectId);
      }
      
      // Zusätzliche Daten für einfachere Fehlersuche
      formData.append("timestamp", new Date().toISOString());
      formData.append("fileName", selectedFile.name);
      formData.append("fileType", selectedFile.type);
      formData.append("fileSize", selectedFile.size.toString());
      
      console.log('Ausgewählte Datei:', selectedFile);
      console.log('Erstellte FormData:', {
        projectId: values.projectId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        timestamp: new Date().toISOString()
      });
      
      // Datei hochladen
      uploadMutation.mutate(formData);
    } catch (error) {
      console.error('Fehler beim Vorbereiten des Uploads:', error);
      toast({
        title: "Fehler beim Vorbereiten des Uploads",
        description: error instanceof Error ? error.message : "Unbekannter Fehler beim Vorbereiten des Uploads",
        variant: "destructive",
      });
    }
  };

  // Handler für erfolgreichen Kamera-Upload
  const handleCameraUploadSuccess = () => {
    if (onUploadSuccess) {
      onUploadSuccess();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Anhang hochladen</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={mode === "camera" ? "camera" : "regular"}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="regular">Datei hochladen</TabsTrigger>
            <TabsTrigger value="camera">Kamera</TabsTrigger>
          </TabsList>
          
          <TabsContent value="regular">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projekt (optional)</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoadingProjects}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue defaultValue="none" placeholder="Projekt auswählen (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Kein Projekt (allgemeiner Anhang)</SelectItem>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.projectName || `Projekt ${project.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel>Datei</FormLabel>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add("border-blue-500");
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove("border-blue-500");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove("border-blue-500");
                      const droppedFile = e.dataTransfer?.files?.[0];
                      if (droppedFile) {
                        const event = {
                          target: {
                            files: e.dataTransfer.files
                          }
                        } as React.ChangeEvent<HTMLInputElement>;
                        handleFileChange(event);
                      }
                    }}
                  >
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.doc,.docx,.txt"
                    />
                    {filePreview ? (
                      <div className="w-full flex flex-col items-center">
                        <img 
                          src={filePreview} 
                          alt="Vorschau" 
                          className="max-h-48 max-w-full object-contain mb-4"
                        />
                        <p className="text-sm font-medium">{selectedFile?.name}</p>
                        <p className="text-xs text-gray-500 mb-2">
                          {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB - ${selectedFile.type || 'Unbekannter Typ'}` : ''}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setSelectedFile(null);
                            setFilePreview(null);
                          }}
                        >
                          Entfernen
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4 flex justify-center flex-col items-center">
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer bg-[#6a961f] text-white px-4 py-2 rounded-md hover:bg-[#5a8418] transition mb-2"
                          >
                            Datei auswählen
                          </label>
                          <p className="text-sm text-gray-500">
                            oder per Drag & Drop hierher ziehen
                          </p>
                        </div>
                        <p className="mt-4 text-xs text-gray-500">
                          Unterstützte Formate: PDF, Bilder, Excel-Dateien, Word-Dokumente
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#6a961f] hover:bg-[#5a8418] text-white"
                  disabled={uploadMutation.isPending || !selectedFile}
                >
                  {uploadMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Hochladen
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="camera">
            <Form {...form}>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel>Projekt (optional)</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoadingProjects}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue defaultValue="none" placeholder="Projekt auswählen (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Kein Projekt (allgemeiner Anhang)</SelectItem>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.projectName || `Projekt ${project.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Kamera-Upload mit optionaler Projekt-ID */}
                <CameraUpload 
                  projectId={(() => {
                    const projectIdValue = form.getValues("projectId");
                    if (projectIdValue && projectIdValue !== "none" && /^\d+$/.test(projectIdValue)) {
                      return parseInt(projectIdValue, 10);
                    }
                    return null;
                  })()} 
                  onUploadSuccess={handleCameraUploadSuccess}
                />
              </div>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}