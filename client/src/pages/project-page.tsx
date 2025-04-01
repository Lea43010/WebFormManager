import { useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function ProjectPage() {
  const [activeTab, setActiveTab] = useState("Liste");
  
  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 1000 * 60, // 1 minute
  });
  
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
  ];
  
  return (
    <DashboardLayout 
      title="Projekte" 
      tabs={["Liste", "Neuer Eintrag", "Import/Export"]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "Liste" && (
        <DataTable
          data={projects}
          columns={columns}
          isLoading={isLoading}
          onAdd={() => {}}
          title="Projektliste"
        />
      )}
      
      {activeTab === "Neuer Eintrag" && (
        <div className="p-4 bg-white rounded-md shadow">
          <h2 className="text-lg font-medium mb-4">Neues Projekt</h2>
          <p className="text-gray-500 mb-4">Dieses Formular wird noch entwickelt.</p>
        </div>
      )}
      
      {activeTab === "Import/Export" && (
        <div className="p-4 bg-white rounded-md shadow">
          <h2 className="text-lg font-medium mb-4">Import/Export</h2>
          <p className="text-gray-500 mb-4">Diese Funktion ist noch in Entwicklung.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
