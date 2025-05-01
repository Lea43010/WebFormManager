import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BayernMapsProps {
  defaultTab?: "bayernatlas" | "denkmalatlas";
  tabValue?: string; // Zusätzliche Prop für die Kompatibilität mit geo-map-page.tsx
}

export function BayernMaps({ defaultTab = "bayernatlas", tabValue }: BayernMapsProps) {
  // Verwende tabValue, wenn vorhanden, andernfalls defaultTab
  const initialTab = (tabValue === "bayernatlas" || tabValue === "denkmalatlas") 
    ? tabValue 
    : defaultTab;
    
  const [activeTab, setActiveTab] = useState<"bayernatlas" | "denkmalatlas">(initialTab);
  
  useEffect(() => {
    // Wenn sich defaultTab oder tabValue ändert, aktualisiere den aktiven Tab
    if (tabValue === "bayernatlas" || tabValue === "denkmalatlas") {
      setActiveTab(tabValue);
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, tabValue]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bayerische Geo-Informationen</CardTitle>
        <CardDescription>
          Kartenansichten für Bau-Projekte in Bayern
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hinweis</AlertTitle>
          <AlertDescription>
            Manche Kartenansichten erlauben keine Einbettung aufgrund von Sicherheitseinstellungen.
            Falls die Karten nicht angezeigt werden, nutzen Sie bitte die direkten Links.
          </AlertDescription>
        </Alert>

        <Tabs 
          value={activeTab} 
          onValueChange={(value: any) => setActiveTab(value as "bayernatlas" | "denkmalatlas")} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bayernatlas">BayernAtlas</TabsTrigger>
            <TabsTrigger value="denkmalatlas">DenkmalAtlas</TabsTrigger>
          </TabsList>
          <TabsContent value="bayernatlas" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-6 bg-muted/60 p-6 rounded-md border">
                <div className="text-center">
                  <div className="flex justify-center">
                    <img 
                      src="/assets/bayern-atlas-logo.svg" 
                      alt="BayernAtlas Logo" 
                      className="h-12 my-4"
                    />
                  </div>
                  <p className="text-sm mb-6 text-muted-foreground">
                    Der BayernAtlas ermöglicht es Ihnen, Informationen zu geografischen Standorten in Bayern zu erhalten. 
                    Die Karte kann aufgrund von Sicherheitseinstellungen möglicherweise nicht direkt eingebettet werden.
                  </p>
                  
                  <p className="text-sm mb-2 font-medium">Funktionen des BayernAtlas:</p>
                  <ul className="text-sm text-muted-foreground mb-4 list-disc pl-5 text-left">
                    <li>Detaillierte Standortinformationen zu Baugrundstücken</li>
                    <li>Luftbildanzeige und topografische Karten</li>
                    <li>Übersicht von Bauleitplanungen</li>
                    <li>Vermessungsdaten und Grundstücksinformationen</li>
                    <li>Höhenprofile für Bauprojekte</li>
                  </ul>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <a 
                    href="https://geoportal.bayern.de/bayernatlas/"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 border border-primary bg-primary text-white rounded-md hover:bg-primary/90 transition"
                  >
                    BayernAtlas öffnen
                  </a>
                  <a 
                    href="https://atlas.bayern.de/?redirect=true&r=0&l_v=true%2Cfalse%2Ctrue%2Ctrue%2Ctrue%2Ctrue&c=628139%2C5475730&t=ba&z=13&l=vt_luftbild"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 border border-primary/40 text-primary rounded-md hover:bg-primary/10 transition"
                  >
                    Direkt zum Luftbild
                  </a>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="denkmalatlas" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-6 bg-muted/60 p-6 rounded-md border">
                <div className="text-center">
                  <div className="flex justify-center">
                    <img 
                      src="/assets/denkmal-atlas-logo.svg" 
                      alt="DenkmalAtlas Logo" 
                      className="h-12 my-4"
                    />
                  </div>
                  <p className="text-sm mb-6 text-muted-foreground">
                    Der DenkmalAtlas Bayern bietet Informationen zu denkmalgeschützten Objekten und historischen Stätten im Freistaat Bayern.
                    Die Karte kann aufgrund von Sicherheitseinstellungen möglicherweise nicht direkt eingebettet werden.
                  </p>
                  
                  <p className="text-sm mb-2 font-medium">Funktionen des DenkmalAtlas:</p>
                  <ul className="text-sm text-muted-foreground mb-4 list-disc pl-5 text-left">
                    <li>Umfassende Informationen zu Baudenkmälern</li>
                    <li>Suche nach denkmalgeschützten Objekten</li>
                    <li>Detaillierte Beschreibungen und historische Daten</li>
                    <li>Informationen zu Denkmalschutzauflagen für Bauprojekte</li>
                    <li>Übersicht von Ensembles und Denkmalbereichen</li>
                  </ul>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <a 
                    href="https://geoportal.bayern.de/denkmalatlas/"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 border border-primary bg-primary text-white rounded-md hover:bg-primary/90 transition"
                  >
                    DenkmalAtlas öffnen
                  </a>
                  <a 
                    href="https://www.blfd.bayern.de/"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 border border-primary/40 text-primary rounded-md hover:bg-primary/10 transition"
                  >
                    Bayerisches Landesamt für Denkmalpflege
                  </a>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default BayernMaps;