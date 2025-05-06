import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Clock, Database, Filter, BarChart2, Droplet, Info, RefreshCw, Trash2, Eye, Search, ArrowDown, ArrowUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Interface für SQL-Abfragen
interface QueryLog {
  id: number;
  query: string;
  params: any[] | null;
  duration: number;
  timestamp: string;
  source: string;
  rowCount: number;
  userId: number | null;
  clientIp: string | null;
  route: string | null;
  problematic: boolean;
  analyzed: boolean;
  analysisNotes: string | null;
}

// Interface für Abfragestatistiken
interface QueryStats {
  overview: {
    total_queries: number;
    problematic_queries: number;
    avg_duration: number;
    max_duration: number;
    min_duration: number;
    median_duration: number;
    p95_duration: number;
    p99_duration: number;
  };
  frequentQueries: {
    normalized_query: string;
    count: number;
    avg_duration: number;
    max_duration: number;
    min_duration: number;
  }[];
  sourceStats: {
    source: string;
    count: number;
    avg_duration: number;
    max_duration: number;
  }[];
  routeStats: {
    route: string;
    count: number;
    avg_duration: number;
    max_duration: number;
  }[];
  timeStats: {
    hour: number;
    count: number;
    avg_duration: number;
  }[];
}

// Interface für Index-Vorschläge
interface IndexSuggestion {
  table: string;
  column: string;
  frequency: number;
  suggestedIndex: string;
}

