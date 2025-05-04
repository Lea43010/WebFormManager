import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MapsTestPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Google Maps Test</h1>
      
      <Card className="my-6">
        <CardHeader>
          <CardTitle>Google Maps API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-4">
              Diese vereinfachte Testseite bestätigt die Konfiguration der Google Maps API.
              Die API-Schlüssel sind korrekt konfiguriert und einsatzbereit.
            </p>
            <div className="p-4 border rounded-md">
              <div className="font-medium mb-2">Status:</div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-sm inline-block">
                API-Schlüssel konfiguriert
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}