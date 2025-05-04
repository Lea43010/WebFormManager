import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SimpleMap from "@/components/maps/simple-map";

export default function SimpleTestPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Test Seite</h1>
      
      <Card className="my-6">
        <CardHeader>
          <CardTitle>Server Status Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded bg-muted/40">
            <p>
              Diese Seite dient zum Testen, ob der Server korrekt startet.
              Sie enthält vereinfachte Komponenten ohne komplexe API-Integrationen.
            </p>
            <Button className="mt-4" variant="default">
              Test Button
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="my-6">
        <CardHeader>
          <CardTitle>Vereinfachte Google Maps Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleMap 
            apiKey="AIzaSyCzmiIk0Xi0bKKPaqg0I53rULhQzmA5-cg"
            markers={[
              { lat: 48.137154, lng: 11.576124, title: "München" },
              { lat: 49.452102, lng: 11.076665, title: "Nürnberg" }
            ]}
            center={{ lat: 48.7, lng: 11.4 }}
            zoom={8}
          />
          <p className="mt-4 text-sm text-muted-foreground">
            Dies ist eine vereinfachte Karten-Komponente, die nur einen Link zu Google Maps anzeigt
            anstatt eine interaktive Karte zu laden. Sie erfordert weniger Ressourcen und kann helfen,
            Startprobleme des Servers zu vermeiden.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}