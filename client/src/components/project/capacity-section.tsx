import { useState } from 'react';
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

const formSchema = z.object({
  bedarfKapaName: z.string().min(1, 'Bitte wählen Sie einen Typ aus'),
  bedarfKapaAnzahl: z.coerce.number().min(1, 'Bitte geben Sie eine Anzahl ein'),
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
    enabled: !!projectId,
  });
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bedarfKapaName: '',
      bedarfKapaAnzahl: 1,
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
    },
    {
      header: 'Anzahl',
      accessorKey: 'bedarfKapaAnzahl',
    },
    {
      header: 'Erstellt am',
      accessorKey: 'createdAt',
      cell: (value: any, row: BedarfKapa) => {
        return value ? new Date(value.toString()).toLocaleDateString() : '-';
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
              
              <FormField
                control={form.control}
                name="bedarfKapaAnzahl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anzahl</FormLabel>
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