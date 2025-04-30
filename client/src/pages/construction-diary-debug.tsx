import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileText, Trash, PenTool } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import DebugNavigation from "@/components/debug-navigation";

// Formular-Schema für das Bautagebuch
const constructionDiarySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datumsformat"),
  employee: z.string().min(1, "Mitarbeiter ist erforderlich"),
  activity: z.string().min(1, "Tätigkeit ist erforderlich"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Ungültiges Zeitformat"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Ungültiges Zeitformat"),
  workHours: z.string().min(1, "Arbeitsstunden sind erforderlich"),
  materialUsage: z.string().optional(),
  remarks: z.string().optional(),
  incidentType: z.enum(["none", "delay", "safety", "quality", "other"]).optional(),
});

type ConstructionDiaryForm = z.infer<typeof constructionDiarySchema>;

interface ConstructionDiary {
  id: number;
  projectId: number;
  date: string;
  employee: string;
  activity: string;
  startTime: string;
  endTime: string;
  workHours: number;
  materialUsage: string | null;
  remarks: string | null;
  incidentType: "none" | "delay" | "safety" | "quality" | "other" | null;
  createdAt: string;
  createdBy: number | null;
}

export default function ConstructionDiaryDebugPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ConstructionDiary | null>(null);
  const [projectId, setProjectId] = useState<number>(3); // Standardmäßig Projekt mit ID 3 (Weilheim)

  // Abrufen der Bautagebuch-Einträge
  const {
    data: diaryEntries,
    isLoading,
    error,
    refetch
  } = useQuery<ConstructionDiary[]>({
    queryKey: [`/api/projects/${projectId}/construction-diary`],
    enabled: !!projectId,
  });

  // Formular für neue Einträge
  const newEntryForm = useForm<ConstructionDiaryForm>({
    resolver: zodResolver(constructionDiarySchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      employee: "",
      activity: "",
      startTime: "08:00",
      endTime: "16:00",
      workHours: "8",
      materialUsage: "",
      remarks: "",
      incidentType: "none",
    },
  });

  // Formular für das Bearbeiten von Einträgen
  const editForm = useForm<ConstructionDiaryForm & { id: number }>({
    resolver: zodResolver(constructionDiarySchema.extend({ id: z.number() })),
    defaultValues: {
      id: 0,
      date: "",
      employee: "",
      activity: "",
      startTime: "",
      endTime: "",
      workHours: "",
      materialUsage: "",
      remarks: "",
      incidentType: "none",
    },
  });

  // Funktion zum Berechnen der Arbeitsstunden aus Start- und Endzeit
  const calculateWorkHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return "";

    try {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;

      // Falls die Endzeit vor der Startzeit liegt, nehmen wir an, dass es sich um einen 24-Stunden-Zeitraum handelt
      const diffMinutes = endTotalMinutes >= startTotalMinutes
        ? endTotalMinutes - startTotalMinutes
        : (24 * 60 - startTotalMinutes) + endTotalMinutes;

      const hours = diffMinutes / 60;
      return hours.toFixed(2);
    } catch (error) {
      console.error("Fehler bei der Berechnung der Arbeitsstunden:", error);
      return "";
    }
  };

  // Erstellen eines neuen Eintrags
  const createMutation = useMutation({
    mutationFn: async (data: ConstructionDiaryForm) => {
      const response = await apiRequest(
        "POST",
        `/api/projects/${projectId}/construction-diary`,
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/construction-diary`] });
      setIsNewEntryDialogOpen(false);
      toast({
        title: "Eintrag erstellt",
        description: "Der Bautagebuch-Eintrag wurde erfolgreich erstellt.",
      });
      newEntryForm.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        employee: "",
        activity: "",
        startTime: "08:00",
        endTime: "16:00",
        workHours: "8",
        materialUsage: "",
        remarks: "",
        incidentType: "none",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Der Eintrag konnte nicht erstellt werden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Aktualisieren eines Eintrags
  const updateMutation = useMutation({
    mutationFn: async (data: ConstructionDiaryForm & { id: number }) => {
      const { id, ...formData } = data;
      const response = await apiRequest(
        "PUT",
        `/api/projects/${projectId}/construction-diary/${id}`,
        formData
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/construction-diary`] });
      setIsEditDialogOpen(false);
      setSelectedEntry(null);
      toast({
        title: "Eintrag aktualisiert",
        description: "Der Bautagebuch-Eintrag wurde erfolgreich aktualisiert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Der Eintrag konnte nicht aktualisiert werden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Löschen eines Eintrags
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(
        "DELETE",
        `/api/projects/${projectId}/construction-diary/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/construction-diary`] });
      toast({
        title: "Eintrag gelöscht",
        description: "Der Bautagebuch-Eintrag wurde erfolgreich gelöscht.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Der Eintrag konnte nicht gelöscht werden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Bearbeiten eines Eintrags starten
  const handleEditEntry = (entry: ConstructionDiary) => {
    setSelectedEntry(entry);
    editForm.reset({
      id: entry.id,
      date: entry.date,
      employee: entry.employee,
      activity: entry.activity,
      startTime: entry.startTime,
      endTime: entry.endTime,
      workHours: entry.workHours.toString(),
      materialUsage: entry.materialUsage || "",
      remarks: entry.remarks || "",
      incidentType: entry.incidentType || "none",
    });
    setIsEditDialogOpen(true);
  };

  // Projektwechsel
  const handleProjectChange = (id: string) => {
    setProjectId(parseInt(id, 10));
  };

  // Rendern eines Badges für den Vorfallstyp
  const renderIncidentBadge = (incidentType: string | null) => {
    if (!incidentType || incidentType === "none") return null;

    const badgeStyles: Record<string, string> = {
      delay: "bg-amber-100 text-amber-800 border-amber-300",
      safety: "bg-red-100 text-red-800 border-red-300",
      quality: "bg-purple-100 text-purple-800 border-purple-300",
      other: "bg-blue-100 text-blue-800 border-blue-300",
    };

    const badgeLabels: Record<string, string> = {
      delay: "Verzögerung",
      safety: "Sicherheit",
      quality: "Qualität",
      other: "Sonstiges",
    };

    return (
      <Badge 
        variant="outline" 
        className={`${badgeStyles[incidentType]} py-1 px-2`}
      >
        {badgeLabels[incidentType]}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <DebugNavigation />
      
      <h1 className="text-3xl font-bold mb-2">Bautagebuch Debug</h1>
      <p className="text-muted-foreground mb-6">Verwalten Sie Bautagebuch-Einträge für ein Projekt.</p>

      {/* Projektauswahl */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Projekt auswählen</CardTitle>
          <CardDescription>Wählen Sie ein Projekt für das Bautagebuch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select 
              value={projectId.toString()} 
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Projekt wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Neubau B27</SelectItem>
                <SelectItem value="2">Brückensanierung A8</SelectItem>
                <SelectItem value="3">Weilheim</SelectItem>
                <SelectItem value="4">Anbindung Industriegebiet</SelectItem>
                <SelectItem value="5">Kreisverkehrsbau</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => refetch()}>Aktualisieren</Button>
          </div>
        </CardContent>
      </Card>

      {/* Hauptbereich */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Tagebucheinträge</h2>
          <Dialog open={isNewEntryDialogOpen} onOpenChange={setIsNewEntryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Neuer Eintrag
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Neuer Bautagebuch-Eintrag</DialogTitle>
                <DialogDescription>
                  Erstellen Sie einen neuen Eintrag für das Bautagebuch.
                </DialogDescription>
              </DialogHeader>
              <Form {...newEntryForm}>
                <form onSubmit={newEntryForm.handleSubmit((data) => createMutation.mutate(data))}>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    {/* Datum */}
                    <FormField
                      control={newEntryForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Datum</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Mitarbeiter */}
                    <FormField
                      control={newEntryForm.control}
                      name="employee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mitarbeiter</FormLabel>
                          <FormControl>
                            <Input placeholder="Name des Mitarbeiters" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Start- und Endzeit */}
                    <FormField
                      control={newEntryForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Startzeit</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                const endTime = newEntryForm.getValues("endTime");
                                if (endTime) {
                                  const workHours = calculateWorkHours(e.target.value, endTime);
                                  newEntryForm.setValue("workHours", workHours);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={newEntryForm.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endzeit</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                const startTime = newEntryForm.getValues("startTime");
                                if (startTime) {
                                  const workHours = calculateWorkHours(startTime, e.target.value);
                                  newEntryForm.setValue("workHours", workHours);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Arbeitsstunden */}
                    <FormField
                      control={newEntryForm.control}
                      name="workHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Arbeitsstunden</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Nur Zahlen mit maximal 2 Dezimalstellen erlauben
                                if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
                                  field.onChange(e);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Automatisch berechnet aus Start- und Endzeit
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Vorfallstyp */}
                    <FormField
                      control={newEntryForm.control}
                      name="incidentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vorfallstyp</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Vorfallstyp wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Keiner</SelectItem>
                              <SelectItem value="delay">Verzögerung</SelectItem>
                              <SelectItem value="safety">Sicherheitsvorfall</SelectItem>
                              <SelectItem value="quality">Qualitätsproblem</SelectItem>
                              <SelectItem value="other">Sonstiges</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Tätigkeit */}
                    <FormField
                      control={newEntryForm.control}
                      name="activity"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Tätigkeit</FormLabel>
                          <FormControl>
                            <Input placeholder="Durchgeführte Tätigkeit" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Materialverbrauch */}
                    <FormField
                      control={newEntryForm.control}
                      name="materialUsage"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Materialverbrauch</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Verwendete Materialien (optional)"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Bemerkungen */}
                    <FormField
                      control={newEntryForm.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Bemerkungen</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Zusätzliche Bemerkungen (optional)"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Speichern...
                        </>
                      ) : (
                        "Speichern"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Lade Einträge...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded">
            <p>Fehler beim Laden der Bautagebuch-Einträge.</p>
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        ) : !diaryEntries || diaryEntries.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-lg mb-1">Keine Einträge</h3>
            <p className="text-gray-500 mb-4">
              Für dieses Projekt wurden noch keine Bautagebuch-Einträge erstellt.
            </p>
            <Button variant="outline" onClick={() => setIsNewEntryDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Eintrag erstellen
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Tätigkeit</TableHead>
                <TableHead>Zeit</TableHead>
                <TableHead>Stunden</TableHead>
                <TableHead>Vorfall</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diaryEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {format(new Date(entry.date), "dd.MM.yyyy", { locale: de })}
                  </TableCell>
                  <TableCell>{entry.employee}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.activity}
                  </TableCell>
                  <TableCell>
                    {entry.startTime} - {entry.endTime}
                  </TableCell>
                  <TableCell>{entry.workHours}</TableCell>
                  <TableCell>{renderIncidentBadge(entry.incidentType)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditEntry(entry)}
                      >
                        <PenTool className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500"
                        onClick={() => deleteMutation.mutate(entry.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Bearbeitungsdialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bautagebuch-Eintrag bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Details des ausgewählten Eintrags.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate(data))}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  {/* Datum */}
                  <FormField
                    control={editForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Datum</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Mitarbeiter */}
                  <FormField
                    control={editForm.control}
                    name="employee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mitarbeiter</FormLabel>
                        <FormControl>
                          <Input placeholder="Name des Mitarbeiters" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Start- und Endzeit */}
                  <FormField
                    control={editForm.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Startzeit</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              const endTime = editForm.getValues("endTime");
                              if (endTime) {
                                const workHours = calculateWorkHours(e.target.value, endTime);
                                editForm.setValue("workHours", workHours);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endzeit</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              const startTime = editForm.getValues("startTime");
                              if (startTime) {
                                const workHours = calculateWorkHours(startTime, e.target.value);
                                editForm.setValue("workHours", workHours);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Arbeitsstunden */}
                  <FormField
                    control={editForm.control}
                    name="workHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arbeitsstunden</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Nur Zahlen mit maximal 2 Dezimalstellen erlauben
                              if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
                                field.onChange(e);
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Automatisch berechnet aus Start- und Endzeit
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Vorfallstyp */}
                  <FormField
                    control={editForm.control}
                    name="incidentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vorfallstyp</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vorfallstyp wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Keiner</SelectItem>
                            <SelectItem value="delay">Verzögerung</SelectItem>
                            <SelectItem value="safety">Sicherheitsvorfall</SelectItem>
                            <SelectItem value="quality">Qualitätsproblem</SelectItem>
                            <SelectItem value="other">Sonstiges</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Tätigkeit */}
                  <FormField
                    control={editForm.control}
                    name="activity"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Tätigkeit</FormLabel>
                        <FormControl>
                          <Input placeholder="Durchgeführte Tätigkeit" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Materialverbrauch */}
                  <FormField
                    control={editForm.control}
                    name="materialUsage"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Materialverbrauch</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Verwendete Materialien (optional)"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Bemerkungen */}
                  <FormField
                    control={editForm.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Bemerkungen</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Zusätzliche Bemerkungen (optional)"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Aktualisieren...
                      </>
                    ) : (
                      "Aktualisieren"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}