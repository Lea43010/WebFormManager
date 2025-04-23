import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Super einfache Version ohne reaktive Zustände oder komplexe JSX-Elemente
export function BasicCalendarView({ projectId }: { projectId: number }) {
  // Aktuelle Jahr ermitteln
  const currentYear = new Date().getFullYear();
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Kalenderwochen-Planer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-medium text-center">Kalenderwochenübersicht {currentYear}</h3>
            <p className="text-center text-muted-foreground text-sm">Projekt ID: {projectId}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-md">
              <h4 className="font-medium">Q1 {currentYear}</h4>
              <p className="text-sm text-muted-foreground">KW 1-13</p>
            </div>
            
            <div className="p-3 border rounded-md">
              <h4 className="font-medium">Q2 {currentYear}</h4>
              <p className="text-sm text-muted-foreground">KW 14-26</p>
            </div>
            
            <div className="p-3 border rounded-md">
              <h4 className="font-medium">Q3 {currentYear}</h4>
              <p className="text-sm text-muted-foreground">KW 27-39</p>
            </div>
            
            <div className="p-3 border rounded-md">
              <h4 className="font-medium">Q4 {currentYear}</h4>
              <p className="text-sm text-muted-foreground">KW 40-53</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 border rounded-md bg-yellow-50 text-yellow-800">
            <p className="text-center">
              Diese vereinfachte Kalenderansicht wurde zur Behebung von Rendering-Problemen erstellt.
            </p>
            <p className="text-center mt-2">
              Eine vollständige Version mit Meilenstein-Visualisierung wird in Kürze implementiert.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}