import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

export interface DbFixResult {
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
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DbFixResult | null>(null);
  
  // Status für erweiterte Anzeigen
  const [showAppliedFixes, setShowAppliedFixes] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  
  // Nur Administratoren dürfen auf diese Seite zugreifen
  React.useEffect(() => {
    if (user && user.role !== 'administrator') {
      toast({
        title: "Zugriff verweigert",
        description: "Sie haben keine Berechtigung, auf diese Seite zuzugreifen.",
        variant: "destructive"
      });
      setLocation('/');
    }
  }, [user, setLocation, toast]);
  
  const runDbFix = async () => {
    setLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/debug/db-structure/fix');
      const data = await response.json();
      
      setResult(data);
      
      if (data.success) {
        toast({
          title: "Reparatur erfolgreich",
          description: `${data.fixes_applied.length} Probleme wurden behoben.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Reparatur mit Fehlern",
          description: `${data.errors.length} Fehler sind aufgetreten.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Fehler bei der Datenbankstruktur-Reparatur:", error);
      toast({
        title: "Fehler",
        description: "Bei der Datenbankstruktur-Reparatur ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Manuell mit dem Skript reparieren, falls API-Route nicht funktioniert
  const runManualRepair = () => {
    toast({
      title: "Hinweis zur manuellen Reparatur",
      description: "Führen Sie 'npx tsx server/run-db-fixes.ts' in der Kommandozeile aus.",
    });
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-screen-lg mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Datenbankstruktur-Reparatur</h1>
          <Button variant="outline" onClick={() => setLocation('/admin')}>
            Zurück zum Admin-Bereich
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reparatur der Datenbankstruktur</CardTitle>
            <CardDescription>
              Dieses Tool behebt bekannte Datenbankstrukturprobleme, wie fehlende Primärschlüssel
              und NULL-Werte in Fremdschlüsselspalten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Achtung</AlertTitle>
              <AlertDescription>
                Diese Operation sollte nur von Administratoren durchgeführt werden. 
                Stellen Sie sicher, dass Sie ein aktuelles Backup der Datenbank haben.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-between">
            <Button 
              onClick={runDbFix} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reparatur läuft...
                </>
              ) : (
                'Datenbankstruktur reparieren'
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={runManualRepair}
              className="w-full sm:w-auto"
            >
              Hinweise zur manuellen Reparatur
            </Button>
          </CardFooter>
        </Card>
        
        {result && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                )}
                Ergebnis der Reparatur
              </CardTitle>
              <CardDescription>
                {result.success
                  ? `Die Reparatur wurde erfolgreich durchgeführt. ${result.fixes_applied.length} Probleme wurden behoben.`
                  : `Die Reparatur wurde mit Fehlern abgeschlossen. ${result.errors.length} Fehler sind aufgetreten.`}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {result.fixes_applied.length > 0 && (
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAppliedFixes(!showAppliedFixes)}
                    className="mb-2 flex items-center justify-between w-full"
                  >
                    <span className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Angewendete Fixes ({result.fixes_applied.length})
                    </span>
                    {showAppliedFixes ? <ChevronUp /> : <ChevronDown />}
                  </Button>
                  
                  {showAppliedFixes && (
                    <div className="rounded-md border p-4 max-h-[400px] overflow-y-auto bg-muted/30">
                      {result.fixes_applied.map((fix, index) => (
                        <div key={index} className="mb-4 pb-4 border-b last:border-b-0 last:mb-0 last:pb-0">
                          <h4 className="font-medium">
                            Tabelle: {fix.table}{fix.column ? `, Spalte: ${fix.column}` : ''}
                          </h4>
                          <p className="text-sm text-muted-foreground">Problem: {fix.issue}</p>
                          <p className="text-sm">Fix: {fix.fix}</p>
                          <p className="text-sm text-green-600">Ergebnis: {fix.result}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {result.errors.length > 0 && (
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowErrors(!showErrors)}
                    className="mb-2 flex items-center justify-between w-full"
                  >
                    <span className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                      Fehler ({result.errors.length})
                    </span>
                    {showErrors ? <ChevronUp /> : <ChevronDown />}
                  </Button>
                  
                  {showErrors && (
                    <div className="rounded-md border border-red-200 p-4 max-h-[400px] overflow-y-auto bg-red-50">
                      {result.errors.map((error, index) => (
                        <div key={index} className="mb-4 pb-4 border-b last:border-b-0 last:mb-0 last:pb-0">
                          <h4 className="font-medium">
                            Tabelle: {error.table}{error.column ? `, Spalte: ${error.column}` : ''}
                          </h4>
                          <p className="text-sm text-muted-foreground">Problem: {error.issue}</p>
                          <p className="text-sm text-red-600">Fehler: {error.error}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2 text-blue-500" />
              Hinweise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Die Reparatur behebt fehlende Primärschlüssel in Tabellen.</li>
              <li>NULL-Werte in Fremdschlüsselspalten werden behoben und NOT NULL Constraints werden hinzugefügt.</li>
              <li>Eine komplette Dokumentation finden Sie unter <code>docs/db-structure-fixes-report.md</code>.</li>
              <li>Die Implementierungsdetails finden Sie unter <code>docs/db-structure-fix-implementation.md</code>.</li>
              <li>Wenn die API-Route nicht funktioniert, können Sie die Reparatur manuell mit <code>npx tsx server/run-db-fixes.ts</code> ausführen.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}