import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Person, Company, Customer, insertPersonSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

// Erweitern des Zod-Schemas für die Validierung
const formSchema = insertPersonSchema
  .extend({
    firstname: z.string().min(1, "Vorname ist erforderlich"),
    lastname: z.string().min(1, "Nachname ist erforderlich"),
  })
  .transform((data) => {
    return {
      ...data,
      companyId: data.companyId ? Number(data.companyId) : undefined,
      personId: data.personId ? Number(data.personId) : undefined,
      projectId: data.projectId ? Number(data.projectId) : undefined,
      professionalName: data.professionalName ? Number(data.professionalName) : undefined,
    };
  });

interface PersonFormProps {
  person?: Person | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PersonForm({ person, onSuccess, onCancel }: PersonFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch companies for dropdown
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Fetch customers for dropdown (für die Erweiterung mit Kundenauswahl)
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    staleTime: 1000 * 60, // 1 minute
  });

  // Form defaultValues
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: person?.id,
      personId: person?.personId || undefined,
      projectId: person?.projectId || undefined,
      companyId: person?.companyId || undefined,
      professionalName: person?.professionalName || undefined,
      firstname: person?.firstname || "",
      lastname: person?.lastname || "",
    },
  });

  // Update form values when person changes
  useEffect(() => {
    if (person) {
      form.reset({
        id: person.id,
        personId: person.personId || undefined,
        projectId: person.projectId || undefined,
        companyId: person.companyId || undefined,
        professionalName: person.professionalName || undefined,
        firstname: person.firstname || "",
        lastname: person.lastname || "",
      });
    }
  }, [person, form]);

  // Mutations
  const createPersonMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/persons", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: "Person wurde erfolgreich erstellt",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/persons"] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Erstellen der Person: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updatePersonMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("PUT", `/api/persons/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: "Person wurde erfolgreich aktualisiert",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/persons"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren der Person: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (person) {
      updatePersonMutation.mutate(values);
    } else {
      createPersonMutation.mutate(values);
    }
  };
  
  const isPending = createPersonMutation.isPending || updatePersonMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-4"><span className="mr-2">👤</span> Beteiligte</h3>
              
              {/* Personendaten */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorname</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Vorname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nachname</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nachname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Kunde Auswahl */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kunde</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kunde auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Keiner</SelectItem>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.firstName} {customer.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Firma Auswahl */}
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Firma</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Firma auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Keine</SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Versteckte IDs */}
              <div className="hidden">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="personId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="professionalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Berufsbezeichnung ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            type="button"
            disabled={isPending}
          >
            Abbrechen
          </Button>
          <Button 
            type="submit" 
            disabled={isPending}
          >
            {person ? "Aktualisieren" : "Speichern"}
          </Button>
        </div>
      </form>
    </Form>
  );
}