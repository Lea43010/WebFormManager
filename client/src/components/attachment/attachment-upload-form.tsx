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
  projectId: z.string().min(1, "Bitte wählen Sie ein Projekt aus"),
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
      projectId: initialProjectId || "",
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
      const response = await fetch("/api/attachments/upload", {
        method: "POST",
        body: data,
        credentials: "include"
      });
      return response.json();
    },
    onSuccess: () => {
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
      toast({
        title: "Fehler beim Hochladen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Datei-Auswahl-Handler
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Bildvorschau nur für Bilder
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
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

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("projectId", values.projectId);
    
    uploadMutation.mutate(formData);
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

                <div className="space-y-4">
                  <FormLabel>Datei</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    {filePreview ? (
                      <div className="w-full flex flex-col items-center">
                        <img 
                          src={filePreview} 
                          alt="Vorschau" 
                          className="max-h-48 max-w-full object-contain mb-4"
                        />
                        <p className="text-sm">{selectedFile?.name}</p>
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
                        <div className="mt-4 flex justify-center">
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer bg-[#6a961f] text-white px-4 py-2 rounded-md hover:bg-[#5a8418] transition"
                          >
                            Datei auswählen
                          </label>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          PDF, Bilder, Excel-Dateien oder andere Dokumenttypen
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
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem className="mb-6">
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
            
            <CameraUpload 
              projectId={form.watch("projectId") ? parseInt(form.watch("projectId")) : null} 
              onUploadSuccess={handleCameraUploadSuccess}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}