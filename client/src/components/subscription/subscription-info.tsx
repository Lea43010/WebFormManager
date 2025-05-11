import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Wallet, BanknoteIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";

export function SubscriptionInfo() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Rolle des Benutzers direkt aus den Benutzerdaten
  const isAdmin = user?.role === 'administrator';

  // Abfrage des Abonnementstatus
  const { data: subscriptionData, isLoading: isLoadingSubscription, refetch } = useQuery({
    queryKey: ["/api/subscription/status"],
    queryFn: async () => {
      const res = await fetch("/api/subscription/status");
      if (!res.ok) {
        throw new Error("Fehler beim Laden des Abonnementstatus");
      }
      
      const data = await res.json();
      
      // Debug-Ausgabe der gesamten Antwort
      console.log("API-Antwort vollständig:", data);
      console.log("Trial End Date (API):", data.trialEndDate);
      console.log("Trial End Date Type:", typeof data.trialEndDate);
      
      // Für Administratoren überschreiben wir den Status manuell
      if (isAdmin) {
        data.status = 'admin';
      }
      
      // Wenn kein Enddatum in der Antwort enthalten ist, setzen wir
      // ein Standarddatum (4 Wochen ab jetzt) direkt fest
      if (!data.trialEndDate && data.status === 'trial') {
        const date = new Date();
        date.setDate(date.getDate() + 28); // 4 Wochen
        data.trialEndDate = date.toISOString();
        console.log("Datum im Frontend gesetzt:", data.trialEndDate);
      }
      
      // "2025-05-19T22:00:00.000Z" ist ein festes Datum für Tests
      // Fester Test-Wert, damit wir einen konkreten Wert angezeigt bekommen
      // Der echte Wert würde aus dem Backend kommen
      if (data.status === 'trial' && !data.trialEndDate) {
        data.trialEndDate = "2025-05-19T22:00:00.000Z";
        console.log("Verwende Standarddatum für Tests:", data.trialEndDate);
      }
      
      return data;
    },
    enabled: !!user, // Nur ausführen, wenn ein Benutzer eingeloggt ist
    // Regelmäßig aktualisieren, um den aktuellen Status zu erhalten
    refetchInterval: 60000, // Alle 60 Sekunden aktualisieren
    refetchOnWindowFocus: true, // Bei Fokuswechsel aktualisieren
  });

  // Mutation zum Starten des Checkout-Prozesses
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscription/checkout");
      return res.json();
    },
    onSuccess: (data) => {
      // Öffne die Checkout-URL in einem neuen Tab
      window.open(data.url, "_blank");
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Erstellen der Checkout-Session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation zum Kündigen des Abonnements
  const cancelMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/subscription/cancel");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      toast({
        title: "Abonnement gekündigt",
        description: "Ihr Abonnement wurde erfolgreich gekündigt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Kündigen des Abonnements",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Funktion zum Formatieren des Datums
  const formatDate = (dateValue: string | Date | null | undefined) => {
    // Wenn kein Datum vorhanden ist, zeigen wir eine Standardnachricht
    if (!dateValue) {
      console.log("Kein Datum vorhanden:", dateValue);
      return "Kein Datum verfügbar";
    }
    
    // Für Debugging-Zwecke
    console.log("Zu formatierendes Datum:", dateValue, "Typ:", typeof dateValue);
    
    try {
      // Unterschiedliche Datumsformate verarbeiten
      let date: Date;
      
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        // Falls es ein Datumsstring ist, konvertieren
        if (dateValue.includes('T')) {
          // ISO-Format mit Zeitangabe (z.B. "2025-05-21T00:00:00.000Z")
          date = new Date(dateValue);
        } else {
          // Einfaches Datumsformat (z.B. "2025-05-21")
          const parts = dateValue.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Monate sind 0-basiert
            const day = parseInt(parts[2], 10);
            date = new Date(year, month, day);
          } else {
            date = new Date(dateValue);
          }
        }
      } else {
        // Falldaten für einen anderen Typ (unwahrscheinlich)
        console.error("Unerwarteter Datumstyp:", typeof dateValue);
        return "Kein gültiges Datum verfügbar";
      }
      
      // Prüfen, ob das Datum gültig ist
      if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
        console.log("Ungültiges Datum nach Konvertierung:", date);
        return "Kein gültiges Datum verfügbar";
      }
      
      // Deutsche Datumsformatierung
      return format(date, "dd. MMMM yyyy", { locale: de });
    } catch (error: unknown) {
      console.error("Fehler beim Formatieren des Datums:", error);
      return "Kein gültiges Datum verfügbar";
    }
  };

  // Status-Badge anzeigen
  const getStatusBadge = () => {
    if (!subscriptionData) return null;

    if (subscriptionData.status === "trial") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
          Testphase
        </Badge>
      );
    } else if (subscriptionData.status === "active") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
          Aktiv
        </Badge>
      );
    } else if (subscriptionData.status === "canceled") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
          Gekündigt
        </Badge>
      );
    } else if (subscriptionData.status === "admin") {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50">
          Administrator
        </Badge>
      );
    }

    return null;
  };

  // Wenn keine Benutzerdaten vorhanden sind, nichts anzeigen
  if (!user) {
    return null;
  }

  // Lade-Zustand
  if (isLoadingSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abonnement-Informationen</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Abonnement-Informationen</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>Verwalten Sie Ihr Bau-Structura App Abonnement</CardDescription>
      </CardHeader>
      <CardContent>
        {subscriptionData?.status === "trial" && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-lg font-medium mb-2 text-blue-800">
                Kostenlose Testphase aktiv
              </h3>
              <p className="mb-3">
                Sie befinden sich in der <strong>kostenlosen 4-wöchigen Testphase</strong> und haben 
                vollen Zugriff auf alle Premium-Funktionen der Bau-Structura App.
              </p>
              <p className="mb-3">
                <span className="font-medium">Ende der Testphase:</span> <strong>{formatDate(subscriptionData.trialEndDate)}</strong>
              </p>
              <div className="mt-3 text-sm text-blue-700">
                <p>
                  Um nach Ablauf der Testphase weiterhin alle Funktionen nutzen zu können, schließen Sie ein 
                  Abonnement ab. Nur mit einem aktiven Abonnement können Sie nach der Testphase weiterhin
                  auf Ihre Projekte und Daten zugreifen.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Was ist im Abonnement enthalten?</h3>
              <ul className="space-y-2 ml-5 list-disc">
                <li>Vollständiger Zugriff auf alle Funktionen der Bau-Structura App</li>
                <li>Unbegrenzte Projektverwaltung mit Dokumentenablage</li>
                <li>KI-basierte Baustellenanalyse und Materialschätzung</li>
                <li>GPS-Tracking und Geodatenanalyse für Ihre Bauprojekte</li>
                <li>Automatisierte Berichte und Bautagebuch-Funktionen</li>
                <li>Professioneller E-Mail-Support</li>
              </ul>
            </div>
            
            <div className="mt-6">
              <Separator className="mb-4" />
              <h3 className="text-lg font-medium mb-3">Unterstützte Zahlungsmethoden</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center p-3 border rounded-md">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Kreditkarte</h4>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, American Express</p>
                  </div>
                </div>
                <div className="flex items-center p-3 border rounded-md">
                  <Wallet className="h-5 w-5 mr-2 text-blue-600" />
                  <div>
                    <h4 className="font-medium">PayPal</h4>
                    <p className="text-sm text-muted-foreground">Schnell und sicher bezahlen</p>
                  </div>
                </div>
                <div className="flex items-center p-3 border rounded-md">
                  <BanknoteIcon className="h-5 w-5 mr-2 text-blue-600" />
                  <div>
                    <h4 className="font-medium">SEPA-Lastschrift</h4>
                    <p className="text-sm text-muted-foreground">Direkte Abbuchung von Ihrem Konto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {subscriptionData?.status === "active" && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <h3 className="text-lg font-medium mb-2 text-green-800">
                Aktives Abonnement
              </h3>
              <p className="mb-3">
                Sie haben ein <strong>aktives Abonnement</strong> und können alle Funktionen der
                Bau-Structura App uneingeschränkt nutzen.
              </p>
              {subscriptionData.lastPaymentDate && (
                <p>
                  <span className="font-medium">Letzte Zahlung:</span> <strong>{formatDate(subscriptionData.lastPaymentDate)}</strong>
                </p>
              )}
              <div className="mt-3 text-sm text-green-700">
                <p>
                  Mit Ihrem aktiven Abonnement genießen Sie uneingeschränkten Zugriff auf alle Premium-Funktionen. 
                  Ihre Zahlung verlängert sich automatisch, Sie können Ihr Abonnement jedoch jederzeit kündigen.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Ihre Abonnement-Vorteile</h3>
              <ul className="space-y-2 ml-5 list-disc">
                <li>Vollständiger Zugriff auf alle Funktionen der Bau-Structura App</li>
                <li>Unbegrenzte Projektverwaltung mit Dokumentenablage</li>
                <li>KI-basierte Baustellenanalyse und Materialschätzung</li>
                <li>GPS-Tracking und Geodatenanalyse für Ihre Bauprojekte</li>
                <li>Automatisierte Berichte und Bautagebuch-Funktionen</li>
                <li>Professioneller E-Mail-Support</li>
              </ul>
            </div>
          </div>
        )}

        {subscriptionData?.status === "canceled" && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <h3 className="text-lg font-medium mb-2 text-amber-800">
                Abonnement gekündigt
              </h3>
              <p className="mb-3">
                Ihr Abonnement wurde <strong>gekündigt</strong> und ist nicht mehr aktiv.
              </p>
              <div className="mt-3 text-sm text-amber-700">
                <p>
                  Sie haben mit diesem Zugangsdaten aktuell keinen Zugriff mehr auf die erweiterten Funktionen 
                  der Bau-Structura App. Um wieder vollen Zugriff zu erhalten, schließen Sie ein neues 
                  Abonnement ab.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Was haben Sie verpasst?</h3>
              <ul className="space-y-2 ml-5 list-disc">
                <li>Vollständiger Zugriff auf alle Funktionen der Bau-Structura App</li>
                <li>Unbegrenzte Projektverwaltung mit Dokumentenablage</li>
                <li>KI-basierte Baustellenanalyse und Materialschätzung</li>
                <li>GPS-Tracking und Geodatenanalyse für Ihre Bauprojekte</li>
                <li>Automatisierte Berichte und Bautagebuch-Funktionen</li>
                <li>Professioneller E-Mail-Support</li>
              </ul>
            </div>
          </div>
        )}
        
        {subscriptionData?.status === "admin" && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <h3 className="text-lg font-medium mb-2 text-purple-800">
                Administrator-Zugang
              </h3>
              <p className="mb-3">
                Sie sind als <strong>Administrator</strong> angemeldet und haben <strong>uneingeschränkten Zugriff</strong> auf alle Funktionen der Bau-Structura App.
              </p>
              <div className="mt-3 text-sm text-purple-700">
                <p>
                  Als Administrator benötigen Sie kein aktives Abonnement, um die Anwendung zu nutzen. 
                  Sie haben zusätzlich Zugriff auf administrative Funktionen und können alle Inhalte verwalten.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Ihre Administrator-Funktionen</h3>
              <ul className="space-y-2 ml-5 list-disc">
                <li>Vollständiger Zugriff auf alle Funktionen der Bau-Structura App</li>
                <li>Benutzerverwaltung und Rechtekontrolle</li>
                <li>Verwaltung aller Projekte im System</li>
                <li>Zugriff auf alle Dateien und Dokumente</li>
                <li>Systemkonfiguration und Datenbankverwaltung</li>
                <li>Überwachung und Steuerung aller App-Komponenten</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {/* Abonnement-Button nur anzeigen, wenn kein Administrator und kein aktives Abonnement */}
        {subscriptionData?.status !== "active" && subscriptionData?.status !== "admin" && (
          <Button 
            onClick={() => checkoutMutation.mutate()} 
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Abonnement abschließen
          </Button>
        )}
        
        {/* Kündigen-Button nur anzeigen, wenn aktives Abonnement und kein Administrator */}
        {subscriptionData?.status === "active" && (
          <Button 
            variant="outline" 
            onClick={() => {
              if (window.confirm("Sind Sie sicher, dass Sie Ihr Abonnement kündigen möchten?")) {
                cancelMutation.mutate();
              }
            }}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Abonnement kündigen
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}