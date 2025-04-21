import DashboardLayout from "@/components/layouts/dashboard-layout";
import { SubscriptionInfo } from "@/components/subscription/subscription-info";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CreditCard } from "lucide-react";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth();

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

  return (
    <DashboardLayout title="Mein Abonnement" tabs={[]}>
      <div className="flex flex-col gap-6">
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
                Mit einem aktiven Abonnement der Bau-Structura App erhalten Sie Zugriff auf alle 
                Premium-Funktionen und können das volle Potenzial der Anwendung nutzen.
              </p>
              
              <h3>Was ist im Abonnement enthalten?</h3>
              <ul>
                <li>Unbegrenzte Anzahl an Projekten</li>
                <li>Zugriff auf alle erweiterten Funktionen</li>
                <li>Speicherplatz für Ihre Dokumente und Anhänge</li>
                <li>Prioritäts-Support</li>
                <li>Regelmäßige Updates und neue Funktionen</li>
              </ul>
              
              <h3>Preismodell</h3>
              <p>
                Der Preis für das Abonnement basiert auf einem monatlichen Zahlungsmodell. 
                Sie können Ihr Abonnement jederzeit kündigen.
              </p>
              
              <h3>Testphase</h3>
              <p>
                Jeder neue Benutzer erhält eine kostenlose 4-wöchige Testphase, in der alle Funktionen
                uneingeschränkt genutzt werden können. Nach Ablauf der Testphase ist ein Abonnement
                erforderlich, um weiterhin auf alle Funktionen zugreifen zu können.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}