import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { BedarfKapa } from "@shared/schema";

const bedarfKapaTypes = [
  "Tiefbau", 
  "HSA Tiefbau", 
  "NVT Montage", 
  "Endmontage NE3", 
  "Bauleiter", 
  "Sonstiges"
];

// Schema für die Eingabevalidierung
const bedarfKapaSchema = z.object({
  bedarfKapaName: z.string().min(1, { message: "Bitte Typ auswählen" }),
  bedarfKapaAnzahl: z.string().min(1, { message: "Anzahl eingeben" }).refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, 
    { message: "Anzahl muss eine positive Zahl sein" }
  ),
});

type BedarfKapaFormData = z.infer<typeof bedarfKapaSchema>;

export function CapacitySection({ projectId }: { projectId: number }) {
  const { toast } = useToast();
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Formular-Setup
  const form = useForm<BedarfKapaFormData>({
    resolver: zodResolver(bedarfKapaSchema),
    defaultValues: {
      bedarfKapaName: "",
      bedarfKapaAnzahl: "",
    },
  });

  // Bedarf/Kapazitäten aus der Datenbank laden
  const { data: bedarfKapas, isLoading: isLoadingBedarfKapas } = useQuery<BedarfKapa[]>({
    queryKey: ['/api/projects', projectId, 'bedarfKapa'],
    enabled: !!projectId,
  });

  // Mutation zum Speichern neuer Bedarfe/Kapazitäten
  const createMutation = useMutation({
    mutationFn: async (data: BedarfKapaFormData) => {
      const res = await apiRequest('POST', `/api/projects/${projectId}/bedarfKapa`, {
        ...data,
        projectId,
        bedarfKapaAnzahl: parseInt(data.bedarfKapaAnzahl),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'bedarfKapa'] });
      form.reset();
      setIsAddingNew(false);
      toast({
        title: "Bedarf/Kapazität gespeichert",
        description: "Die Bedarf/Kapazität wurde erfolgreich gespeichert",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Die Bedarf/Kapazität konnte nicht gespeichert werden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation zum Löschen von Bedarfen/Kapazitäten
  const deleteMutation = useMutation({
    mutationFn: async (bedarfKapaId: number) => {
      await apiRequest('DELETE', `/api/projects/${projectId}/bedarfKapa/${bedarfKapaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'bedarfKapa'] });
      toast({
        title: "Bedarf/Kapazität gelöscht",
        description: "Die Bedarf/Kapazität wurde erfolgreich gelöscht",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Die Bedarf/Kapazität konnte nicht gelöscht werden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Formular absenden
  const onSubmit = (data: BedarfKapaFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bedarf/Kapazitäten</span>
          {!isAddingNew && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNew(true)}
              disabled={isAddingNew}
            >
              <Plus className="mr-2 h-4 w-4" />
              Neu hinzufügen
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingBedarfKapas ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Aktuelle Bedarfe/Kapazitäten anzeigen */}
            {bedarfKapas && bedarfKapas.length > 0 ? (
              <div className="space-y-2 mb-4">
                <div className="grid grid-cols-5 gap-2 font-medium text-sm text-muted-foreground">
                  <div className="col-span-2">Art</div>
                  <div className="col-span-2">Anzahl</div>
                  <div className="col-span-1"></div>
                </div>
                {bedarfKapas.map((item) => (
                  <div key={item.id} className="grid grid-cols-5 gap-2 items-center border-b pb-2">
                    <div className="col-span-2">{item.bedarfKapaName}</div>
                    <div className="col-span-2">{item.bedarfKapaAnzahl}</div>
                    <div className="col-span-1 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : !isAddingNew ? (
              <div className="text-center py-4 text-muted-foreground">
                Keine Bedarfe/Kapazitäten angelegt. Klicken Sie auf "Neu hinzufügen".
              </div>
            ) : null}

            {/* Formular für neuen Bedarf/Kapazität */}
            {isAddingNew && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bedarfKapaName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Art</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Bitte wählen..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bedarfKapaTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
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
                      name="bedarfKapaAnzahl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anzahl</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingNew(false)}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Speichern
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}