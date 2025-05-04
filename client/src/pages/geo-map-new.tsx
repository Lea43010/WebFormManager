import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Trash2, Save, BarChart } from "lucide-react";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";

// Vereinfachte Version ohne externe Kartenkomponenten
const GeoMapNew = () => {
  const [distance, setDistance] = useState(0);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  
  // Vereinfachte Funktionen als Platzhalter
  const handleMapClick = () => {
    toast({
      title: "Info", 
      description: "Kartenklick-Funktion wurde aufgerufen."
    });
  };

  const clearMarkers = () => {
    toast({
      title: "Info", 
      description: "Marker wurden gelöscht."
    });
    setDistance(0);
  };

  const fetchElevationData = () => {
    if (!startAddress || !endAddress) {
      toast({
        title: "Fehler",
        description: "Bitte Start- und Zieladresse eingeben.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Erfolg",
      description: "Höhenprofilsdaten erfolgreich simuliert!",
    });
  };

  const saveRoute = () => {
    if (!startAddress || !endAddress) {
      toast({
        title: "Fehler",
        description: "Bitte Start- und Zieladresse eingeben.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Erfolg",
      description: "Route erfolgreich gespeichert!",
    });
    
    // Simuliere eine Streckenlänge berechnen
    const newDistance = Math.floor(Math.random() * 50) + 5; // 5-55 km
    setDistance(newDistance);
  };

  // Einfache Karten-Platzhalter-Komponente
  const SimpleMapPlaceholder = () => (
    <div 
      className="w-full h-[500px] bg-slate-100 rounded-md border-2 border-dashed border-slate-200 flex flex-col items-center justify-center"
      onClick={handleMapClick}
    >
      <MapPin className="h-16 w-16 text-slate-300 mb-4" />
      <h3 className="text-xl font-medium text-slate-700 mb-2">Karte wird geladen</h3>
      <p className="text-slate-500 text-center max-w-md">
        Die Google Maps Komponente wird hier integriert. 
        Klicken Sie auf die Karte, um Wegpunkte zu markieren.
      </p>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Streckenplanung für Tiefbau</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Adresseingabe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startAddress">Startadresse:</Label>
              <Input 
                id="startAddress"
                placeholder="Startadresse eingeben" 
                value={startAddress}
                onChange={(e) => setStartAddress(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endAddress">Zieladresse:</Label>
              <Input 
                id="endAddress"
                placeholder="Zieladresse eingeben" 
                value={endAddress}
                onChange={(e) => setEndAddress(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Kartenansicht</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleMapPlaceholder />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Streckeninformationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-medium">Streckenlänge: {distance} km</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearMarkers}>
                <Trash2 className="h-4 w-4 mr-1" />
                Marker löschen
              </Button>
              <Button variant="outline" onClick={fetchElevationData}>
                <BarChart className="h-4 w-4 mr-1" />
                Höhenprofil
              </Button>
              <Button onClick={saveRoute}>
                <Save className="h-4 w-4 mr-1" />
                Route speichern
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeoMapNew;