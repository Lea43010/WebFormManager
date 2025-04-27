import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert, Mail, ArrowLeft } from 'lucide-react';
import { Link } from "wouter";
import SendWelcomeEmail from "@/components/admin/send-welcome-email";

export default function AdminEmailsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrator';

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Zugriff verweigert</h1>
        <p>Sie haben keine Berechtigung, auf diesen Bereich zuzugreifen.</p>
        <Link href="/dashboard">
          <a className="flex items-center text-primary mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </a>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ShieldAlert className="h-8 w-8 mr-2 text-primary" />
          <h1 className="text-4xl font-bold">E-Mail Verwaltung</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href="/admin">
            <a className="flex items-center px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-md text-primary transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Zurück zur Administration</span>
            </a>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center mb-4">
            <Mail className="h-6 w-6 mr-2 text-primary" />
            <h2 className="text-2xl font-semibold">Willkommens-E-Mails</h2>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Senden Sie Willkommens-E-Mails an neue Benutzer, um ihnen den Einstieg in die Anwendung zu erleichtern.
            Die E-Mail enthält wichtige Informationen zur Nutzung der Anwendung und Links zur Dokumentation.
          </p>
          
          <SendWelcomeEmail />
        </div>
        
        {/* Hier könnten weitere E-Mail-Funktionalitäten hinzugefügt werden */}
      </div>
    </div>
  );
}