import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  FileWarning, 
  Mail, 
  Phone, 
  User, 
  FileCheck, 
  PieChart, 
  AlertCircle, 
  BarChart,
  Download,
  Code,
  FileJson
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";

// Typdefinitionen
interface DataQualityReport {
  totalRecords: number;
  issues: {
    type: string;
    count: number;
    severity: "low" | "medium" | "high";
    description: string;
    affectedEntities: string[];
  }[];
  overallScore: number;
  lastUpdated: string;
}

interface DataQualityIssue {
  id: number;
  entityType: string;
  entityId: number;
  entityName: string;
  issueType: string;
  issueDescription: string;
  severity: "low" | "medium" | "high";
  detected: string;
  resolved: boolean;
  resolvedAt?: string;
}

export function DataQualityManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [issues, setIssues] = useState<DataQualityIssue[]>([]);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [issueFilter, setIssueFilter] = useState<string | null>(null);
  const [jsonReport, setJsonReport] = useState<string>("");

  // Mock-Daten für Entwicklungszwecke
  const mockReport: DataQualityReport = {
    totalRecords: 1243,
    issues: [
      { 
        type: "email", 
        count: 23, 
        severity: "high", 
        description: "Ungültige E-Mail-Adressen", 
        affectedEntities: ["Kunden", "Benutzer", "Kontakte"] 
      },
      { 
        type: "phone", 
        count: 15, 
        severity: "medium", 
        description: "Ungültige Telefonnummern", 
        affectedEntities: ["Kunden", "Kontakte"] 
      },
      { 
        type: "duplicate", 
        count: 8, 
        severity: "medium", 
        description: "Duplikate bei Mitarbeitern", 
        affectedEntities: ["Bautagebuch"] 
      },
      { 
        type: "missing", 
        count: 32, 
        severity: "low", 
        description: "Fehlende optionale Felder", 
        affectedEntities: ["Projekte", "Kunden"] 
      },
    ],
    overallScore: 87,
    lastUpdated: new Date().toISOString()
  };

  const mockIssues: DataQualityIssue[] = [
    {
      id: 1,
      entityType: "Kunde",
      entityId: 6,
      entityName: "Mustermann GmbH",
      issueType: "email",
      issueDescription: "Ungültige E-Mail-Adresse: mustermann@gmial.com",
      severity: "high",
      detected: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      resolved: false
    },
    {
      id: 2,
      entityType: "Kontakt",
      entityId: 3,
      entityName: "Max Mustermann",
      issueType: "phone",
      issueDescription: "Ungültige Telefonnummer: 01234-56789000",
      severity: "medium",
      detected: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      resolved: false
    },
    {
      id: 3,
      entityType: "Mitarbeiter",
      entityId: 7,
      entityName: "Hans Schmidt",
      issueType: "duplicate",
      issueDescription: "Mögliches Duplikat: Hans Schmitt (ID: 12)",
      severity: "medium",
      detected: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      resolved: true,
      resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Simuliere API-Aufruf mit Mock-Daten
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // In Produktion hier durch echten API-Aufruf ersetzen
        // const response = await apiRequest("GET", "/api/admin/data-quality/report");
        // const data = await response.json();
        
        // Mock-Daten für die Entwicklung
        setTimeout(() => {
          setReport(mockReport);
          setIssues(mockIssues);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Fehler beim Laden des Datenqualitätsberichts:", error);
        toast({
          title: "Fehler",
          description: "Der Datenqualitätsbericht konnte nicht geladen werden.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Laden der JSON-Daten für den Datenbankstruktur-Qualitätsbericht
  useEffect(() => {
    const fetchJsonReport = async () => {
      if (selectedTab === "json-report") {
        try {
          const response = await fetch("/api/debug/data-quality/json-report");
          if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
          }
          const data = await response.json();
          setJsonReport(JSON.stringify(data, null, 2));
        } catch (error) {
          console.error("Fehler beim Laden des JSON-Berichts:", error);
          setJsonReport(JSON.stringify({
            error: "Fehler beim Laden des Berichts",
            message: error instanceof Error ? error.message : "Unbekannter Fehler"
          }, null, 2));
        }
      }
    };

    fetchJsonReport();
  }, [selectedTab]);

  // Funktion zum Markieren eines Issues als gelöst
  const markAsResolved = async (issueId: number) => {
    try {
      // In Produktion hier durch echten API-Aufruf ersetzen
      // await apiRequest("POST", `/api/admin/data-quality/issues/${issueId}/resolve`);
      
      // Mock-Implementation
      setIssues(issues.map(issue => 
        issue.id === issueId 
          ? { ...issue, resolved: true, resolvedAt: new Date().toISOString() } 
          : issue
      ));
      
      toast({
        title: "Erfolg",
        description: "Das Problem wurde als gelöst markiert.",
      });
    } catch (error) {
      console.error("Fehler beim Markieren des Problems als gelöst:", error);
      toast({
        title: "Fehler",
        description: "Das Problem konnte nicht als gelöst markiert werden.",
        variant: "destructive",
      });
    }
  };

  // Funktion zum Generieren eines Datenqualitätsberichts
  const generateReport = async () => {
    try {
      setIsLoading(true);
      // In Produktion hier durch echten API-Aufruf ersetzen
      // await apiRequest("POST", "/api/admin/data-quality/report/generate");
      
      // Mock-Implementation 
      setTimeout(() => {
        toast({
          title: "Bericht generiert",
          description: "Der Datenqualitätsbericht wurde erfolgreich erstellt."
        });
        setReport({
          ...mockReport,
          lastUpdated: new Date().toISOString()
        });
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Fehler beim Generieren des Berichts:", error);
      toast({
        title: "Fehler",
        description: "Der Bericht konnte nicht generiert werden.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Funktion zum Herunterladen eines Berichts als CSV
  const downloadReportAsCSV = () => {
    try {
      // Erstellen der CSV-Daten
      const csvHeader = "Typ;Anzahl;Schweregrad;Beschreibung;Betroffene Entitäten\n";
      const csvData = report?.issues.map(issue => 
        `${issue.type};${issue.count};${issue.severity};${issue.description};${issue.affectedEntities.join(", ")}`
      ).join("\n");
      
      // Erstellen eines Blob und Herunterladen
      const csvContent = csvHeader + csvData;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `datenqualitaetsbericht_${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.click();
      
      toast({
        title: "Download gestartet",
        description: "Der Bericht wird als CSV heruntergeladen."
      });
    } catch (error) {
      console.error("Fehler beim Herunterladen des Berichts:", error);
      toast({
        title: "Fehler",
        description: "Der Bericht konnte nicht heruntergeladen werden.",
        variant: "destructive",
      });
    }
  };

  // Funktion zum Aktivieren von automatischen Benachrichtigungen
  const enableNotifications = async () => {
    try {
      // In Produktion hier durch echten API-Aufruf ersetzen
      // await apiRequest("POST", "/api/admin/data-quality/notifications/enable");
      
      toast({
        title: "Benachrichtigungen aktiviert",
        description: "Sie erhalten nun automatische Benachrichtigungen bei Datenqualitätsproblemen."
      });
    } catch (error) {
      console.error("Fehler beim Aktivieren der Benachrichtigungen:", error);
      toast({
        title: "Fehler",
        description: "Die Benachrichtigungen konnten nicht aktiviert werden.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-36">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-sm text-muted-foreground">Datenqualitätsbericht wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Datenqualitätsmanagement</h2>
          <p className="text-muted-foreground">
            Überwachung und Verbesserung der Datenqualität im System
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateReport} className="flex gap-2">
            <PieChart className="h-4 w-4" />
            Bericht generieren
          </Button>
          <Button variant="outline" onClick={downloadReportAsCSV} className="flex gap-2">
            <Download className="h-4 w-4" />
            Als CSV exportieren
          </Button>
        </div>
      </div>
      
      {report && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Datenqualitätsübersicht</CardTitle>
                <CardDescription>
                  Letzte Aktualisierung: {format(new Date(report.lastUpdated), 'dd. MMMM yyyy, HH:mm', { locale: de })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Gesamtbewertung:</span>
                <div className="flex items-center gap-2">
                  <Progress value={report.overallScore} className="w-24 h-2" />
                  <span className="font-semibold">{report.overallScore}%</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  Übersicht
                </TabsTrigger>
                <TabsTrigger value="issues" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Probleme
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Einstellungen
                </TabsTrigger>
                <TabsTrigger value="html-report" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  HTML-Bericht
                </TabsTrigger>
                <TabsTrigger value="json-report" className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  JSON-Bericht
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Problemstatistik</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {report.issues.map((issue, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {issue.type === "email" && <Mail className="h-4 w-4 text-orange-500" />}
                              {issue.type === "phone" && <Phone className="h-4 w-4 text-blue-500" />}
                              {issue.type === "duplicate" && <User className="h-4 w-4 text-purple-500" />}
                              {issue.type === "missing" && <FileWarning className="h-4 w-4 text-yellow-500" />}
                              <span>{issue.description}</span>
                              <Badge 
                                variant={
                                  issue.severity === "high" ? "destructive" : 
                                  issue.severity === "medium" ? "default" : "outline"
                                }
                              >
                                {issue.count}
                              </Badge>
                            </div>
                            <div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  // Wechseln zum Issues-Tab und nach Typ filtern
                                  setSelectedTab("issues");
                                  setIssueFilter(issue.type);
                                }}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Datenverteilung</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] flex justify-center items-center">
                        <p className="text-muted-foreground text-center">
                          Hier werden Diagramme zur Datenverteilung angezeigt
                          <br />
                          (In der fertigen Version werden hier Grafiken dargestellt)
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="issues">
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <Badge 
                      variant={!issueFilter ? "secondary" : "outline"} 
                      className="cursor-pointer"
                      onClick={() => setIssueFilter(null)}
                    >
                      Alle
                    </Badge>
                    <Badge 
                      variant={issueFilter === "email" ? "secondary" : "outline"} 
                      className="cursor-pointer"
                      onClick={() => setIssueFilter("email")}
                    >
                      E-Mails
                    </Badge>
                    <Badge 
                      variant={issueFilter === "phone" ? "secondary" : "outline"} 
                      className="cursor-pointer"
                      onClick={() => setIssueFilter("phone")}
                    >
                      Telefonnummern
                    </Badge>
                    <Badge 
                      variant={issueFilter === "duplicate" ? "secondary" : "outline"} 
                      className="cursor-pointer"
                      onClick={() => setIssueFilter("duplicate")}
                    >
                      Duplikate
                    </Badge>
                    <Badge 
                      variant={issueFilter === "missing" ? "secondary" : "outline"} 
                      className="cursor-pointer"
                      onClick={() => setIssueFilter("missing")}
                    >
                      Fehlende Felder
                    </Badge>
                  </div>
                  
                  {issues
                    .filter(issue => !issueFilter || issue.issueType === issueFilter)
                    .map(issue => (
                    <Card key={issue.id} className={issue.resolved ? "opacity-70" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                issue.severity === "high" ? "destructive" : 
                                issue.severity === "medium" ? "default" : "outline"
                              }
                            >
                              {issue.severity === "high" ? "Hoch" : 
                               issue.severity === "medium" ? "Mittel" : "Niedrig"}
                            </Badge>
                            <CardTitle className="text-lg">{issue.entityType}: {issue.entityName}</CardTitle>
                          </div>
                          <Badge variant={issue.resolved ? "outline" : "secondary"}>
                            {issue.resolved ? "Gelöst" : "Offen"}
                          </Badge>
                        </div>
                        <CardDescription>
                          Erkannt am {format(new Date(issue.detected), 'dd. MMMM yyyy', { locale: de })}
                          {issue.resolved && issue.resolvedAt && (
                            <span> • Gelöst am {format(new Date(issue.resolvedAt), 'dd. MMMM yyyy', { locale: de })}</span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p>{issue.issueDescription}</p>
                      </CardContent>
                      {!issue.resolved && (
                        <CardFooter className="pt-2 flex justify-between">
                          <Button variant="ghost" size="sm">Details anzeigen</Button>
                          <Button variant="outline" size="sm" onClick={() => markAsResolved(issue.id)}>
                            Als gelöst markieren
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Benachrichtigungen</CardTitle>
                    <CardDescription>
                      Konfigurieren Sie, wie und wann Sie über Datenqualitätsprobleme informiert werden möchten
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">E-Mail-Benachrichtigungen</h4>
                          <p className="text-sm text-muted-foreground">
                            Erhalten Sie täglich eine Zusammenfassung neuer Datenqualitätsprobleme
                          </p>
                        </div>
                        <Button onClick={enableNotifications}>Aktivieren</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Schwellenwerte für Benachrichtigungen</h4>
                          <p className="text-sm text-muted-foreground">
                            Legen Sie fest, ab wann Sie über Probleme informiert werden möchten
                          </p>
                        </div>
                        <Button variant="outline">Konfigurieren</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Automatisierte Berichte</CardTitle>
                    <CardDescription>
                      Planen Sie regelmäßige Datenqualitätsberichte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Wöchentlicher Bericht</h4>
                          <p className="text-sm text-muted-foreground">
                            Erhalten Sie jeden Montag um 8:00 Uhr einen Datenqualitätsbericht
                          </p>
                        </div>
                        <Button variant="outline">Aktivieren</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Monatlicher Bericht</h4>
                          <p className="text-sm text-muted-foreground">
                            Erhalten Sie am ersten Tag jedes Monats einen detaillierten Bericht
                          </p>
                        </div>
                        <Button variant="outline">Aktivieren</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="html-report">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">HTML-Bericht zur Datenbankstruktur</CardTitle>
                    <CardDescription>
                      Interaktiver HTML-Bericht zur Überprüfung der Datenbankstruktur und -qualität
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="rounded border">
                        <iframe 
                          src="/api/debug/data-quality/html-report" 
                          className="w-full min-h-[600px] rounded" 
                          title="Datenbankstruktur-Qualitätsbericht"
                        ></iframe>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Der HTML-Bericht bietet eine interaktive Ansicht der Datenbankstrukturqualität
                        </p>
                        <a 
                          href="/api/debug/data-quality/html-report" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="no-underline"
                        >
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            In neuem Tab öffnen
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="json-report">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">JSON-Bericht zur Datenbankstruktur</CardTitle>
                    <CardDescription>
                      Technischer JSON-Bericht mit detaillierten Informationen zur Datenbankstruktur
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="rounded border bg-zinc-950 p-4 overflow-auto max-h-[600px]">
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                          <code>
                            {jsonReport || `Lade JSON-Daten...
// Der JSON-Bericht wird direkt vom API-Endpunkt abgerufen
// Verwenden Sie den Button unten, um den vollständigen Bericht im JSON-Format zu öffnen`}
                          </code>
                        </pre>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Der JSON-Bericht enthält technische Details zur weitergehenden Analyse
                        </p>
                        <a 
                          href="/api/debug/data-quality/json-report" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="no-underline"
                        >
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <FileJson className="h-4 w-4" />
                            JSON-Bericht öffnen
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}