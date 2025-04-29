import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, BarChart2, CheckCircle, ChevronDown, Database, Download, FileText, Filter, Loader2, RefreshCw, Table, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Hilfsfunktionen für Formatierung
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Typdefinitionen
type Report = {
  filename: string;
  type: 'profile' | 'outlier' | 'expectations' | 'validation' | 'summary' | 'unknown';
  createdAt: string;
  size: number;
  path: string;
};

type TableInfo = {
  table_name: string;
  column_count: number;
};

function ReportCard({ report, onDelete }: { report: Report, onDelete: (filename: string) => void }) {
  const { toast } = useToast();
  
  const getIcon = () => {
    switch (report.type) {
      case 'profile':
        return <BarChart2 className="h-8 w-8 text-blue-500" />;
      case 'outlier':
        return <AlertTriangle className="h-8 w-8 text-amber-500" />;
      case 'expectations':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'validation':
        return <CheckCircle className="h-8 w-8 text-violet-500" />;
      case 'summary':
        return <FileText className="h-8 w-8 text-slate-500" />;
      default:
        return <FileText className="h-8 w-8 text-slate-500" />;
    }
  };
  
  const getTitle = () => {
    switch (report.type) {
      case 'profile':
        return 'Datenprofilierung';
      case 'outlier':
        return 'Ausreißer-Analyse';
      case 'expectations':
        return 'Daten-Erwartungen';
      case 'validation':
        return 'Datenvalidierung';
      case 'summary':
        return 'Zusammenfassung';
      default:
        return report.filename;
    }
  };
  
  const getDescription = () => {
    const tableName = getTableName();
    switch (report.type) {
      case 'profile':
        return `Umfassende Analyse der Tabelle ${tableName}`;
      case 'outlier':
        return `Identifizierte Ausreißer in der Tabelle ${tableName}`;
      case 'expectations':
        return `Definierte Datenqualitätserwartungen für ${tableName}`;
      case 'validation':
        return `Validierungsergebnisse für die Tabelle ${tableName}`;
      case 'summary':
        return `Zusammenfassung der Datenqualitätsprüfung`;
      default:
        return `Bericht: ${report.filename}`;
    }
  };
  
  const getTableName = () => {
    const match = report.filename.match(/(?:profil|ausreisser|erwartungen|validierung)_(.+?)(?:_\d{8}|\.\w+$)/);
    return match ? match[1] : 'Alle Tabellen';
  };
  
  const handleView = () => {
    window.open(report.path, '_blank');
  };
  
  const handleDelete = async () => {
    try {
      await apiRequest('DELETE', report.path);
      toast({
        title: 'Bericht gelöscht',
        description: `Der Bericht "${report.filename}" wurde erfolgreich gelöscht.`,
      });
      onDelete(report.filename);
    } catch (error) {
      toast({
        title: 'Fehler beim Löschen',
        description: `Der Bericht konnte nicht gelöscht werden: ${error}`,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start space-y-0 pb-2">
        <div className="space-y-1 flex-1">
          <CardTitle className="text-lg">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </div>
        <div className="flex items-center space-x-1">
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent className="text-sm pb-2">
        <div className="flex justify-between text-muted-foreground">
          <span>Erstellt am: {formatDate(new Date(report.createdAt))}</span>
          <span>Größe: {formatBytes(report.size)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Badge variant="outline" className="text-xs">{report.type}</Badge>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Löschen
          </Button>
          <Button size="sm" onClick={handleView}>
            <FileText className="h-4 w-4 mr-1" />
            Ansehen
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function QualityCheckForm({ tables }: { tables: TableInfo[] }) {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<string | undefined>();
  const [profile, setProfile] = useState(true);
  const [outliers, setOutliers] = useState(true);
  const [validate, setValidate] = useState(true);
  const [limit, setLimit] = useState<string | undefined>();
  const [isRunning, setIsRunning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsRunning(true);
    
    try {
      const response = await apiRequest('POST', '/api/data-quality/run', {
        table: selectedTable,
        profile,
        outliers,
        validate,
        limit: limit ? parseInt(limit) : undefined,
      });
      
      const data = await response.json();
      
      toast({
        title: 'Datenqualitätsprüfung gestartet',
        description: 'Die Analyse wurde im Hintergrund gestartet. Die Ergebnisse erscheinen in der Übersicht, sobald die Verarbeitung abgeschlossen ist.',
      });
      
      console.log('Qualitätsprüfung gestartet:', data);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: `Die Datenqualitätsprüfung konnte nicht gestartet werden: ${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="table-select">Tabelle auswählen</Label>
        <Select value={selectedTable} onValueChange={setSelectedTable}>
          <SelectTrigger id="table-select">
            <SelectValue placeholder="Alle Tabellen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle Tabellen</SelectItem>
            {tables?.map((table) => (
              <SelectItem key={table.table_name} value={table.table_name}>
                {table.table_name} ({table.column_count} Spalten)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>Analysearten</Label>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="profile" checked={profile} onCheckedChange={(checked) => setProfile(!!checked)} />
              <Label htmlFor="profile" className="cursor-pointer">Datenprofilierung (Vollständige Datenanalyse)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="outliers" checked={outliers} onCheckedChange={(checked) => setOutliers(!!checked)} />
              <Label htmlFor="outliers" className="cursor-pointer">Ausreißer-Erkennung (Statistische Anomalien)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="validate" checked={validate} onCheckedChange={(checked) => setValidate(!!checked)} />
              <Label htmlFor="validate" className="cursor-pointer">Datenvalidierung (Regelbasierte Überprüfung)</Label>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="limit-input">Datensatzlimit (optional)</Label>
          <Input 
            id="limit-input" 
            value={limit || ''} 
            onChange={(e) => setLimit(e.target.value)}
            type="number"
            min="1"
            placeholder="Alle Datensätze"
          />
          <p className="text-xs text-muted-foreground">
            Begrenzt die Anzahl der analysierten Datensätze. Hilfreich bei großen Tabellen.
          </p>
        </div>
      </div>
      
      <Button type="submit" disabled={isRunning} className="w-full">
        {isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Datenqualitätsprüfung läuft...
          </>
        ) : (
          <>
            <BarChart2 className="mr-2 h-4 w-4" />
            Datenqualitätsprüfung starten
          </>
        )}
      </Button>
    </form>
  );
}

export default function DataQualityDashboard() {
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  // Berichte abrufen
  const { 
    data: reportsData,
    isLoading: isLoadingReports,
    error: reportsError
  } = useQuery({
    queryKey: ['/api/data-quality/reports', refreshKey],
    retry: false,
  });

  // Tabellen abrufen
  const { 
    data: tablesData,
    isLoading: isLoadingTables,
    error: tablesError
  } = useQuery({
    queryKey: ['/api/data-quality/tables', refreshKey],
    retry: false,
  });

  // Fehlerbehandlung
  useEffect(() => {
    if (reportsError) {
      toast({
        title: 'Fehler beim Laden der Berichte',
        description: String(reportsError),
        variant: 'destructive',
      });
    }
    
    if (tablesError) {
      toast({
        title: 'Fehler beim Laden der Tabellenliste',
        description: String(tablesError),
        variant: 'destructive',
      });
    }
  }, [reportsError, tablesError, toast]);

  // Aktualisierung der Berichte
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Löschung eines Berichts
  const handleDeleteReport = (filename: string) => {
    handleRefresh();
  };

  // Gefilterte Berichte
  // Typensichere Extrahierung der Berichte
  const reports: Report[] = (() => {
    if (!reportsData || typeof reportsData !== 'object' || reportsData === null) return [];
    if (!('reports' in reportsData) || !Array.isArray(reportsData.reports)) return [];
    return reportsData.reports as Report[];
  })();
  
  const filteredReports = filterType 
    ? reports.filter((report) => report.type === filterType)
    : reports;

  // Typensichere Extrahierung der Tabellen
  const tables: TableInfo[] = (() => {
    if (!tablesData || typeof tablesData !== 'object' || tablesData === null) return [];
    if (!('tables' in tablesData) || !Array.isArray(tablesData.tables)) return [];
    return tablesData.tables as TableInfo[];
  })();

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart2 className="h-8 w-8 mr-2 text-primary" />
          <h1 className="text-3xl font-bold">Datenqualitäts-Dashboard</h1>
        </div>
        <Button variant="ghost" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>
      
      <Tabs defaultValue="reports">
        <TabsList className="mb-4">
          <TabsTrigger value="reports" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Qualitätsberichte
          </TabsTrigger>
          <TabsTrigger value="run" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            Neue Prüfung
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            Automatisierung
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Datenqualitätsberichte</CardTitle>
              <CardDescription>
                Übersicht aller durchgeführten Datenqualitätsprüfungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">
                    {filteredReports.length} {filteredReports.length === 1 ? 'Bericht' : 'Berichte'} gefunden
                  </span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Nach Typ filtern</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => setFilterType(undefined)}>
                        <span className={!filterType ? 'font-bold' : ''}>Alle Typen</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterType('profile')}>
                        <span className={filterType === 'profile' ? 'font-bold' : ''}>Datenprofilierung</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterType('outlier')}>
                        <span className={filterType === 'outlier' ? 'font-bold' : ''}>Ausreißer-Analyse</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterType('expectations')}>
                        <span className={filterType === 'expectations' ? 'font-bold' : ''}>Daten-Erwartungen</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterType('validation')}>
                        <span className={filterType === 'validation' ? 'font-bold' : ''}>Datenvalidierung</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterType('summary')}>
                        <span className={filterType === 'summary' ? 'font-bold' : ''}>Zusammenfassung</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {isLoadingReports ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-muted-foreground">Lade Berichte...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-muted/50">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Keine Berichte gefunden</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Es wurden noch keine Datenqualitätsprüfungen durchgeführt.
                  </p>
                  <Button onClick={() => {
                      // Navigieren zum Reiter "run" manuell
                      const tabsContent = document.querySelectorAll('[role="tabpanel"]');
                      tabsContent.forEach((panel) => {
                        if (panel.getAttribute('data-state') === 'active') {
                          panel.setAttribute('data-state', 'inactive');
                        }
                        if (panel.getAttribute('value') === 'run') {
                          panel.setAttribute('data-state', 'active');
                        }
                      });
                      
                      const tabs = document.querySelectorAll('[role="tab"]');
                      tabs.forEach((tab) => {
                        if (tab.getAttribute('data-state') === 'active') {
                          tab.setAttribute('data-state', 'inactive');
                        }
                        if (tab.getAttribute('value') === 'run') {
                          tab.setAttribute('data-state', 'active');
                        }
                      });
                    }}>
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Neue Prüfung starten
                  </Button>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-muted/50">
                  <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Keine Berichte mit diesem Filter</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Es wurden keine Berichte mit dem aktuellen Filter gefunden.
                  </p>
                  <Button variant="outline" onClick={() => setFilterType(undefined)}>
                    Filter zurücksetzen
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredReports.map((report: Report) => (
                    <ReportCard 
                      key={report.filename} 
                      report={report} 
                      onDelete={handleDeleteReport} 
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="run">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Neue Datenqualitätsprüfung</CardTitle>
                  <CardDescription>
                    Starten Sie eine neue Prüfung der Datenbankqualität
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingTables ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-muted-foreground">Lade Tabellenliste...</p>
                    </div>
                  ) : (
                    <QualityCheckForm tables={tables} />
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Informationen</CardTitle>
                  <CardDescription>
                    Über die Datenqualitätsprüfung
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Datenprofilierung</h3>
                    <p className="text-sm text-muted-foreground">
                      Erstellt einen umfassenden Bericht mit Statistiken zu jeder Spalte, Korrelationen und Vollständigkeit der Daten.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-1">Ausreißer-Erkennung</h3>
                    <p className="text-sm text-muted-foreground">
                      Identifiziert statistische Anomalien und Ausreißer in numerischen Feldern mit verschiedenen Methoden.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-1">Datenvalidierung</h3>
                    <p className="text-sm text-muted-foreground">
                      Überprüft die Daten gegen vordefinierte Erwartungen und generiert einen Validierungsbericht.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-1">Hinweise</h3>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      <li>Die Analyse kann je nach Datenmenge einige Zeit in Anspruch nehmen</li>
                      <li>Bei großen Tabellen empfiehlt sich eine Begrenzung der Datensätze</li>
                      <li>Die Berichte werden automatisch in der Übersicht angezeigt</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Automatisierte Prüfungen</CardTitle>
              <CardDescription>
                Richten Sie regelmäßige Datenqualitätsprüfungen ein
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-center py-8 border rounded-lg bg-muted/50">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Funktion in Entwicklung</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  Die automatische Planung regelmäßiger Datenqualitätsprüfungen wird in einem zukünftigen Update verfügbar sein.
                </p>
                <Button variant="outline" disabled>
                  Demnächst verfügbar
                </Button>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Zukünftige Features: Zeitplanung, Benachrichtigungen, bedingte Prüfungen
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}