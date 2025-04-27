import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import DebugNavigation from "@/components/debug-navigation";

interface DbIssue {
  category: string;
  issue_type: string;
  message: string;
  table_name?: string;
  column_name?: string;
  recommended_action?: string;
  severity: "high" | "medium" | "low";
}

interface DbStructureQualityResponse {
  issues: DbIssue[];
  summary: {
    total_issues: number;
    high_severity_issues: number;
    medium_severity_issues: number;
    low_severity_issues: number;
    tables_checked: number;
    columns_checked: number;
  };
  status: string;
}

const severityColors = {
  high: "text-red-700 bg-red-100 border-red-300",
  medium: "text-amber-700 bg-amber-100 border-amber-300",
  low: "text-blue-700 bg-blue-100 border-blue-300",
};

const DbStructureQualityPage: React.FC = () => {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DbStructureQualityResponse>({
    queryKey: ["/api/data-quality/db-structure"],
    staleTime: 1000 * 60 * 5, // 5 Minuten
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Aktualisiert",
      description: "Die Datenbankstruktur-Qualitätsprüfung wurde aktualisiert.",
    });
  };

  // Gruppiere Probleme nach Kategorie
  const issuesByCategory = React.useMemo(() => {
    if (!data?.issues) return {};
    
    return data.issues.reduce(
      (acc: Record<string, DbIssue[]>, issue) => {
        if (!acc[issue.category]) {
          acc[issue.category] = [];
        }
        acc[issue.category].push(issue);
        return acc;
      },
      {}
    );
  }, [data?.issues]);

  const categories = Object.keys(issuesByCategory);

  const renderSeverityBadge = (severity: "high" | "medium" | "low") => {
    const labels = {
      high: "Hoch",
      medium: "Mittel",
      low: "Niedrig",
    };

    return (
      <Badge variant="outline" className={`${severityColors[severity]} py-1 px-2`}>
        {labels[severity]}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <DebugNavigation />
      
      <h1 className="text-3xl font-bold mb-2">Datenbankstruktur-Qualitätsprüfung</h1>
      <p className="text-muted-foreground mb-6">
        Überprüfung der Datenbankstruktur auf Best Practices und Konsistenz.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 mr-2 animate-spin text-primary" />
          <span>Datenbankstruktur wird analysiert...</span>
        </div>
      ) : isError ? (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Fehler bei der Analyse</h3>
                <p className="text-sm">{(error as Error)?.message || "Ein unbekannter Fehler ist aufgetreten."}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Erneut versuchen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Zusammenfassung */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Zusammenfassung</CardTitle>
              <CardDescription>
                Übersicht der Datenbankstruktur-Qualitätsprüfung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Geprüfte Tabellen</p>
                  <p className="text-2xl font-semibold">{data?.summary.tables_checked}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Geprüfte Spalten</p>
                  <p className="text-2xl font-semibold">{data?.summary.columns_checked}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Probleme gesamt</p>
                  <p className="text-2xl font-semibold">{data?.summary.total_issues}</p>
                  <div className="flex gap-2 mt-2">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                      <span className="text-xs">{data?.summary.high_severity_issues}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-amber-500 rounded-full mr-1"></span>
                      <span className="text-xs">{data?.summary.medium_severity_issues}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                      <span className="text-xs">{data?.summary.low_severity_issues}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </CardFooter>
          </Card>

          {data?.summary.total_issues === 0 ? (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Keine Probleme gefunden</h3>
                    <p className="text-sm">Die Datenbankstruktur entspricht allen überprüften Best Practices.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Problembereiche */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Gefundene Probleme nach Kategorie</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={activeCategory === category ? "default" : "outline"}
                      className="justify-start h-auto py-3"
                      onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <span className="text-sm font-semibold">{issuesByCategory[category].length}</span>
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{category}</div>
                          <div className="text-xs opacity-70">
                            {issuesByCategory[category].filter(i => i.severity === 'high').length} kritisch,{' '}
                            {issuesByCategory[category].filter(i => i.severity === 'medium').length} mittel
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Detaillierte Problemliste */}
              {activeCategory && (
                <Card>
                  <CardHeader>
                    <CardTitle>{activeCategory}</CardTitle>
                    <CardDescription>
                      {issuesByCategory[activeCategory].length} Problem(e) gefunden
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Priorität</TableHead>
                          <TableHead>Problem</TableHead>
                          <TableHead>Tabelle</TableHead>
                          <TableHead>Spalte</TableHead>
                          <TableHead>Empfehlung</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {issuesByCategory[activeCategory].map((issue, index) => (
                          <TableRow key={index}>
                            <TableCell>{renderSeverityBadge(issue.severity)}</TableCell>
                            <TableCell className="font-medium">{issue.message}</TableCell>
                            <TableCell>{issue.table_name || '-'}</TableCell>
                            <TableCell>{issue.column_name || '-'}</TableCell>
                            <TableCell className="max-w-md">{issue.recommended_action || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Alle Probleme im Accordion */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Alle Probleme</h2>
                <Accordion type="single" collapsible className="w-full">
                  {categories.map((category, idx) => (
                    <AccordionItem key={idx} value={category}>
                      <AccordionTrigger className="hover:bg-slate-50 px-4">
                        <div className="flex items-center">
                          <span>{category}</span>
                          <Badge className="ml-2" variant="outline">
                            {issuesByCategory[category].length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Priorität</TableHead>
                              <TableHead>Problem</TableHead>
                              <TableHead>Tabelle</TableHead>
                              <TableHead>Spalte</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {issuesByCategory[category].map((issue, index) => (
                              <TableRow key={index}>
                                <TableCell>{renderSeverityBadge(issue.severity)}</TableCell>
                                <TableCell className="font-medium">{issue.message}</TableCell>
                                <TableCell>{issue.table_name || '-'}</TableCell>
                                <TableCell>{issue.column_name || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default DbStructureQualityPage;