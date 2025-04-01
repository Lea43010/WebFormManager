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
import { PlusCircle, Paperclip } from "lucide-react";

export default function ProjectPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("Liste");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      setIsDialogOpen(false);
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
    setIsDialogOpen(true);
  };
  
  // Handle edit button click
  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setIsDialogOpen(true);
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
      accessorKey: "projectId",
      header: "Projektnummer",
    },
    {
      accessorKey: "projectName",
      header: "Projektname",
    },
    {
      accessorKey: "projectArt",
      header: "Projektart",
    },
    {
      accessorKey: "projectStartdate",
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
      accessorKey: "projectStop",
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
      accessorKey: "id", // Wir benutzen die ID als Schlüssel
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
  
  return (
    <DashboardLayout 
      title={
        <div className="flex items-center justify-between w-full">
          <span>Projekte</span>
          <Button 
            onClick={() => navigate("/quick-entry")}
            className="ml-4"
            variant="outline"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Kunden/Firma hinzufügen
          </Button>
        </div>
      }
      tabs={["Liste", "Neuer Eintrag", "Import/Export"]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "Liste" && (
        <DataTable
          data={projects}
          columns={columns}
          isLoading={isLoading}
          onAdd={handleAddProject}
          onEdit={handleEditProject}
          onDelete={handleDeleteProject}
          title="Projektliste"
        />
      )}
      
      {activeTab === "Neuer Eintrag" && (
        <div>
          <div className="bg-muted/30 p-4 rounded-md mb-6 flex flex-wrap items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Schnelle Dateneingabe</h3>
              <p className="text-sm text-muted-foreground">
                Benötigen Sie neue Kunden- oder Firmendaten für Ihr Projekt?
              </p>
            </div>
            <Button 
              onClick={() => navigate("/quick-entry")}
              className="mt-2 md:mt-0"
              variant="outline"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Kunden/Firma hinzufügen
            </Button>
          </div>
          
          <ProjectForm 
            onSubmit={handleFormSubmit} 
            isLoading={saveProjectMutation.isPending} 
          />
        </div>
      )}
      
      {activeTab === "Import/Export" && (
        <div className="p-4 bg-white rounded-md shadow">
          <h2 className="text-lg font-medium mb-4">Import/Export</h2>
          <p className="text-gray-500 mb-4">Diese Funktion ist noch in Entwicklung.</p>
        </div>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{currentProject ? "Projekt bearbeiten" : "Neues Projekt"}</DialogTitle>
            <DialogDescription>
              Geben Sie die Details des Projekts ein.
            </DialogDescription>
          </DialogHeader>
          
          <ProjectForm 
            project={currentProject} 
            onSubmit={handleFormSubmit} 
            isLoading={saveProjectMutation.isPending} 
          />
        </DialogContent>
      </Dialog>
      
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
