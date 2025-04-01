import { useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { Material } from "@shared/schema";

export default function MaterialPage() {
  const [activeTab, setActiveTab] = useState("Liste");
  
  // Fetch materials
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Table columns
  const columns = [
    {
      accessorKey: "materialId",
      header: "Material-ID",
    },
    {
      accessorKey: "materialName",
      header: "Materialname",
    },
    {
      accessorKey: "materialAmount",
      header: "Menge",
    },
    {
      accessorKey: "materialPrice",
      header: "Preis pro Stück",
      cell: (value: number) => {
        return value ? `${value.toFixed(2)} €` : '';
      }
    },
    {
      accessorKey: "materialTotal",
      header: "Gesamtpreis",
      cell: (value: number) => {
        return value ? `${value.toFixed(2)} €` : '';
      }
    },
  ];
  
  return (
    <DashboardLayout 
      title="Materialdaten" 
      tabs={["Liste", "Neuer Eintrag", "Import/Export"]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "Liste" && (
        <DataTable
          data={materials}
          columns={columns}
          isLoading={isLoading}
          onAdd={() => {}}
          title="Materialliste"
        />
      )}
      
      {activeTab === "Neuer Eintrag" && (
        <div className="p-4 bg-white rounded-md shadow">
          <h2 className="text-lg font-medium mb-4">Neues Material</h2>
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
