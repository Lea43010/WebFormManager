import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Milestone, MilestoneDetail } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CalendarWeekPlannerProps {
  projectId: number;
}

// Hilfsfunktion zur Bestimmung der Anzahl der Kalenderwochen in einem Jahr
const getWeeksInYear = (year: number) => {
  const lastDay = new Date(year, 11, 31);
  const lastDayOfYear = lastDay.getDay();
  if (lastDayOfYear === 4 || (lastDayOfYear === 3 && isLeapYear(year))) {
    return 53;
  }
  return 52;
};

// Überprüft, ob ein Jahr ein Schaltjahr ist
const isLeapYear = (year: number) => {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
};

// Aktuelle Kalenderwoche berechnen
const getCurrentWeek = () => {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return weekNumber;
};

// Aktuelles Jahr
const getCurrentYear = () => {
  return new Date().getFullYear();
};

// Funktion zum Formatieren des Monatsnamens für die Monatsheader
const getMonthName = (month: number) => {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return months[month];
};

// Farben für die verschiedenen Bauphasen
const getBauphaseColor = (bauphase: string | null) => {
  const colors: Record<string, string> = {
    'Baustart Tiefbau FÖB': 'bg-blue-100 border-blue-500 text-blue-700',
    'Baustart Tiefbau EWB': 'bg-[#e8f3e2] border-[#5c9935] text-[#5c9935]',
    'Tiefbau EWB': 'bg-teal-100 border-teal-500 text-teal-700',
    'Tiefbau FÖB': 'bg-cyan-100 border-cyan-500 text-cyan-700',
    'Montage NE3 EWB': 'bg-amber-100 border-amber-500 text-amber-700',
    'Montage NE3 FÖB': 'bg-orange-100 border-orange-500 text-orange-700',
    'Endmontage NE4 EWB': 'bg-purple-100 border-purple-500 text-purple-700',
    'Endmontage NE4 FÖB': 'bg-fuchsia-100 border-fuchsia-500 text-fuchsia-700',
    'Sonstiges': 'bg-gray-100 border-gray-500 text-gray-700'
  };
  
  return colors[bauphase || 'Sonstiges'] || colors['Sonstiges'];
};

// Filter-Optionen für EWB/FÖB
const ewbFoebOptions = ['Alle', 'EWB', 'FÖB', 'EWB,FÖB', 'keine'];

// Filter-Optionen für Bauphasen
const bauphasenOptions = ['Alle', 'Baustart Tiefbau FÖB', 'Baustart Tiefbau EWB', 'Tiefbau EWB', 'Tiefbau FÖB', 
                           'Montage NE3 EWB', 'Montage NE3 FÖB', 'Endmontage NE4 EWB', 'Endmontage NE4 FÖB', 'Sonstiges'];

