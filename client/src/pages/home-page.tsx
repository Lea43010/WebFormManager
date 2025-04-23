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
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Hinweis-Card - kompakt für alle Geräte */}
        <Card className="bg-amber-50 border-amber-300">
          <CardHeader className="p-2 sm:pb-2 sm:pt-3 sm:px-3">
            <CardTitle className="flex items-center gap-1 sm:gap-2 text-amber-800 text-sm sm:text-base md:text-lg">
              <Info className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="line-clamp-2">Reihenfolge der Dateneingabe</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2 sm:px-3 sm:pb-3">
            <p className="text-amber-800 text-xs sm:text-sm md:text-base">
              Um ein neues Projekt anzulegen, müssen Sie zuerst <strong>Unternehmen</strong> und <strong>Kunden</strong> eintragen. 
              Bitte stellen Sie sicher, dass diese Daten vorhanden sind.
            </p>
          </CardContent>
        </Card>
        
        {/* Hauptbereich - Schnellzugriff auf die wichtigsten Module */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {/* Projektekarte */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-green-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Projekte</span>
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-2 sm:p-3 pt-0">
              <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-green-600 hover:bg-green-700" 
                      onClick={() => navigate("/projects")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          {/* Unternehmenskarte */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-blue-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Unternehmen</span>
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-2 sm:p-3 pt-0">
              <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-blue-600 hover:bg-blue-700" 
                      onClick={() => navigate("/companies")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          {/* Kundenkarte */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-purple-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Kunden</span>
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-2 sm:p-3 pt-0">
              <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-purple-600 hover:bg-purple-700" 
                      onClick={() => navigate("/customers")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          {/* Bautagebuchkarte */}
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-indigo-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Bautagebuch</span>
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-2 sm:p-3 pt-0">
              <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-indigo-600 hover:bg-indigo-700" 
                      onClick={() => navigate("/attachments")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          {/* Geomapkarte */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-yellow-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                <Map className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Geo-Map</span>
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-2 sm:p-3 pt-0">
              <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-yellow-600 hover:bg-yellow-700" 
                      onClick={() => navigate("/geo-map")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          {/* Hilfekarte */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-red-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Hilfe & Info</span>
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-2 sm:p-3 pt-0">
              <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-red-600 hover:bg-red-700" 
                      onClick={() => navigate("/information")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          {/* Admin-Karte - nur für Administratoren */}
          {user?.role === 'administrator' && (
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-2 sm:p-3">
                <CardTitle className="text-slate-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="truncate">Admin</span>
                </CardTitle>
              </CardHeader>
              <CardFooter className="p-2 sm:p-3 pt-0">
                <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-slate-600 hover:bg-slate-700" 
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
            <CardHeader className="py-2 sm:py-3 px-2 sm:px-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                  <Database className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-primary" />
                  Datenbank-Migration
                </CardTitle>
                <CardDescription className="text-xs">Migration zu Supabase</CardDescription>
              </div>
              <Button variant="ghost" size="sm" 
                      className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                      onClick={() => setShowMigration(!showMigration)}>
                {showMigration ? "Ausblenden" : "Anzeigen"}
              </Button>
            </CardHeader>
            {showMigration && (
              <>
                <CardContent className="py-2 px-2 sm:px-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <Button 
                      onClick={() => downloadFile('migration_schema.sql')}
                      variant="outline"
                      size="sm"
                      className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Schema
                    </Button>
                    <Button 
                      onClick={() => downloadFile('data_inserts.sql')}
                      variant="outline"
                      size="sm"
                      className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Daten
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="p-2 sm:p-3">
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg w-full">
                    <h3 className="text-2xs sm:text-xs font-bold mb-1">Migrations-Anleitung</h3>
                    <ol className="list-decimal list-inside space-y-1 text-2xs sm:text-xs">
                      <li>Supabase-Projekt mit leerer Postgres-DB erstellen</li>
                      <li>Zuerst <code className="bg-gray-200 px-1 rounded text-2xs sm:text-xs">migration_schema.sql</code> ausführen</li>
                      <li>Dann <code className="bg-gray-200 px-1 rounded text-2xs sm:text-xs">data_inserts.sql</code> ausführen</li>
                      <li>Umgebungsvariablen mit Supabase-Daten aktualisieren</li>
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