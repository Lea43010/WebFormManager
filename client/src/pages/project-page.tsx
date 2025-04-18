import { useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ProjectForm from "@/components/project/project-form";
import AttachmentUpload from "@/components/project/attachment-upload";
import { ProjectGrid } from "@/components/project/project-grid";
import { Grid, List } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { PlusCircle, Paperclip, ArrowLeft } from "lucide-react";

export default function ProjectPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Create or update project mutation
  const saveProjectMutation = useMutation({
    mutationFn: async (project: Partial<Project>) => {
      if (project.id) {
        // Update existing project
        const res = await apiRequest("PUT", `/api/projects/${project.id}`, project);
        return await res.json();
      } else {
        // Create new project
        const res = await apiRequest("POST", "/api/projects", project);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsEditing(false);
      toast({
        title: currentProject ? "Projekt aktualisiert" : "Projekt erstellt",
        description: `Das Projekt wurde erfolgreich ${currentProject ? "aktualisiert" : "erstellt"}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim ${currentProject ? "Aktualisieren" : "Erstellen"} des Projekts: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Projekt gelöscht",
        description: "Das Projekt wurde erfolgreich gelöscht",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen des Projekts: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle add button click
  const handleAddProject = () => {
    setCurrentProject(null);
    setIsEditing(true);
  };
  
  // Handle edit button click
  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setIsEditing(true);
  };
  
  // Handle view details click
  const handleViewDetails = (project: Project) => {
    if (project.id) {
      navigate(`/projects/${project.id}`);
    }
  };
  
  // Handle delete button click
  const handleDeleteProject = (project: Project) => {
    setCurrentProject(project);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = () => {
    if (currentProject?.id) {
      deleteProjectMutation.mutate(currentProject.id);
    }
  };
  
  // Submit form
  const handleFormSubmit = (data: Partial<Project>) => {
    saveProjectMutation.mutate(data);
  };
  
  // Handler für Anhänge anzeigen
  const handleShowAttachments = (project: Project) => {
    if (project.id) {
      setSelectedProjectId(project.id);
    }
  };
  
  // Table columns
  const columns = [
    {
      accessorKey: "id" as keyof Project,
      header: "Projekt ID",
      cell: (value: number) => {
        return <span className="font-medium">{value}</span>;
      },
    },
    {
      accessorKey: "projectName" as keyof Project,
      header: "Projektname",
    },
    {
      accessorKey: "projectArt" as keyof Project,
      header: "Projektart",
    },
    {
      accessorKey: "projectStartdate" as keyof Project,
      header: "Zeitraum",
      cell: (value: string, row: Project) => {
        const startDate = row.projectStartdate ? new Date(row.projectStartdate).toLocaleDateString() : 'N/A';
        const endDate = row.projectEnddate ? new Date(row.projectEnddate).toLocaleDateString() : 'N/A';
        return (
          <div>
            <div>{startDate}</div>
            <div>-</div>
            <div>{endDate}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "projectStop" as keyof Project,
      header: "Status",
      cell: (value: boolean) => {
        return value ? (
          <Badge variant="destructive">Gestoppt</Badge>
        ) : (
          <Badge variant="default" className="bg-green-600">Aktiv</Badge>
        );
      },
    },
    {
      accessorKey: "id" as keyof Project, // Wir benutzen die ID als Schlüssel
      header: "Anhänge",
      cell: (value: any, row: Project) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleShowAttachments(row);
            }}
          >
            <Paperclip className="h-4 w-4 mr-1" />
            Anhänge
          </Button>
        );
      },
    },
  ];
  
  // Ansichtsumschaltung
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  };

  return (
    <DashboardLayout 
      title="Projektverwaltung"
      tabs={[]}
    >
      {!isEditing ? (
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button 
                variant={viewMode === 'list' ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="mr-2 h-4 w-4" />
                Liste
              </Button>
              <Button 
                variant={viewMode === 'grid' ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="mr-2 h-4 w-4" />
                Kacheln
              </Button>
            </div>
            <Button onClick={handleAddProject}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Neues Projekt
            </Button>
          </div>
          
          {viewMode === 'list' ? (
            <DataTable
              data={projects}
              columns={columns}
              isLoading={isLoading}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              title="Projektübersicht"
            />
          ) : (
            <ProjectGrid
              projects={projects}
              isLoading={isLoading}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onShowAttachments={handleShowAttachments}
              onViewChange={() => setViewMode('list')}
            />
          )}
        </div>
      ) : null}
      

      
      {isEditing && (
        <div className="mt-8">
          {currentProject ? (
            <div className="flex items-center mb-6">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Liste
              </Button>
            </div>
          ) : null}
          
          <ProjectForm 
            project={currentProject} 
            onSubmit={handleFormSubmit} 
            isLoading={saveProjectMutation.isPending} 
          />
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projekt löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie das Projekt "{currentProject?.projectName}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? "Wird gelöscht..." : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Attachments Dialog */}
      <Dialog open={!!selectedProjectId} onOpenChange={(open) => !open && setSelectedProjectId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Projektanhänge</DialogTitle>
            <DialogDescription>
              Verwalten Sie die Anhänge für dieses Projekt.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProjectId && (
            <AttachmentUpload projectId={selectedProjectId} />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
