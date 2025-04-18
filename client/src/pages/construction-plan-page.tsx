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
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
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