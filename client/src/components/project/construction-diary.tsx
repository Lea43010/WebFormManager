import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ConstructionDiary,
  ConstructionDiaryEmployee,
  insertConstructionDiarySchema,
  insertConstructionDiaryEmployeeSchema,
  BedarfKapa,
  incidentTypeEnum
} from "@shared/schema";
import { Loader2, Plus, FileText, Download, Trash, PenTool, Users, UserPlus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Validierungsschema für das Bautagebuch-Formular
const constructionDiaryFormSchema = z.object({
  date: z.string().min(1, { message: "Bitte geben Sie ein Datum ein" }),
  employee: z.string().min(1, { message: "Bitte geben Sie einen Mitarbeiter an" }),
  activity: z.string().min(1, { message: "Bitte beschreiben Sie die Tätigkeit" }),
  startTime: z.string().min(1, { message: "Bitte geben Sie eine Startzeit ein" }),
  endTime: z.string().min(1, { message: "Bitte geben Sie eine Endzeit ein" }),
  workHours: z.string().min(1, { message: "Bitte geben Sie die Arbeitsstunden ein" }),
  materialUsage: z.string().optional(),
  remarks: z.string().optional(),
  incidentType: z.enum(['Arbeitsunfälle', 'Sicherheitsvorkommnisse', 'Schäden', 'Verluste', 'Beschwerden', 'Sonstiges']).optional(),
});

type ConstructionDiaryFormValues = z.infer<typeof constructionDiaryFormSchema>;

interface ConstructionDiaryProps {
  projectId: number;
}

export function ConstructionDiarySection({ projectId }: ConstructionDiaryProps) {
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ConstructionDiary | null>(null);
  const [diaryEmployees, setDiaryEmployees] = useState<ConstructionDiaryEmployee[]>([]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ firstName: "", lastName: "", position: "" });
  const queryClient = useQueryClient();

  // Abrufen der Bautagebuch-Einträge
  const {
    data: diaryEntries,
    isLoading,
    error,
  } = useQuery<ConstructionDiary[]>({
    queryKey: [`/api/projects/${projectId}/construction-diary`],
    enabled: !!projectId,
  });

  // Erstellen eines neuen Eintrags
  const createMutation = useMutation({
    mutationFn: async (data: ConstructionDiaryFormValues) => {
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
    mutationFn: async (data: ConstructionDiaryFormValues & { id: number }) => {
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

  // Abrufen der verfügbaren Mitarbeiter aus BedarfKapa
  const { data: bedarfKapaEntries } = useQuery<BedarfKapa[]>({
    queryKey: [`/api/projects/${projectId}/bedarfkapa`],
    enabled: !!projectId,
  });
  
  // Abrufen der Mitarbeiter eines Bautagebuch-Eintrags
  const fetchDiaryEmployees = async (diaryId: number) => {
    try {
      const response = await apiRequest(
        "GET",
        `/api/construction-diary/${diaryId}/employees`
      );
      const employees = await response.json();
      setDiaryEmployees(employees);
    } catch (error) {
      console.error("Fehler beim Abrufen der Mitarbeiter:", error);
      toast({
        title: "Fehler",
        description: "Die Mitarbeiter konnten nicht abgerufen werden.",
        variant: "destructive",
      });
    }
  };
  
  // Hinzufügen eines neuen Mitarbeiters
  const addEmployee = async () => {
    if (!selectedEntry) return;
    
    try {
      const response = await apiRequest(
        "POST",
        `/api/construction-diary/${selectedEntry.id}/employees`,
        newEmployee
      );
      const createdEmployee = await response.json();
      setDiaryEmployees([...diaryEmployees, createdEmployee]);
      setNewEmployee({ firstName: "", lastName: "", position: "" });
      setShowEmployeeForm(false);
      
      toast({
        title: "Mitarbeiter hinzugefügt",
        description: "Der Mitarbeiter wurde erfolgreich zum Bautagebuch-Eintrag hinzugefügt."
      });
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Mitarbeiters:", error);
      toast({
        title: "Fehler",
        description: "Der Mitarbeiter konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    }
  };
  
  // Löschen eines Mitarbeiters
  const removeEmployee = async (employeeId: number) => {
    if (!selectedEntry) return;
    
    try {
      await apiRequest(
        "DELETE",
        `/api/construction-diary/${selectedEntry.id}/employees/${employeeId}`
      );
      
      setDiaryEmployees(diaryEmployees.filter(emp => emp.id !== employeeId));
      
      toast({
        title: "Mitarbeiter entfernt",
        description: "Der Mitarbeiter wurde erfolgreich aus dem Bautagebuch-Eintrag entfernt."
      });
    } catch (error) {
      console.error("Fehler beim Entfernen des Mitarbeiters:", error);
      toast({
        title: "Fehler",
        description: "Der Mitarbeiter konnte nicht entfernt werden.",
        variant: "destructive",
      });
    }
  };

  // Formular für neue Einträge
  const newEntryForm = useForm<ConstructionDiaryFormValues>({
    resolver: zodResolver(constructionDiaryFormSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      employee: "",
      activity: "",
      startTime: "08:00",
      endTime: "16:00",
      workHours: "8",
      materialUsage: "",
      remarks: "",
      incidentType: undefined,
    },
  });

  // Formular für das Bearbeiten von Einträgen
  const editForm = useForm<ConstructionDiaryFormValues & { id: number }>({
    resolver: zodResolver(constructionDiaryFormSchema.extend({ id: z.number() })),
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
      incidentType: undefined,
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

      // Wenn Endzeit vor Startzeit liegt, gehe von einem 24-Stunden-Format aus
      const diffMinutes = endTotalMinutes >= startTotalMinutes
        ? endTotalMinutes - startTotalMinutes
        : (24 * 60 - startTotalMinutes) + endTotalMinutes;

      const hours = diffMinutes / 60;
      return hours.toFixed(2);
    } catch (error) {
      return "";
    }
  };

  // Handler für das Erstellen eines neuen Eintrags
  const handleCreateEntry = (data: ConstructionDiaryFormValues) => {
    createMutation.mutate(data);
  };

  // Handler für das Aktualisieren eines Eintrags
  const handleUpdateEntry = (data: ConstructionDiaryFormValues & { id: number }) => {
    updateMutation.mutate(data);
  };

  // Handler für das Löschen eines Eintrags
  const handleDeleteEntry = (id: number) => {
    if (window.confirm("Möchten Sie diesen Eintrag wirklich löschen?")) {
      deleteMutation.mutate(id);
    }
  };

  // Handler für das Öffnen des Bearbeitungsdialogs
  const handleEditEntry = async (entry: ConstructionDiary) => {
    setSelectedEntry(entry);
    
    // Daten für das Formular setzen
    editForm.reset({
      id: entry.id,
      date: format(new Date(entry.date), "yyyy-MM-dd"),
      employee: entry.employee,
      activity: entry.activity,
      startTime: entry.startTime,
      endTime: entry.endTime,
      workHours: entry.workHours.toString(),
      materialUsage: entry.materialUsage || "",
      remarks: entry.remarks || "",
      incidentType: entry.incidentType || undefined,
    });
    
    // Mitarbeiter für diesen Eintrag abrufen
    await fetchDiaryEmployees(entry.id);
    
    // Dialog öffnen
    setIsEditDialogOpen(true);
  };

  // Handler für Startzeit-Änderung (automatische Berechnung der Arbeitsstunden)
  newEntryForm.watch((data, { name }) => {
    if (name === "startTime" || name === "endTime") {
      const startTime = data.startTime;
      const endTime = data.endTime;
      if (startTime && endTime) {
        const workHours = calculateWorkHours(startTime, endTime);
        if (workHours) {
          newEntryForm.setValue("workHours", workHours);
        }
      }
    }
  });

  // Handler für Startzeit-Änderung im Bearbeitungsformular
  editForm.watch((data, { name }) => {
    if (name === "startTime" || name === "endTime") {
      const startTime = data.startTime;
      const endTime = data.endTime;
      if (startTime && endTime) {
        const workHours = calculateWorkHours(startTime, endTime);
        if (workHours) {
          editForm.setValue("workHours", workHours);
        }
      }
    }
  });

  // Export-Funktionen (Hinweis: Hier könnten später komplexere Export-Logiken implementiert werden)
  const handleExportPDF = () => {
    toast({
      title: "PDF Export",
      description: "Der PDF-Export für das Bautagebuch wird vorbereitet...",
    });
    // Implementierung der PDF-Export-Logik kann später ergänzt werden
  };

  const handleExportExcel = () => {
    toast({
      title: "Excel Export",
      description: "Der Excel-Export für das Bautagebuch wird vorbereitet...",
    });
    // Implementierung der Excel-Export-Logik kann später ergänzt werden
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-36">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        <p>Fehler beim Laden der Bautagebuch-Einträge.</p>
        <p className="text-sm">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bautagebuch</h2>
          <p className="text-muted-foreground">
            Dokumentation der täglichen Bauarbeiten und Fortschritte
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            PDF Export
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Excel Export
          </Button>
          <Dialog open={isNewEntryDialogOpen} onOpenChange={setIsNewEntryDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Neuer Eintrag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neuer Bautagebuch-Eintrag</DialogTitle>
                <DialogDescription>
                  Erfassen Sie hier die Informationen für den heutigen Tag.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...newEntryForm}>
                <form onSubmit={newEntryForm.handleSubmit(handleCreateEntry)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    <FormField
                      control={newEntryForm.control}
                      name="employee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mitarbeiter</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Mitarbeiter auswählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bedarfKapaEntries && bedarfKapaEntries.length > 0 ? (
                                <>
                                  {/* Einzigartige Mitarbeitertypen extrahieren */}
                                  {Array.from(new Set(bedarfKapaEntries.map(entry => entry.bedarfKapaName))).map((employeeType) => (
                                    <SelectItem key={employeeType} value={employeeType}>
                                      {employeeType}
                                    </SelectItem>
                                  ))}
                                </>
                              ) : (
                                <SelectItem value="Keine Mitarbeiter" disabled>
                                  Keine Mitarbeiter verfügbar
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Wählen Sie aus den in Bedarf/Kapazität definierten Mitarbeitertypen
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={newEntryForm.control}
                    name="activity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tätigkeit</FormLabel>
                        <FormControl>
                          <Input placeholder="Beschreibung der durchgeführten Tätigkeiten" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={newEntryForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Startzeit</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
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
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newEntryForm.control}
                      name="workHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Arbeitsstunden</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>
                            Automatisch berechnet
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={newEntryForm.control}
                    name="materialUsage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Materialverbrauch</FormLabel>
                        <FormControl>
                          <Input placeholder="Verwendete Materialien und Mengen" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={newEntryForm.control}
                    name="incidentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sonstige Vorkommnisse</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Art des Vorkommnisses auswählen (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Arbeitsunfälle">Arbeitsunfälle</SelectItem>
                            <SelectItem value="Sicherheitsvorkommnisse">Sicherheitsvorkommnisse</SelectItem>
                            <SelectItem value="Schäden">Schäden / Verluste</SelectItem>
                            <SelectItem value="Verluste">Verluste</SelectItem>
                            <SelectItem value="Beschwerden">Beschwerden (Anlieger, Kunde)</SelectItem>
                            <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Wählen Sie die Art des Vorkommnisses, wenn eines aufgetreten ist
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={newEntryForm.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bemerkungen</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Zusätzliche Hinweise, Probleme oder Beobachtungen" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Abbrechen</Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Eintrag speichern
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bearbeitungsdialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bautagebuch-Eintrag bearbeiten</DialogTitle>
            <DialogDescription>
              Aktualisieren Sie die Informationen für diesen Eintrag.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateEntry)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <FormField
                  control={editForm.control}
                  name="employee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mitarbeiter</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Mitarbeiter auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bedarfKapaEntries && bedarfKapaEntries.length > 0 ? (
                            <>
                              {/* Einzigartige Mitarbeitertypen extrahieren */}
                              {Array.from(new Set(bedarfKapaEntries.map(entry => entry.bedarfKapaName))).map((employeeType) => (
                                <SelectItem key={employeeType} value={employeeType}>
                                  {employeeType}
                                </SelectItem>
                              ))}
                            </>
                          ) : (
                            <SelectItem value="Keine Mitarbeiter" disabled>
                              Keine Mitarbeiter verfügbar
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Wählen Sie aus den in Bedarf/Kapazität definierten Mitarbeitertypen
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="activity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tätigkeit</FormLabel>
                    <FormControl>
                      <Input placeholder="Beschreibung der durchgeführten Tätigkeiten" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Startzeit</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
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
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="workHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arbeitsstunden</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription>
                        Automatisch berechnet
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="materialUsage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materialverbrauch</FormLabel>
                    <FormControl>
                      <Input placeholder="Verwendete Materialien und Mengen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="incidentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sonstige Vorkommnisse</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Art des Vorkommnisses auswählen (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Arbeitsunfälle">Arbeitsunfälle</SelectItem>
                        <SelectItem value="Sicherheitsvorkommnisse">Sicherheitsvorkommnisse</SelectItem>
                        <SelectItem value="Schäden">Schäden / Verluste</SelectItem>
                        <SelectItem value="Verluste">Verluste</SelectItem>
                        <SelectItem value="Beschwerden">Beschwerden (Anlieger, Kunde)</SelectItem>
                        <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Wählen Sie die Art des Vorkommnisses, wenn eines aufgetreten ist
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bemerkungen</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Zusätzliche Hinweise, Probleme oder Beobachtungen" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <input type="hidden" {...editForm.register("id")} />
              
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Abbrechen</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Änderungen speichern
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Tabellarische Übersicht der Bautagebuch-Einträge */}
      {diaryEntries && diaryEntries.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableCaption>Alle Bautagebuch-Einträge für dieses Projekt</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Tätigkeit</TableHead>
                <TableHead>Arbeitszeit</TableHead>
                <TableHead>Stunden</TableHead>
                <TableHead>Materialien</TableHead>
                <TableHead>Vorkommnisse</TableHead>
                <TableHead className="w-[100px]">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diaryEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {format(new Date(entry.date), "dd.MM.yyyy", { locale: de })}
                  </TableCell>
                  <TableCell>{entry.employee}</TableCell>
                  <TableCell>{entry.activity}</TableCell>
                  <TableCell>
                    {entry.startTime} - {entry.endTime} Uhr
                  </TableCell>
                  <TableCell>{entry.workHours}</TableCell>
                  <TableCell>{entry.materialUsage || "-"}</TableCell>
                  <TableCell>
                    {entry.incidentType ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300">
                        {entry.incidentType}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditEntry(entry)}
                      >
                        <PenTool className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="mb-2 text-lg font-medium">Keine Bautagebuch-Einträge vorhanden</p>
            <p className="text-muted-foreground">
              Erstellen Sie einen neuen Eintrag, um die täglichen Aktivitäten zu dokumentieren.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}