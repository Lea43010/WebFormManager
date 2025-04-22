import { useEffect } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { SubscriptionInfo } from "@/components/subscription/subscription-info";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { Redirect, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();

  // URLSearchParams für Query-Parameter auswerten
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    // Erfolgreiche Zahlung
    if (success === 'true' && sessionId) {
      // Session-ID an den Backend-Endpunkt senden
      apiRequest('GET', `/api/subscription/success?session_id=${sessionId}`)
        .then(() => {
          toast({
            title: "Abonnement erfolgreich abgeschlossen",
            description: "Vielen Dank für Ihren Kauf. Ihr Abonnement ist jetzt aktiv.",
            variant: "default",
          });
          
          // Nach dem erfolgreichen Toast die Query-Parameter aus der URL entfernen
          window.history.replaceState({}, document.title, '/subscription');
        })
        .catch(error => {
          console.error("Fehler bei der Verarbeitung der Zahlung:", error);
          toast({
            title: "Fehler bei der Zahlungsverarbeitung",
            description: "Bitte kontaktieren Sie uns für weitere Unterstützung.",
            variant: "destructive",
          });
        });
    }

    // Abgebrochene Zahlung
    if (canceled === 'true') {
      toast({
        title: "Zahlung abgebrochen",
        description: "Der Zahlungsvorgang wurde abgebrochen. Sie können es jederzeit erneut versuchen.",
        variant: "default",
      });
      
      // Nach dem Toast die Query-Parameter aus der URL entfernen
      window.history.replaceState({}, document.title, '/subscription');
    }
  }, [location, toast]);

  // Wenn der Benutzer noch nicht geladen ist, zeige Lade-Animation
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Wenn kein Benutzer eingeloggt ist, zur Login-Seite weiterleiten
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // URLSearchParams für Query-Parameter auswerten
  const searchParams = new URLSearchParams(window.location.search);
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  return (
    <DashboardLayout title="Mein Abonnement" tabs={[]}>
      <div className="flex flex-col gap-6">
        {success === 'true' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Zahlung erfolgreich</AlertTitle>
            <AlertDescription>
              Vielen Dank für Ihren Kauf. Ihr Abonnement ist jetzt aktiv.
            </AlertDescription>
          </Alert>
        )}

        {canceled === 'true' && (
          <Alert className="bg-amber-50 border-amber-200">
            <XCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Zahlung abgebrochen</AlertTitle>
            <AlertDescription>
              Der Zahlungsvorgang wurde abgebrochen. Sie können es jederzeit erneut versuchen.
            </AlertDescription>
          </Alert>
        )}

        <SubscriptionInfo />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Über das Bau-Structura Abonnement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none">
              <p>
                Bau-Structura bietet eine leistungsstarke Software-Lösung für die Verwaltung von Bauprojekten, 
                Mitarbeitern und Ressourcen. Mit unserem Abonnement erhalten Sie:
              </p>
              
              <ul>
                <li>Vollständiger Zugriff auf alle Funktionen der Bau-Structura App</li>
                <li>Unbegrenzte Projektverwaltung mit Dokumentenablage</li>
                <li>Intelligente KI-basierte Baustellenanalyse und Materialschätzung</li>
                <li>GPS-Tracking und Geodatenanalyse für Ihre Bauprojekte</li>
                <li>Automatisierte Berichte und Bautagebuch-Funktionen</li>
                <li>Professioneller E-Mail-Support</li>
              </ul>
              
              <h3>Abonnement-Details</h3>
              <p>
                Abonnieren Sie jetzt und optimieren Sie Ihr Baustellenmanagement mit modernster Technologie. 
                Die ersten 4 Wochen sind kostenlos, danach beträgt die monatliche Gebühr €XX,XX (zzgl. MwSt). 
                Sie können Ihr Abonnement jederzeit mit einer Frist von 30 Tagen kündigen.
              </p>
              
              <h3>Kostenlose Testphase</h3>
              <p>
                Jeder neue Benutzer erhält automatisch eine kostenlose 4-wöchige Testphase mit vollem 
                Funktionsumfang. Nach Ablauf dieser Phase wird ein aktives Abonnement benötigt, um weiterhin 
                auf Ihre Projekte und Daten zugreifen zu können.
              </p>
              
              <p className="text-sm text-gray-500 mt-4">
                Mit Ihrem Abonnement akzeptieren Sie unsere Nutzungsbedingungen und Datenschutzrichtlinien.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}