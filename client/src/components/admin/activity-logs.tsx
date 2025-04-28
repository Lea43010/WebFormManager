import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Loader2, DownloadIcon, FilterIcon, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Anzahl der Logs pro Seite
const ITEMS_PER_PAGE = 25;

// Formatiere Datum und Zeit für die Anzeige
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'dd.MM.yyyy HH:mm:ss', { locale: de });
};

// Helfer-Funktion, um die Badge-Farbe je nach Aktionstyp zu bestimmen
const getActionTypeBadgeVariant = (actionType: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (actionType) {
    case 'CREATE':
      return 'default'; // Grün
    case 'UPDATE':
      return 'secondary'; // Violett
    case 'DELETE':
      return 'destructive'; // Rot
    default:
      return 'outline'; // Standard
  }
};

export function ActivityLogs() {
  const { toast } = useToast();
  
  // Filter-Status
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState<string>('');
  const [component, setComponent] = useState<string>('');
  const [actionType, setActionType] = useState<string>('');
  const [entityType, setEntityType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Abfrage der Filter-Optionen
  const { data: filterOptions, isLoading: filtersLoading } = useQuery({
    queryKey: ['/api/admin/activity-logs/filters'],
    staleTime: 3600000, // 1 Stunde cachen
  });
  
  // Aufbereiten der Abfragefilter
  const getQueryFilters = () => {
    const filters: Record<string, string> = {
      limit: ITEMS_PER_PAGE.toString(),
      offset: ((page - 1) * ITEMS_PER_PAGE).toString(),
    };
    
    if (userId) filters.userId = userId;
    if (component) filters.component = component;
    if (actionType) filters.actionType = actionType;
    if (entityType) filters.entityType = entityType;
    
    if (dateFrom) {
      filters.dateFrom = format(dateFrom, 'yyyy-MM-dd');
    }
    
    if (dateTo) {
      // Auf Ende des Tages setzen
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filters.dateTo = format(endOfDay, 'yyyy-MM-dd HH:mm:ss');
    }
    
    return filters;
  };
  
  // Tab-spezifische Filter anwenden
  useEffect(() => {
    if (activeTab === 'all') {
      setActionType('');
    } else {
      setActionType(activeTab.toUpperCase());
    }
    
    // Zurück zur ersten Seite
    setPage(1);
  }, [activeTab]);
  
  // Abfrage der Aktivitätsprotokolle mit Filtern
  const { 
    data: logsData, 
    isLoading: logsLoading, 
    refetch: refetchLogs 
  } = useQuery({
    queryKey: ['/api/admin/activity-logs', getQueryFilters()],
    refetchOnWindowFocus: false
  });
  
  // Filter zurücksetzen
  const resetFilters = () => {
    setUserId('');
    setComponent('');
    setEntityType('');
    setDateFrom(null);
    setDateTo(null);
    setActiveTab('all');
    setActionType('');
    setPage(1);
  };
  
  // Aktivitätslogs exportieren (CSV)
  const exportLogs = async () => {
    try {
      if (!logsData || !logsData.logs || logsData.logs.length === 0) {
        toast({
          title: "Keine Daten zum Exportieren",
          description: "Es sind keine Aktivitätsprotokolle vorhanden, die exportiert werden können.",
          variant: "destructive"
        });
        return;
      }
      
      // CSV-Kopfzeile
      let csv = "ID,Benutzer,Komponente,Aktion,Entitätstyp,Entitäts-ID,Details,Datum,IP-Adresse\n";
      
      // CSV-Zeilen
      logsData.logs.forEach((log: any) => {
        // Bereinigt Details (JSON) für den CSV-Export
        const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
        
        csv += [
          log.id,
          `${log.username || ''} (${log.user_name || ''})`,
          log.component || '',
          log.action_type || '',
          log.entity_type || '',
          log.entity_id || '',
          `"${details}"`, // In Anführungszeichen für CSV-Sicherheit
          log.created_at ? formatDateTime(log.created_at) : '',
          log.ip_address || ''
        ].join(',') + '\n';
      });
      
      // CSV-Datei erstellen und herunterladen
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `aktivitaetsprotokolle_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export erfolgreich",
        description: `${logsData.logs.length} Aktivitätsprotokolle wurden exportiert.`,
      });
    } catch (error) {
      console.error("Fehler beim Exportieren:", error);
      toast({
        title: "Export fehlgeschlagen",
        description: "Beim Exportieren der Aktivitätsprotokolle ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="bg-muted/50">
        <CardTitle className="text-xl font-bold">Aktivitätsprotokolle</CardTitle>
        <CardDescription>
          Anzeige aller Benutzeraktivitäten im System
        </CardDescription>
      </CardHeader>
      
      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <div className="px-4 pt-4 flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="all">Alle Aktivitäten</TabsTrigger>
            <TabsTrigger value="create">Erstellungen</TabsTrigger>
            <TabsTrigger value="update">Änderungen</TabsTrigger>
            <TabsTrigger value="delete">Löschungen</TabsTrigger>
            <TabsTrigger value="login">Anmeldungen</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetFilters}
              disabled={logsLoading}
            >
              <FilterIcon className="h-4 w-4 mr-1" />
              Filter zurücksetzen
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetchLogs} 
              disabled={logsLoading}
            >
              <RefreshCcw className="h-4 w-4 mr-1" />
              Aktualisieren
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportLogs} 
              disabled={logsLoading || !logsData || !logsData.logs || logsData.logs.length === 0}
            >
              <DownloadIcon className="h-4 w-4 mr-1" />
              Exportieren
            </Button>
          </div>
        </div>
        
        {/* Filter-Bereich */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium">Benutzer-ID</label>
            <Input 
              placeholder="Benutzer-ID" 
              value={userId} 
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Komponente</label>
            <Select 
              value={component} 
              onValueChange={(value) => {
                setComponent(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Komponente auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Komponenten</SelectItem>
                {filterOptions?.components?.map((comp: string) => (
                  <SelectItem key={comp} value={comp}>
                    {comp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Entitätstyp</label>
            <Select 
              value={entityType} 
              onValueChange={(value) => {
                setEntityType(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Entitätstyp auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Entitätstypen</SelectItem>
                {filterOptions?.entityTypes?.map((type: string) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Von Datum</label>
            <DatePicker
              date={dateFrom}
              setDate={(date) => {
                setDateFrom(date);
                setPage(1);
              }}
              placeholder="Von Datum"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Bis Datum</label>
            <DatePicker
              date={dateTo}
              setDate={(date) => {
                setDateTo(date);
                setPage(1);
              }}
              placeholder="Bis Datum"
            />
          </div>
        </div>
        
        <TabsContent value={activeTab} className="m-0">
          <CardContent className="p-0">
            {/* Ladezustand */}
            {(logsLoading || filtersLoading) && (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Daten werden geladen...</span>
              </div>
            )}
            
            {/* Keine Daten vorhanden */}
            {!logsLoading && (!logsData?.logs || logsData.logs.length === 0) && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-lg font-medium mb-2">Keine Aktivitätsprotokolle gefunden</p>
                <p className="text-muted-foreground">
                  Passen Sie die Filter an oder versuchen Sie es später erneut.
                </p>
              </div>
            )}
            
            {/* Daten-Tabelle */}
            {!logsLoading && logsData?.logs && logsData.logs.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Benutzer</TableHead>
                        <TableHead>Komponente</TableHead>
                        <TableHead>Aktion</TableHead>
                        <TableHead>Entität</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>IP-Adresse</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsData.logs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.username || 'N/A'} <br />
                            <span className="text-xs text-muted-foreground">
                              {log.user_name || ''}
                            </span>
                          </TableCell>
                          <TableCell>{log.component || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={getActionTypeBadgeVariant(log.action_type)}>
                              {log.action_type || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.entity_type || 'N/A'}
                            {log.entity_id && (
                              <span className="text-xs text-muted-foreground block">
                                ID: {log.entity_id}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {log.details ? (
                              <details>
                                <summary className="cursor-pointer text-sm">Details anzeigen</summary>
                                <pre className="text-xs mt-1 p-2 bg-muted rounded-md overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            ) : (
                              <span className="text-muted-foreground">Keine Details</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.created_at ? formatDateTime(log.created_at) : 'N/A'}
                          </TableCell>
                          <TableCell>{log.ip_address || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Paginierung */}
                {logsData.pagination && logsData.pagination.total > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-end p-4 border-t">
                    <Pagination
                      currentPage={page}
                      totalPages={logsData.pagination.pages}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}