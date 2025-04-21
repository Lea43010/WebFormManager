import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
      
      // Für Administratoren überschreiben wir den Status manuell
      if (isAdmin) {
        data.status = 'admin';
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
  const formatDate = (dateString: string | null | undefined) => {
    // Wenn kein Datum vorhanden ist, zeigen wir eine Standardnachricht
    if (!dateString) {
      return "Kein Datum verfügbar";
    }
    
    // Für Debugging-Zwecke
    console.log("Zu formatierendes Datum:", dateString);
    
    try {
      // Prüfen, ob das Datum im ISO-Format vorliegt (YYYY-MM-DD)
      const date = new Date(dateString);
      
      // Prüfen, ob das Datum gültig ist (nicht Unix Epoch Start und kein Invalid Date)
      if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
        console.log("Ungültiges Datum erkannt:", dateString);
        return "Kein gültiges Datum verfügbar";
      }
      
      return format(date, "dd. MMMM yyyy", { locale: de });
    } catch (error) {
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
            <p>
              Sie befinden sich in der <strong>kostenlosen 4-wöchigen Testphase</strong>.
            </p>
            <p>
              Ende der Testphase: <strong>{formatDate(subscriptionData.trialEndDate)}</strong>
            </p>
            <p>
              Um nach Ablauf der Testphase weiterhin alle Funktionen nutzen zu können, schließen Sie ein 
              Abonnement ab. Nur mit einem aktiven Abonnement können Sie nach der Testphase weiterhin
              auf Ihre Daten zugreifen.
            </p>
          </div>
        )}

        {subscriptionData?.status === "active" && (
          <div className="space-y-4">
            <p>
              Sie haben ein <strong>aktives Abonnement</strong> und können alle Funktionen der
              Bau-Structura App uneingeschränkt nutzen.
            </p>
            {subscriptionData.lastPaymentDate && (
              <p>
                Letzte Zahlung: <strong>{formatDate(subscriptionData.lastPaymentDate)}</strong>
              </p>
            )}
          </div>
        )}

        {subscriptionData?.status === "canceled" && (
          <div className="space-y-4">
            <p>
              Ihr Abonnement wurde <strong>gekündigt</strong>.
            </p>
            <p>
              Sie haben mit diesem Zugangsdaten keinen Zugriff mehr auf die erweiterten Funktionen 
              der Bau-Structura App. Um wieder vollen Zugriff zu erhalten, schließen Sie ein neues 
              Abonnement ab.
            </p>
          </div>
        )}
        
        {subscriptionData?.status === "admin" && (
          <div className="space-y-4">
            <p>
              Sie sind als <strong>Administrator</strong> angemeldet und haben <strong>uneingeschränkten Zugriff</strong> auf alle Funktionen der Bau-Structura App.
            </p>
            <p>
              Als Administrator benötigen Sie kein aktives Abonnement, um die Anwendung zu nutzen.
            </p>
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