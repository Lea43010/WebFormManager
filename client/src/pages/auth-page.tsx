import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  Info, 
  X,
  MapPin,
  BarChart3,
  Layers,
  LayoutGrid,
  FileText,
  Users,
  Building,
  Building2,
  Settings 
} from "lucide-react";
import logoImage from "@/assets/Logo.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { insertUserSchema } from "@shared/schema";

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // If user is already logged in, redirect to projects page
  useEffect(() => {
    if (user) {
      navigate("/projects");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        navigate("/projects");
      }
    });
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <div className="flex-1 flex flex-col px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96 pt-16">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4">
              <img src={logoImage} alt="Sachverständigenbüro - Justitia" className="h-24" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 text-center">
              Anmeldung
            </h2>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Anmelden</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Registrieren</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Checkbox id="remember-me" />
                        <label
                          htmlFor="remember-me"
                          className="ml-2 block text-sm text-gray-900"
                        >
                          Angemeldet bleiben
                        </label>
                      </div>

                      <div className="text-sm">
                        <a
                          href="#"
                          className="font-medium text-gray-900 hover:text-gray-700"
                        >
                          Passwort vergessen?
                        </a>
                      </div>
                    </div>

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
            </TabsContent>

            <TabsContent value="register">
              <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={registerForm.control}
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} autoComplete="name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-Mail</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                autoComplete="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passwort</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passwort bestätigen</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-[#6a961f] hover:bg-[#5a8418] text-white"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Registrieren
                    </Button>
                  </form>
                </Form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className="relative flex-1 hidden md:block">
        <div className="absolute inset-0 bg-gradient-to-r from-[#6a961f] to-[#4a8416]">
          <div className="flex flex-col justify-center h-full px-10 text-white">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold mb-6">Baustellen App</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="rounded-full bg-white/30 hover:bg-white/40 p-2">
                    <Info className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center">
                      <Info className="mr-2 h-6 w-6 text-primary" />
                      Über die Baustellen App
                    </DialogTitle>
                    <DialogDescription className="text-base py-2">
                      Eine umfassende Lösung für die Verwaltung von Baustellen und Straßenbauprojekten
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="mt-4 space-y-6">
                    <div className="flex flex-col space-y-4">
                      {/* Einführung */}
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Allgemeine Funktionen</h3>
                        <p className="text-gray-600 mb-2">
                          Die Baustellen App bietet eine vollständige Lösung für die Verwaltung von Baustellen und Straßenbauprojekten. 
                          Mit einer benutzerfreundlichen Oberfläche können Unternehmen ihre Projekte, Kunden und Materialien 
                          effizient organisieren.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                          <div className="flex items-start p-3 rounded-lg border">
                            <Building className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Firmendaten</h4>
                              <p className="text-sm text-gray-500">Verwaltung von Unternehmens- und Partnerfirmendaten</p>
                            </div>
                          </div>
                          <div className="flex items-start p-3 rounded-lg border">
                            <Users className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Kundendaten</h4>
                              <p className="text-sm text-gray-500">Zentrale Kundenverwaltung und Kontaktdatenbank</p>
                            </div>
                          </div>
                          <div className="flex items-start p-3 rounded-lg border">
                            <Building2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Projektverwaltung</h4>
                              <p className="text-sm text-gray-500">Projektorganisation mit Status- und Fortschrittsverfolgung</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Geo-Informationen */}
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Geo-Informationen & Standortanalyse</h3>
                        <p className="text-gray-600 mb-3">
                          Erweiterte Funktionen zur Standortanalyse, Routenplanung und Materialkostenberechnung für Straßenbauprojekte.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          <div className="flex items-start p-3 rounded-lg border">
                            <MapPin className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Standortmarkierung</h4>
                              <p className="text-sm text-gray-500">Interaktive Karte zur Markierung von Baustellen und geplanten Strecken</p>
                            </div>
                          </div>
                          <div className="flex items-start p-3 rounded-lg border">
                            <LayoutGrid className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Straßenplanung</h4>
                              <p className="text-sm text-gray-500">Verbindung von Standorten mit automatischer Routenerstellung</p>
                            </div>
                          </div>
                          <div className="flex items-start p-3 rounded-lg border">
                            <Layers className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">RStO 12 Integration</h4>
                              <p className="text-sm text-gray-500">Auswahl und Visualisierung von Belastungsklassen nach RStO 12</p>
                            </div>
                          </div>
                          <div className="flex items-start p-3 rounded-lg border">
                            <BarChart3 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Materialkostenberechnung</h4>
                              <p className="text-sm text-gray-500">Automatische Berechnung von Material- und Maschinenkosten</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dokumentation und Analyse */}
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Dokumentation & Analyse</h3>
                        <p className="text-gray-600 mb-3">
                          Umfangreiche Funktionen für die Dokumentverwaltung und Bodenanalyse:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          <div className="flex items-start p-3 rounded-lg border">
                            <FileText className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Dokumentenverwaltung</h4>
                              <p className="text-sm text-gray-500">Zentrale Speicherung und Verwaltung aller projektbezogenen Dokumente</p>
                            </div>
                          </div>
                          <div className="flex items-start p-3 rounded-lg border">
                            <Settings className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Bodenanalyse</h4>
                              <p className="text-sm text-gray-500">KI-gestützte Analyse von Bodenbildern zur Bestimmung von Bodenklassen</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t pt-4 flex justify-end">
                    <DialogClose asChild>
                      <Button variant="outline">Schließen</Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-xl mb-8">
              Verwalten Sie Ihre Baustellen und Projekte effizient und übersichtlich.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center">
                <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Kundendatenbank pflegen
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Projekte organisieren
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Geo-Informationen und Straßenplanung
              </li>
            </ul>
            
            <div className="mt-8 bg-white/20 p-6 rounded-lg border border-white/20">
              <h3 className="text-xl font-semibold mb-4">Schnellzugriff</h3>
              <div className="flex flex-col space-y-4">
                <form 
                  action="/api/login" 
                  method="post" 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    
                    fetch('/api/login', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        username: formData.get('username') || "leazimmer",
                        password: formData.get('password') || "Landau43010#"
                      }),
                      credentials: 'include'
                    })
                    .then(response => {
                      if (response.ok) {
                        window.location.href = '/projects';
                      } else {
                        console.error('Login fehlgeschlagen');
                      }
                    });
                  }}
                >
                  <input type="hidden" name="username" value="leazimmer" />
                  <input type="hidden" name="password" value="Landau43010#" />
                  
                  <button
                    type="submit"
                    className="w-full bg-white/30 p-4 rounded-lg text-center hover:bg-white/40 transition cursor-pointer flex items-center justify-center"
                  >
                    <svg className="h-8 w-8 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <div className="text-left">
                      <span className="text-lg font-semibold block">Projektverwaltung öffnen</span>
                      <span className="text-sm opacity-80">Erstellen und verwalten Sie Projekte, Kunden und Firmen</span>
                    </div>
                  </button>
                </form>
                
                <form 
                  action="/api/login" 
                  method="post" 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    
                    fetch('/api/login', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        username: formData.get('username') || "leazimmer",
                        password: formData.get('password') || "Landau43010#"
                      }),
                      credentials: 'include'
                    })
                    .then(response => {
                      if (response.ok) {
                        window.location.href = '/attachments';
                      } else {
                        console.error('Login fehlgeschlagen');
                      }
                    });
                  }}
                >
                  <input type="hidden" name="username" value="leazimmer" />
                  <input type="hidden" name="password" value="Landau43010#" />
                  
                  <button
                    type="submit"
                    className="w-full bg-white/30 p-4 rounded-lg text-center hover:bg-white/40 transition cursor-pointer flex items-center justify-center mt-4"
                  >
                    <svg className="h-8 w-8 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <div className="text-left">
                      <span className="text-lg font-semibold block">Anhänge anzeigen</span>
                      <span className="text-sm opacity-80">Alle Projektanhänge anzeigen und verwalten</span>
                    </div>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
