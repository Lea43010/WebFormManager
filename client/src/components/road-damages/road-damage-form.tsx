import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import SpeechRecorder from "./speech-recorder";
import { 
  roadDamageSeverityEnum, 
  roadDamageTypeEnum, 
  repairStatusEnum, 
  insertRoadDamageSchema 
} from "@/schema/road-damage-schema";
import { cn } from "@/lib/utils";

interface RoadDamageFormProps {
  projectId: number;
  userId?: number;
  onSuccess?: () => void;
  initialData?: any;
  isEdit?: boolean;
}

export function RoadDamageForm({ projectId, userId, onSuccess, initialData, isEdit = false }: RoadDamageFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [speechToTextResult, setSpeechToTextResult] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(insertRoadDamageSchema),
    defaultValues: {
      projectId: projectId,
      title: initialData?.title || "",
      description: initialData?.description || "",
      severity: initialData?.severity || undefined,
      damageType: initialData?.damageType || undefined,
      location: initialData?.location || "",
      coordinates: initialData?.coordinates || undefined,
      areaSize: initialData?.areaSize || undefined,
      repairStatus: initialData?.repairStatus || "offen",
      estimatedRepairCost: initialData?.estimatedRepairCost || undefined,
      repairDueDate: initialData?.repairDueDate ? new Date(initialData.repairDueDate) : undefined,
      repairPriority: initialData?.repairPriority || 5,
      imageUrl: initialData?.imageUrl || "",
      voiceNoteUrl: initialData?.voiceNoteUrl || "",
      createdBy: user?.id,
      assignedTo: initialData?.assignedTo || undefined,
    },
  });

  // Wenn Speech-to-Text-Ergebnis vorliegt, in die Beschreibung einfügen
  useEffect(() => {
    if (speechToTextResult) {
      const currentDescription = form.getValues("description") || "";
      form.setValue("description", currentDescription + " " + speechToTextResult);
    }
  }, [speechToTextResult, form]);

  // Mutation für das Erstellen eines neuen Straßenschadens
  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest("POST", "/api/road-damages", formData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Straßenschaden erfolgreich erstellt",
        description: "Der Straßenschaden wurde erfolgreich in die Datenbank eingetragen.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "road-damages"] });
      if (onSuccess) onSuccess();
      form.reset();
      setImagePreviewUrl("");
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Erstellen des Straßenschadens",
        description: error.message || "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    },
  });

  // Mutation für das Aktualisieren eines bestehenden Straßenschadens
  const updateMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest("PUT", `/api/road-damages/${initialData.id}`, formData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Straßenschaden aktualisiert",
        description: "Die Änderungen wurden erfolgreich gespeichert.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "road-damages"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Aktualisieren des Straßenschadens",
        description: error.message || "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    },
  });

  // Funktion zum Hochladen eines Bildes
  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await apiRequest("POST", "/api/road-damages/upload-image", formData, {
        headers: {
          // Keine Content-Type-Header hier setzen - wird automatisch von fetch für FormData gesetzt
        },
      });
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error("Fehler beim Hochladen des Bildes:", error);
      toast({
        title: "Fehler beim Hochladen des Bildes",
        description: "Das Bild konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Funktion zum Hochladen einer Audionotiz
  const handleSpeechResult = async (audioBlob: Blob, text: string) => {
    setSpeechToTextResult(text);
    
    const formData = new FormData();
    formData.append("audio", audioBlob, "speech.webm");

    try {
      const response = await apiRequest("POST", "/api/road-damages/upload-audio", formData, {
        headers: {
          // Keine Content-Type-Header hier setzen - wird automatisch von fetch für FormData gesetzt
        },
      });
      const data = await response.json();
      form.setValue("voiceNoteUrl", data.audioUrl);
    } catch (error) {
      console.error("Fehler beim Hochladen der Audionotiz:", error);
      toast({
        title: "Fehler beim Hochladen der Audionotiz",
        description: "Die Audionotiz konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Bild hochladen, falls vorhanden
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile);
        if (imageUrl) {
          data.imageUrl = imageUrl;
        }
      }

      // Speichern oder aktualisieren
      if (isEdit && initialData) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Fehler beim Speichern des Straßenschadens:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler für Bildauswahl
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Vorschau erstellen
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Projektreferenz (versteckt) */}
          <input type="hidden" {...form.register("projectId")} />
          
          {/* Titel */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titel *</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. Schlagloch Hauptstraße" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Beschreibung */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beschreibung</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detaillierte Beschreibung des Schadens"
                    {...field}
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
                <div className="mt-2">
                  <SpeechRecorder onResult={handleSpeechResult} />
                </div>
              </FormItem>
            )}
          />

          {/* Schadensschwere und -typ nebeneinander */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schweregrad</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bitte wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roadDamageSeverityEnum.map((severity) => (
                        <SelectItem key={severity} value={severity}>
                          {severity.charAt(0).toUpperCase() + severity.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="damageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schadenstyp</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bitte wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roadDamageTypeEnum.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Standort */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standort</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. Kreuzung Hauptstraße/Gartenweg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Größe und Priorität nebeneinander */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="areaSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Größe (m²)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="z.B. 2.5" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repairPriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorität (1-10)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max="10" 
                      step="1"
                      placeholder="z.B. 5" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>1 = niedrig, 10 = hoch</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Status und geschätzte Kosten nebeneinander */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="repairStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bitte wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {repairStatusEnum.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedRepairCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geschätzte Kosten (€)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="z.B. 1500.00" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Reparatur-Fälligkeitsdatum */}
          <FormField
            control={form.control}
            name="repairDueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fälligkeitsdatum für Reparatur</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: de })
                        ) : (
                          <span>Datum auswählen</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bildupload */}
          <FormItem>
            <FormLabel>Bild</FormLabel>
            <FormControl>
              <div className="space-y-2">
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="w-full cursor-pointer"
                />
                {(imagePreviewUrl || initialData?.imageUrl) && (
                  <div className="mt-2 border rounded-md overflow-hidden">
                    <img 
                      src={imagePreviewUrl || initialData?.imageUrl} 
                      alt="Vorschau" 
                      className="object-cover max-h-48 w-full"
                    />
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={loading || createMutation.isPending || updateMutation.isPending}
            >
              {(loading || createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Aktualisieren" : "Speichern"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}