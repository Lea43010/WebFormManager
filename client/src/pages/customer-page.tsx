import { useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { Customer } from "@shared/schema";

export default function CustomerPage() {
  const [activeTab, setActiveTab] = useState("Liste");
  
  // Fetch customers
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  const handleAddCustomer = () => {
    setActiveTab("Neuer Eintrag");
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
      tabs={["Liste", "Neuer Eintrag", "Import/Export"]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "Liste" && (
        <DataTable
          data={customers}
          columns={columns}
          isLoading={isLoading}
          onAdd={handleAddCustomer}
          title="Kundenliste"
        />
      )}
      
      {activeTab === "Neuer Eintrag" && (
        <div className="p-4 bg-white rounded-md shadow">
          <h2 className="text-lg font-medium mb-4">Neuer Kunde</h2>
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
