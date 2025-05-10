import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import logoImage from "@/assets/Logo.png";

// Login-Typen direkt hier definieren
type LoginFormData = {
  username: string;
  password: string;
};

// Login-Schema definieren
const loginSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich")
});

export default function LandingPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [showLoginForm, setShowLoginForm] = useState(false);

  // Login-Formular
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    const loginData: LoginFormData = {
      username: values.username,
      password: values.password
    };
    loginMutation.mutate(loginData);
  };

  // Wenn der Benutzer bereits angemeldet ist, zum Dashboard weiterleiten
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white py-4 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Bau - Structura App</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="text-[#3B82F6] border-[#3B82F6] hover:bg-[#3B82F6] hover:text-white"
              onClick={() => setShowLoginForm(!showLoginForm)}
            >
              {showLoginForm ? "Anmeldeformular schließen" : "Anmelden"}
            </Button>
          </div>
        </div>
      </header>

      {/* Login Form */}
      {showLoginForm && (
        <div className="bg-white shadow-md py-6 mb-8">
          <div className="container mx-auto px-4 max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Anmelden</h2>
                <p className="text-gray-600 mt-2">Geben Sie Ihre Zugangsdaten ein</p>
              </div>
              
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
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Anmelden
                  </Button>
                  
                  <div className="text-center mt-4">
                    <span 
                      className="text-sm text-gray-600 hover:text-[#6a961f] cursor-pointer"
                      onClick={() => {
                        setShowLoginForm(false);
                        setLocation("/auth");
                      }}
                    >
                      Noch kein Konto? Jetzt registrieren
                    </span>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#f0f4e8] to-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Baustellen und Projekte einfach verwalten
              </h1>
              <p className="text-xl text-gray-700 mb-8">
                Mit unserer Bau - Structura App organisieren Sie Ihre Projekte, 
                Kunden und Dokumente effizient und übersichtlich – speziell 
                entwickelt für die Baubranche.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button 
                  className="bg-[#6a961f] hover:bg-[#5a8418] text-white px-8 py-3 text-lg"
                  onClick={() => setShowLoginForm(!showLoginForm)}
                >
                  Jetzt starten
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <div className="bg-[#6a961f] rounded-lg shadow-xl p-8 text-white max-w-md">
                <h3 className="text-2xl font-bold mb-4">Ihre Vorteile</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Einfache Verwaltung von Bauprojekten</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Zentrale Kundendatenbank</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Übersichtliche Dokumentenverwaltung</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Integrierte Geoinformationen und Straßenbauklassen</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
            Funktionen, die Ihre Arbeit erleichtern
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#6a961f]/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-[#6a961f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Projektverwaltung</h3>
              <p className="text-gray-600">
                Erstellen und verwalten Sie Ihre Bauprojekte mit allen wichtigen Informationen 
                an einem zentralen Ort.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#6a961f]/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-[#6a961f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Kunden- und Firmendatenbank</h3>
              <p className="text-gray-600">
                Verwalten Sie Ihre Geschäftspartner, Kunden und Subunternehmer 
                übersichtlich und mit allen wichtigen Kontaktdaten.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#6a961f]/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-[#6a961f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Dokumentenverwaltung</h3>
              <p className="text-gray-600">
                Anhänge und Dokumente zentral speichern und jederzeit 
                schnell auf wichtige Projektunterlagen zugreifen.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#6a961f]/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-[#6a961f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Belastungsklassen</h3>
              <p className="text-gray-600">
                RStO 12 Informationen und Belastungsklassen für den 
                Straßenbau direkt in der Anwendung verfügbar.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#6a961f]/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-[#6a961f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Geoinformationen</h3>
              <p className="text-gray-600">
                Baustellen auf Karten lokalisieren und direkte Verknüpfungen 
                zu externen Kartendiensten nutzen.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#6a961f]/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-[#6a961f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Spracherkennung</h3>
              <p className="text-gray-600">
                Einfache Eingabe von Notizen und Kommentaren durch 
                integrierte Spracherkennungsfunktion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#6a961f] py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Bereit, Ihre Bauprojekte effizienter zu verwalten?
          </h2>
          <p className="text-white/90 text-xl mb-8 max-w-3xl mx-auto">
            Registrieren Sie sich jetzt und erfahren Sie, wie die Bau - Structura App 
            Ihre tägliche Arbeit erleichtern kann.
          </p>
          <Button 
            className="bg-white text-[#6a961f] hover:bg-gray-100 px-8 py-3 text-lg"
            onClick={() => {
              setShowLoginForm(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Kostenlos starten
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Bau - Structura App</h3>
              <p className="text-gray-400">
                Die umfassende Lösung für die Verwaltung von Bauprojekten, 
                speziell entwickelt für die Bedürfnisse der Baubranche.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Schnellzugriff</h3>
              <ul className="space-y-2">
                <li>
                  <span 
                    className="text-gray-400 hover:text-white transition cursor-pointer"
                    onClick={() => {
                      setShowLoginForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Anmelden
                  </span>
                </li>
                <li>
                  <span 
                    className="text-gray-400 hover:text-white transition cursor-pointer"
                    onClick={() => {
                      setLocation("/auth");
                    }}
                  >
                    Registrieren
                  </span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Funktionen</h3>
              <ul className="space-y-2">
                <li><span className="text-gray-400">Projektverwaltung</span></li>
                <li><span className="text-gray-400">Kundendatenbank</span></li>
                <li><span className="text-gray-400">Dokumentenmanagement</span></li>
                <li><span className="text-gray-400">RStO 12 & Geoinformationen</span></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Kontakt</h3>
              <p className="text-gray-400">
                Bei Fragen zur Anwendung wenden Sie sich bitte an den Support.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Bau - Structura App. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}