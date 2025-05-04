import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

/**
 * Einfache Platzhalterseite für den Geo-Map-Bereich
 * Ohne externe Kartenimporte oder komplexe Komponenten
 */
export default function GeoMapPlaceholder() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Geo-Informationen</h1>
      </div>
      
      <Card className="my-6">
        <CardHeader>
          <CardTitle>Kartenansicht - Wartungsmodus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-md p-6 text-center">
            <h2 className="text-xl font-medium mb-4">Kartenmodul wird aktualisiert</h2>
            <p className="mb-4">
              Das Kartenmodul wird derzeit aktualisiert und optimiert. 
              Bitte versuchen Sie es später noch einmal.
            </p>
            <div className="h-[300px] border-2 border-dashed border-muted-foreground/20 rounded-md 
                          flex items-center justify-center mb-6">
              <p className="text-muted-foreground">Kartenansicht temporär nicht verfügbar</p>
            </div>
            <Button asChild>
              <Link to="/dashboard">Zurück zum Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}