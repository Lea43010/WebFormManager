import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Employee } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, Eye, Edit, Trash2, 
  Search, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Pagination from "@/components/pagination";

export default function DataView() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const pageSize = 10;

  // Fetch employees data
  const { 
    data, 
    isLoading 
  } = useQuery<{ data: Employee[], total: number }>({
    queryKey: ["/api/employees", currentPage, pageSize, searchTerm],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      
      if (searchTerm) {
        searchParams.append("search", searchTerm);
      }
      
      const response = await fetch(`/api/employees?${searchParams.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      
      return response.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: "Eintrag wurde erfolgreich gelöscht.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Löschen fehlgeschlagen: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle view entry
  const handleViewEntry = (id: number) => {
    toast({
      title: "Info",
      description: `Detailansicht für Eintrag #${id} wird geladen...`,
    });
    // In a real app, this would navigate to a detail view
  };

  // Handle edit entry
  const handleEditEntry = (id: number) => {
    toast({
      title: "Info",
      description: `Bearbeitung für Eintrag #${id} wird geladen...`,
    });
    // In a real app, this would navigate to the edit form
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deleteId !== null) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  // Handle export data
  const handleExportData = () => {
    toast({
      title: "Info",
      description: "Export wird vorbereitet...",
    });
    
    // In a real app, this would generate a CSV or Excel file
    setTimeout(() => {
      toast({
        title: "Erfolg",
        description: "Daten wurden erfolgreich exportiert.",
      });
    }, 1000);
  };

  // Get status badge class based on contract type and active status
  const getStatusBadge = (employee: Employee) => {
    if (!employee.isActive) {
      return "bg-error bg-opacity-10 text-error";
    }
    
    switch (employee.contractType) {
      case "teilzeit":
        return "bg-warning bg-opacity-10 text-warning";
      default:
        return "bg-success bg-opacity-10 text-success";
    }
  };

  // Get status text
  const getStatusText = (employee: Employee) => {
    if (!employee.isActive) {
      return "Inaktiv";
    }
    
    switch (employee.contractType) {
      case "teilzeit":
        return "Teilzeit";
      default:
        return "Aktiv";
    }
  };

  return (
    <section className="space-y-6 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-neutral-800">Daten Ansicht</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Suchen..."
              className="pl-10 pr-4 py-2"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          </div>
          <Button onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Exportieren
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-100">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Abteilung
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Position
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </td>
                </tr>
              ) : data && data.data.length > 0 ? (
                data.data.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">
                      {employee.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                      {employee.department ? 
                        employee.department.charAt(0).toUpperCase() + employee.department.slice(1) : 
                        "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                      {employee.position || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(employee)}`}>
                        {getStatusText(employee)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary-dark"
                        onClick={() => handleViewEntry(employee.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-secondary-500 hover:text-secondary-600"
                        onClick={() => handleEditEntry(employee.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-error hover:text-red-700"
                            onClick={() => setDeleteId(employee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Möchten Sie den Eintrag #{employee.id} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteId(null)}>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteConfirm}
                              className="bg-error hover:bg-red-700"
                            >
                              {deleteMutation.isPending && deleteId === employee.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Löschen"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-neutral-500">
                    Keine Einträge gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {data && (
          <Pagination
            currentPage={currentPage}
            totalItems={data.total}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </section>
  );
}
