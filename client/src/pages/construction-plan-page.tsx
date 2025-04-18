import { useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import ConstructionPhaseView from "@/components/construction-plan/construction-phase-view";
import ResourcesView from "@/components/construction-plan/resources-view";
import MilestonesView from "@/components/construction-plan/milestones-view";

// Kalenderwochen-Hilfsfunktionen
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

const getMonday = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Anpassung für Sonntag
  return new Date(date.setDate(diff));
};

const generateWeekDays = (date: Date): Date[] => {
  const monday = getMonday(new Date(date));
  return Array(7).fill(0).map((_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
};

export default function ConstructionPlanPage() {
  const [activeTab, setActiveTab] = useState("baumaßnahmen");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "year">("week");
  
  // Fetch projects for selection
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Handler for changing projects
  const handleProjectChange = (project: Project) => {
    setSelectedProject(project);
  };
  
  return (
    <DashboardLayout 
      title="Übersicht Bauprojekte" 
      description="Projektplanung und Ressourcenverwaltung für Baumaßnahmen"
    >
      <div className="space-y-4">
        <Tabs defaultValue="baumaßnahmen" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="baumaßnahmen">Baumaßnahmen</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="zeitrahmen">Zeitrahmen</TabsTrigger>
              <TabsTrigger value="meilensteine">Meilensteine</TabsTrigger>
            </TabsList>

            <div className="flex space-x-2">
              <TabsList>
                <TabsTrigger 
                  value="day" 
                  onClick={() => setViewMode("day")}
                  className={viewMode === "day" ? "bg-primary text-primary-foreground" : ""}
                >
                  Tag
                </TabsTrigger>
                <TabsTrigger 
                  value="week" 
                  onClick={() => setViewMode("week")}
                  className={viewMode === "week" ? "bg-primary text-primary-foreground" : ""}
                >
                  Woche
                </TabsTrigger>
                <TabsTrigger 
                  value="month" 
                  onClick={() => setViewMode("month")}
                  className={viewMode === "month" ? "bg-primary text-primary-foreground" : ""}
                >
                  Monat
                </TabsTrigger>
                <TabsTrigger 
                  value="year" 
                  onClick={() => setViewMode("year")}
                  className={viewMode === "year" ? "bg-primary text-primary-foreground" : ""}
                >
                  Jahr
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Linke Spalte: Projekt- und Datumsauswahl */}
            <div className="md:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Projekt auswählen</CardTitle>
                  <CardDescription>Aktuelles Bauprojekt für die Planung</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {projects.map((project) => (
                      <div 
                        key={project.id}
                        className={`p-2 rounded cursor-pointer hover:bg-muted ${
                          selectedProject?.id === project.id ? 'bg-primary/20' : ''
                        }`}
                        onClick={() => handleProjectChange(project)}
                      >
                        {project.projectName}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Kalenderwoche</CardTitle>
                  <CardDescription>Zeitraum auswählen</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4">
                    {/* Verbesserte Kalenderwochenanzeige */}
                    <div className="border rounded-md bg-white p-4">
                      <div className="flex justify-between items-center mb-4">
                        <button 
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => {
                            if (selectedDate) {
                              const prevWeek = new Date(selectedDate);
                              prevWeek.setDate(prevWeek.getDate() - 7);
                              setSelectedDate(prevWeek);
                            }
                          }}
                        >
                          &lt;
                        </button>
                        <div className="text-center">
                          <div className="text-lg font-semibold">
                            {selectedDate?.toLocaleString('de-DE', { month: 'long', year: 'numeric' })}
                          </div>
                          <div className="text-sm font-medium text-primary px-2 py-1 rounded-full bg-primary-50 mt-1 inline-block">
                            {selectedDate && `KW ${getWeekNumber(selectedDate)}`}
                          </div>
                        </div>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => {
                            if (selectedDate) {
                              const nextWeek = new Date(selectedDate);
                              nextWeek.setDate(nextWeek.getDate() + 7);
                              setSelectedDate(nextWeek);
                            }
                          }}
                        >
                          &gt;
                        </button>
                      </div>
                      
                      {/* Wochenübersicht */}
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
                          <div key={i} className="text-xs font-medium text-gray-500">{day}</div>
                        ))}
                        
                        {selectedDate && generateWeekDays(selectedDate).map((date, i) => {
                          const isToday = isSameDay(date, new Date());
                          const isSelected = selectedDate && isSameDay(date, selectedDate);
                          
                          return (
                            <div 
                              key={i}
                              className={`
                                aspect-square flex items-center justify-center text-sm cursor-pointer rounded-full
                                ${isToday ? 'font-medium border border-primary' : ''}
                                ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}
                              `}
                              onClick={() => setSelectedDate(date)}
                            >
                              {date.getDate()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Normaler Kalender für andere Monate */}
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Rechte Spalte: Inhalte je nach Tab */}
            <div className="md:col-span-3">
              <TabsContent value="baumaßnahmen" className="m-0">
                <ConstructionPhaseView 
                  project={selectedProject} 
                  date={selectedDate} 
                  viewMode={viewMode}
                />
              </TabsContent>
              
              <TabsContent value="teams" className="m-0">
                <ResourcesView 
                  project={selectedProject} 
                  date={selectedDate} 
                  viewMode={viewMode}
                />
              </TabsContent>
              
              <TabsContent value="zeitrahmen" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Zeitrahmen</CardTitle>
                    <CardDescription>Planungszeitraum für das Projekt</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedProject ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Zeitplanung für: {selectedProject.projectName}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="border rounded p-2">
                            <div className="text-sm text-muted-foreground">Geplanter Start</div>
                            <div className="font-medium">01.05.2025</div>
                          </div>
                          <div className="border rounded p-2">
                            <div className="text-sm text-muted-foreground">Geplanter Abschluss</div>
                            <div className="font-medium">30.09.2025</div>
                          </div>
                          <div className="border rounded p-2">
                            <div className="text-sm text-muted-foreground">Dauer</div>
                            <div className="font-medium">153 Tage</div>
                          </div>
                          <div className="border rounded p-2">
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="font-medium text-amber-600">In Planung</div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="font-medium mb-2">Bauabschnitte</h4>
                          <div className="space-y-2">
                            {["Tiefbau: Erdarbeiten", "HAS Tiefbau (Hausanschluss)", "NVT Montage", "Endmontage NE3"].map((phase, index) => (
                              <div key={index} className="flex justify-between border-b pb-1">
                                <span>{phase}</span>
                                <span className="text-muted-foreground">
                                  {index === 0 ? "01.05.2025 - 15.06.2025" : 
                                   index === 1 ? "16.06.2025 - 15.07.2025" :
                                   index === 2 ? "16.07.2025 - 31.08.2025" : 
                                   "01.09.2025 - 30.09.2025"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 text-muted-foreground">
                        Bitte wählen Sie ein Projekt aus.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="meilensteine" className="m-0">
                <MilestonesView 
                  project={selectedProject} 
                  date={selectedDate} 
                  viewMode={viewMode}
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}