import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Calendar 
} from "@/components/ui/calendar";
import * as z from "zod";

interface PermissionSectionProps {
  projectId: number;
}

interface Permission {
  id: number;
  projectId: number;
  permissionType: string;
  permissionDate: string | null;
  permissionAuthority: string;
  permissionNotes: string | null;
  createdAt: string;
}

const permissionFormSchema = z.object({
  permissionType: z.string().min(1, { message: "Bitte geben Sie den Typ der Genehmigung an" }),
  permissionAuthority: z.string().min(1, { message: "Bitte geben Sie die Genehmigungsbehörde an" }),
  permissionDate: z.date().nullable(),
  permissionNotes: z.string().nullable(),
});

type PermissionFormValues = z.infer<typeof permissionFormSchema>;

export default function PermissionSection({ projectId }: PermissionSectionProps) {
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);
  const { toast } = useToast();

  // Abrufen der Genehmigungen für dieses Projekt
  const { data: permissions, isLoading, isError } = useQuery({
    queryKey: ["/api/projects", projectId, "permissions"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/permissions`);
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Genehmigungen");
      }
      return response.json();
    }
  });

  // Hinzufügen einer neuen Genehmigung
  const addPermissionMutation = useMutation({
    mutationFn: async (data: PermissionFormValues) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/permissions`, data);
      if (!response.ok) {
        throw new Error("Fehler beim Hinzufügen der Genehmigung");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Genehmigung hinzugefügt",
        description: "Die Genehmigung wurde erfolgreich hinzugefügt.",
      });
      setIsAddPermissionOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "permissions"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Hinzufügen der Genehmigung: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Löschen einer Genehmigung
  const deletePermissionMutation = useMutation({
    mutationFn: async (permissionId: number) => {
      const response = await apiRequest("DELETE", `/api/permissions/${permissionId}`);
      if (!response.ok) {
        throw new Error("Fehler beim Löschen der Genehmigung");
      }
    },
    onSuccess: () => {
      toast({
        title: "Genehmigung gelöscht",
        description: "Die Genehmigung wurde erfolgreich gelöscht.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "permissions"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen der Genehmigung: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Formular für neue Genehmigungen
  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      permissionType: "",
      permissionAuthority: "",
      permissionDate: null,
      permissionNotes: "",
    },
  });

  // Formular zurücksetzen, wenn Dialog geöffnet wird
  useEffect(() => {
    if (isAddPermissionOpen) {
      form.reset();
    }
  }, [isAddPermissionOpen, form]);

  // Neue Genehmigung hinzufügen
  const onSubmit = (data: PermissionFormValues) => {
    addPermissionMutation.mutate(data);
  };

  // Genehmigung löschen
  const handleDeletePermission = (permissionId: number) => {
    if (confirm("Möchten Sie diese Genehmigung wirklich löschen?")) {
      deletePermissionMutation.mutate(permissionId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Genehmigungen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Fehler beim Laden der Genehmigungen.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Genehmigungen</span>
          <Dialog open={isAddPermissionOpen} onOpenChange={setIsAddPermissionOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Genehmigung hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Neue Genehmigung</DialogTitle>
                <DialogDescription>
                  Tragen Sie die Details der Genehmigung ein.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="permissionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Typ der Genehmigung*</FormLabel>
                          <FormControl>
                            <Input placeholder="z.B. Baugenehmigung" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="permissionAuthority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Genehmigungsbehörde*</FormLabel>
                          <FormControl>
                            <Input placeholder="z.B. Bauamt" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="permissionDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Datum der Genehmigung</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
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
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                locale={de}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="permissionNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anmerkungen</FormLabel>
                          <FormControl>
                            <Input placeholder="Optionale Notizen" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter className="mt-4">
                    <div className="flex gap-3 justify-end w-full">
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Abbrechen
                        </Button>
                      </DialogClose>
                      <Button 
                        type="submit" 
                        disabled={addPermissionMutation.isPending}
                      >
                        {addPermissionMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Genehmigung speichern
                      </Button>
                    </div>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Genehmigungen und Zulassungen für dieses Projekt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {permissions && permissions.length > 0 ? (
          <div className="space-y-4">
            {permissions.map((permission: Permission) => (
              <Card key={permission.id} className="shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{permission.permissionType}</p>
                      <p className="text-sm text-muted-foreground">Behörde: {permission.permissionAuthority}</p>
                      {permission.permissionDate && (
                        <p className="text-sm text-muted-foreground">
                          Datum: {new Date(permission.permissionDate).toLocaleDateString('de-DE')}
                        </p>
                      )}
                      {permission.permissionNotes && (
                        <p className="text-sm text-muted-foreground mt-1">{permission.permissionNotes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePermission(permission.id)}
                      disabled={deletePermissionMutation.isPending}
                    >
                      {deletePermissionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Keine Genehmigungen vorhanden. Fügen Sie mit dem Plus-Button oben rechts eine Genehmigung hinzu.
          </p>
        )}
      </CardContent>
    </Card>
  );
}