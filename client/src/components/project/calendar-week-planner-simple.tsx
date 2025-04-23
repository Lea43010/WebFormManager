import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalendarWeekPlannerProps {
  projectId: number;
}

export function CalendarWeekPlanner({ projectId }: CalendarWeekPlannerProps) {
  const [selectedYear] = useState(new Date().getFullYear());

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Kalenderwochen-Planer (Vereinfachte Version)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 text-center">
          <p>Zeitlicher Rahmen für das Jahr {selectedYear}</p>
          <p>Projekt-ID: {projectId}</p>
          <p className="text-muted-foreground mt-4">Diese vereinfachte Version wurde für die Fehlerbehebung erstellt.</p>
        </div>
      </CardContent>
    </Card>
  );
}