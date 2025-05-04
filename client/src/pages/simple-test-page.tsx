import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
              Sie enthält keine komplexen Komponenten oder API-Aufrufe.
            </p>
            <Button className="mt-4" variant="default">
              Test Button
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}