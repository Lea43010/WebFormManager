import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCopy, UserPlus, Users, Mail, Terminal, Shield, UserCog } from "lucide-react";
import { useState } from "react";
import { UserManagement as UserManagementComponent } from "@/components/admin/user-management";

export default function UserManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast({
      title: "Befehl kopiert",
      description: "Der Befehl wurde in die Zwischenablage kopiert.",
    });
  };
  
  // Benutzer-Button in der Kopfzeile verlinkt zum Benutzer-Tab
  const handleShowUsers = () => {
    setActiveTab("users");
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benutzerverwaltung</h1>
          <p className="text-muted-foreground">
            Anleitungen und Tools zur Verwaltung von Benutzern in der Bau-Structura App
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Users size={16} />
            <span>Benutzer anzeigen</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="users">Benutzerliste</TabsTrigger>
          <TabsTrigger value="create">Benutzer anlegen</TabsTrigger>
          <TabsTrigger value="emails">E-Mail-Vorlagen</TabsTrigger>
          <TabsTrigger value="permissions">Berechtigungen</TabsTrigger>
        </TabsList>

        {/* Übersicht Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Benutzerverwaltung in der Bau-Structura App
              </CardTitle>
              <CardDescription>
                Hier finden Sie alle wichtigen Informationen zur Verwaltung von Benutzern
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Benutzer anlegen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Erstellen Sie neue Benutzer für die Anwendung</p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={() => setActiveTab("create")}
                    >
                      Zur Anleitung
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      Benutzerliste
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Verwalten Sie bestehende Benutzerkonten und prüfen Sie Testphasen</p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={() => setActiveTab("users")}
                    >
                      Benutzer verwalten
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-Mail-Verwaltung
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Verwalten Sie E-Mail-Vorlagen für Benutzerbenachrichtigungen</p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={() => setActiveTab("emails")}
                    >
                      Zu den Vorlagen
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Berechtigungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Informationen zu Benutzerrollen und -berechtigungen</p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={() => setActiveTab("permissions")}
                    >
                      Zu den Berechtigungen
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benutzer anlegen Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Benutzer anlegen
              </CardTitle>
              <CardDescription>
                Anleitung zum Erstellen neuer Benutzer über die Kommandozeile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Kommandozeilen-Tool</AlertTitle>
                <AlertDescription>
                  Das Anlegen neuer Benutzer erfolgt über ein spezielles Script, das auf der Kommandozeile ausgeführt wird.
                  Dies sorgt für eine sichere Passwort-Generierung und korrekte Datenbankeinträge.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Schritt 1: Script anpassen</h3>
                <p className="text-sm">
                  Öffnen Sie das Script <code>scripts/create-user.ts</code> und passen Sie die Benutzerdaten an:
                </p>
                <div className="bg-slate-950 text-slate-50 p-3 rounded-md text-sm font-mono whitespace-pre-wrap relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-6 w-6 opacity-80 hover:opacity-100"
                    onClick={() => copyCommand(`const NEW_USER = {
  username: 'benutzername',
  password: 'temporäres-passwort', // wird beim Ausführen gehashed
  user_name: 'Vor- und Nachname',
  user_email: 'email@example.com',
  role: 'benutzer', // oder 'administrator'
  created_by: 1, // ID des Administrators, der den Benutzer anlegt
  gdpr_consent: true
};`)}
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-slate-400">// Parameter für den neuen Benutzer</span>
{`const NEW_USER = {
  username: 'benutzername',
  password: 'temporäres-passwort', // wird beim Ausführen gehashed
  user_name: 'Vor- und Nachname',
  user_email: 'email@example.com',
  role: 'benutzer', // oder 'administrator'
  created_by: 1, // ID des Administrators, der den Benutzer anlegt
  gdpr_consent: true
};`}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Schritt 2: Script ausführen</h3>
                <p className="text-sm">
                  Führen Sie das Script aus, um den Benutzer anzulegen:
                </p>
                <div className="bg-slate-950 text-slate-50 p-3 rounded-md text-sm font-mono relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-6 w-6 opacity-80 hover:opacity-100"
                    onClick={() => copyCommand('npx tsx scripts/create-user.ts')}
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                  </Button>
                  <span>npx tsx scripts/create-user.ts</span>
                </div>
                <p className="text-sm">
                  Das Script wird:
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Prüfen, ob der Benutzername bereits existiert</li>
                  <li>Das Passwort sicher hashen</li>
                  <li>Den Benutzer in der Datenbank anlegen</li>
                  <li>Ein Ablaufdatum für die Testphase (4 Wochen ab heute) setzen</li>
                  <li>Die Benutzerdaten bei erfolgreicher Erstellung ausgeben</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Schritt 3: Willkommens-E-Mail senden</h3>
                <p className="text-sm">
                  Passen Sie das Willkommens-E-Mail-Script an und führen Sie es aus:
                </p>
                <div className="bg-slate-950 text-slate-50 p-3 rounded-md text-sm font-mono whitespace-pre-wrap relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-6 w-6 opacity-80 hover:opacity-100"
                    onClick={() => copyCommand(`// In scripts/send-welcome-email.ts
const USER_INFO = {
  username: 'benutzername',
  user_name: 'Vor- und Nachname',
  user_email: 'email@example.com',
  password: 'temporäres-passwort',
};`)}
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                  </Button>
{`// In scripts/send-welcome-email.ts
const USER_INFO = {
  username: 'benutzername',
  user_name: 'Vor- und Nachname',
  user_email: 'email@example.com',
  password: 'temporäres-passwort',
};`}
                </div>
                
                <div className="bg-slate-950 text-slate-50 p-3 rounded-md text-sm font-mono relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-6 w-6 opacity-80 hover:opacity-100"
                    onClick={() => copyCommand('npx tsx scripts/send-welcome-email.ts')}
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                  </Button>
                  <span>npx tsx scripts/send-welcome-email.ts</span>
                </div>
                
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertTitle>E-Mail-Versand</AlertTitle>
                  <AlertDescription>
                    <p>In der Entwicklungsumgebung werden E-Mails als Dateien im Verzeichnis <code>temp/emails/</code> gespeichert.</p>
                    <p className="mt-1">In der Produktionsumgebung werden sie über den konfigurierten E-Mail-Provider (Brevo) verschickt.</p>
                  </AlertDescription>
                </Alert>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Wichtige Hinweise</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Fordern Sie die Benutzer auf, ihr temporäres Passwort nach der ersten Anmeldung zu ändern</li>
                  <li>Administratoren müssen keine Abonnements erwerben, sie haben automatisch vollen Zugriff</li>
                  <li>Reguläre Benutzer haben nach der Registrierung eine 4-wöchige Testphase</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* E-Mail-Vorlagen Tab */}
        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                E-Mail-Vorlagen
              </CardTitle>
              <CardDescription>
                Vorlagen für Benutzerbenachrichtigungen und automatisierte E-Mails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Willkommens-E-Mail</h3>
                <p className="text-sm">
                  Diese E-Mail wird an neue Benutzer gesendet, um ihnen ihre Zugangsdaten mitzuteilen.
                </p>
                <div className="border rounded-md p-4 space-y-4">
                  <div>
                    <h4 className="font-medium">Betreff:</h4>
                    <p className="text-sm">Willkommen bei Bau - Structura App - Ihre Zugangsdaten</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Wichtige Elemente:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Begrüßung mit Namen des Benutzers</li>
                      <li>Login-Daten (Benutzername und temporäres Passwort)</li>
                      <li>Link zur Anwendung</li>
                      <li>Aufforderung zum Ändern des Passworts</li>
                      <li>Übersicht der wichtigsten Funktionen</li>
                      <li>Support-Informationen</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium">Dokumentation und Archivierung:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Eine Kopie jeder Willkommens-E-Mail wird automatisch an <strong>lea.zimmer@gmx.net</strong> gesendet</li>
                      <li>Die Kopie enthält zusätzliche Informationen wie Erstellungsdatum und Benutzerdetails</li>
                      <li>Alle verschickten E-Mails werden in der Entwicklungsumgebung in <code>temp/emails/</code> gespeichert</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium">Datei:</h4>
                    <p className="text-sm font-mono">scripts/send-welcome-email.ts</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Verifizierungscode</h3>
                <p className="text-sm">
                  Diese E-Mail wird zur Zwei-Faktor-Authentifizierung oder zum Zurücksetzen von Passwörtern verwendet.
                </p>
                <div className="border rounded-md p-4 space-y-4">
                  <div>
                    <h4 className="font-medium">Betreff:</h4>
                    <p className="text-sm">Ihr Anmeldecode - Bau - Structura App</p>
                    <p className="text-sm">oder: Passwort zurücksetzen - Bau - Structura App</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Wichtige Elemente:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>6-stelliger Verifizierungscode</li>
                      <li>Bei Passwort-Reset: Link zum Zurücksetzen</li>
                      <li>Hinweis zur Gültigkeit (30 Minuten)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium">Datei:</h4>
                    <p className="text-sm font-mono">server/email.ts</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold">E-Mail-Konfiguration</h3>
                <p className="text-sm mt-2">
                  Die E-Mail-Konfiguration ist in <code>config.ts</code> definiert und kann je nach Umgebung angepasst werden.
                </p>
                <Alert className="mt-4">
                  <AlertTitle className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    E-Mail-Provider
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                      <li><strong>Entwicklung:</strong> E-Mails werden als Dateien im Verzeichnis <code>temp/emails/</code> gespeichert</li>
                      <li><strong>Staging:</strong> E-Mails werden in der Konsole ausgegeben</li>
                      <li><strong>Produktion:</strong> E-Mails werden über Brevo API versendet (erfordert API-Key)</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Berechtigungen Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Benutzerrollen und -berechtigungen
              </CardTitle>
              <CardDescription>
                Übersicht über die verschiedenen Benutzerrollen und ihre Berechtigungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-600">Administrator</h3>
                  <div className="border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 rounded-md p-4">
                    <ul className="list-disc pl-5 text-sm space-y-2">
                      <li>Vollständiger Zugriff auf alle Funktionen</li>
                      <li>Kann Benutzer anlegen, bearbeiten und löschen</li>
                      <li>Kann Projekte für alle Benutzer sehen und bearbeiten</li>
                      <li>Zugriff auf Admin-Bereich und Systemkonfiguration</li>
                      <li>Kein Abonnement erforderlich</li>
                      <li>Kann Umgebungsvariablen und Deployment-Einstellungen verwalten</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-emerald-600">Manager</h3>
                  <div className="border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 rounded-md p-4">
                    <ul className="list-disc pl-5 text-sm space-y-2">
                      <li>Zugriff auf selbst erstellte Projekte</li>
                      <li>Kann eigene Projekte erstellen und verwalten</li>
                      <li>Kann Bautagebuch-Einträge hinzufügen und bearbeiten</li>
                      <li>Kann Meilensteine verwalten und tracken</li>
                      <li>Benötigt Abonnement nach Ablauf der Testphase (4 Wochen)</li>
                      <li>Kein Zugriff auf Admin-Bereich und Systemeinstellungen</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Projektberechtigungen</h3>
                <p className="text-sm">
                  Zusätzlich zu den Benutzerrollen können auch projektspezifische Berechtigungen vergeben werden:
                </p>
                <div className="border rounded-md p-4">
                  <ul className="list-disc pl-5 text-sm space-y-2">
                    <li><strong>Projekteigentümer:</strong> Vollständiger Zugriff auf das Projekt</li>
                    <li><strong>Projektmitarbeiter:</strong> Kann Bautagebuch-Einträge erstellen und Dokumente hinzufügen</li>
                    <li><strong>Gast:</strong> Nur Leserechte für bestimmte Projektbereiche</li>
                  </ul>
                </div>
                <p className="text-sm mt-2">
                  Die Projektberechtigungen werden in der Tabelle <code>tblpermissions</code> verwaltet und können über die Benutzeroberfläche im Projektdetail-Bereich vergeben werden.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}