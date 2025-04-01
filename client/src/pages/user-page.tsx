import { useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UserPage() {
  const [activeTab, setActiveTab] = useState("Liste");
  
  // Fetch users - Note: This API endpoint is not implemented yet
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    staleTime: 1000 * 60, // 1 minute
    retry: false, // Don't retry since this endpoint might not be implemented yet
  });
  
  // Table columns
  const columns = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "username",
      header: "Benutzername",
      cell: (value: string, row: User) => {
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-white">
                {value.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{value}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "E-Mail",
    },
  ];
  
  return (
    <DashboardLayout 
      title="Benutzerverwaltung" 
      tabs={["Liste", "Neuer Benutzer", "Berechtigungen"]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "Liste" && (
        <DataTable
          data={users}
          columns={columns}
          isLoading={isLoading}
          onAdd={() => {}}
          title="Benutzerliste"
        />
      )}
      
      {activeTab === "Neuer Benutzer" && (
        <div className="p-4 bg-white rounded-md shadow">
          <h2 className="text-lg font-medium mb-4">Neuer Benutzer</h2>
          <p className="text-gray-500 mb-4">Dieses Formular wird noch entwickelt.</p>
        </div>
      )}
      
      {activeTab === "Berechtigungen" && (
        <div className="p-4 bg-white rounded-md shadow">
          <h2 className="text-lg font-medium mb-4">Berechtigungsverwaltung</h2>
          <p className="text-gray-500 mb-4">Diese Funktion ist noch in Entwicklung.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
