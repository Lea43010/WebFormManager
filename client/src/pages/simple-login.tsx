import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import logoImage from "@/assets/Logo.png";

// Login-Schema definieren
const loginSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich")
});

export default function SimpleLoginPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Login-Formular
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({
      username: values.username,
      password: values.password
    }, {
      onSuccess: () => {
        // Die Weiterleitung erfolgt jetzt direkt in der Mutation in useAuth.tsx
        console.log("Login erfolgreich, Weiterleitung erfolgt automatisch...");
      }
    });
  };

  // Wenn der Benutzer bereits angemeldet ist, zur Projektübersicht weiterleiten
  useEffect(() => {
    // Prüfen, ob der Benutzer bereits angemeldet ist
    if (user) {
      console.log("Benutzer bereits angemeldet, leite zur Projektübersicht weiter...");
      setLocation("/projects");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img
            className="h-20 w-auto"
            src={logoImage}
            alt="Logo"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Anmeldung
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          <Form {...loginForm}>
            <form
              onSubmit={loginForm.handleSubmit(onLoginSubmit)}
              className="space-y-6"
            >
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benutzername</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-[#6a961f] hover:bg-[#5a8418] text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Anmelden
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}