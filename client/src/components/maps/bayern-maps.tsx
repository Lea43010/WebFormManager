import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function BayernMaps() {
  const [activeTab, setActiveTab] = useState("bayernatlas");

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bayernatlas">BayernAtlas</TabsTrigger>
            <TabsTrigger value="denkmalatlas">DenkmalAtlas</TabsTrigger>
          </TabsList>
          <TabsContent value="bayernatlas" className="mt-4">
            <div className="space-y-4">
              <div className="iframe-container h-[600px] w-full border border-border rounded-md">
                <iframe 
                  className="w-full h-full"
                  src="https://atlas.bayern.de/?redirect=true&r=0&l_v=true%2Cfalse%2Ctrue%2Ctrue%2Ctrue%2Ctrue&c=628139%2C5475730&t=ba&z=13&l=vt_luftbild%2Cda4e50de-e3de-4a62-9ebc-ae7e0dab935f%2C6f5a389c-4ef3-4b5a-9916-475fd5c5962b%2C044eccef-ab23-478c-8f17-e2182559d036%2Cd0e7d4ea-62d8-46a0-a54a-09654530beed%2C9d0e3859-be17-4a40-b439-1ba19b45fbb8&l_o=1%2C1%2C0.55%2C0.85%2C0.8%2C0.45"
                  allowFullScreen
                  title="BayernAtlas"
                />
              </div>
              <div className="text-sm">
                <a 
                  href="https://atlas.bayern.de/?redirect=true&r=0&l_v=true%2Cfalse%2Ctrue%2Ctrue%2Ctrue%2Ctrue&c=628139%2C5475730&t=ba&z=13&l=vt_luftbild%2Cda4e50de-e3de-4a62-9ebc-ae7e0dab935f%2C6f5a389c-4ef3-4b5a-9916-475fd5c5962b%2C044eccef-ab23-478c-8f17-e2182559d036%2Cd0e7d4ea-62d8-46a0-a54a-09654530beed%2C9d0e3859-be17-4a40-b439-1ba19b45fbb8&l_o=1%2C1%2C0.55%2C0.85%2C0.8%2C0.45"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  BayernAtlas in neuem Tab öffnen
                </a>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="denkmalatlas" className="mt-4">
            <div className="space-y-4">
              <div className="iframe-container h-[600px] w-full border border-border rounded-md">
                <iframe 
                  className="w-full h-full"
                  src="https://geoportal.bayern.de/denkmalatlas/"
                  allowFullScreen
                  title="DenkmalAtlas"
                />
              </div>
              <div className="text-sm">
                <a 
                  href="https://geoportal.bayern.de/denkmalatlas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  DenkmalAtlas in neuem Tab öffnen
                </a>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default BayernMaps;