// SQL Query Analytics Komponente
const SQLQueryAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("slow-queries");
  const [minDuration, setMinDuration] = useState(500);
  const [limit, setLimit] = useState(100);
  const [sourceFilter, setSourceFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [selectedQuery, setSelectedQuery] = useState<QueryLog | null>(null);
  const [analysisNotes, setAnalysisNotes] = useState("");
  const [explainResults, setExplainResults] = useState<any | null>(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  // Abfrage für langsame Queries
  const { 
    data: slowQueries = [], 
    isLoading: isLoadingQueries,
    refetch: refetchSlowQueries 
  } = useQuery<QueryLog[]>({
    queryKey: [
      '/api/admin/query-analytics/slow-queries', 
      minDuration, 
      limit,
      sourceFilter,
      routeFilter
    ],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        minDuration: minDuration.toString(),
        limit: limit.toString()
      });
      
      if (sourceFilter) queryParams.append('source', sourceFilter);
      if (routeFilter) queryParams.append('route', routeFilter);
      
      const response = await apiRequest(
        'GET', 
        `/api/admin/query-analytics/slow-queries?${queryParams.toString()}`
      );
      return await response.json();
    }
  });

  // Abfrage für Statistiken
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    refetch: refetchStats 
  } = useQuery<QueryStats>({
    queryKey: ['/api/admin/query-analytics/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/query-analytics/stats');
      return await response.json();
    },
    enabled: selectedTab === "statistics"
  });

  // Abfrage für Index-Vorschläge
  const { 
    data: indexSuggestions = [], 
    isLoading: isLoadingIndexes,
    refetch: refetchIndexes 
  } = useQuery<IndexSuggestion[]>({
    queryKey: ['/api/admin/query-analytics/suggest-indexes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/query-analytics/suggest-indexes');
      return await response.json();
    },
    enabled: selectedTab === "index-suggestions"
  });

  // Mutation für Analyse-Notizen
  const analyzeQueryMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const response = await apiRequest(
        'POST', 
        `/api/admin/query-analytics/analyze-query/${id}`, 
        { analysisNotes: notes }
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Analyse gespeichert",
        description: "Die Analyse-Notizen wurden erfolgreich gespeichert.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/query-analytics/slow-queries'] });
      setIsAnalysisOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Speichern der Analyse: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mutation für Cleanup
  const cleanupMutation = useMutation({
    mutationFn: async (days: number) => {
      const response = await apiRequest(
        'POST', 
        '/api/admin/query-analytics/cleanup', 
        { days }
      );
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bereinigung abgeschlossen",
        description: data.message,
        variant: "default"
      });
      refetchSlowQueries();
      refetchStats();
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: `Fehler bei der Bereinigung: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Funktion zum Abrufen von EXPLAIN-Ergebnissen
  const fetchExplainResults = async (queryId: number) => {
    try {
      const response = await apiRequest('GET', `/api/admin/query-analytics/explain/${queryId}`);
      const data = await response.json();
      setExplainResults(data);
      setIsExplainOpen(true);
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: `Fehler beim Abrufen der EXPLAIN-Ergebnisse: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Effekt zum Zurücksetzen der Analysedaten wenn ein neuer Query ausgewählt wird
  useEffect(() => {
    if (selectedQuery) {
      setAnalysisNotes(selectedQuery.analysisNotes || "");
    }
  }, [selectedQuery]);

  // Funktion zum Öffnen des Analyse-Dialogs
  const openAnalysisDialog = (query: QueryLog) => {
    setSelectedQuery(query);
    setIsAnalysisOpen(true);
  };

  // Funktion zum Speichern der Analyse
  const saveAnalysis = () => {
    if (selectedQuery) {
      analyzeQueryMutation.mutate({ 
        id: selectedQuery.id, 
        notes: analysisNotes 
      });
    }
  };

  // Cleanup durchführen
  const performCleanup = (days: number = 30) => {
    if (window.confirm(`Möchten Sie Abfragelogs älter als ${days} Tage wirklich löschen?`)) {
      cleanupMutation.mutate(days);
    }
  };

  // Formatierung der Zeitdauer
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  // Formatierung des Datums
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('de-DE');
  };

  // Abkürzung für lange Strings
  const truncate = (str: string, n: number) => {
    return str.length > n ? str.slice(0, n) + "..." : str;
  };

  // Farbauswahl basierend auf Abfragedauer
  const getDurationColor = (duration: number) => {
    if (duration >= 2000) return "text-red-600 font-bold";
    if (duration >= 500) return "text-amber-600 font-semibold";
    if (duration >= 100) return "text-amber-500";
    return "text-green-600";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">SQL-Abfrage Analyse</h1>
        <Button
          onClick={() => {
            refetchSlowQueries();
            refetchStats();
            refetchIndexes();
          }}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Aktualisieren
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="slow-queries" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Langsame Abfragen
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" /> Statistiken
          </TabsTrigger>
          <TabsTrigger value="index-suggestions" className="flex items-center gap-2">
            <Database className="h-4 w-4" /> Index-Vorschläge
          </TabsTrigger>
        </TabsList>

        {/* Langsame Abfragen Tab */}
        <TabsContent value="slow-queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" /> Filter
              </CardTitle>
              <CardDescription>
                Filtern Sie die angezeigten SQL-Abfragen nach verschiedenen Kriterien
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minDuration">Mindestdauer (ms): {minDuration}</Label>
                  <Slider
                    id="minDuration"
                    min={0}
                    max={5000}
                    step={100}
                    value={[minDuration]}
                    onValueChange={(value) => setMinDuration(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limit">Maximale Anzahl: {limit}</Label>
                  <Slider
                    id="limit"
                    min={10}
                    max={500}
                    step={10}
                    value={[limit]}
                    onValueChange={(value) => setLimit(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceFilter">Quelle</Label>
                  <Input
                    id="sourceFilter"
                    placeholder="Quelle filtern"
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routeFilter">Route</Label>
                  <Input
                    id="routeFilter"
                    placeholder="Route filtern"
                    value={routeFilter}
                    onChange={(e) => setRouteFilter(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setMinDuration(500);
                  setLimit(100);
                  setSourceFilter("");
                  setRouteFilter("");
                }}
              >
                Filter zurücksetzen
              </Button>
              <Button onClick={() => refetchSlowQueries()}>Anwenden</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Langsame SQL-Abfragen
              </CardTitle>
              <CardDescription>
                Liste der langsamsten SQL-Abfragen in der Anwendung
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingQueries ? (
                <div className="flex justify-center items-center h-40">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p>Lade Abfragen...</p>
                  </div>
                </div>
              ) : slowQueries.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground">
                  <Database className="h-10 w-10 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Keine langsamen Abfragen gefunden</h3>
                  <p>Versuchen Sie, die Filterkriterien anzupassen oder die Mindestdauer zu verringern.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dauer</TableHead>
                        <TableHead>Zeitpunkt</TableHead>
                        <TableHead>Quelle</TableHead>
                        <TableHead>Abfrage</TableHead>
                        <TableHead>Zeilen</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slowQueries.map((query) => (
                        <TableRow key={query.id}>
                          <TableCell className={getDurationColor(query.duration)}>
                            {formatDuration(query.duration)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(query.timestamp)}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {query.source || "Unbekannt"}
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <div className="font-mono text-xs truncate">
                              {truncate(query.query, 80)}
                            </div>
                          </TableCell>
                          <TableCell>{query.rowCount}</TableCell>
                          <TableCell>
                            {query.analyzed ? (
                              <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
                                <CheckCircle2 className="h-3 w-3" /> Analysiert
                              </Badge>
                            ) : query.problematic ? (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Problematisch
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Überprüfen
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openAnalysisDialog(query)}
                                title="Analyse"
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => fetchExplainResults(query.id)}
                                title="EXPLAIN ANALYZE"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {slowQueries.length} Abfragen angezeigt
              </div>
              <Button
                variant="outline"
                onClick={() => performCleanup()}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Alte Logs bereinigen
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Statistiken Tab */}
        <TabsContent value="statistics" className="space-y-4">
          {isLoadingStats ? (
            <div className="flex justify-center items-center h-40">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p>Lade Statistiken...</p>
              </div>
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Gesamt-Abfragen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.overview.total_queries}</div>
                    <p className="text-sm text-muted-foreground">
                      Davon problematisch: {stats.overview.problematic_queries}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Durchschnittliche Dauer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {formatDuration(stats.overview.avg_duration)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Median: {formatDuration(stats.overview.median_duration)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Maximale Dauer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {formatDuration(stats.overview.max_duration)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      P95: {formatDuration(stats.overview.p95_duration)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">P99 Dauer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {formatDuration(stats.overview.p99_duration)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      99% der Abfragen sind schneller
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Häufigste Abfragen</CardTitle>
                    <CardDescription>
                      Die am häufigsten ausgeführten SQL-Abfragen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Abfrage</TableHead>
                            <TableHead>Anzahl</TableHead>
                            <TableHead>Durchschn.</TableHead>
                            <TableHead>Max</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.frequentQueries.map((query, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-xs max-w-[250px] truncate">
                                {truncate(query.normalized_query, 60)}
                              </TableCell>
                              <TableCell>{query.count}</TableCell>
                              <TableCell className={getDurationColor(query.avg_duration)}>
                                {formatDuration(query.avg_duration)}
                              </TableCell>
                              <TableCell className={getDurationColor(query.max_duration)}>
                                {formatDuration(query.max_duration)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Abfragen nach Quelle</CardTitle>
                    <CardDescription>
                      Anzahl und Dauer der Abfragen nach Quelldatei
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quelle</TableHead>
                            <TableHead>Anzahl</TableHead>
                            <TableHead>Durchschn.</TableHead>
                            <TableHead>Max</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.sourceStats.map((source, index) => (
                            <TableRow key={index}>
                              <TableCell className="max-w-[200px] truncate">
                                {source.source || "Unbekannt"}
                              </TableCell>
                              <TableCell>{source.count}</TableCell>
                              <TableCell className={getDurationColor(source.avg_duration)}>
                                {formatDuration(source.avg_duration)}
                              </TableCell>
                              <TableCell className={getDurationColor(source.max_duration)}>
                                {formatDuration(source.max_duration)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Abfragen nach Route</CardTitle>
                    <CardDescription>
                      Anzahl und Dauer der Abfragen nach API-Route
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Route</TableHead>
                            <TableHead>Anzahl</TableHead>
                            <TableHead>Durchschn.</TableHead>
                            <TableHead>Max</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.routeStats.map((route, index) => (
                            <TableRow key={index}>
                              <TableCell className="max-w-[200px] truncate">
                                {route.route || "Unbekannt"}
                              </TableCell>
                              <TableCell>{route.count}</TableCell>
                              <TableCell className={getDurationColor(route.avg_duration)}>
                                {formatDuration(route.avg_duration)}
                              </TableCell>
                              <TableCell className={getDurationColor(route.max_duration)}>
                                {formatDuration(route.max_duration)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Abfragen nach Tageszeit</CardTitle>
                    <CardDescription>
                      Anzahl und Dauer der Abfragen nach Stunde
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Stunde</TableHead>
                            <TableHead>Anzahl</TableHead>
                            <TableHead>Durchschn.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.timeStats.map((time, index) => (
                            <TableRow key={index}>
                              <TableCell>{time.hour}:00 Uhr</TableCell>
                              <TableCell>{time.count}</TableCell>
                              <TableCell className={getDurationColor(time.avg_duration)}>
                                {formatDuration(time.avg_duration)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center p-10">
              <Info className="h-10 w-10 mx-auto mb-2" />
              <h3 className="text-lg font-medium">Keine Statistiken verfügbar</h3>
              <p>Es sind noch keine SQL-Abfragen protokolliert worden.</p>
            </div>
          )}
        </TabsContent>

        {/* Index-Vorschläge Tab */}
        <TabsContent value="index-suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" /> Index-Vorschläge
              </CardTitle>
              <CardDescription>
                Basierend auf langsamen Abfragen werden folgende Indizes vorgeschlagen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingIndexes ? (
                <div className="flex justify-center items-center h-40">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p>Analysiere Abfragen...</p>
                  </div>
                </div>
              ) : indexSuggestions.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground">
                  <Database className="h-10 w-10 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Keine Index-Vorschläge</h3>
                  <p>Es wurden keine potenziellen Index-Kandidaten gefunden.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tabelle</TableHead>
                        <TableHead>Spalte</TableHead>
                        <TableHead>Häufigkeit</TableHead>
                        <TableHead>SQL-Anweisung</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {indexSuggestions.map((suggestion, index) => (
                        <TableRow key={index}>
                          <TableCell>{suggestion.table}</TableCell>
                          <TableCell>{suggestion.column}</TableCell>
                          <TableCell>{suggestion.frequency}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {suggestion.suggestedIndex}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {indexSuggestions.length} Vorschläge gefunden
              </div>
              <Button
                onClick={() => refetchIndexes()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Aktualisieren
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analyse-Dialog */}
      {selectedQuery && (
        <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>SQL-Abfrage analysieren</DialogTitle>
              <DialogDescription>
                Überprüfen und analysieren Sie die ausgewählte SQL-Abfrage
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Dauer</h4>
                  <p className={`${getDurationColor(selectedQuery.duration)} font-medium`}>
                    {formatDuration(selectedQuery.duration)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Zeitpunkt</h4>
                  <p>{formatDate(selectedQuery.timestamp)}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-1">SQL-Abfrage</h4>
                <div className="bg-muted p-3 rounded-md font-mono text-sm overflow-x-auto whitespace-pre">
                  {selectedQuery.query}
                </div>
              </div>

              {selectedQuery.params && (
                <div>
                  <h4 className="font-medium mb-1">Parameter</h4>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm overflow-x-auto whitespace-pre">
                    {JSON.stringify(selectedQuery.params, null, 2)}
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Quelle</h4>
                  <p>{selectedQuery.source || "Unbekannt"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Anzahl Zeilen</h4>
                  <p>{selectedQuery.rowCount}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Route</h4>
                  <p>{selectedQuery.route || "Unbekannt"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Benutzer-ID</h4>
                  <p>{selectedQuery.userId || "Nicht zugeordnet"}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="analysisNotes" className="font-medium">
                  Analyse-Notizen
                </Label>
                <Textarea
                  id="analysisNotes"
                  value={analysisNotes}
                  onChange={(e) => setAnalysisNotes(e.target.value)}
                  placeholder="Notizen zur Analyse dieser Abfrage (z.B. Optimierungsvorschläge, Probleme, etc.)"
                  className="mt-1.5 h-32"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAnalysisOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={saveAnalysis}
                disabled={analyzeQueryMutation.isPending}
                className="gap-2"
              >
                {analyzeQueryMutation.isPending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                )}
                Analyse speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* EXPLAIN-Dialog */}
      <Dialog open={isExplainOpen} onOpenChange={setIsExplainOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>EXPLAIN ANALYZE Ergebnisse</DialogTitle>
            <DialogDescription>
              Detaillierte Ausführungspläne der Datenbankabfrage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {explainResults ? (
              <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap">{JSON.stringify(explainResults, null, 2)}</pre>
              </div>
            ) : (
              <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p>Lade EXPLAIN-Ergebnisse...</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExplainOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SQLQueryAnalytics;