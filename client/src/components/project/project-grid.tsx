import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Paperclip, Star, Calendar, List, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Project } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

// Erweiterte Projektschnittstelle mit Kundennamen
interface ProjectWithCustomerName extends Project {
  customerName?: string;
}

// Hilfsfunktion zur Berechnung der Kalenderwoche (ISO-Format)
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

interface ProjectGridProps {
  projects: ProjectWithCustomerName[];
  isLoading: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onShowAttachments: (project: Project) => void;
  onViewDetails?: (project: Project) => void;
  onViewChange: () => void;
}

export function ProjectGrid({
  projects,
  isLoading,
  onEdit,
  onDelete,
  onShowAttachments,
  onViewDetails,
  onViewChange,
}: ProjectGridProps) {
  const [filterText, setFilterText] = useState("");

  // Simple filtering function
  const filteredProjects = projects.filter((project) => {
    if (!filterText) return true;
    
    return Object.values(project).some((value) => {
      return String(value).toLowerCase().includes(filterText.toLowerCase());
    });
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Filtern..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onViewChange}>
            <List className="mr-2 h-4 w-4" />
            Listenansicht
          </Button>
        </div>
      </div>

      <LoadingOverlay 
        isLoading={isLoading} 
        text="Projekte werden geladen..." 
        variant="skeleton"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className={`py-3 px-4 ${project.projectStop ? 'bg-red-100' : 'bg-green-100'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-medium mb-1">{project.projectName}</h3>
                      <CardDescription>
                        {project.projectArt && <Badge>{project.projectArt}</Badge>}
                      </CardDescription>
                    </div>
                    <Badge variant={project.projectStop ? "destructive" : "default"} className={project.projectStop ? "" : "bg-green-600"}>
                      {project.projectStop ? "Gestoppt" : "Aktiv"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-600 font-medium">Kunde:</span>
                      <span className="ml-1">{project.customerName || (project.customerId ? `ID: ${project.customerId}` : '-')}</span>
                    </div>
                    {project.projectStartdate && (
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="font-medium">Zeitraum:</span>
                        </div>
                        <div className="ml-6 text-sm">
                          <div>
                            <span className="font-medium">KW {getWeekNumber(new Date(project.projectStartdate))}</span>
                            <span> {new Date(project.projectStartdate).toLocaleDateString()}</span>
                          </div>
                          <div>-</div>
                          <div>
                            {project.projectEnddate ? (
                              <>
                                <span className="font-medium">KW {getWeekNumber(new Date(project.projectEnddate))}</span>
                                <span> {new Date(project.projectEnddate).toLocaleDateString()}</span>
                              </>
                            ) : (
                              <span>Offen</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {project.projectNotes && (
                      <p className="text-sm text-gray-600 line-clamp-2">{project.projectNotes}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t px-4 py-3 bg-gray-50 flex justify-between">
                  <TooltipProvider>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onShowAttachments(project)}
                          >
                            <Paperclip className="h-4 w-4 text-gray-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Anhänge</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      {onViewDetails && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewDetails(project)}
                            >
                              <BookOpen className="h-4 w-4 text-green-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Details</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(project)}
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Bearbeiten</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(project)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Löschen</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex justify-center py-10">
              <p className="text-gray-500">Keine Projekte gefunden.</p>
            </div>
          )}
        </div>
      </LoadingOverlay>
    </div>
  );
}