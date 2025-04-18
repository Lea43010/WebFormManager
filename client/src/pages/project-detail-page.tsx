import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Edit, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CapacitySection } from "@/components/project/capacity-section";
import ProjectForm from "@/components/project/project-form";
import AttachmentUpload from "@/components/project/attachment-upload";

// Hilfsfunktion zur Berechnung der Kalenderwoche (ISO-Format)
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export default function ProjectDetailPage() {
  const [, navigate] = useLocation();
  const [_, params] = useRoute("/projects/:id");
  const [isEditing, setIsEditing] = useState(false);
  const projectId = params?.id ? parseInt(params.id) : null;

  // Redirect if no project ID is provided
  useEffect(() => {
    if (!projectId) {
      navigate("/projects");
    }
  }, [projectId, navigate]);

  // Fetch project data
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Handle form submission
  const handleFormSubmit = (data: Partial<Project>) => {
    // This is handled in the ProjectForm component via the onSubmit callback
    // After successful update, navigate back to the project detail view
    setIsEditing(false);
  };

  // Go back to projects list
  const handleBackToList = () => {
    navigate("/projects");
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Projektdetails">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout title="Projektdetails">
        <div className="p-4 text-center">
          <p>Projekt nicht gefunden.</p>
          <Button onClick={handleBackToList} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Projektliste
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Projekt: ${project.projectName}`}
      description={
        <span className="flex items-center space-x-2 mt-1">
          <Badge variant={project.projectStop ? "destructive" : "default"} className={project.projectStop ? "" : "bg-green-600"}>
            {project.projectStop ? "Gestoppt" : "Aktiv"}
          </Badge>
          <span className="text-sm text-muted-foreground">Projektart: {project.projectArt || "Nicht angegeben"}</span>
        </span>
      }
    >
      {isEditing ? (
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Projektdetails
          </Button>

          <ProjectForm
            project={project}
            onSubmit={handleFormSubmit}
            isLoading={false}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={handleBackToList}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Projektliste
            </Button>
            <Button
              onClick={() => setIsEditing(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Projekt bearbeiten
            </Button>
          </div>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList>
              <TabsTrigger value="overview">Übersicht</TabsTrigger>
              <TabsTrigger value="capacity">Bedarf/Kapazitäten</TabsTrigger>
              <TabsTrigger value="attachments">Anhänge</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Projektinformationen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">Projektname:</div>
                      <div>{project.projectName}</div>
                      
                      <div className="font-medium">Projektart:</div>
                      <div>{project.projectArt || "Nicht angegeben"}</div>
                      
                      <div className="font-medium">Status:</div>
                      <div>
                        <Badge variant={project.projectStop ? "destructive" : "default"} className={project.projectStop ? "" : "bg-green-600"}>
                          {project.projectStop ? "Gestoppt" : "Aktiv"}
                        </Badge>
                      </div>
                      
                      <div className="font-medium">Startdatum:</div>
                      <div className="flex items-center gap-2">
                        {project.projectStartdate ? (
                          <>
                            <span>{new Date(project.projectStartdate).toLocaleDateString()}</span>
                            <Badge variant="outline" className="text-xs">
                              KW {getWeekNumber(new Date(project.projectStartdate))}
                            </Badge>
                          </>
                        ) : (
                          "Nicht angegeben"
                        )}
                      </div>
                      
                      <div className="font-medium">Enddatum:</div>
                      <div className="flex items-center gap-2">
                        {project.projectEnddate ? (
                          <>
                            <span>{new Date(project.projectEnddate).toLocaleDateString()}</span>
                            <Badge variant="outline" className="text-xs">
                              KW {getWeekNumber(new Date(project.projectEnddate))}
                            </Badge>
                          </>
                        ) : (
                          "Nicht angegeben"
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Projektdetails</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">Breite:</div>
                      <div>{project.projectWidth || "Nicht angegeben"}</div>
                      
                      <div className="font-medium">Länge:</div>
                      <div>{project.projectLength || "Nicht angegeben"}</div>
                      
                      <div className="font-medium">Höhe:</div>
                      <div>{project.projectHeight || "Nicht angegeben"}</div>
                      
                      <div className="font-medium">Kunde:</div>
                      <div>{"Nicht angegeben"}</div>
                      
                      <div className="font-medium">Unternehmen:</div>
                      <div>{"Nicht angegeben"}</div>
                    </div>
                  </CardContent>
                </Card>

                {project.projectText && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Projektnotizen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap">{project.projectText}</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="capacity" className="mt-4">
              {project.id && <CapacitySection projectId={project.id} />}
            </TabsContent>

            <TabsContent value="attachments" className="mt-4">
              {project.id && <AttachmentUpload projectId={project.id} />}
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardLayout>
  );
}