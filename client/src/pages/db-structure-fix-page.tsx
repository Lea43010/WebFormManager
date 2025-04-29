import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layouts/dashboard-layout';

interface DbFixResult {
  success: boolean;
  fixes_applied: {
    table: string;
    column?: string;
    issue: string;
    fix: string;
    result: string;
  }[];
  errors: {
    table: string;
    column?: string;
    issue: string;
    error: string;
  }[];
}

export default function DbStructureFixPage() {
  const [result, setResult] = useState<DbFixResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFixDatabaseStructure = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('POST', '/api/debug/db-structure/fix');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Datenbank-Struktur reparieren" description="Reparieren von Strukturproblemen in der Datenbank">
      <div className="container mx-auto py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Datenbank-Struktur reparieren</CardTitle>
            <CardDescription>
              Dieses Tool behebt automatisch Probleme mit der Datenbankstruktur, wie z.B. fehlende
              Primärschlüssel und NULL-Werte in Fremdschlüsselspalten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Alert className="mb-4 border-orange-300 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-600">Achtung!</AlertTitle>
                <AlertDescription>
                  Dieser Vorgang kann Daten ändern oder löschen. Es wird empfohlen, vorher eine Sicherung der Datenbank zu erstellen.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleFixDatabaseStructure} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Reparatur wird durchgeführt...
                </>
              ) : (
                'Datenbank-Struktur reparieren'
              )}
            </Button>
          </CardFooter>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>
                Ergebnis der Reparatur
                {result.success ? (
                  <CheckCircle2 className="inline-block ml-2 h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="inline-block ml-2 h-5 w-5 text-red-600" />
                )}
              </CardTitle>
              <CardDescription>
                {result.success 
                  ? `${result.fixes_applied.length} Probleme wurden erfolgreich behoben.` 
                  : `Es gab Fehler bei der Reparatur. Es wurden ${result.fixes_applied.length} Probleme behoben, aber ${result.errors.length} Fehler aufgetreten.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="fixes">
                <TabsList className="mb-4">
                  <TabsTrigger value="fixes">Behobene Probleme ({result.fixes_applied.length})</TabsTrigger>
                  <TabsTrigger value="errors">Fehler ({result.errors.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="fixes">
                  {result.fixes_applied.length === 0 ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Keine Probleme behoben</AlertTitle>
                      <AlertDescription>Es wurden keine Probleme gefunden, die behoben werden mussten.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {result.fixes_applied.map((fix, index) => (
                        <Card key={index}>
                          <CardHeader className="py-3">
                            <CardTitle className="text-base">
                              Tabelle: {fix.table} {fix.column && `(Spalte: ${fix.column})`}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="font-medium">Problem</div>
                                <div>{fix.issue}</div>
                              </div>
                              <div>
                                <div className="font-medium">Lösung</div>
                                <div>{fix.fix}</div>
                              </div>
                              <div>
                                <div className="font-medium">Ergebnis</div>
                                <div className="text-green-600">{fix.result}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="errors">
                  {result.errors.length === 0 ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Keine Fehler</AlertTitle>
                      <AlertDescription>Alle Probleme wurden erfolgreich behoben.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {result.errors.map((error, index) => (
                        <Card key={index}>
                          <CardHeader className="py-3">
                            <CardTitle className="text-base">
                              Tabelle: {error.table} {error.column && `(Spalte: ${error.column})`}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-medium">Problem</div>
                                <div>{error.issue}</div>
                              </div>
                              <div>
                                <div className="font-medium">Fehler</div>
                                <div className="text-red-600">{error.error}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}