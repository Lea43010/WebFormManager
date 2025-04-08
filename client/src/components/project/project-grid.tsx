import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Paperclip, Star, Calendar, List } from "lucide-react";
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

interface ProjectGridProps {
  projects: Project[];
  isLoading: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onShowAttachments: (project: Project) => void;
  onViewChange: () => void;
}

export function ProjectGrid({
  projects,
  isLoading,
  onEdit,
  onDelete,
  onShowAttachments,
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="bg-gray-100 h-32"></CardHeader>
              <CardContent className="pt-4">
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className={`py-3 px-4 ${project.projectStop ? 'bg-red-100' : 'bg-green-100'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-medium mb-1">{project.projectName}</h3>
                      <CardDescription>
                        <Badge variant="outline" className="mr-2">
                          {project.personId ? `Ansprechpartner: ${project.personId}` : 'Kein Ansprechpartner'}
                        </Badge>
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
                      <span className="text-gray-600 font-medium">Kunden ID:</span>
                      <span className="ml-1">{project.customerId || '-'}</span>
                    </div>
                    {project.projectStartdate && (
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        <span>
                          {new Date(project.projectStartdate).toLocaleDateString()} - 
                          {project.projectEnddate ? new Date(project.projectEnddate).toLocaleDateString() : 'Offen'}
                        </span>
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
      )}
    </div>
  );
}