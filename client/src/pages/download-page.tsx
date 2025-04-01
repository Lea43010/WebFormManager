import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { Download, Database } from "lucide-react";

export default function DownloadPage() {
  const { toast } = useToast();

  const downloadFile = (filename: string) => {
    // Create the full URL with the protocol and host
    // Dies ist wichtig, da relative URLs möglicherweise nicht funktionieren
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/downloads/${filename}`;
    
    console.log("Downloading file from URL:", url);
    
    // Direkter Download über ein neues Fenster (bessere Browser-Kompatibilität)
    window.open(url, '_blank');
    
    toast({
      title: "Download gestartet",
      description: `Die Datei ${filename} wird in einem neuen Tab geöffnet. Speichern Sie sie mit Rechtsklick > Speichern unter...`,
    });
  };

  return (
    <DashboardLayout title="Datenbank Migration" tabs={[]}>
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Migration zu Supabase</h2>
          <p className="text-gray-600">
            Hier können Sie die für die Migration zu Supabase notwendigen SQL-Dateien herunterladen.
            Diese Dateien enthalten das Datenbankschema und die vorhandenen Daten.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Datenbankschema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Diese Datei enthält die Struktur der Datenbank (Tabellen, Indizes, etc.) ohne Daten.
                Sie müssen diese zuerst in Supabase ausführen.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => downloadFile('migration_schema.sql')}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" /> Schema herunterladen
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Datenbankdaten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Diese Datei enthält nur die Daten der Tabellen. Laden Sie diese Datei nach dem Anlegen
                der Datenbankstruktur in Supabase hoch.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => downloadFile('data_inserts.sql')}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" /> Daten herunterladen
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-gray-100 rounded-lg">
          <h3 className="text-xl font-bold mb-3">Anleitung zur Migration</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Erstellen Sie ein neues Projekt in Supabase mit einer leeren Postgres-Datenbank</li>
            <li>Gehen Sie zum SQL-Editor in Ihrem Supabase-Dashboard</li>
            <li>Laden Sie zuerst die Datei <code>migration_schema.sql</code> hoch und führen Sie diese aus</li>
            <li>Laden Sie dann die Datei <code>data_inserts.sql</code> hoch und führen Sie diese aus</li>
            <li>Notieren Sie sich die Verbindungsdaten Ihrer Supabase-Datenbank</li>
            <li>Aktualisieren Sie die Umgebungsvariablen in Ihrer Replit-Umgebung mit den Supabase-Verbindungsdaten</li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  );
}