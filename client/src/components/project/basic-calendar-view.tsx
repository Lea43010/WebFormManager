import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Smartphone } from "lucide-react";

interface CalendarViewProps {
  projectId: number;
}

export function BasicCalendarView({ projectId }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  const toggleView = () => {
    setViewMode(prev => prev === 'mobile' ? 'desktop' : 'mobile');
  };

  // Aktuelle Jahr ermitteln
  const currentYear = new Date().getFullYear();
  
  // Jahre für Auswahl generieren (aktuelles Jahr ± 2 Jahre)
  const yearOptions = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2
  ];

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Kalenderwochen-Planer</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleView}
          className="flex items-center"
        >
          {viewMode === 'mobile' ? (
            <>
              <Monitor className="h-4 w-4 mr-2" />
              <span>Desktop</span>
            </>
          ) : (
            <>
              <Smartphone className="h-4 w-4 mr-2" />
              <span>Mobil</span>
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Select
              defaultValue={currentYear.toString()}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Jahr" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-center p-4 border rounded-md">
            {viewMode === 'mobile' ? (
              <p>Mobile Ansicht für Projekt #{projectId}</p>
            ) : (
              <p>Desktop Ansicht für Projekt #{projectId}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}