export function CalendarWeekPlanner({ projectId }: CalendarWeekPlannerProps) {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [selectedEwbFoeb, setSelectedEwbFoeb] = useState<string>('Alle');
  const [selectedBauphase, setSelectedBauphase] = useState<string>('Alle');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(null);
  
  // Abfrage der Meilensteine für das Projekt
  const { data: milestones, isLoading: isLoadingMilestones } = useQuery<Milestone[]>({
    queryKey: [`/api/projects/${projectId}/milestones`], 
    enabled: !!projectId
  });
  
  // Bei Auswahl eines Meilensteins die Meilenstein-Details abfragen
  const { data: milestoneDetails, isLoading: isLoadingDetails } = useQuery<MilestoneDetail[]>({
    queryKey: [`/api/milestones/${selectedMilestoneId}/details`],
    enabled: !!selectedMilestoneId
  });

  // Jahresoptionen (aktuelles Jahr +/- 5 Jahre)
  const yearOptions = useMemo(() => {
    const currentYear = getCurrentYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  }, []);

  // Quartal-Definitionen
  const quarters = [
    { id: 'all', label: 'Ganzes Jahr', weeks: Array.from({ length: getWeeksInYear(selectedYear) }, (_, i) => i + 1) },
    { id: 'q1', label: 'Q1 (Jan-Mär)', weeks: Array.from({ length: 13 }, (_, i) => i + 1) },
    { id: 'q2', label: 'Q2 (Apr-Jun)', weeks: Array.from({ length: 13 }, (_, i) => i + 14) },
    { id: 'q3', label: 'Q3 (Jul-Sep)', weeks: Array.from({ length: 13 }, (_, i) => i + 27) },
    { id: 'q4', label: 'Q4 (Okt-Dez)', weeks: Array.from({ length: 13 }, (_, i) => i + 40) }
  ];

  // Wochen für das ausgewählte Quartal oder Jahr
  const weeksToShow = useMemo(() => {
    const quarter = quarters.find(q => q.id === selectedQuarter);
    return quarter?.weeks || [];
  }, [selectedQuarter, selectedYear, quarters]);

  // Gefilterte Meilensteine basierend auf den Filtereinstellungen
  const filteredMilestones = useMemo(() => {
    if (!milestones) return [];
    
    return milestones.filter(milestone => {
      const ewbFoebMatch = selectedEwbFoeb === 'Alle' || milestone.ewbFoeb === selectedEwbFoeb;
      const bauphaseMatch = selectedBauphase === 'Alle' || milestone.bauphase === selectedBauphase;
      
      return ewbFoebMatch && bauphaseMatch && milestone.jahr === selectedYear;
    });
  }, [milestones, selectedEwbFoeb, selectedBauphase, selectedYear]);

  // Berechnet die Wochen-zu-Monat-Zuordnung für das ausgewählte Jahr
  const monthHeaders = useMemo(() => {
    const headers: { month: string, colspan: number, startWeek: number }[] = [];
    const monthsInQuarter = selectedQuarter === 'all' ? 12 : 3;
    const startMonth = selectedQuarter === 'all' ? 0 : 
                       selectedQuarter === 'q1' ? 0 :
                       selectedQuarter === 'q2' ? 3 :
                       selectedQuarter === 'q3' ? 6 : 9;
    
    // Einfache Annäherung - kann verfeinert werden für höhere Genauigkeit
    for (let i = 0; i < monthsInQuarter; i++) {
      const month = (startMonth + i) % 12;
      const weeksInMonth = month === 1 && isLeapYear(selectedYear) ? 5 : 
                          [3, 5, 8, 10].includes(month) ? 5 : 4;
      
      headers.push({
        month: getMonthName(month),
        colspan: weeksInMonth,
        startWeek: headers.reduce((sum, h) => sum + h.colspan, 0) + 1
      });
    }
    
    return headers;
  }, [selectedQuarter, selectedYear]);

  // Verzögerung für "hover"-Effekte auf mobilen Geräten
  useEffect(() => {
    if (selectedMilestoneId) {
      const timer = setTimeout(() => {
        setSelectedMilestoneId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedMilestoneId]);

  // Jahr wechseln
  const changeYear = (direction: number) => {
    setSelectedYear(prev => prev + direction);
  };

  if (isLoadingMilestones) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Zeitlicher Rahmen (Kalenderwochen)</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Zeitraum wählen" />
              </SelectTrigger>
              <SelectContent>
                {quarters.map(quarter => (
                  <SelectItem key={quarter.id} value={quarter.id}>{quarter.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => changeYear(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select value={selectedYear.toString()} onValueChange={value => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Jahr" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => changeYear(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <CardDescription>
          Visualisieren Sie Meilensteine und Bauphasen nach Kalenderwochen
        </CardDescription>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Select value={selectedEwbFoeb} onValueChange={setSelectedEwbFoeb}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="EWB/FÖB" />
            </SelectTrigger>
            <SelectContent>
              {ewbFoebOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedBauphase} onValueChange={setSelectedBauphase}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Bauphase" />
            </SelectTrigger>
            <SelectContent>
              {bauphasenOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredMilestones.length === 0 ? (
          <div className="text-center p-8 border rounded-md">
            <p className="text-muted-foreground">Keine Meilensteine für die ausgewählten Filter vorhanden.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-1 -mx-4 sm:mx-0">
            <div className="min-w-max">
              {/* Monatsheader - Angepasste Größen für mobile Ansicht */}
              <div className="flex border-b">
                <div className="w-40 sm:w-60 p-1 sm:p-2 text-xs sm:text-sm font-medium border-r bg-gray-50">Meilenstein</div>
                <div className="flex">
                  {monthHeaders.map((header, idx) => (
                    <div 
                      key={idx} 
                      className="text-center font-medium bg-gray-50 border-r text-xs sm:text-sm"
                      style={{ width: `${header.colspan * 2}rem` }}
                    >
                      {header.month}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Kalenderwochen-Header - Kleinere Elemente für mobile Optimierung */}
              <div className="flex border-b">
                <div className="w-40 sm:w-60 p-1 sm:p-2 text-xs sm:text-sm font-medium border-r">Bauphase</div>
                {weeksToShow.map(week => (
                  <div 
                    key={week} 
                    className={`w-8 sm:w-10 p-0.5 sm:p-1 text-center text-xs font-medium ${
                      week === getCurrentWeek() && selectedYear === getCurrentYear() 
                        ? 'bg-blue-100' 
                        : ''
                    }`}
                  >
                    {week}
                  </div>
                ))}
              </div>
              
              {/* Meilensteine mit Bauphasen - Touch-freundlichere Elemente */}
              {filteredMilestones.map(milestone => (
                <div 
                  key={milestone.id} 
                  className="flex border-b hover:bg-gray-50 cursor-pointer group"
                  onClick={() => setSelectedMilestoneId(prev => prev === milestone.id ? null : milestone.id)}
                >
                  <div className={`w-40 sm:w-60 p-1 sm:p-2 border-r flex items-center ${
                    selectedMilestoneId === milestone.id ? 'bg-blue-50' : ''
                  }`}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col w-full">
                            <div className="font-medium text-xs sm:text-sm truncate">{milestone.name}</div>
                            <div className="text-[10px] sm:text-xs flex items-center gap-1 flex-wrap">
                              <span className={`px-1 py-0.5 rounded text-[10px] sm:text-xs ${
                                milestone.ewbFoeb === 'EWB' ? 'bg-[#e8f3e2] text-[#5c9935]' :
                                milestone.ewbFoeb === 'FÖB' ? 'bg-blue-100 text-blue-800' :
                                milestone.ewbFoeb === 'EWB,FÖB' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {milestone.ewbFoeb || 'keine'}
                              </span>
                              <span className="text-gray-500 truncate">{milestone.type || 'Sonstiges'}</span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <div><strong>Meilenstein:</strong> {milestone.name}</div>
                            <div><strong>Bauphase:</strong> {milestone.bauphase}</div>
                            <div><strong>Typ:</strong> {milestone.type}</div>
                            <div><strong>EWB/FÖB:</strong> {milestone.ewbFoeb}</div>
                            {milestone.sollMenge && (
                              <div><strong>Soll-Menge:</strong> {milestone.sollMenge}</div>
                            )}
                            <div><strong>Zeitraum:</strong> KW {milestone.startKW} - KW {milestone.endKW}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {weeksToShow.map(week => {
                    const isInRange = milestone.jahr === selectedYear &&
                                      week >= milestone.startKW && 
                                      week <= milestone.endKW;
                    const isStart = week === milestone.startKW;
                    const isEnd = week === milestone.endKW;
                    const hasDetail = milestoneDetails?.some(
                      detail => detail.milestoneId === milestone.id && 
                                detail.kalenderwoche === week &&
                                detail.jahr === selectedYear
                    );
                    
                    return (
                      <div 
                        key={`${milestone.id}-${week}`} 
                        className={`w-10 p-1 text-center border-r-0 ${
                          isInRange 
                            ? getBauphaseColor(milestone.bauphase)
                            : ''
                        } ${
                          isStart ? 'rounded-l-md border-l' : ''
                        } ${
                          isEnd ? 'rounded-r-md border-r' : ''
                        } ${
                          isInRange && !isStart && !isEnd ? 'border-t border-b' : ''
                        } relative group-hover:opacity-90 transition-opacity`}
                      >
                        {isInRange && week === Math.floor((milestone.startKW + milestone.endKW) / 2) && (
                          <div className="text-xs font-medium text-black overflow-hidden whitespace-nowrap">
                            {milestone.sollMenge || ""}
                          </div>
                        )}
                        {hasDetail && selectedMilestoneId === milestone.id && (
                          <div className="absolute inset-0 bg-white bg-opacity-30 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-white" title="Details vorhanden" />
                          </div>
                        )}
                        {isInRange && selectedMilestoneId === milestone.id && hasDetail && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute inset-0" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {milestoneDetails
                                  ?.filter(d => d.milestoneId === milestone.id && d.kalenderwoche === week)
                                  .map((detail, idx) => (
                                    <div key={idx} className="text-xs">
                                      <div><strong>KW {detail.kalenderwoche}:</strong> {detail.text}</div>
                                      {detail.supplementaryInfo && (
                                        <div className="text-gray-600">{detail.supplementaryInfo}</div>
                                      )}
                                      {detail.sollMenge && (
                                        <div><strong>Soll:</strong> {detail.sollMenge}</div>
                                      )}
                                      {detail.ewbFoeb !== 'keine' && (
                                        <div><strong>Status:</strong> {detail.ewbFoeb}</div>
                                      )}
                                    </div>
                                  ))
                                }
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Legende */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-3">
          <div className="text-sm font-medium">Legende:</div>
          {bauphasenOptions.slice(1).map(bauphase => (
            <div key={bauphase} className="flex items-center">
              <div className={`w-3 h-3 rounded-sm mr-1 ${getBauphaseColor(bauphase)}`} />
              <span className="text-xs">{bauphase}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}