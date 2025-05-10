import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, PhoneCall, Mail, List, MapPin, Building } from "lucide-react";
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
import { Company } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

interface CompanyGridProps {
  companies: Company[];
  isLoading: boolean;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onViewChange: () => void;
}

export function CompanyGrid({
  companies,
  isLoading,
  onEdit,
  onDelete,
  onViewChange,
}: CompanyGridProps) {
  const [filterText, setFilterText] = useState("");

  // Simple filtering function
  const filteredCompanies = companies.filter((company) => {
    if (!filterText) return true;
    
    // Combine searchable fields
    const searchableText = `
      ${company.companyName || ''} 
      ${company.companyEmail || ''} 
      ${company.companyPhone || ''} 
      ${company.city || ''} 
      ${company.street || ''} 
      ${company.companyArt || ''}
    `.toLowerCase();
    
    return searchableText.includes(filterText.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-64">
          <TooltipButton tooltipText="Unternehmen nach Namen oder anderen Eigenschaften filtern" side="top">
            <div className="w-full">
              <Input
                placeholder="Filtern..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full"
              />
            </div>
          </TooltipButton>
        </div>
        <div className="flex gap-2">
          <TooltipButton tooltipText="Zur Listenansicht der Unternehmen wechseln" side="top">
            <Button variant="outline" onClick={onViewChange}>
              <List className="mr-2 h-4 w-4" />
              Listenansicht
            </Button>
          </TooltipButton>
        </div>
      </div>

      <LoadingOverlay 
        isLoading={isLoading} 
        text="Unternehmen werden geladen..." 
        variant="skeleton"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map((company) => (
              <Card key={company.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="py-3 px-4 bg-primary/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-medium mb-1">{company.companyName}</h3>
                      <CardDescription>
                        {company.companyArt && <Badge variant="outline">{company.companyArt}</Badge>}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {company.id}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="space-y-3">
                    {(company.street || company.city) && (
                      <div className="flex items-start text-sm">
                        <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
                        <div>
                          <div>{company.street} {company.houseNumber}</div>
                          <div>{company.postalCode} {company.city}</div>
                        </div>
                      </div>
                    )}
                    
                    {company.companyEmail && (
                      <div className="flex items-center text-sm">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{company.companyEmail}</span>
                      </div>
                    )}
                    
                    {company.companyPhone && (
                      <div className="flex items-center text-sm">
                        <PhoneCall className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{company.companyPhone}</span>
                      </div>
                    )}
                    
                    {company.vatId && (
                      <div className="flex items-center text-sm">
                        <Building className="w-4 h-4 mr-2 text-gray-500" />
                        <span>USt-ID: {company.vatId}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t px-4 py-3 bg-gray-50 flex justify-end">
                  <TooltipProvider>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(company)}
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
                            onClick={() => onDelete(company)}
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
              <p className="text-gray-500">Keine Unternehmen gefunden.</p>
            </div>
          )}
        </div>
      </LoadingOverlay>
    </div>
  );
}