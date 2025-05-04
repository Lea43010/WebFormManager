import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BasicMap from "@/components/maps/basic-map";
import { GOOGLE_MAPS_API_KEY } from "@/config/google-maps";

export default function MapsTestPage() {
  // API-Schlüssel aus der Konfiguration verwenden
  const apiKey = GOOGLE_MAPS_API_KEY;
  
  const [markers] = useState([
    { lat: 48.137154, lng: 11.576124, title: "München" },
    { lat: 49.452102, lng: 11.076665, title: "Nürnberg" }
  ]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Google Maps Test</h1>
      
      <Card className="my-6">
        <CardHeader>
          <CardTitle>Einfache Google Maps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-4">
              Diese vereinfachte Karte verwendet die Google Maps API ohne komplexe Bibliotheken.
              Die direkten Google Maps API-Schlüssel sind konfiguriert und funktionsfähig.
            </p>
            <BasicMap 
              apiKey={apiKey}
              markers={markers}
              center={{ lat: 48.7, lng: 11.4 }}
              zoom={8}
              height="400px"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}