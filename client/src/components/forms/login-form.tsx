import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

// Validierungsschema für das Login-Formular
const loginSchema = z.object({
  username: z.string().min(3, 'Benutzername muss mindestens 3 Zeichen haben'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
});

// Typ für die Login-Daten
type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Formular-Hook initialisieren
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  // Status für den Ladezustand
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Absenden des Formulars
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/login', data);
      const user = await response.json();
      
      // Benutzer in den Cache setzen
      queryClient.setQueryData(['/api/user'], user);
      
      toast({
        title: 'Erfolgreich angemeldet',
        description: `Willkommen zurück, ${user.username}!`,
      });
      
      // Weiterleitung zum Dashboard
      setLocation('/');
    } catch (error: any) {
      toast({
        title: 'Fehler bei der Anmeldung',
        description: error.message || 'Bitte überprüfen Sie Ihre Anmeldedaten',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold mb-6 text-center">Anmelden</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Benutzername</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Benutzername eingeben" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passwort</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Passwort eingeben" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Anmelden...
              </>
            ) : (
              'Anmelden'
            )}
          </Button>
        </form>
      </Form>
      
      <div className="mt-4 text-center text-sm">
        <p>
          Noch kein Konto?{' '}
          <a href="/register" className="text-primary hover:underline">
            Jetzt registrieren
          </a>
        </p>
      </div>
    </div>
  );
}