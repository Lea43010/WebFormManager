import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Download, 
  Info, 
  FileText, 
  Building2, 
  Users, 
  BarChart3, 
  Map, 
  CalendarDays, 
  BookOpen
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showMigration, setShowMigration] = useState(false);

  const downloadFile = (filename: string) => {
    // Create the full URL with the protocol and host
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/downloads/${filename}`;
    
    console.log("Downloading file from URL:", url);
    
    // Direkter Download über ein neues Fenster
    window.open(url, '_blank');
    
    toast({
      title: "Download gestartet",
      description: `Die Datei ${filename} wird in einem neuen Tab geöffnet. Speichern Sie sie mit Rechtsklick > Speichern unter...`,
    });
  };

  return (
    <DashboardLayout title="Dashboard" tabs={[]}>
      <div className="flex flex-col gap-4">
        {/* Hinweis-Card - kompakt für alle Geräte */}
        <Card className="bg-amber-50 border-amber-300">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800 text-base sm:text-lg">
              <Info className="h-5 w-5" />
              Wichtiger Hinweis zur Reihenfolge der Dateneingabe
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3">
            <p className="text-amber-800 text-sm sm:text-base">
              Um ein neues Projekt anzulegen, müssen Sie zuerst <strong>Unternehmen</strong> und <strong>Kunden</strong> eintragen. 
              Bitte stellen Sie sicher, dass diese Daten vorhanden sind, bevor Sie ein Projekt erstellen.
            </p>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 pt-0">
            <Button 
              variant="outline" 
              size="sm"
              className="text-amber-800 border-amber-300 hover:bg-amber-100"
              onClick={() => navigate("/companies")}
            >
              <Building2 className="h-4 w-4 mr-1" /> Unternehmen
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-amber-800 border-amber-300 hover:bg-amber-100"
              onClick={() => navigate("/customers")}
            >
              <Users className="h-4 w-4 mr-1" /> Kunden
            </Button>
          </CardFooter>
        </Card>
        
        {/* Hauptbereich - Schnellzugriff auf die wichtigsten Module */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-3">
              <CardTitle className="text-green-800 text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-700" />
                Projekte
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-3 pt-0">
              <Button variant="default" className="w-full text-sm bg-green-600 hover:bg-green-700" 
                      onClick={() => navigate("/projects")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-3">
              <CardTitle className="text-blue-800 text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-700" />
                Unternehmen
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-3 pt-0">
              <Button variant="default" className="w-full text-sm bg-blue-600 hover:bg-blue-700" 
                      onClick={() => navigate("/companies")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-3">
              <CardTitle className="text-purple-800 text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-700" />
                Kunden
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-3 pt-0">
              <Button variant="default" className="w-full text-sm bg-purple-600 hover:bg-purple-700" 
                      onClick={() => navigate("/customers")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-3">
              <CardTitle className="text-indigo-800 text-base flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-indigo-700" />
                Bautagebuch
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-3 pt-0">
              <Button variant="default" className="w-full text-sm bg-indigo-600 hover:bg-indigo-700" 
                      onClick={() => navigate("/attachments")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-3">
              <CardTitle className="text-yellow-800 text-base flex items-center gap-2">
                <Map className="h-5 w-5 text-yellow-700" />
                Geo-Map
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-3 pt-0">
              <Button variant="default" className="w-full text-sm bg-yellow-600 hover:bg-yellow-700" 
                      onClick={() => navigate("/geo-map")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-3">
              <CardTitle className="text-red-800 text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-red-700" />
                Hilfe & Info
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-3 pt-0">
              <Button variant="default" className="w-full text-sm bg-red-600 hover:bg-red-700" 
                      onClick={() => navigate("/information")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          {user?.role === 'administrator' && (
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-3">
                <CardTitle className="text-slate-800 text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-slate-700" />
                  Admin
                </CardTitle>
              </CardHeader>
              <CardFooter className="p-3 pt-0">
                <Button variant="default" className="w-full text-sm bg-slate-600 hover:bg-slate-700" 
                      onClick={() => navigate("/admin")}>
                  Öffnen
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        {/* Datenbank-Migration Card - nur für Administratoren */}
        {user?.role === 'administrator' && (
          <Card className="mt-2">
            <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium flex items-center">
                  <Database className="h-4 w-4 mr-2 text-primary" />
                  Datenbank-Migration
                </CardTitle>
                <CardDescription>Migration zu Supabase</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowMigration(!showMigration)}>
                {showMigration ? "Ausblenden" : "Anzeigen"}
              </Button>
            </CardHeader>
            {showMigration && (
              <>
                <CardContent className="py-2">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Button 
                      onClick={() => downloadFile('migration_schema.sql')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" /> Schema herunterladen
                    </Button>
                    <Button 
                      onClick={() => downloadFile('data_inserts.sql')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" /> Daten herunterladen
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="bg-gray-50 p-3 rounded-lg w-full">
                    <h3 className="text-xs font-bold mb-1">Anleitung zur Migration</h3>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Erstellen Sie ein Supabase-Projekt mit leerer Postgres-Datenbank</li>
                      <li>Führen Sie zuerst <code className="bg-gray-200 px-1 rounded">migration_schema.sql</code> aus</li>
                      <li>Führen Sie dann <code className="bg-gray-200 px-1 rounded">data_inserts.sql</code> aus</li>
                      <li>Aktualisieren Sie die Umgebungsvariablen mit den Supabase-Daten</li>
                    </ol>
                  </div>
                </CardFooter>
              </>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}