import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InsertBedarfKapa, BedarfKapa } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Column } from '@/components/ui/data-table-types';

const bedarfTypes = [
  'Tiefbau',
  'HSA Tiefbau', 
  'NVT Montage', 
  'Endmontage NE3', 
  'Bauleiter', 
  'Sonstiges'
];

// Hilfsfunktion für die Generierung von Kalenderwochen
const generateWeeks = () => {
  const weeks = [];
  for (let i = 1; i <= 53; i++) {
    weeks.push(i);
  }
  return weeks;
};

// Jahre generieren (aktuelles Jahr + 3 Jahre in die Zukunft)
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 4; i++) {
    years.push(currentYear + i);
  }
  return years;
};

const weeks = generateWeeks();
const years = generateYears();

// Erweitertes Schema für Kalenderwochenplanung
const formSchema = z.object({
  bedarfKapaName: z.string().min(1, 'Bitte wählen Sie einen Typ aus'),
  bedarfKapaAnzahl: z.coerce.number().min(1, 'Bitte geben Sie eine Anzahl ein'),
  kalenderwoche: z.coerce.number().min(1).max(53).default(1),
  jahr: z.coerce.number().min(2020).default(new Date().getFullYear()),
});

interface CapacitySectionProps {
  projectId: number;
}

export function CapacitySection({ projectId }: CapacitySectionProps) {
  const { toast } = useToast();
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Fetch BedarfKapa data for the current project
  const { data: bedarfKapas, isLoading } = useQuery<BedarfKapa[]>({
    queryKey: [`/api/projects/${projectId}/bedarfkapa`],
    enabled: !!projectId
  });
  
  // Separate effect für Debug-Logs
  React.useEffect(() => {
    if (bedarfKapas) {
      console.log('Fetched BedarfKapa data:', bedarfKapas);
    }
  }, [bedarfKapas]);
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bedarfKapaName: '',
      bedarfKapaAnzahl: 1,
      kalenderwoche: 1,
      jahr: new Date().getFullYear(),
    },
  });
  
  // Add bedarfKapa mutation
  const addMutation = useMutation({
    mutationFn: async (data: Omit<InsertBedarfKapa, 'projectId'>) => {
      const res = await apiRequest('POST', `/api/projects/${projectId}/bedarfkapa`, {
        ...data,
        projectId,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Erfolg',
        description: 'Bedarf/Kapazität wurde hinzugefügt',
      });
      setIsAddingNew(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bedarfkapa`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Hinzufügen: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Delete bedarfKapa mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/projects/${projectId}/bedarfkapa/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Erfolg',
        description: 'Bedarf/Kapazität wurde gelöscht',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bedarfkapa`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Löschen: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    addMutation.mutate(data);
  };
  
  // Handle delete
  const handleDelete = (bedarfKapa: BedarfKapa) => {
    if (confirm(`Möchten Sie wirklich '${bedarfKapa.bedarfKapaName}' löschen?`)) {
      deleteMutation.mutate(bedarfKapa.id);
    }
  };
  
  // Table columns mit korrekten Typangaben
  const columns: Column<BedarfKapa>[] = [
    {
      header: 'Typ',
      accessorKey: 'bedarfKapaName',
      cell: (value: any, row: BedarfKapa) => {
        // Für die Debugging-Zwecke das volle Objekt in der Konsole ausgeben
        console.log('Row data:', row);
        return row.bedarfKapaName || '-';
      }
    },
    {
      header: 'Anzahl Teams',
      accessorKey: 'bedarfKapaAnzahl',
      cell: (value: any, row: BedarfKapa) => {
        return row.bedarfKapaAnzahl?.toString() || '-';
      }
    },
    {
      header: 'Kalenderwoche',
      accessorKey: 'kalenderwoche',
      cell: (value: any, row: BedarfKapa) => {
        return row.kalenderwoche ? `KW ${row.kalenderwoche}` : '-';
      }
    },
    {
      header: 'Jahr',
      accessorKey: 'jahr',
      cell: (value: any, row: BedarfKapa) => {
        return row.jahr?.toString() || '-';
      }
    },
    {
      header: 'Erstellt am',
      accessorKey: 'createdAt',
      cell: (value: any, row: BedarfKapa) => {
        return row.createdAt ? new Date(row.createdAt.toString()).toLocaleDateString() : '-';
      }
    },
  ];
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Bedarf & Kapazitäten</h2>
      
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>Neuen Bedarf/Kapazität hinzufügen</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="bedarfKapaName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Typ auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bedarfTypes.map(type => (
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bedarfKapaAnzahl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anzahl Teams</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="kalenderwoche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kalenderwoche</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="KW auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weeks.map(week => (
                            <SelectItem key={week} value={week.toString()}>
                              KW {week}
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
                  name="jahr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jahr</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Jahr auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={addMutation.isPending}
              >
                {addMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !bedarfKapas || bedarfKapas.length === 0 ? (
        <div className="text-center py-4 px-4 bg-white border rounded-md shadow-sm mt-4">
          <p className="text-muted-foreground">
            Keine Einträge vorhanden. Bitte fügen Sie oben einen neuen Bedarf hinzu.
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-md shadow-sm overflow-hidden mt-4">
          <div className="p-4">
            <h3 className="text-lg font-medium mb-2">Vorhandene Bedarfe/Kapazitäten</h3>
            <DataTable
              data={bedarfKapas}
              columns={columns}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}
    </div>
  );
}