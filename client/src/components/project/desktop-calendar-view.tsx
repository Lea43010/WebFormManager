import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Milestone } from '@shared/schema';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Hilfsfunktionen
const getCurrentYear = () => new Date().getFullYear();
const getCurrentWeek = () => {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  return Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
};

// Prüfen, ob ein Jahr ein Schaltjahr ist
const isLeapYear = (year: number) => {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
};

// Bestimmen der Anzahl der Kalenderwochen in einem Jahr
const getWeeksInYear = (year: number) => {
  const lastDay = new Date(year, 11, 31);
  const lastDayOfYear = lastDay.getDay();
  if (lastDayOfYear === 4 || (lastDayOfYear === 3 && isLeapYear(year))) {
    return 53;
  }
  return 52;
};

// Funktion zum Formatieren des Monatsnamens
const getMonthName = (month: number) => {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return months[month];
};

// Bauphase-Farben
const getBauphaseColor = (bauphase: string | null) => {
  switch (bauphase) {
    case 'Baustart Tiefbau FÖB': return 'bg-blue-100 border-blue-500 text-blue-700';
    case 'Baustart Tiefbau EWB': return 'bg-green-100 border-green-500 text-green-700';
    case 'Tiefbau EWB': return 'bg-teal-100 border-teal-500 text-teal-700';
    case 'Tiefbau FÖB': return 'bg-cyan-100 border-cyan-500 text-cyan-700';
    case 'Montage NE3 EWB': return 'bg-amber-100 border-amber-500 text-amber-700';
    case 'Montage NE3 FÖB': return 'bg-orange-100 border-orange-500 text-orange-700';
    case 'Endmontage NE4 EWB': return 'bg-purple-100 border-purple-500 text-purple-700';
    case 'Endmontage NE4 FÖB': return 'bg-fuchsia-100 border-fuchsia-500 text-fuchsia-700';
    default: return 'bg-gray-100 border-gray-500 text-gray-700';
  }
};

// Interface für die Desktop-Kalender-View
interface DesktopCalendarViewProps {
  projectId: number;
}

export default function DesktopCalendarView({ projectId }: DesktopCalendarViewProps) {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedBauphase, setSelectedBauphase] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Abfrage der Meilensteine für das Projekt
  const { data: milestones, isLoading } = useQuery<Milestone[]>({
    queryKey: [`/api/projects/${projectId}/milestones`],
    enabled: !!projectId
  });

  // Kalenderwochen im Jahr
  const weeksInYear = getWeeksInYear(selectedYear);
  
  // Jahre für Auswahl generieren
  const yearOptions = Array.from(
    { length: 5 }, 
    (_, i) => getCurrentYear() - 2 + i
  );

  // Alle verfügbaren Arten und Bauphasen sammeln
  const allTypes = useMemo(() => {
    if (!milestones) return [];
    const types = new Set<string>();
    milestones.forEach(m => {
      if (m.type) types.add(m.type);
    });
    return Array.from(types);
  }, [milestones]);

  const allBauphasen = useMemo(() => {
    if (!milestones) return [];
    const bauphasen = new Set<string>();
    milestones.forEach(m => {
      if (m.bauphase) bauphasen.add(m.bauphase);
    });
    return Array.from(bauphasen);
  }, [milestones]);

  // Meilensteine nach Auswahlkriterien filtern
  const filteredMilestones = useMemo(() => {
    if (!milestones) return [];
    
    return milestones.filter(m => {
      if (m.jahr !== selectedYear) return false;
      if (selectedType && m.type !== selectedType) return false;
      if (selectedBauphase && m.bauphase !== selectedBauphase) return false;
      return true;
    });
  }, [milestones, selectedYear, selectedType, selectedBauphase]);

  // Monatsüberschriften für die Kalendaransicht
  const monthHeaders = useMemo(() => {
    const headers = [];
    let currentMonth = 0;
    let monthWeeks = 0;
    
    for (let week = 1; week <= weeksInYear; week++) {
      // Bestimmen des ungefähren Monats für diese Kalenderwoche
      const approxDate = new Date(selectedYear, 0, 1 + (week - 1) * 7);
      const month = approxDate.getMonth();
      
      if (month !== currentMonth || week === 1) {
        if (week > 1) {
          headers.push({ month: getMonthName(currentMonth), colspan: monthWeeks });
        }
        currentMonth = month;
        monthWeeks = 1;
      } else {
        monthWeeks++;
      }
      
      if (week === weeksInYear) {
        headers.push({ month: getMonthName(currentMonth), colspan: monthWeeks });
      }
    }
    
    return headers;
  }, [selectedYear, weeksInYear]);

  // Kalenderwochenanzeige ändern
  const changeYear = (delta: number) => {
    setSelectedYear(prev => prev + delta);
  };

  // Rendert die Kalenderwochen-Spaltenüberschriften
  const renderWeekHeaders = () => {
    const headers = [];
    
    for (let week = 1; week <= weeksInYear; week++) {
      const isCurrentWeek = week === getCurrentWeek() && selectedYear === getCurrentYear();
      
      headers.push(
        <div
          key={week}
          className={`text-center text-xs w-8 border-r py-1 ${isCurrentWeek ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
        >
          {week}
        </div>
      );
    }
    
    return headers;
  };

  // Rendert die Balken für jeden Meilenstein
  const renderMilestoneBar = (milestone: Milestone) => {
    // Leere Zellen vor dem Start
    const startCells = [];
    for (let i = 1; i < milestone.startKW; i++) {
      startCells.push(<div key={`start-${i}`} className="w-8 h-full border-r"></div>);
    }
    
    // Berechne Länge des Meilensteins
    const duration = Math.max(1, milestone.endKW - milestone.startKW + 1);
    const barWidth = `${duration * 32}px`; // 32px entspricht der Breite einer Wochenzelle (w-8)
    
    return (
      <div className="flex h-8">
        {startCells}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`h-6 mt-1 rounded-md border ${getBauphaseColor(milestone.bauphase)} text-xs flex items-center justify-center overflow-hidden whitespace-nowrap px-1`}
                style={{ width: barWidth }}
              >
                {milestone.name}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="space-y-1 text-sm">
                <div><strong>Meilenstein:</strong> {milestone.name}</div>
                <div><strong>Zeitraum:</strong> KW {milestone.startKW} - KW {milestone.endKW}</div>
                <div><strong>Typ:</strong> {milestone.type || 'Nicht angegeben'}</div>
                <div><strong>Bauphase:</strong> {milestone.bauphase || 'Nicht angegeben'}</div>
                {milestone.sollMenge && (
                  <div><strong>Soll-Menge:</strong> {milestone.sollMenge}</div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => changeYear(-1)}
            className="h-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Jahr" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => changeYear(1)}
            className="h-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Select
          value={selectedType || ""}
          onValueChange={(value) => setSelectedType(value === "" ? null : value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle Typen</SelectItem>
            {allTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={selectedBauphase || ""}
          onValueChange={(value) => setSelectedBauphase(value === "" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Bauphase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle Bauphasen</SelectItem>
            {allBauphasen.map(bauphase => (
              <SelectItem key={bauphase} value={bauphase}>{bauphase}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {filteredMilestones.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <p className="text-muted-foreground">Keine Meilensteine für die ausgewählten Filter vorhanden.</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-1 -mx-4 sm:mx-0">
          <div className="min-w-max">
            <div className="flex border-b">
              <div className="w-40 sm:w-60 p-1 sm:p-2 text-xs sm:text-sm font-medium border-r bg-gray-50">Meilenstein</div>
              <div className="flex">
                {monthHeaders.map((header, idx) => (
                  <div 
                    key={idx} 
                    className="text-center font-medium bg-gray-50 border-r text-xs sm:text-sm"
                    style={{ width: `${header.colspan * 32}px` }}
                  >
                    {header.month}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex border-b">
              <div className="w-40 sm:w-60 border-r"></div>
              <div className="flex">
                {renderWeekHeaders()}
              </div>
            </div>
            
            {filteredMilestones.map(milestone => (
              <div key={milestone.id} className="flex border-b hover:bg-gray-50">
                <div className="w-40 sm:w-60 p-1 sm:p-2 text-xs border-r truncate" title={milestone.name}>
                  {milestone.name}
                </div>
                <div className="flex-1">
                  {renderMilestoneBar(milestone)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}