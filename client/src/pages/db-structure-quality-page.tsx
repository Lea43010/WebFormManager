import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DebugNavigation from "@/components/debug-navigation";

interface DbStructureIssue {
  category: string;
  issue: string;
  details: string[];
  severity: "low" | "medium" | "high";
}

interface DbStructureRule {
  check: string;
  description: string;
  enabled: boolean;
  severity: "low" | "medium" | "high";
}

interface DbStructureResponse {
  timestamp: string;
  rules: DbStructureRule[];
  issues: DbStructureIssue[];
  totalIssues: number;
  status: "passed" | "issues_found";
}

export default function DbStructureQualityPage() {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState<Record<number, boolean>>({});

  const { data, isLoading, isError, refetch } = useQuery<DbStructureResponse>({
    queryKey: ["/api/data-quality/db-structure"],
    refetchOnWindowFocus: false,
  });

  // Funktion zum Umschalten der Detailanzeige für eine bestimmte Ausgabe
  const toggleDetails = (index: number) => {
    setShowDetails((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Funktion zum Erhalten eines Badges basierend auf dem Schweregrad
  const getSeverityBadge = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Niedrig
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Mittel
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Hoch
          </Badge>
        );
      default:
        return null;
    }
  };

  // Funktion zum Erhalten eines Icons basierend auf dem Status
  const getStatusIcon = () => {
    if (!data) return null;
    
    if (data.status === "passed") {
      return <CheckCircle className="h-8 w-8 text-green-500" />;
    } else {
      return data.issues.some(issue => issue.severity === "high") 
        ? <AlertCircle className="h-8 w-8 text-red-500" />
        : <AlertTriangle className="h-8 w-8 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <DebugNavigation />
      
      <h1 className="text-3xl font-bold mb-8">Datenbankstruktur-Qualitätsprüfung</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Prüfung wird durchgeführt...</span>
        </div>
      ) : isError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>
            Es ist ein Fehler bei der Prüfung der Datenbankstruktur aufgetreten. Bitte versuchen Sie es später erneut.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center">
              {getStatusIcon()}
              <div className="ml-4">
                <h2 className="text-xl font-semibold">
                  {data.status === "passed"
                    ? "Alle Prüfungen bestanden"
                    : `${data.totalIssues} Probleme gefunden`}
                </h2>
                <p className="text-gray-500 text-sm">
                  Zuletzt geprüft: {new Date(data.timestamp).toLocaleString('de-DE')}
                </p>
              </div>
            </div>
            <Button onClick={() => refetch()}>
              Erneut prüfen
            </Button>
          </div>

          {/* Regeln anzeigen */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Prüfungsregeln</CardTitle>
              <CardDescription>
                Die folgenden Regeln werden bei der Datenbankstrukturprüfung angewendet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regel</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Schweregrad</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rules.map((rule, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {rule.check}
                      </TableCell>
                      <TableCell>{rule.description}</TableCell>
                      <TableCell>{getSeverityBadge(rule.severity)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.enabled ? "default" : "outline"}
                          className={
                            rule.enabled
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "text-gray-500"
                          }
                        >
                          {rule.enabled ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Probleme anzeigen */}
          {data.issues.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Gefundene Probleme</CardTitle>
                <CardDescription>
                  Die folgenden Probleme wurden in der Datenbankstruktur gefunden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold flex items-center">
                            <span className="mr-2">{issue.category}:</span> 
                            {getSeverityBadge(issue.severity)}
                          </h3>
                          <p className="my-2">{issue.issue}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleDetails(index)}
                        >
                          {showDetails[index] ? "Details ausblenden" : "Details anzeigen"}
                        </Button>
                      </div>

                      {showDetails[index] && (
                        <div className="mt-4 p-3 bg-white rounded border">
                          <h4 className="font-medium mb-2">Betroffene Objekte:</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {issue.details.map((detail, idx) => (
                              <li key={idx} className="font-mono text-sm">
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-green-50 border-green-100">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Keine Probleme gefunden
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Alle Datenbankstrukturprüfungen wurden erfolgreich bestanden.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}