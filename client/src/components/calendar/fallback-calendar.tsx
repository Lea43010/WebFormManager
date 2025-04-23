import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScreenSize } from "@/hooks/use-mobile";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function FallbackCalendar({ projectId = 0 }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <CardTitle className="text-base sm:text-lg mb-2 sm:mb-0">Kalenderwochen-Planer</CardTitle>
          <div className="flex space-x-2 items-center self-center sm:self-auto">
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 w-8 sm:h-9 sm:w-9 p-0 min-touch-target flex items-center justify-center"
              onClick={() => setYear(year - 1)}
              aria-label="Vorheriges Jahr"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-2 py-1 font-medium text-sm sm:text-base">{year}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 sm:h-9 sm:w-9 p-0 min-touch-target flex items-center justify-center"
              onClick={() => setYear(year + 1)}
              aria-label="Nächstes Jahr"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-medium">Kalenderwochenübersicht {year}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Projekt ID: {projectId}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            {isMobile ? (
              // Mobile Ansicht - Halbjahre
              <>
                <div className="p-2 sm:p-3 border rounded-md touch-manipulation min-touch-target flex flex-col justify-center">
                  <h4 className="text-sm sm:text-base font-medium">H1 {year}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">KW 1-26</p>
                </div>
                <div className="p-2 sm:p-3 border rounded-md touch-manipulation min-touch-target flex flex-col justify-center">
                  <h4 className="text-sm sm:text-base font-medium">H2 {year}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">KW 27-52/53</p>
                </div>
              </>
            ) : (
              // Desktop Ansicht - Quartale
              <>
                <div className="p-2 sm:p-3 border rounded-md touch-manipulation min-touch-target flex flex-col justify-center">
                  <h4 className="text-sm sm:text-base font-medium">Q1 {year}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">KW 1-13</p>
                </div>
                <div className="p-2 sm:p-3 border rounded-md touch-manipulation min-touch-target flex flex-col justify-center">
                  <h4 className="text-sm sm:text-base font-medium">Q2 {year}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">KW 14-26</p>
                </div>
                <div className="p-2 sm:p-3 border rounded-md touch-manipulation min-touch-target flex flex-col justify-center">
                  <h4 className="text-sm sm:text-base font-medium">Q3 {year}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">KW 27-39</p>
                </div>
                <div className="p-2 sm:p-3 border rounded-md touch-manipulation min-touch-target flex flex-col justify-center">
                  <h4 className="text-sm sm:text-base font-medium">Q4 {year}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">KW 40-52/53</p>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-2 sm:mt-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-center text-xs sm:text-sm text-yellow-800">
              Temporäre Ansicht während der Wartung des Kalender-Moduls
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}