import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { 
  roadDamageTypeEnum, 
  damageSeverityEnum,
  insertRoadDamageSchema
} from "../../../shared/schema-road-damage";
import { SpeechRecorder } from "./speech-recorder";
import { useRoadDamages } from "@/hooks/use-road-damages";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

const damageSeverityLabels = {
  leicht: "Leicht - visuell erkennbar, keine sofortige Gefahr",
  mittel: "Mittel - deutliche Beeinträchtigung, mittelfristig zu reparieren",
  schwer: "Schwer - erhebliche Beeinträchtigung, zeitnah zu reparieren",
  kritisch: "Kritisch - unmittelbare Gefahr, sofortige Maßnahmen erforderlich",
};

const damageTypeLabels = {
  riss: "Riss - Einzelne Risse in der Fahrbahnoberfläche",
  schlagloch: "Schlagloch - Loch in der Fahrbahnoberfläche",
  netzriss: "Netzriss - Netzartige Rissbildung",
  verformung: "Verformung - Wellenbildung oder Absenkung",
  ausbruch: "Ausbruch - Ausgebrochene Teile der Fahrbahnoberfläche",
  abplatzung: "Abplatzung - Oberflächliche Materialablösungen",
  kantenschaden: "Kantenschaden - Beschädigung an Fahrbahnkanten",
  fugenausbruch: "Fugenausbruch - Beschädigung an Fugen",
  abnutzung: "Abnutzung - Oberflächenverschleiß",
  sonstiges: "Sonstiges - Andere Schadensarten",
};

// Create form schema based on road damage schema
const formSchema = insertRoadDamageSchema;

interface RoadDamageFormProps {
  projectId: number;
  userId: number;
  onSuccess?: () => void;
}

export function RoadDamageForm({ projectId, userId, onSuccess }: RoadDamageFormProps) {
  const [isSprachaufnahme, setIsSprachaufnahme] = useState(false);
  const { createRoadDamageMutation, speechRecognitionMutation } = useRoadDamages(projectId);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId,
      createdBy: userId,
      damageType: "sonstiges",
      severity: "mittel",
      description: "",
      position: "",
      recommendedAction: "",
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createRoadDamageMutation.mutateAsync(values);
      form.reset({
        projectId,
        createdBy: userId,
        damageType: "sonstiges",
        severity: "mittel",
        description: "",
        position: "",
        recommendedAction: "",
      });
      
      toast({
        title: "Straßenschaden erfasst",
        description: "Der Straßenschaden wurde erfolgreich gespeichert.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      toast({
        title: "Fehler beim Speichern",
        description: "Der Straßenschaden konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };
  
  const handleSpeechRecording = async (blob: Blob) => {
    try {
      const response = await speechRecognitionMutation.mutateAsync({
        audioBlob: blob,
        projectId,
        createdBy: userId,
      });
      
      toast({
        title: "Spracherkennung erfolgreich",
        description: "Die Sprachaufnahme wurde erfolgreich analysiert und der Straßenschaden gespeichert.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Fehler bei der Spracherkennung:", error);
      toast({
        title: "Fehler bei der Spracherkennung",
        description: "Die Sprachaufnahme konnte nicht verarbeitet werden.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Neuen Straßenschaden erfassen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Button
              type="button"
              variant={isSprachaufnahme ? "default" : "outline"}
              onClick={() => setIsSprachaufnahme(true)}
            >
              Sprachaufnahme
            </Button>
            <Button
              type="button"
              variant={!isSprachaufnahme ? "default" : "outline"}
              onClick={() => setIsSprachaufnahme(false)}
            >
              Formular
            </Button>
          </div>
          
          {isSprachaufnahme ? (
            <div className="mb-6">
              <div className="mb-4">
                <Label htmlFor="sprachhinweis">Sprachaufnahme</Label>
                <p className="text-sm text-gray-500 mb-4">
                  Beschreiben Sie den Straßenschaden mit Ihrer Stimme. Nennen Sie den Schadenstyp, 
                  die Schwere, die genaue Position und weitere Details. Die KI wird diese 
                  Informationen auswerten und automatisch als Straßenschaden erfassen.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Beispiel: "An der Kreuzung Hauptstraße/Bergweg befindet sich ein Schlagloch 
                  mit etwa 30 cm Durchmesser und 5 cm Tiefe. Der Schaden ist mittelgroß und 
                  stellt eine Gefahr für Radfahrer dar. Eine Reparatur sollte innerhalb der 
                  nächsten zwei Wochen erfolgen."
                </p>
              </div>
              
              <SpeechRecorder
                onRecordingComplete={handleSpeechRecording}
                isProcessing={speechRecognitionMutation.isPending}
              />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
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
                              <SelectValue placeholder="Schadenstyp auswählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.keys(damageTypeLabels).map((type) => (
                              <SelectItem key={type} value={type}>
                                {damageTypeLabels[type as keyof typeof damageTypeLabels]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Wählen Sie die Art des Straßenschadens aus.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                              <SelectValue placeholder="Schweregrad auswählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.keys(damageSeverityLabels).map((severity) => (
                              <SelectItem key={severity} value={severity}>
                                {damageSeverityLabels[severity as keyof typeof damageSeverityLabels]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Wie schwerwiegend ist der Schaden?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Kreuzung Hauptstraße/Bergweg" {...field} />
                      </FormControl>
                      <FormDescription>
                        Beschreiben Sie die genaue Position des Schadens
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detaillierte Beschreibung des Schadens"
                          className="resize-none min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Detaillierte Beschreibung des Schadens, inklusive Größe, Tiefe und andere relevante Eigenschaften.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="recommendedAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empfohlene Maßnahme</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Empfohlene Reparaturmaßnahmen"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optionale Beschreibung der empfohlenen Reparaturmaßnahmen und Dringlichkeit.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  disabled={createRoadDamageMutation.isPending}
                  className="w-full"
                >
                  {createRoadDamageMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Straßenschaden speichern
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}