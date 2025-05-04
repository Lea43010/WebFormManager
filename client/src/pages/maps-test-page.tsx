import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SimpleGoogleMapsComponent, { SimpleMarkerInfo } from "@/components/maps/simplified-google-maps";

export default function MapsTestPage() {
  const [markers] = useState<SimpleMarkerInfo[]>([
    { position: [48.137154, 11.576124], title: "München" },
    { position: [49.452102, 11.076665], title: "Nürnberg" }
  ]);

  const apiKey = "AIzaSyCzmiIk0Xi0bKKPaqg0I53rULhQzmA5-cg";
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Google Maps Test</h1>
      
      <Card className="my-6">
        <CardHeader>
          <CardTitle>Vereinfachte Google Maps-Komponente</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleGoogleMapsComponent 
            markers={markers}
            apiKey={apiKey}
          />
        </CardContent>
      </Card>
    </div>
  );
}