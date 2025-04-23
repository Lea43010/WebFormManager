import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Milestone } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, Monitor, Smartphone } from "lucide-react";

// Hilfsfunktionen
const getCurrentYear = () => new Date().getFullYear();
const getCurrentWeek = () => {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  return Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
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

// Kalenderwochen-Planner-Komponenten
interface CalendarWeekPlannerProps {
  projectId: number;
  onViewChange?: (view: 'mobile' | 'desktop') => void;
}

// Vereinfachte Mobile Version
export function MobileCalendarView({ projectId }: { projectId: number }) {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedQuarter, setSelectedQuarter] = useState<string>('1');
  
  // Abfrage der Meilensteine für das Projekt
  const { data: milestones, isLoading } = useQuery<Milestone[]>({
    queryKey: [`/api/projects/${projectId}/milestones`],
    enabled: !!projectId
  });

  // Jahre für Auswahl generieren
  const yearOptions = Array.from(
    { length: 5 }, 
    (_, i) => getCurrentYear() - 2 + i
  );

  // Quartal-Mappings für Kalenderwochen
  const quarterWeeks = {
    '1': { start: 1, end: 13 },
    '2': { start: 14, end: 26 },
    '3': { start: 27, end: 39 },
    '4': { start: 40, end: 53 }
  };

  // Meilensteine nach Jahr und Quartal filtern
  const filteredMilestones = milestones?.filter(m => {
    if (m.jahr !== selectedYear) return false;
    
    const q = quarterWeeks[selectedQuarter as keyof typeof quarterWeeks];
    return (m.startKW >= q.start && m.startKW <= q.end) || 
           (m.endKW >= q.start && m.endKW <= q.end) ||
           (m.startKW <= q.start && m.endKW >= q.end);
  }) || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value))}
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

        <Select
          value={selectedQuarter}
          onValueChange={setSelectedQuarter}
        >
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue placeholder="Quartal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Q1 (KW 1-13)</SelectItem>
            <SelectItem value="2">Q2 (KW 14-26)</SelectItem>
            <SelectItem value="3">Q3 (KW 27-39)</SelectItem>
            <SelectItem value="4">Q4 (KW 40-53)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredMilestones.length === 0 ? (
        <div className="text-center p-4 border rounded-md">
          <p className="text-muted-foreground">Keine Meilensteine im ausgewählten Zeitraum.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMilestones.map(milestone => (
            <div 
              key={milestone.id} 
              className={`p-3 rounded-md border ${getBauphaseColor(milestone.bauphase)}`}
            >
              <div className="font-medium">{milestone.name}</div>
              <div className="text-sm mt-1 flex justify-between">
                <span>KW {milestone.startKW} - {milestone.endKW}</span>
                <Badge variant="outline" className="ml-2">{milestone.type || 'Unbekannt'}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Übergeordnete Komponente mit Umschaltfunktion
export function CalendarWeekPlanner({ projectId, onViewChange }: CalendarWeekPlannerProps) {
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  const toggleView = () => {
    const newView = viewMode === 'mobile' ? 'desktop' : 'mobile';
    setViewMode(newView);
    if (onViewChange) onViewChange(newView);
  };

  // Dynamischer Import der Desktop-Ansicht
  const [DesktopView, setDesktopView] = useState<any>(null);

  useEffect(() => {
    // Lazy-load der Desktop-Komponente, um Parsing-Fehler zu vermeiden
    if (viewMode === 'desktop' && !DesktopView) {
      import('./desktop-calendar-view')
        .then(module => {
          setDesktopView(() => module.default);
        })
        .catch(err => {
          console.error('Fehler beim Laden der Desktop-Ansicht:', err);
          setViewMode('mobile'); // Fallback zur mobilen Ansicht
        });
    }
  }, [viewMode, DesktopView]);

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Kalenderwochen-Planer</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleView}
          className="flex items-center space-x-1"
        >
          {viewMode === 'mobile' ? (
            <>
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Desktop-Ansicht</span>
            </>
          ) : (
            <>
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Mobile-Ansicht</span>
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {viewMode === 'mobile' ? (
          <MobileCalendarView projectId={projectId} />
        ) : DesktopView ? (
          <DesktopView projectId={projectId} />
        ) : (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}