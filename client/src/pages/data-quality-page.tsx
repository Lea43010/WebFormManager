import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, FileCheck, BarChart, FileWarning, Settings, RefreshCw, Download, FileText, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type EntityType = "customers" | "companies" | "projects" | "milestones" | "employees" | "attachments";

interface DataQualityRule {
  id: number;
  entityType: EntityType;
  fieldName: string;
  ruleName: string;
  ruleDescription: string;
  severity: "low" | "medium" | "high";
  active: boolean;
}

interface DataQualityIssue {
  id: number;
  entityType: EntityType;
  entityId: number;
  entityName: string;
  fieldName: string;
  issueType: string;
  issueDescription: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
  resolvedAt: string | null;
}

interface DataQualityMetric {
  entityType: EntityType;
  totalRecords: number;
  completeRecords: number;
  incompleteRecords: number;
  qualityScore: number;
  lastChecked: string;
}

const defaultRules: DataQualityRule[] = [
  {
    id: 1,
    entityType: "customers",
    fieldName: "first_name",
    ruleName: "required",
    ruleDescription: "Vorname darf nicht leer sein",
    severity: "medium",
    active: true
  },
  {
    id: 2,
    entityType: "customers",
    fieldName: "last_name",
    ruleName: "required",
    ruleDescription: "Nachname darf nicht leer sein",
    severity: "medium",
    active: true
  },
  {
    id: 3,
    entityType: "customers",
    fieldName: "customer_email",
    ruleName: "email_format",
    ruleDescription: "E-Mail muss gültiges Format haben",
    severity: "high",
    active: true
  },
  {
    id: 4,
    entityType: "companies",
    fieldName: "company_name",
    ruleName: "required",
    ruleDescription: "Firmenname darf nicht leer sein",
    severity: "high",
    active: true
  },
  {
    id: 5,
    entityType: "projects",
    fieldName: "project_name",
    ruleName: "required",
    ruleDescription: "Projektname darf nicht leer sein",
    severity: "high",
    active: true
  },
  {
    id: 6,
    entityType: "projects",
    fieldName: "project_startdate",
    ruleName: "valid_date",
    ruleDescription: "Startdatum muss gültiges Datum sein",
    severity: "medium",
    active: true
  },
  {
    id: 7,
    entityType: "projects",
    fieldName: "project_enddate",
    ruleName: "date_after",
    ruleDescription: "Enddatum muss nach Startdatum liegen",
    severity: "medium",
    active: true
  }
];

export default function DataQualityPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedEntity, setSelectedEntity] = useState<EntityType | undefined>("customers");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  // Mock Data für die Demonstration
  const [metrics, setMetrics] = useState<DataQualityMetric[]>([]);
  const [issues, setIssues] = useState<DataQualityIssue[]>([]);
  const [rules, setRules] = useState<DataQualityRule[]>(defaultRules);
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);

  // In einer echten Implementierung würden wir diese Daten vom Server abrufen
  useEffect(() => {
    // Simulation der Metriken für verschiedene Entitäten
    const mockMetrics: DataQualityMetric[] = [
      {
        entityType: "customers",
        totalRecords: 24,
        completeRecords: 20,
        incompleteRecords: 4,
        qualityScore: 83,
        lastChecked: new Date().toISOString()
      },
      {
        entityType: "companies",
        totalRecords: 12,
        completeRecords: 10,
        incompleteRecords: 2,
        qualityScore: 88,
        lastChecked: new Date().toISOString()
      },
      {
        entityType: "projects",
        totalRecords: 18,
        completeRecords: 15,
        incompleteRecords: 3,
        qualityScore: 78,
        lastChecked: new Date().toISOString()
      },
      {
        entityType: "employees",
        totalRecords: 9,
        completeRecords: 8,
        incompleteRecords: 1,
        qualityScore: 91,
        lastChecked: new Date().toISOString()
      },
      {
        entityType: "attachments",
        totalRecords: 31,
        completeRecords: 29,
        incompleteRecords: 2,
        qualityScore: 94,
        lastChecked: new Date().toISOString()
      }
    ];
    setMetrics(mockMetrics);

    // Simulation von Datenqualitätsproblemen
    const mockIssues: DataQualityIssue[] = [
      {
        id: 1,
        entityType: "customers",
        entityId: 1,
        entityName: "Max Mustermann",
        fieldName: "customer_email",
        issueType: "invalid_format",
        issueDescription: "E-Mail-Format ist ungültig: 'max.mustermann@'",
        severity: "high",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: null
      },
      {
        id: 2,
        entityType: "customers",
        entityId: 4,
        entityName: "John Doe",
        fieldName: "postal_code",
        issueType: "missing_value",
        issueDescription: "Postleitzahl fehlt",
        severity: "medium",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: null
      },
      {
        id: 3,
        entityType: "projects",
        entityId: 2,
        entityName: "Straßensanierung B12",
        fieldName: "project_enddate",
        issueType: "invalid_value",
        issueDescription: "Enddatum liegt vor Startdatum",
        severity: "high",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: null
      },
      {
        id: 4,
        entityType: "companies",
        entityId: 3,
        entityName: "Bauunternehmen GmbH",
        fieldName: "company_phone",
        issueType: "invalid_format",
        issueDescription: "Telefonnummer hat falsches Format",
        severity: "low",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: null
      }
    ];
    setIssues(mockIssues);
  }, []);

  // Filter issues by selected entity and severity
  const filteredIssues = issues.filter(issue => {
    if (selectedEntity && issue.entityType !== selectedEntity) {
      return false;
    }
    if (filterSeverity !== "all" && issue.severity !== filterSeverity) {
      return false;
    }
    return true;
  });

  // Gesamtqualitätspunkte berechnen
  const overallQualityScore = metrics.length > 0
    ? Math.round(metrics.reduce((sum, metric) => sum + metric.qualityScore, 0) / metrics.length)
    : 0;

  // Simulation eines Datenqualitätschecks
  const runDataQualityCheck = () => {
    setIsRunningCheck(true);
    setCheckProgress(0);
    
    // Simuliere einen Fortschritt
    const interval = setInterval(() => {
      setCheckProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunningCheck(false);
          toast({
            title: "Datenqualitätsprüfung abgeschlossen",
            description: "Die Ergebnisse wurden aktualisiert.",
            variant: "default",
          });
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  // Simulation einer Problemlösung
  const resolveIssue = (issueId: number) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, resolvedAt: new Date().toISOString() } 
        : issue
    ));
    
    toast({
      title: "Problem als gelöst markiert",
      description: "Das Datenqualitätsproblem wurde als gelöst markiert.",
      variant: "default",
    });
  };

  // Regelaktivierung umschalten
  const toggleRuleActive = (ruleId: number) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, active: !rule.active } 
        : rule
    ));
  };

  return (
    <DashboardLayout title="Datenqualitätsmanagement" description="Überwachen und verbessern Sie die Qualität Ihrer Daten">
      <div className="bg-[#F3F4F6] p-6 rounded-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white shadow">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-[#6a961f] data-[state=active]:text-white">
              <BarChart className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center gap-2 data-[state=active]:bg-[#6a961f] data-[state=active]:text-white">
              <FileWarning className="h-4 w-4" />
              <span>Probleme</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2 data-[state=active]:bg-[#6a961f] data-[state=active]:text-white">
              <Settings className="h-4 w-4" />
              <span>Regeln</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard-Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card className="bg-white shadow rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-[#111827]">Gesamtqualität</CardTitle>
                  <CardDescription>Durchschnittliche Datenqualität über alle Entitäten</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-bold text-[#6a961f] mb-2">{overallQualityScore}%</div>
                    <Progress value={overallQualityScore} className="h-2 w-full bg-gray-200" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Basierend auf allen Datenqualitätsregeln
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-[#111827]">Offene Probleme</CardTitle>
                  <CardDescription>Anzahl der ungelösten Datenqualitätsprobleme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-bold text-amber-500 mb-2">
                      {issues.filter(issue => !issue.resolvedAt).length}
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap justify-center">
                      <Badge variant="destructive" className="flex items-center gap-1 text-xs py-0 px-2 h-6">
                        <AlertCircle className="h-3 w-3" />
                        Hoch: {issues.filter(issue => !issue.resolvedAt && issue.severity === "high").length}
                      </Badge>
                      <Badge variant="default" className="bg-amber-500 text-white flex items-center gap-1 text-xs py-0 px-2 h-6">
                        <AlertCircle className="h-3 w-3" />
                        Mittel: {issues.filter(issue => !issue.resolvedAt && issue.severity === "medium").length}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 text-xs py-0 px-2 h-6">
                        <AlertCircle className="h-3 w-3" />
                        Niedrig: {issues.filter(issue => !issue.resolvedAt && issue.severity === "low").length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-[#111827]">Aktionen</CardTitle>
                  <CardDescription>Datenqualität überprüfen und verbessern</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      onClick={runDataQualityCheck} 
                      disabled={isRunningCheck} 
                      className="w-full flex items-center justify-center gap-2 bg-[#6a961f] hover:bg-[#5b851a]"
                    >
                      {isRunningCheck ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Prüfung läuft...
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-4 w-4" />
                          Datenqualität prüfen
                        </>
                      )}
                    </Button>
                    
                    {isRunningCheck && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Fortschritt:</span>
                          <span>{checkProgress}%</span>
                        </div>
                        <Progress value={checkProgress} className="h-2 bg-gray-200" />
                      </div>
                    )}
                    
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-[#6a961f] text-[#6a961f]">
                      <Download className="h-4 w-4" />
                      Bericht exportieren
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <h3 className="text-lg font-medium mb-4 text-[#111827]">Qualität nach Entitätstyp</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <Card key={metric.entityType} className="bg-white shadow rounded-lg overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-[#111827]">
                      {metric.entityType === "customers" && "Kunden"}
                      {metric.entityType === "companies" && "Unternehmen"}
                      {metric.entityType === "projects" && "Projekte"}
                      {metric.entityType === "employees" && "Mitarbeiter"}
                      {metric.entityType === "attachments" && "Anhänge"} 
                    </CardTitle>
                    <CardDescription>
                      {metric.totalRecords} Datensätze | Letzte Prüfung: {new Date(metric.lastChecked).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Qualitätsbewertung:</span>
                        <span className={`font-medium ${getQualityScoreColor(metric.qualityScore)}`}>
                          {metric.qualityScore}%
                        </span>
                      </div>
                      <Progress 
                        value={metric.qualityScore} 
                        className={`h-2 ${getQualityScoreProgressColor(metric.qualityScore)}`} 
                      />
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Vollständig</span>
                          <span className="font-medium">{metric.completeRecords} ({Math.round(metric.completeRecords / metric.totalRecords * 100)}%)</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Unvollständig</span>
                          <span className="font-medium">{metric.incompleteRecords} ({Math.round(metric.incompleteRecords / metric.totalRecords * 100)}%)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Probleme-Tab */}
          <TabsContent value="issues" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Card className="w-full md:w-1/3 bg-white shadow rounded-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-[#111827]">Filter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Entitätstyp</label>
                    <Select 
                      value={selectedEntity || "all"} 
                      onValueChange={(value) => setSelectedEntity(value === "all" ? undefined : value as EntityType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Alle Entitäten" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Entitäten</SelectItem>
                        <SelectItem value="customers">Kunden</SelectItem>
                        <SelectItem value="companies">Unternehmen</SelectItem>
                        <SelectItem value="projects">Projekte</SelectItem>
                        <SelectItem value="employees">Mitarbeiter</SelectItem>
                        <SelectItem value="attachments">Anhänge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Schweregrad</label>
                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alle Schweregrade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Schweregrade</SelectItem>
                        <SelectItem value="high">Hoch</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="low">Niedrig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2 border-[#6a961f] text-[#6a961f]"
                      onClick={() => {
                        setSelectedEntity(undefined);
                        setFilterSeverity("all");
                      }}
                    >
                      <Filter className="h-4 w-4" />
                      Filter zurücksetzen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full md:w-2/3 bg-white shadow rounded-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-[#111827]">Datenqualitätsprobleme</CardTitle>
                  <CardDescription>
                    {filteredIssues.length} {filteredIssues.length === 1 ? 'Problem' : 'Probleme'} gefunden
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {filteredIssues.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-medium mb-1">Keine Probleme gefunden</h3>
                        <p className="text-muted-foreground">
                          Für die ausgewählten Filter wurden keine Datenqualitätsprobleme gefunden.
                        </p>
                      </div>
                    ) : (
                      filteredIssues.map((issue) => (
                        <div key={issue.id} className="border-b py-4 last:border-0 last:pb-0 first:pt-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant={
                                    issue.severity === "high" ? "destructive" : 
                                    issue.severity === "medium" ? "outline" : 
                                    "outline"
                                  }
                                  className={
                                    issue.severity === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    issue.severity === "low" ? "bg-blue-50 text-blue-700 border-blue-200" : ""
                                  }
                                >
                                  {issue.severity === "high" ? "Hoch" : issue.severity === "medium" ? "Mittel" : "Niedrig"}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {getEntityTypeLabel(issue.entityType)}: {issue.entityName}
                                </span>
                              </div>
                              <h4 className="font-medium">{getFieldLabel(issue.fieldName)}: {issue.issueType === "missing_value" ? "Wert fehlt" : "Ungültiges Format"}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{issue.issueDescription}</p>
                              <div className="text-xs text-muted-foreground mt-2">
                                Erkannt am: {new Date(issue.createdAt).toLocaleString('de-DE')}
                              </div>
                            </div>
                            <div>
                              {issue.resolvedAt ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Gelöst
                                </Badge>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => resolveIssue(issue.id)}
                                  className="text-[#6a961f] border-[#6a961f]"
                                >
                                  Als gelöst markieren
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Regeln-Tab */}
          <TabsContent value="rules" className="space-y-4">
            <Card className="bg-white shadow rounded-lg">
              <CardHeader>
                <CardTitle className="text-lg text-[#111827]">Datenqualitätsregeln</CardTitle>
                <CardDescription>
                  Konfigurieren Sie die Regeln für die Datenqualitätsprüfung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Entitätstyp</TableHead>
                        <TableHead className="w-[200px]">Feld</TableHead>
                        <TableHead className="w-[250px]">Regel</TableHead>
                        <TableHead className="w-[100px]">Schweregrad</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>{getEntityTypeLabel(rule.entityType)}</TableCell>
                          <TableCell>{getFieldLabel(rule.fieldName)}</TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium">{getRuleLabel(rule.ruleName)}</span>
                              <p className="text-xs text-muted-foreground mt-1">{rule.ruleDescription}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                rule.severity === "high" ? "destructive" : 
                                rule.severity === "medium" ? "outline" : 
                                "outline"
                              }
                              className={
                                rule.severity === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                rule.severity === "low" ? "bg-blue-50 text-blue-700 border-blue-200" : ""
                              }
                            >
                              {rule.severity === "high" ? "Hoch" : rule.severity === "medium" ? "Mittel" : "Niedrig"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={rule.active ? "default" : "outline"} 
                              className={rule.active ? "bg-[#6a961f]" : ""}
                            >
                              {rule.active ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRuleActive(rule.id)}
                            >
                              {rule.active ? "Deaktivieren" : "Aktivieren"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Helper functions for labels
function getEntityTypeLabel(entityType: EntityType): string {
  switch (entityType) {
    case "customers": return "Kunden";
    case "companies": return "Unternehmen";
    case "projects": return "Projekte";
    case "milestones": return "Meilensteine";
    case "employees": return "Mitarbeiter";
    case "attachments": return "Anhänge";
    default: return entityType;
  }
}

function getFieldLabel(fieldName: string): string {
  switch (fieldName) {
    case "first_name": return "Vorname";
    case "last_name": return "Nachname";
    case "customer_email": return "E-Mail";
    case "company_name": return "Firmenname";
    case "company_phone": return "Telefon";
    case "project_name": return "Projektname";
    case "project_startdate": return "Startdatum";
    case "project_enddate": return "Enddatum";
    case "postal_code": return "Postleitzahl";
    default: return fieldName;
  }
}

function getRuleLabel(ruleName: string): string {
  switch (ruleName) {
    case "required": return "Pflichtfeld";
    case "email_format": return "E-Mail-Format";
    case "valid_date": return "Gültiges Datum";
    case "date_after": return "Datum nach";
    default: return ruleName;
  }
}

function getQualityScoreColor(score: number): string {
  if (score >= 90) return "text-[#6a961f]"; // Corporate green for good scores
  if (score >= 70) return "text-amber-600";
  return "text-red-600";
}

function getQualityScoreProgressColor(score: number): string {
  if (score >= 90) return "bg-[#6a961f]"; // Corporate green for good scores
  if (score >= 70) return "bg-amber-500";
  return "bg-red-500";
}