import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft } from "lucide-react";
import SendWelcomeEmail from "@/components/admin/send-welcome-email";
import { useAuth } from "@/hooks/use-auth";

export default function AdminEmailsPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  // Nur Administratoren können diese Seite sehen
  const isAdmin = user?.role === 'administrator';

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-semibold mb-4">Keine Berechtigung</h1>
        <p className="mb-4">Sie haben keine Berechtigung, auf diese Seite zuzugreifen.</p>
        <Button onClick={() => setLocation("/")}>Zurück zur Startseite</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Mail className="h-8 w-8 mr-2 text-primary" />
          <h1 className="text-4xl font-bold">E-Mail-Verwaltung</h1>
        </div>
        
        <Link href="/admin">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Administration
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mt-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">E-Mail-Funktionen</h2>
          <p className="text-muted-foreground mb-6">
            Hier können Sie verschiedene E-Mail-Funktionen ausführen wie Willkommens-E-Mails an neue Benutzer senden.
          </p>
        </div>
        
        <SendWelcomeEmail />
      </div>
    </div>
  );
}