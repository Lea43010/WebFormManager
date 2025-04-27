import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Schema für die E-Mail-Daten
const welcomeEmailSchema = z.object({
  username: z.string().min(3, 'Benutzername muss mindestens 3 Zeichen lang sein'),
  user_name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  user_email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
  sendToAdmin: z.boolean().default(true)
});

type WelcomeEmailData = z.infer<typeof welcomeEmailSchema>;

export default function SendWelcomeEmail() {
  const { toast } = useToast();
  const [sentSuccess, setSentSuccess] = useState(false);
  
  // Benutzer aus der API abrufen
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
    retry: false,
  });
  
  // Form mit Zod-Validator
  const form = useForm<WelcomeEmailData>({
    resolver: zodResolver(welcomeEmailSchema),
    defaultValues: {
      username: '',
      user_name: '',
      user_email: '',
      password: '',
      sendToAdmin: true
    }
  });
  
  // Mutation zum Senden der E-Mail
  const sendEmailMutation = useMutation({
    mutationFn: async (data: WelcomeEmailData) => {
      const response = await apiRequest('POST', '/api/admin/send-welcome-email', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'E-Mail versendet',
        description: 'Die Willkommens-E-Mail wurde erfolgreich versendet.',
      });
      setSentSuccess(true);
      
      // Formular zurücksetzen
      setTimeout(() => {
        form.reset();
        setSentSuccess(false);
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: `E-Mail konnte nicht gesendet werden: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Form Submit Handler
  const onSubmit = (data: WelcomeEmailData) => {
    sendEmailMutation.mutate(data);
  };
  
  // Benutzer auswählen
  const handleUserSelect = (userId: string) => {
    if (!users.length) return;
    
    const selectedUser = users.find((user: any) => user.id.toString() === userId);
    if (selectedUser) {
      form.setValue('username', selectedUser.username);
      form.setValue('user_name', selectedUser.user_name || '');
      form.setValue('user_email', selectedUser.user_email || '');
      // Wir setzen kein Passwort, da es im Formular manuell eingegeben werden soll
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Willkommens-E-Mail versenden
        </CardTitle>
        <CardDescription>
          Senden Sie eine Willkommens-E-Mail mit Zugangsdaten an einen neuen Benutzer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sentSuccess && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>E-Mail erfolgreich gesendet</AlertTitle>
            <AlertDescription>
              Die Willkommens-E-Mail wurde erfolgreich an den Benutzer versendet.
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {users && users.length > 0 && (
              <div className="mb-6">
                <FormLabel>Benutzer auswählen (optional)</FormLabel>
                <Select onValueChange={handleUserSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Benutzer auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username} ({user.user_email || 'Keine E-Mail'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Wählen Sie einen existierenden Benutzer aus oder füllen Sie die Felder manuell aus.
                </p>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benutzername</FormLabel>
                  <FormControl>
                    <Input placeholder="max.mustermann" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="user_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Max Mustermann" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="user_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail-Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="max.mustermann@example.com" {...field} />
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
                  <FormLabel>Temporäres Passwort</FormLabel>
                  <FormControl>
                    <Input placeholder="Temporäres Passwort" {...field} />
                  </FormControl>
                  <FormDescription>
                    Dieses Passwort wird in der E-Mail mitgeteilt. Der Benutzer sollte es nach der ersten Anmeldung ändern.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sendToAdmin"
              render={({ field }) => (
                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="sendToAdmin"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="sendToAdmin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Kopie an Administrator senden
                  </label>
                </div>
              )}
            />
            
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Hinweis zum E-Mail-Versand</AlertTitle>
              <AlertDescription>
                <p>In der Entwicklungsumgebung werden E-Mails als Dateien im Verzeichnis <code>temp/emails/</code> gespeichert.</p>
                <p className="mt-1">In der Produktionsumgebung werden sie über die authentifizierte Domain <code>bau-structura.de</code> versendet.</p>
              </AlertDescription>
            </Alert>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="mr-2"
          onClick={() => form.reset()}
        >
          Zurücksetzen
        </Button>
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          disabled={sendEmailMutation.isPending}
        >
          {sendEmailMutation.isPending ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              E-Mail wird gesendet...
            </span>
          ) : (
            <span className="flex items-center">
              <Send className="mr-2 h-4 w-4" />
              E-Mail senden
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}