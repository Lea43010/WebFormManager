import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCopy, Globe, Info, Server, Terminal, TestTube2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function DeploymentDocs() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast({
      title: "Befehl kopiert",
      description: "Der Befehl wurde in die Zwischenablage kopiert.",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deployment Dokumentation</h1>
          <p className="text-muted-foreground">
            Anleitung zur Verwaltung der Deployment-Umgebungen für die Bau-Structura App
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Info className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-muted-foreground">Zuletzt aktualisiert: 28.04.2025</span>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-7 w-full max-w-4xl">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="environments">Umgebungen</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center">
            <TestTube2 className="h-4 w-4 mr-2" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="troubleshooting">Fehlerbehebung</TabsTrigger>
          <TabsTrigger value="manual">Anleitung</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment-Umgebungen der Bau-Structura App</CardTitle>
              <CardDescription>
                Überblick über das Multi-Umgebungs-Deployment-System
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Die Bau-Structura App verwendet ein dreistufiges Deployment-System, das 
                eine kontinuierliche Entwicklung ermöglicht, während die Anwendung bereits 
                in Produktion ist. Die drei Umgebungen sind:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-500 flex items-center">
                      <Terminal className="h-5 w-5 mr-2" />
                      Development
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Lokale Entwicklungsumgebung für neue Features und Bugfixes. 
                      Keine echten E-Mails werden versendet, alle Debugging-Features sind aktiviert.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-amber-500 flex items-center">
                      <Server className="h-5 w-5 mr-2" />
                      Staging
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Testumgebung für die Qualitätssicherung vor dem Deployment in die Produktion.
                      Ähnliche Konfiguration wie Produktion, aber mit zusätzlichen Sicherheitsnetzen.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-red-500 flex items-center">
                      <Globe className="h-5 w-5 mr-2" />
                      Production
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Live-Umgebung für Endbenutzer. Maximale Sicherheit, 
                      Leistung und Stabilität. Minimale Logs, echte E-Mails werden versendet.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-lg font-semibold mt-6">Umgebungskonfiguration</h3>
              <p>
                Jede Umgebung hat ihre eigene Konfigurationsdatei 
                (<code>.env.development</code>, <code>.env.staging</code>, <code>.env.production</code>)
                mit spezifischen Einstellungen für Datenbank, API-Schlüssel, Logging und Sicherheit.
              </p>

              <p>
                Die Anwendung bietet integrierte Tools zur Verwaltung dieser Umgebungen, 
                einschließlich Klonen, Testen und Einrichten neuer Umgebungen.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Umgebungsdetails</CardTitle>
              <CardDescription>
                Spezifische Konfigurationen und Eigenschaften jeder Umgebung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-500">Development</h3>
                <Separator className="my-2" />
                <p className="mb-2">
                  Die Entwicklungsumgebung ist für lokale Entwicklung, Tests und Debugging optimiert.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 my-4">
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">NODE_ENV:</span>
                    <span className="text-sm ml-2">development</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">LOG_LEVEL:</span>
                    <span className="text-sm ml-2">debug</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">E-Mail-Modus:</span>
                    <span className="text-sm ml-2">Entwicklung (keine echten E-Mails)</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">2FA:</span>
                    <span className="text-sm ml-2">Deaktiviert</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">Rate Limits:</span>
                    <span className="text-sm ml-2">Hoch</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">Port:</span>
                    <span className="text-sm ml-2">5000</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Starten mit:</strong> <code>./scripts/env-tools.sh start development</code>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-amber-500">Staging</h3>
                <Separator className="my-2" />
                <p className="mb-2">
                  Die Staging-Umgebung ist eine Testumgebung, die der Produktionsumgebung ähnelt, aber mit zusätzlichen Debugging-Funktionen.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 my-4">
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">NODE_ENV:</span>
                    <span className="text-sm ml-2">staging</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">LOG_LEVEL:</span>
                    <span className="text-sm ml-2">info</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">E-Mail-Modus:</span>
                    <span className="text-sm ml-2">Entwicklung (keine echten E-Mails)</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">2FA:</span>
                    <span className="text-sm ml-2">Optional</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">Rate Limits:</span>
                    <span className="text-sm ml-2">Mittel</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">Port:</span>
                    <span className="text-sm ml-2">5000</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Starten mit:</strong> <code>./scripts/env-tools.sh start staging</code>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-500">Production</h3>
                <Separator className="my-2" />
                <p className="mb-2">
                  Die Produktionsumgebung ist für maximale Sicherheit, Leistung und Stabilität optimiert.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 my-4">
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">NODE_ENV:</span>
                    <span className="text-sm ml-2">production</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">LOG_LEVEL:</span>
                    <span className="text-sm ml-2">warn</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">E-Mail-Modus:</span>
                    <span className="text-sm ml-2">Produktion (echte E-Mails)</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">2FA:</span>
                    <span className="text-sm ml-2">Aktiviert</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">Rate Limits:</span>
                    <span className="text-sm ml-2">Strikt</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-sm font-medium">Port:</span>
                    <span className="text-sm ml-2">80</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Starten mit:</strong> <code>./scripts/env-tools.sh start production</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Umgebungsmanagement-Tools</CardTitle>
              <CardDescription>
                Verfügbare Werkzeuge für die Verwaltung der Deployment-Umgebungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">env-tools.sh</h3>
                <p className="mb-2">
                  Das zentrale Skript für alle Umgebungsverwaltungsaufgaben. Es bietet eine einheitliche Schnittstelle für die anderen Skripte.
                </p>
                <div className="bg-muted p-3 rounded-md my-3">
                  <div className="flex items-center gap-2 mb-1">
                    <code>./scripts/env-tools.sh list [details]</code>
                    <Button variant="ghost" size="icon" onClick={() => copyCommand("./scripts/env-tools.sh list details")}>
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Listet alle verfügbaren Umgebungen auf, mit optionalen Details</p>
                </div>
                <div className="bg-muted p-3 rounded-md my-3">
                  <div className="flex items-center gap-2 mb-1">
                    <code>./scripts/env-tools.sh setup &lt;env&gt;</code>
                    <Button variant="ghost" size="icon" onClick={() => copyCommand("./scripts/env-tools.sh setup development")}>
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Richtet eine neue Umgebung ein</p>
                </div>
                <div className="bg-muted p-3 rounded-md my-3">
                  <div className="flex items-center gap-2 mb-1">
                    <code>./scripts/env-tools.sh clone &lt;source&gt; &lt;target&gt;</code>
                    <Button variant="ghost" size="icon" onClick={() => copyCommand("./scripts/env-tools.sh clone development staging")}>
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Klont eine Umgebung in eine andere</p>
                </div>
                <div className="bg-muted p-3 rounded-md my-3">
                  <div className="flex items-center gap-2 mb-1">
                    <code>./scripts/env-tools.sh test &lt;source&gt; &lt;target&gt;</code>
                    <Button variant="ghost" size="icon" onClick={() => copyCommand("./scripts/env-tools.sh test development production")}>
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Testet das Klonen ohne tatsächliche Änderungen vorzunehmen</p>
                </div>
                <div className="bg-muted p-3 rounded-md my-3">
                  <div className="flex items-center gap-2 mb-1">
                    <code>./scripts/env-tools.sh start &lt;env&gt;</code>
                    <Button variant="ghost" size="icon" onClick={() => copyCommand("./scripts/env-tools.sh start development")}>
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Startet die Anwendung in der angegebenen Umgebung</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Individuelle Skripte</h3>
                <p className="mb-2">
                  Die folgenden Skripte können auch direkt ausgeführt werden:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="bg-muted p-3 rounded-md">
                    <code>./scripts/run-env-list.sh</code>
                    <p className="text-sm text-muted-foreground mt-1">Listet alle verfügbaren Umgebungen auf</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <code>./scripts/run-env-setup.sh</code>
                    <p className="text-sm text-muted-foreground mt-1">Richtet eine neue Umgebung ein</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <code>./scripts/run-env-clone.sh</code>
                    <p className="text-sm text-muted-foreground mt-1">Klont eine Umgebung in eine andere</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <code>./scripts/run-env-test.sh</code>
                    <p className="text-sm text-muted-foreground mt-1">Testet das Klonen ohne Änderungen</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Environment-Module</h3>
                <p className="mb-2">
                  Die Konfigurationslogik ist in den folgenden Modulen implementiert:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="bg-muted p-3 rounded-md">
                    <code>config/environments.ts</code>
                    <p className="text-sm text-muted-foreground mt-1">Hauptkonfigurationsmodul mit Funktionen und Konstanten</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <code>scripts/setup-environment.ts</code>
                    <p className="text-sm text-muted-foreground mt-1">Logik für das Einrichten neuer Umgebungen</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <code>scripts/clone-environment.ts</code>
                    <p className="text-sm text-muted-foreground mt-1">Logik für das Klonen von Umgebungen</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <code>scripts/test-env-clone.ts</code>
                    <p className="text-sm text-muted-foreground mt-1">Testlogik für das Klonen ohne Änderungen</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CI/CD-Workflows</CardTitle>
              <CardDescription>
                GitHub Actions Workflows für automatisiertes Deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Automatisiertes Deployment</h3>
                <p className="mb-4">
                  Die Anwendung nutzt GitHub Actions für kontinuierliche Integration und Deployment. 
                  Die folgenden Workflows sind konfiguriert:
                </p>

                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium text-amber-500 flex items-center">
                      <Server className="h-4 w-4 mr-2" />
                      Deploy to Staging
                    </h4>
                    <p className="text-sm my-2">
                      Wird automatisch ausgeführt, wenn Code zum <code>develop</code>-Branch 
                      gepusht wird oder manuell über die GitHub Actions UI.
                    </p>
                    <div className="text-sm bg-muted p-2 rounded mt-2">
                      <p><strong>Workflow-Datei:</strong> <code>.github/workflows/deploy-staging.yml</code></p>
                      <p><strong>Schritte:</strong> Code auschecken, Node.js einrichten, Dependencies installieren, 
                      Umgebungsvariablen konfigurieren, Datenbankmigration ausführen, Build erstellen, 
                      Tests ausführen, zum Staging-Server deployen</p>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <h4 className="font-medium text-red-500 flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      Deploy to Production
                    </h4>
                    <p className="text-sm my-2">
                      Wird automatisch ausgeführt, wenn Code zum <code>main</code>-Branch 
                      gepusht wird oder manuell über die GitHub Actions UI mit Bestätigung.
                    </p>
                    <div className="text-sm bg-muted p-2 rounded mt-2">
                      <p><strong>Workflow-Datei:</strong> <code>.github/workflows/deploy-production.yml</code></p>
                      <p><strong>Schritte:</strong> Bestätigung anfordern (bei manueller Ausführung), 
                      Code auschecken, Node.js einrichten, Dependencies installieren, Umgebungsvariablen konfigurieren, 
                      Datenbankmigration ausführen, Build erstellen, Tests ausführen, Backup erstellen, 
                      zum Produktionsserver deployen, Health-Check durchführen</p>
                    </div>
                    <p className="text-sm text-red-500 mt-2">
                      <strong>Wichtig:</strong> Das Produktionsdeployment erfordert eine explizite Bestätigung bei
                      manueller Ausführung.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mt-4">Deployment-Prozess</h3>
                <p className="mb-2">
                  Der empfohlene Workflow für neue Features ist:
                </p>

                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Entwickeln und Testen in der <strong>Development</strong>-Umgebung</li>
                  <li>Pull Request zum <code>develop</code>-Branch erstellen</li>
                  <li>Nach Genehmigung wird der Code automatisch zur <strong>Staging</strong>-Umgebung deployed</li>
                  <li>Testen in der Staging-Umgebung</li>
                  <li>Pull Request vom <code>develop</code>- zum <code>main</code>-Branch erstellen</li>
                  <li>Nach Genehmigung wird der Code automatisch zur <strong>Production</strong>-Umgebung deployed</li>
                </ol>

                <div className="bg-muted p-3 rounded-md my-4">
                  <p className="text-sm">
                    <strong>Tipp:</strong> Für dringende Hotfixes kann ein Pull Request direkt zum 
                    <code>main</code>-Branch erstellt werden, aber diese Änderungen sollten später 
                    zurück in den <code>develop</code>-Branch gemergt werden.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube2 className="h-5 w-5 mr-2" />
                Test-Dokumentation
              </CardTitle>
              <CardDescription>
                Übersicht der Tests und Testabdeckung der Bau-Structura App
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Testphilosophie</h3>
                <p className="mb-4">
                  Die Bau-Structura App folgt einem mehrschichtigen Testansatz, um sicherzustellen, 
                  dass die Anwendung zuverlässig, robust und benutzerfreundlich ist:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                  <Card className="border-l-4 border-l-blue-400">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-blue-500 flex items-center text-base">
                        <TestTube2 className="h-4 w-4 mr-2" />
                        Unit-Tests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Testen einzelner Komponenten und Funktionen in Isolation mit Jest und React Testing Library.
                        Momentan 26 Unit-Tests über verschiedene Komponenten.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-amber-400">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-amber-500 flex items-center text-base">
                        <TestTube2 className="h-4 w-4 mr-2" />
                        Integrationstests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Testen des Zusammenspiels verschiedener Komponenten.
                        Momentan 11 Integrationstests für die Hauptsysteme.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-red-400">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-red-500 flex items-center text-base">
                        <TestTube2 className="h-4 w-4 mr-2" />
                        End-to-End-Tests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Testen der Anwendung aus Benutzerperspektive.
                        In Planung für kritische Benutzerworkflows.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Unit-Tests</h3>
                <p className="mb-4">
                  Die Unit-Tests stellen sicher, dass einzelne Komponenten und Funktionen wie erwartet funktionieren.
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Datenbankstruktur-Qualitätsprüfung (7 Tests)
                    </h4>
                    <p className="text-sm mb-2 text-muted-foreground">
                      Datei: <code>server/__tests__/db-structure-quality.test.ts</code>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-muted rounded p-2 text-sm">Qualitätsprüfung implementiert</div>
                      <div className="bg-muted rounded p-2 text-sm">Regeln für Tabellennamen (tbl-Präfix)</div>
                      <div className="bg-muted rounded p-2 text-sm">Regeln für Primärschlüssel</div>
                      <div className="bg-muted rounded p-2 text-sm">Regeln für Fremdschlüssel</div>
                      <div className="bg-muted rounded p-2 text-sm">HTML-Report-Generierung</div>
                      <div className="bg-muted rounded p-2 text-sm">JSON-Report-Generierung</div>
                      <div className="bg-muted rounded p-2 text-sm">Tab-Navigation UI</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Benutzer-Management (5 Tests)
                    </h4>
                    <p className="text-sm mb-2 text-muted-foreground">
                      Datei: <code>server/__tests__/user-management.test.ts</code>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-muted rounded p-2 text-sm">Benutzer-Schema Validierung</div>
                      <div className="bg-muted rounded p-2 text-sm">E-Mail-Validierung</div>
                      <div className="bg-muted rounded p-2 text-sm">Passwort-Validierung</div>
                      <div className="bg-muted rounded p-2 text-sm">Rollenvalidierung</div>
                      <div className="bg-muted rounded p-2 text-sm">Passwort-Hashing</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Geo-Informationen (5 Tests)
                    </h4>
                    <p className="text-sm mb-2 text-muted-foreground">
                      Datei: <code>client/src/__tests__/geo-information.test.tsx</code>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-muted rounded p-2 text-sm">Map-Komponente Rendering</div>
                      <div className="bg-muted rounded p-2 text-sm">Marker-Anzeige</div>
                      <div className="bg-muted rounded p-2 text-sm">Standortformular Rendering</div>
                      <div className="bg-muted rounded p-2 text-sm">Adresssuche</div>
                      <div className="bg-muted rounded p-2 text-sm">Koordinatenaktualisierung</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Bautagebuch (7 Tests)
                    </h4>
                    <p className="text-sm mb-2 text-muted-foreground">
                      Datei: <code>server/__tests__/construction-diary.test.ts</code>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-muted rounded p-2 text-sm">Schema-Validierung</div>
                      <div className="bg-muted rounded p-2 text-sm">Wetter-Validierung</div>
                      <div className="bg-muted rounded p-2 text-sm">Temperatur-Validierung</div>
                      <div className="bg-muted rounded p-2 text-sm">Eintrag-Erstellung</div>
                      <div className="bg-muted rounded p-2 text-sm">Eintrag-Abruf</div>
                      <div className="bg-muted rounded p-2 text-sm">Eintrag-Aktualisierung</div>
                      <div className="bg-muted rounded p-2 text-sm">Eintrag-Löschung</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Integrationstests</h3>
                <p className="mb-4">
                  Integrationstests prüfen, ob verschiedene Komponenten der Anwendung korrekt zusammenarbeiten.
                </p>
                
                <p className="text-sm mb-2 text-muted-foreground">
                  Datei: <code>integration-tests/app-integration.test.js</code>
                </p>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Authentication & Benutzer-Verwaltung (3 Tests)
                    </h4>
                    <div className="bg-muted rounded p-2 text-sm mt-2">
                      Login, Benutzer anlegen, Benutzer abrufen
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Projekt-Verwaltung (2 Tests)
                    </h4>
                    <div className="bg-muted rounded p-2 text-sm mt-2">
                      Projekt anlegen, Projekte abrufen
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Bautagebuch (2 Tests)
                    </h4>
                    <div className="bg-muted rounded p-2 text-sm mt-2">
                      Bautagebuch-Eintrag anlegen, Bautagebuch-Einträge abrufen
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Datenqualitäts-Management (2 Tests)
                    </h4>
                    <div className="bg-muted rounded p-2 text-sm mt-2">
                      HTML-Report abrufen, JSON-Report abrufen
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Integration Geolocation (2 Tests)
                    </h4>
                    <div className="bg-muted rounded p-2 text-sm mt-2">
                      Projektstandort aktualisieren, Projektstandort abrufen
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Tests ausführen</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Unit-Tests</h4>
                    <div className="bg-muted p-3 rounded-md my-3">
                      <div className="flex items-center gap-2 mb-1">
                        <code>node run-all-tests.mjs</code>
                        <Button variant="ghost" size="icon" onClick={() => copyCommand("node run-all-tests.mjs")}>
                          <ClipboardCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Integrationstests</h4>
                    <div className="bg-muted p-3 rounded-md my-3">
                      <div className="flex items-center gap-2 mb-1">
                        <code>node run-integration-test.mjs</code>
                        <Button variant="ghost" size="icon" onClick={() => copyCommand("node run-integration-test.mjs")}>
                          <ClipboardCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fehlerbehebung</CardTitle>
              <CardDescription>
                Häufige Probleme und deren Lösungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Umgebungsprobleme</h3>
                <div className="space-y-4 mt-4">
                  <div className="border p-4 rounded-md">
                    <h4 className="font-medium">Fehler: "Die Quellkonfiguration existiert nicht"</h4>
                    <p className="text-sm my-2">
                      Dies bedeutet, dass die Quell-Umgebungsdatei (<code>.env.development</code>, etc.) 
                      nicht gefunden werden konnte.
                    </p>
                    <div className="bg-muted p-2 rounded-md">
                      <p className="text-sm font-medium">Lösung:</p>
                      <ol className="list-decimal list-inside text-sm ml-2">
                        <li>Überprüfen Sie, ob die Datei existiert</li>
                        <li>Richten Sie die Quellumgebung ein mit <code>./scripts/env-tools.sh setup &lt;source-env&gt;</code></li>
                      </ol>
                    </div>
                  </div>

                  <div className="border p-4 rounded-md">
                    <h4 className="font-medium">Fehler: "Die Zielkonfiguration existiert bereits"</h4>
                    <p className="text-sm my-2">
                      Dies bedeutet, dass bereits eine Konfiguration für die Zielumgebung existiert und 
                      das Skript diese nicht überschreiben möchte.
                    </p>
                    <div className="bg-muted p-2 rounded-md">
                      <p className="text-sm font-medium">Lösung:</p>
                      <ol className="list-decimal list-inside text-sm ml-2">
                        <li>Fügen Sie <code>--force</code> zum Befehl hinzu, um die Zielkonfiguration zu überschreiben</li>
                        <li>Beispiel: <code>./scripts/env-tools.sh clone development staging --force</code></li>
                      </ol>
                    </div>
                  </div>

                  <div className="border p-4 rounded-md">
                    <h4 className="font-medium">Fehler beim Starten der Anwendung in einer bestimmten Umgebung</h4>
                    <p className="text-sm my-2">
                      Dies kann verschiedene Ursachen haben, wie z.B. fehlende Umgebungsvariablen oder 
                      falsche Datenbankkonfiguration.
                    </p>
                    <div className="bg-muted p-2 rounded-md">
                      <p className="text-sm font-medium">Lösung:</p>
                      <ol className="list-decimal list-inside text-sm ml-2">
                        <li>Überprüfen Sie die Umgebungskonfiguration mit <code>./scripts/env-tools.sh list details</code></li>
                        <li>Stellen Sie sicher, dass alle erforderlichen Variablen gesetzt sind, besonders <code>DATABASE_URL</code></li>
                        <li>Bei Datenbankproblemen überprüfen Sie die Verbindung mit <code>pg_isready -d $DATABASE_URL</code></li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mt-6">Deployment-Probleme</h3>
                <div className="space-y-4 mt-4">
                  <div className="border p-4 rounded-md">
                    <h4 className="font-medium">GitHub Actions Workflow schlägt fehl</h4>
                    <p className="text-sm my-2">
                      Wenn ein Deployment-Workflow fehlschlägt, überprüfen Sie die Logs in der GitHub Actions UI.
                    </p>
                    <div className="bg-muted p-2 rounded-md">
                      <p className="text-sm font-medium">Häufige Ursachen und Lösungen:</p>
                      <ul className="list-disc list-inside text-sm ml-2">
                        <li>Fehlende Secrets: Stellen Sie sicher, dass alle erforderlichen Secrets in den Repository-Einstellungen konfiguriert sind</li>
                        <li>Build-Fehler: Beheben Sie alle Build-Fehler lokal und pushen Sie die Fixes</li>
                        <li>Test-Fehler: Führen Sie Tests lokal aus, um Fehler zu identifizieren</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border p-4 rounded-md">
                    <h4 className="font-medium">Unterschiede zwischen Umgebungen</h4>
                    <p className="text-sm my-2">
                      Wenn die Anwendung in einer Umgebung funktioniert, aber in einer anderen nicht, 
                      könnte dies an Umgebungsunterschieden liegen.
                    </p>
                    <div className="bg-muted p-2 rounded-md">
                      <p className="text-sm font-medium">Lösung:</p>
                      <ol className="list-decimal list-inside text-sm ml-2">
                        <li>Vergleichen Sie die Umgebungsvariablen mit <code>./scripts/env-tools.sh list details</code></li>
                        <li>Überprüfen Sie Umgebungsspezifische Konfiguration in <code>config/environments.ts</code></li>
                        <li>Stellen Sie sicher, dass alle erforderlichen Dienste (Datenbank, etc.) in der Zielumgebung erreichbar sind</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mt-6">Notfallwiederherstellung</h3>
                <p className="mb-4">
                  Im Falle eines fehlgeschlagenen Deployments in der Produktionsumgebung:
                </p>

                <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                  <h4 className="font-medium text-red-700">Rollback-Prozess</h4>
                  <ol className="list-decimal list-inside text-sm ml-2 text-red-700 mt-2">
                    <li>Überprüfen Sie, ob ein automatischer Rollback durch den Workflow ausgelöst wurde</li>
                    <li>Wenn nicht, können Sie manuell zur vorherigen Version zurückkehren, indem Sie den letzten erfolgreichen Commit zum <code>main</code>-Branch auschecken</li>
                    <li>Verwenden Sie die Backup-Dateien in <code>.env.production.backup</code>, falls vorhanden</li>
                    <li>Bei Datenbankproblemen können Sie das letzte Backup wiederherstellen</li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mt-4">
                  <h4 className="font-medium text-blue-700">Backup-Strategie</h4>
                  <p className="text-sm text-blue-700 mt-2">
                    Die Anwendung erstellt automatisch Backups der Umgebungskonfigurationen vor dem Überschreiben.
                    Es wird empfohlen, regelmäßige Datenbank-Backups zu planen und diese an einem sicheren Ort aufzubewahren.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                Benutzerhandbuch
              </CardTitle>
              <CardDescription>
                Umfassende Anleitung für Anwender der Bau-Structura App
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Das Benutzerhandbuch enthält detaillierte Anleitungen für alle Funktionen der Bau-Structura App.
                Es ist sowohl für neue Benutzer als auch für erfahrene Anwender eine wichtige Ressource.
              </p>
              
              <h3 className="text-lg font-semibold mt-4">Inhalt des Handbuchs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div className="bg-muted p-3 rounded-md">
                  <h4 className="font-medium mb-2">Grundfunktionen</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Anmeldung und Registrierung</li>
                    <li>Dashboard-Übersicht</li>
                    <li>Projektmanagement</li>
                    <li>Bautagebuch</li>
                    <li>Meilensteine</li>
                  </ul>
                </div>
                
                <div className="bg-muted p-3 rounded-md">
                  <h4 className="font-medium mb-2">Erweiterte Funktionen</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Oberflächenanalyse</li>
                    <li>Bedarfs- und Kapazitätsplanung</li>
                    <li>Dokumenten-Management</li>
                    <li>Administration</li>
                    <li>Datensicherung</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                <p className="font-medium">Zugriff auf das Benutzerhandbuch</p>
                <p className="text-sm mt-2">
                  Das vollständige Benutzerhandbuch ist als Markdown-Dokument verfügbar und kann 
                  über verschiedene Wege aufgerufen werden:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                  <li>Direkt unter <code>/docs/Benutzerhandbuch.md</code> im Projektverzeichnis</li>
                  <li>In der App unter &quot;Hilfe & Info&quot; &gt; &quot;Benutzerhandbuch&quot;</li>
                  <li>Als PDF-Download über den Link unten</li>
                </ul>
              </div>
              
              <div className="flex justify-center mt-6">
                <Button className="w-full md:w-auto">
                  <a href="/docs/Benutzerhandbuch.md" target="_blank" className="flex items-center">
                    Benutzerhandbuch öffnen
                  </a>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">
                Das Handbuch wird regelmäßig aktualisiert, um neue Funktionen und Verbesserungen zu dokumentieren.
                Die aktuelle Version ist vom 28.04.2025.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}