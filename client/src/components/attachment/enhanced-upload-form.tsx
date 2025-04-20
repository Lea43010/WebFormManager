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
import { Loader2, Upload, Camera } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CameraUpload } from "@/components/ui/camera-upload";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Project, fileCategoryEnum } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedFileUpload } from "./enhanced-file-upload";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Definieren des Schemas für das Upload-Formular
const uploadSchema = z.object({
  projectId: z.string().min(1, "Bitte wählen Sie ein Projekt aus"),
  fileCategory: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

interface EnhancedUploadFormProps {
  onUploadSuccess?: () => void;
  initialProjectId?: string;
  mode?: "regular" | "camera";
}

export default function EnhancedUploadForm({ 
  onUploadSuccess, 
  initialProjectId,
  mode = "regular"
}: EnhancedUploadFormProps) {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      projectId: initialProjectId || "",
      fileCategory: "Andere",
      description: "",
      tags: "",
    },
  });

  // Projekte für das Dropdown laden
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 10 * 1000, // 10 Sekunden
  });

  // Dateiauswahl-Handler
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  // Hochladen der Dateien
  const uploadFiles = async (values: UploadFormValues) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Keine Datei ausgewählt",
        description: "Bitte wählen Sie eine Datei zum Hochladen aus",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Bei mehreren Dateien sequentiell hochladen
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", values.projectId);
        
        if (values.fileCategory) {
          formData.append("fileCategory", values.fileCategory);
        }
        
        if (values.description) {
          formData.append("description", values.description);
        }

        if (values.tags) {
          formData.append("tags", values.tags);
        }
        
        const response = await fetch("/api/attachments/upload", {
          method: "POST",
          body: formData,
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error(`Upload fehlgeschlagen: ${response.status} ${response.statusText}`);
        }
        
        await response.json();
      }
      
      toast({
        title: `${selectedFiles.length === 1 ? "Datei" : "Dateien"} hochgeladen`,
        description: `${selectedFiles.length} ${selectedFiles.length === 1 ? "Datei wurde" : "Dateien wurden"} erfolgreich hochgeladen`,
      });
      
      // Zurücksetzen des Formulars und der ausgewählten Dateien
      form.reset();
      setSelectedFiles([]);
      
      // Cache invalidieren und Erfolg melden
      queryClient.invalidateQueries({ queryKey: ["/api/attachments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      toast({
        title: "Fehler beim Hochladen",
        description: (error as Error).message || "Ein unbekannter Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Handler für erfolgreichen Kamera-Upload
  const handleCameraUploadSuccess = () => {
    if (onUploadSuccess) {
      onUploadSuccess();
    }
  };

  // File-Kategorie-Optionen
  const fileCategoryOptions = [
    { value: "Verträge", label: "Verträge" },
    { value: "Rechnungen", label: "Rechnungen" },
    { value: "Pläne", label: "Pläne" },
    { value: "Protokolle", label: "Protokolle" },
    { value: "Genehmigungen", label: "Genehmigungen" },
    { value: "Fotos", label: "Fotos" },
    { value: "Analysen", label: "Analysen" },
    { value: "Andere", label: "Andere" },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Dateien hochladen</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={mode === "camera" ? "camera" : "regular"}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="regular">Datei(en) hochladen</TabsTrigger>
            <TabsTrigger value="camera">Kamera</TabsTrigger>
          </TabsList>
          
          <TabsContent value="regular">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(uploadFiles)} className="space-y-6">
                {/* Projekt und Dateiupload nebeneinander */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projekt</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoadingProjects || uploading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Projekt auswählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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

                  <div>
                    <FormLabel>Datei(en)</FormLabel>
                    <EnhancedFileUpload 
                      onFilesSelected={handleFilesSelected}
                      multiple={true}
                      uploading={uploading}
                      value={selectedFiles}
                      onValueChange={(files) => setSelectedFiles(files || [])}
                    />
                  </div>
                </div>

                {/* Kategorien */}
                <FormField
                  control={form.control}
                  name="fileCategory"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Kategorie</FormLabel>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                        disabled={uploading}
                      >
                        {fileCategoryOptions.map((category) => (
                          <FormItem
                            key={category.value}
                            className="flex items-center space-x-2 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem value={category.value} id={`category-${category.value}`} />
                            </FormControl>
                            <Label htmlFor={`category-${category.value}`} className="text-sm">
                              {category.label}
                            </Label>
                          </FormItem>
                        ))}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Beschreibung und Tags in zwei Spalten */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beschreibung (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Beschreibung eingeben..."
                            {...field}
                            disabled={uploading}
                            className="min-h-[60px] max-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Tags durch Kommas getrennt"
                            {...field}
                            disabled={uploading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#6a961f] hover:bg-[#5a8418] text-white"
                  disabled={uploading || selectedFiles.length === 0}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird hochgeladen...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {selectedFiles.length === 1 ? 'Datei hochladen' : `${selectedFiles.length} Dateien hochladen`}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="camera">
            <Form {...form}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projekt</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoadingProjects}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Projekt auswählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                  
                  {/* Leer für das Layout */}
                  <div className="flex items-end">
                    <p className="text-sm text-muted-foreground">Bitte wählen Sie ein Projekt und nutzen Sie dann die Kamera.</p>
                  </div>
                </div>
                
                <CameraUpload 
                  projectId={form.watch("projectId") ? parseInt(form.watch("projectId")) : null} 
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