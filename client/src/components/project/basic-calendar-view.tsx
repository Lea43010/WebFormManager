import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScreenSize } from "@/hooks/use-mobile";

// Super einfache Version ohne reaktive Zustände oder komplexe JSX-Elemente
export function BasicCalendarView({ projectId }: { projectId: number }) {
  // Aktuelle Jahr ermitteln
  const currentYear = new Date().getFullYear();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';
  
  return (
    <Card className="shadow-md">
      <CardHeader className="py-3 sm:py-4">
        <CardTitle className="text-lg sm:text-xl">Kalenderwochen-Planer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="px-2 sm:px-4 py-2 sm:py-4 space-y-3 sm:space-y-4">
          <div>
            <h3 className="font-medium text-center text-base sm:text-lg">Kalenderwochenübersicht {currentYear}</h3>
            <p className="text-center text-muted-foreground text-xs sm:text-sm">Projekt ID: {projectId}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            {/* Erste Jahreshälfte (mobil) oder Q1 (Desktop) */}
            <div className="p-2 sm:p-3 border rounded-md touch-manipulation min-touch-target flex flex-col justify-center">
              <h4 className="font-medium text-sm sm:text-base">
                {isMobile ? `H1 ${currentYear}` : `Q1 ${currentYear}`}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isMobile ? "KW 1-26" : "KW 1-13"}
              </p>
            </div>
            
            {/* Q2 (nur Desktop) oder ersetzt durch H1 auf Mobilgeräten */}
            {!isMobile && (
              <div className="p-2 sm:p-3 border rounded-md touch-manipulation min-touch-target flex flex-col justify-center">
                <h4 className="font-medium text-sm sm:text-base">Q2 {currentYear}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">KW 14-26</p>
              </div>
            )}
            
            {/* Zweite Jahreshälfte (mobil) oder Q3 (Desktop) */}
            <div className="p-2 sm:p-3 border rounded-md touch-manipulation min-touch-target flex flex-col justify-center">
              <h4 className="font-medium text-sm sm:text-base">
                {isMobile ? `H2 ${currentYear}` : `Q3 ${currentYear}`}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isMobile ? "KW 27-53" : "KW 27-39"}
              </p>
            </div>
            
            {/* Q4 (nur Desktop) oder ersetzt durch H2 auf Mobilgeräten */}
            {!isMobile && (
              <div className="p-2 sm:p-3 border rounded-md touch-manipulation min-touch-target flex flex-col justify-center">
                <h4 className="font-medium text-sm sm:text-base">Q4 {currentYear}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">KW 40-53</p>
              </div>
            )}
          </div>
          
          <div className="mt-2 sm:mt-4 p-3 sm:p-4 border rounded-md bg-yellow-50 text-yellow-800">
            <p className="text-center text-xs sm:text-sm">
              Diese vereinfachte Kalenderansicht wurde zur Behebung von Rendering-Problemen erstellt.
            </p>
            <p className="text-center mt-1 sm:mt-2 text-xs sm:text-sm">
              Eine vollständige Version mit Meilenstein-Visualisierung wird in Kürze implementiert.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}