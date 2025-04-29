import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, Customer } from "@shared/schema";
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
import { useAuth } from "@/hooks/use-auth";

// Hilfsfunktion zur Berechnung der Kalenderwoche (ISO-Format)
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export default function ProjectPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // API-Endpunkt basierend auf Benutzerrolle auswählen
  const projectsEndpoint = user?.role === 'administrator' || user?.role === 'manager' 
    ? "/api/projects"  // Admin und Manager sehen alle Projekte
    : "/api/user/projects"; // Normale Benutzer sehen nur ihre eigenen Projekte
  
  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: [projectsEndpoint],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Fetch customers
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Combine projects with customer names
  const projectsWithCustomerNames = useMemo(() => {
    return projects.map(project => {
      const customer = customers.find(c => c.id === project.customerId);
      return {
        ...project,
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : undefined
      };
    });
  }, [projects, customers]);
  
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
    onSuccess: (newProject) => {
      // Direktes Update des Caches für sofortige UI-Aktualisierung
      if (currentProject?.id) {
        // Für Updates: Ersetze das aktualisierte Projekt im Cache
        // Aktualisiere alle relevanten Caches
        ["/api/projects", "/api/user/projects", projectsEndpoint].forEach(cacheKey => {
          queryClient.setQueryData<Project[]>([cacheKey], (oldData) => {
            if (!oldData) return oldData;
            return oldData.map(item => item.id === newProject.id ? newProject : item);
          });
        });
      } else {
        // Für neue Projekte: Zum Cache hinzufügen
        // Aktualisiere alle relevanten Caches
        ["/api/projects", "/api/user/projects", projectsEndpoint].forEach(cacheKey => {
          queryClient.setQueryData<Project[]>([cacheKey], (oldData) => {
            if (!oldData) return [newProject];
            return [...oldData, newProject];
          });
        });
      }
      
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
      // Direkte Aktualisierung des Caches ohne neu zu laden
      // Aktualisiere alle relevanten Caches
      ["/api/projects", "/api/user/projects", projectsEndpoint].forEach(cacheKey => {
        queryClient.setQueryData<Project[]>([cacheKey], (oldData) => 
          oldData ? oldData.filter(project => project.id !== currentProject?.id) : []
        );
      });
      
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
  const handleFormSubmit = async (data: Partial<Project>): Promise<Project> => {
    return new Promise((resolve, reject) => {
      saveProjectMutation.mutate(data, {
        onSuccess: (savedProject) => resolve(savedProject),
        onError: (error) => reject(error)
      });
    });
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
        const startDate = row.projectStartdate ? new Date(row.projectStartdate) : null;
        const endDate = row.projectEnddate ? new Date(row.projectEnddate) : null;
        
        // Berechne Kalenderwoche für Start- und Enddatum
        const startKW = startDate ? getWeekNumber(startDate) : null;
        const endKW = endDate ? getWeekNumber(endDate) : null;
        
        // Formatiere für die Anzeige
        const startDateStr = startDate ? startDate.toLocaleDateString() : 'N/A';
        const endDateStr = endDate ? endDate.toLocaleDateString() : 'N/A';
        
        return (
          <div>
            <div>
              {startKW && <span className="font-medium">KW {startKW}</span>}
              <span> {startDateStr}</span>
            </div>
            <div>-</div>
            <div>
              {endKW && <span className="font-medium">KW {endKW}</span>}
              <span> {endDateStr}</span>
            </div>
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

          {/* Aktionsleiste */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
            {/* Ansichtsoptionen - Mobile-optimiert */}
            <div className="flex gap-2 w-full sm:w-auto mb-2 sm:mb-0">
              <Button 
                variant={viewMode === 'list' ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm"
              >
                <List className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Liste
              </Button>
              <Button 
                variant={viewMode === 'grid' ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm"
              >
                <Grid className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Kacheln
              </Button>
            </div>
            
            {/* Neues Projekt Button */}
            <Button 
              onClick={handleAddProject}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
            >
              <PlusCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Neues Projekt
            </Button>
          </div>
          
          {viewMode === 'list' ? (
            <DataTable
              data={projectsWithCustomerNames}
              columns={columns}
              isLoading={isLoadingProjects || isLoadingCustomers}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onViewDetails={handleViewDetails}
              title="Projektübersicht"
            />
          ) : (
            <ProjectGrid
              projects={projectsWithCustomerNames}
              isLoading={isLoadingProjects || isLoadingCustomers}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onShowAttachments={handleShowAttachments}
              onViewDetails={handleViewDetails}
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
