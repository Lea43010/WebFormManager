import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  ShieldAlert, Users, Database, BarChart, Settings, FileCode, 
  Mail, ActivityIcon, Clock, ServerCrash, HardDrive, CloudUpload,
  CreditCard
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  // Nur Administratoren können Login-Logs sehen
  const isAdmin = user?.role === 'administrator';

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <ShieldAlert className="h-8 w-8 mr-2 text-primary" />
          <h1 className="text-4xl font-bold">Administration</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isAdmin && (
          <>
            {/* Benutzerverwaltung & Testphasen */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <CardTitle className="text-blue-800 text-base flex items-center gap-2">
                  <Users className="h-5 w-5 shrink-0" />
                  <span>Benutzerverwaltung</span>
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Benutzer, Berechtigungen und Abonnements verwalten
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex justify-center">
                <Button 
                  variant="default" 
                  className="bg-blue-600 hover:bg-blue-700 w-full" 
                  onClick={() => navigate("/admin/users")}
                >
                  Öffnen
                </Button>
              </CardFooter>
            </Card>

            {/* System-Logs */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <CardTitle className="text-purple-800 text-base flex items-center gap-2">
                  <ActivityIcon className="h-5 w-5 shrink-0" />
                  <span>System-Logs</span>
                </CardTitle>
                <CardDescription className="text-purple-600">
                  Systemaktivitäten und Ereignisprotokolle
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex justify-center">
                <Button 
                  variant="default" 
                  className="bg-purple-600 hover:bg-purple-700 w-full" 
                  onClick={() => navigate("/admin/logs")}
                >
                  Öffnen
                </Button>
              </CardFooter>
            </Card>
            
            {/* Backup-System */}
            <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <CardTitle className="text-teal-800 text-base flex items-center gap-2">
                  <HardDrive className="h-5 w-5 shrink-0" />
                  <span>Backup-System</span>
                </CardTitle>
                <CardDescription className="text-teal-600">
                  Backups erstellen, verwalten und Status überwachen
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex justify-center">
                <Button 
                  variant="default" 
                  className="bg-teal-600 hover:bg-teal-700 w-full" 
                  onClick={() => navigate("/admin/backup-status")}
                >
                  Öffnen
                </Button>
              </CardFooter>
            </Card>
            
            {/* Datenqualität */}
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <CardTitle className="text-indigo-800 text-base flex items-center gap-2">
                  <BarChart className="h-5 w-5 shrink-0" />
                  <span>Datenqualität</span>
                </CardTitle>
                <CardDescription className="text-indigo-600">
                  Berichte, Analysen, Automatisierung und Fehlerbehebung
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex justify-center">
                <Button 
                  variant="default" 
                  className="bg-indigo-600 hover:bg-indigo-700 w-full" 
                  onClick={() => navigate("/admin/data-quality-dashboard")}
                >
                  Öffnen
                </Button>
              </CardFooter>
            </Card>
            
            {/* E-Mail-Verwaltung */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <CardTitle className="text-red-800 text-base flex items-center gap-2">
                  <Mail className="h-5 w-5 shrink-0" />
                  <span>E-Mail-Verwaltung</span>
                </CardTitle>
                <CardDescription className="text-red-600">
                  E-Mail-Vorlagen und Sendeprotokolle
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex justify-center">
                <Button 
                  variant="default" 
                  className="bg-red-600 hover:bg-red-700 w-full" 
                  onClick={() => navigate("/admin/emails")}
                >
                  Öffnen
                </Button>
              </CardFooter>
            </Card>
            
            {/* Deployment-Docs */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <CardTitle className="text-slate-800 text-base flex items-center gap-2">
                  <FileCode className="h-5 w-5 shrink-0" />
                  <span>Deployment</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Deployment-Anleitungen und Status
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex justify-center">
                <Button 
                  variant="default" 
                  className="bg-slate-600 hover:bg-slate-700 w-full" 
                  onClick={() => navigate("/admin/deployment-docs")}
                >
                  Öffnen
                </Button>
              </CardFooter>
            </Card>

            {/* Abonnement-Verwaltung */}
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <CardTitle className="text-emerald-800 text-base flex items-center gap-2">
                  <CreditCard className="h-5 w-5 shrink-0" />
                  <span>Abonnement-Verwaltung</span>
                </CardTitle>
                <CardDescription className="text-emerald-600">
                  Abonnements und Zahlungsinformationen verwalten
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex justify-center">
                <Button 
                  variant="default" 
                  className="bg-emerald-600 hover:bg-emerald-700 w-full" 
                  onClick={() => navigate("/subscription")}
                >
                  Öffnen
                </Button>
              </CardFooter>
            </Card>
            
            {/* Datenübertragung */}
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <CardTitle className="text-amber-800 text-base flex items-center gap-2">
                  <Database className="h-5 w-5 shrink-0" />
                  <span>Datenübertragung</span>
                </CardTitle>
                <CardDescription className="text-amber-600">
                  Datenaustausch und Datenbankmigration
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex justify-center">
                <Button 
                  variant="default" 
                  className="bg-amber-600 hover:bg-amber-700 w-full" 
                  onClick={() => navigate("/db-migration")}
                >
                  Öffnen
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}