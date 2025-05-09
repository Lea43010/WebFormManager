import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { Company } from "@shared/schema";
import CompanyForm from "@/components/company/company-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function CompanyPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch companies
  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Create or update company mutation
  const saveCompanyMutation = useMutation({
    mutationFn: async (company: Partial<Company>) => {
      if (company.id) {
        // Update existing company
        const res = await apiRequest("PUT", `/api/companies/${company.id}`, company);
        return await res.json();
      } else {
        // Create new company
        const res = await apiRequest("POST", "/api/companies", company);
        return await res.json();
      }
    },
    onSuccess: (newCompany) => {
      // Update cache directly for immediate UI updates
      if (currentCompany?.id) {
        // For updates: replace the updated company in the cache
        queryClient.setQueryData<Company[]>(["/api/companies"], (oldData) => 
          oldData?.map(item => item.id === newCompany.id ? newCompany : item) || []
        );
      } else {
        // For new companies: add to the existing list
        queryClient.setQueryData<Company[]>(["/api/companies"], (oldData) => 
          oldData ? [...oldData, newCompany] : [newCompany]
        );
      }
      
      setIsEditing(false);
      toast({
        title: currentCompany ? "Unternehmen aktualisiert" : "Unternehmen erstellt",
        description: `Das Unternehmen wurde erfolgreich ${currentCompany ? "aktualisiert" : "erstellt"}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim ${currentCompany ? "Aktualisieren" : "Erstellen"} des Unternehmens: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/companies/${id}`);
    },
    onSuccess: () => {
      // Direkte Aktualisierung des Caches ohne neu zu laden
      queryClient.setQueryData<Company[]>(["/api/companies"], (oldData) => 
        oldData ? oldData.filter(company => company.id !== currentCompany?.id) : []
      );
      
      setIsDeleteDialogOpen(false);
      toast({
        title: "Unternehmen gelöscht",
        description: "Das Unternehmen wurde erfolgreich gelöscht",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen des Unternehmens: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle add button click
  const handleAddCompany = () => {
    setCurrentCompany(null);
    setIsEditing(true);
  };
  
  // Handle edit button click
  const handleEditCompany = (company: Company) => {
    setCurrentCompany(company);
    setIsEditing(true);
  };
  
  // Handle delete button click
  const handleDeleteCompany = (company: Company) => {
    setCurrentCompany(company);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = () => {
    if (currentCompany?.id) {
      deleteCompanyMutation.mutate(currentCompany.id);
    }
  };
  
  // Submit form
  const handleFormSubmit = async (data: Partial<Company>): Promise<Company> => {
    return new Promise((resolve, reject) => {
      saveCompanyMutation.mutate(data, {
        onSuccess: (savedCompany) => resolve(savedCompany),
        onError: (error) => reject(error)
      });
    });
  };
  
  // Table columns
  const columns = [
    {
      accessorKey: "id",
      header: "Firmennummer",
    },
    {
      accessorKey: "companyName",
      header: "Firmenname",
    },
    {
      accessorKey: "companyArt",
      header: "Unternehmensart",
    },
    {
      accessorKey: "city",
      header: "Ort",
      cell: (value: string, row: Company) => {
        const address = [row.street, row.houseNumber].filter(Boolean).join(" ");
        const cityInfo = [row.postalCode, row.city].filter(Boolean).join(" ");
        return (
          <div>
            <div>{address}</div>
            <div>{cityInfo}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "companyEmail",
      header: "Kontakt",
      cell: (value: string, row: Company) => {
        return (
          <div>
            <div>{row.companyEmail}</div>
            {row.companyPhone && <div className="text-gray-500">{row.companyPhone}</div>}
          </div>
        );
      },
    },
  ];
  
  return (
    <DashboardLayout 
      title="Firmendaten" 
      tabs={[]}
    >
      {!isEditing ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleAddCompany}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Neues Unternehmen
            </Button>
          </div>
          <DataTable
            data={companies}
            columns={columns}
            isLoading={isLoading}
            onEdit={handleEditCompany}
            onDelete={handleDeleteCompany}
            title="Unternehmensliste"
          />
        </div>
      ) : null}
      
      {isEditing && (
        <div className="mt-8">
          <div className="flex justify-end mb-6">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Liste
            </Button>
          </div>
          
          <CompanyForm 
            company={currentCompany} 
            onSubmit={handleFormSubmit} 
            isLoading={saveCompanyMutation.isPending} 
          />
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unternehmen löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie das Unternehmen "{currentCompany?.companyName}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteCompanyMutation.isPending}
            >
              {deleteCompanyMutation.isPending ? "Wird gelöscht..." : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
