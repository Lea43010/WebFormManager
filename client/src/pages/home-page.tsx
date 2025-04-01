import { useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, Download } from "lucide-react";

export default function HomePage() {
  const { toast } = useToast();
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Projekte</CardTitle>
            <CardDescription>Übersicht aller Projekte</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Verwalten Sie Ihre Projekte und deren Anhänge.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.href = "/projects"}>
              Zu den Projekten
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unternehmen</CardTitle>
            <CardDescription>Übersicht aller Unternehmen</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Verwalten Sie Ihre Unternehmensdaten.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.href = "/companies"}>
              Zu den Unternehmen
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kunden</CardTitle>
            <CardDescription>Übersicht aller Kunden</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Verwalten Sie Ihre Kundendaten.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.href = "/customers"}>
              Zu den Kunden
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Datenbank-Migration</CardTitle>
              <CardDescription>Migration zu Supabase</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setShowMigration(!showMigration)}>
              {showMigration ? "Ausblenden" : "Anzeigen"}
            </Button>
          </CardHeader>
          {showMigration && (
            <>
              <CardContent>
                <div className="mb-4">
                  <p className="text-gray-600">
                    Hier können Sie die für die Migration zu Supabase notwendigen SQL-Dateien herunterladen.
                    Diese Dateien enthalten das Datenbankschema und die vorhandenen Daten.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Datenbankschema</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Diese Datei enthält die Struktur der Datenbank (Tabellen, Indizes, etc.) ohne Daten.
                      Sie müssen diese zuerst in Supabase ausführen.
                    </p>
                    <Button 
                      onClick={() => downloadFile('migration_schema.sql')}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" /> Schema herunterladen
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Datenbankdaten</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Diese Datei enthält nur die Daten der Tabellen. Laden Sie diese Datei nach dem Anlegen
                      der Datenbankstruktur in Supabase hoch.
                    </p>
                    <Button 
                      onClick={() => downloadFile('data_inserts.sql')}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" /> Daten herunterladen
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="bg-gray-50 p-4 rounded-lg w-full">
                  <h3 className="text-sm font-bold mb-2">Anleitung zur Migration</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Erstellen Sie ein neues Projekt in Supabase mit einer leeren Postgres-Datenbank</li>
                    <li>Gehen Sie zum SQL-Editor in Ihrem Supabase-Dashboard</li>
                    <li>Laden Sie zuerst die Datei <code className="bg-gray-200 px-1 rounded">migration_schema.sql</code> hoch und führen Sie diese aus</li>
                    <li>Laden Sie dann die Datei <code className="bg-gray-200 px-1 rounded">data_inserts.sql</code> hoch und führen Sie diese aus</li>
                    <li>Notieren Sie sich die Verbindungsdaten Ihrer Supabase-Datenbank</li>
                    <li>Aktualisieren Sie die Umgebungsvariablen in Ihrer Replit-Umgebung mit den Supabase-Verbindungsdaten</li>
                  </ol>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}