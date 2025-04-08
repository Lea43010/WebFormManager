import { useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Customer } from "@shared/schema";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import CustomerForm from "@/components/customer/customer-form";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CustomerPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch customers
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Create or update customer mutation
  const saveCustomerMutation = useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      if (customer.id) {
        // Update existing customer
        const res = await apiRequest("PUT", `/api/customers/${customer.id}`, customer);
        return await res.json();
      } else {
        // Create new customer
        const res = await apiRequest("POST", "/api/customers", customer);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsEditing(false);
      toast({
        title: currentCustomer ? "Kunde aktualisiert" : "Kunde erstellt",
        description: `Der Kunde wurde erfolgreich ${currentCustomer ? "aktualisiert" : "erstellt"}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim ${currentCustomer ? "Aktualisieren" : "Erstellen"} des Kunden: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Kunde gelöscht",
        description: "Der Kunde wurde erfolgreich gelöscht",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen des Kunden: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle add button click
  const handleAddCustomer = () => {
    setCurrentCustomer(null);
    setIsEditing(true);
  };
  
  // Handle edit button click
  const handleEditCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsEditing(true);
  };
  
  // Handle delete button click
  const handleDeleteCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = () => {
    if (currentCustomer?.id) {
      deleteCustomerMutation.mutate(currentCustomer.id);
    }
  };
  
  // Submit form
  const handleFormSubmit = (data: Partial<Customer>) => {
    saveCustomerMutation.mutate(data);
  };
  
  // Table columns
  const columns = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "customerId",
      header: "Kundennummer",
    },
    {
      accessorKey: "street",
      header: "Adresse",
      cell: (value: string, row: Customer) => {
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
      accessorKey: "customerEmail",
      header: "Kontakt",
      cell: (value: string, row: Customer) => {
        return (
          <div>
            <div>{row.customerEmail}</div>
            {row.customerPhone && <div className="text-gray-500">{row.customerPhone}</div>}
          </div>
        );
      },
    },
  ];
  
  return (
    <DashboardLayout 
      title="Kundendaten" 
      tabs={[]}
    >
      {!isEditing ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleAddCustomer}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Neuer Kunde
            </Button>
          </div>
          <DataTable
            data={customers}
            columns={columns as any}
            isLoading={isLoading}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            title="Kundenliste"
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
          
          <CustomerForm 
            customer={currentCustomer} 
            onSubmit={handleFormSubmit} 
            isLoading={saveCustomerMutation.isPending} 
          />
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kunde löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie den Kunden "{currentCustomer?.customerId}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? "Wird gelöscht..." : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
