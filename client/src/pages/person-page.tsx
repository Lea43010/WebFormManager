import { useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { Person } from "@shared/schema";
import PersonForm from "@/components/person/person-form";

export default function PersonPage() {
  const [activeTab, setActiveTab] = useState("Liste");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  // Fetch persons
  const { data: persons = [], isLoading, refetch } = useQuery<Person[]>({
    queryKey: ["/api/persons"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Table columns
  const columns = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "firstname",
      header: "Vorname",
    },
    {
      accessorKey: "lastname",
      header: "Nachname",
    },
    {
      accessorKey: "companyId",
      header: "Firma ID",
    },
  ];
  
  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
    setActiveTab("Person bearbeiten");
  };
  
  const handleAddSuccess = () => {
    setActiveTab("Liste");
    refetch();
  };
  
  const handleBackToList = () => {
    setSelectedPerson(null);
    setActiveTab("Liste");
  };
  
  return (
    <DashboardLayout 
      title="Personalverwaltung" 
      tabs={["Liste", "Neue Person", selectedPerson ? "Person bearbeiten" : null].filter(Boolean)}
      activeTab={activeTab}
      onTabChange={(tab) => {
        if (tab === "Liste") {
          setSelectedPerson(null);
        }
        setActiveTab(tab);
      }}
    >
      {activeTab === "Liste" && (
        <DataTable
          data={persons}
          columns={columns}
          isLoading={isLoading}
          onAdd={() => setActiveTab("Neue Person")}
          onEdit={handleEditPerson}
          title="Personenliste"
        />
      )}
      
      {(activeTab === "Neue Person" || activeTab === "Person bearbeiten") && (
        <PersonForm 
          person={selectedPerson} 
          onSuccess={handleAddSuccess}
          onCancel={handleBackToList}
        />
      )}
    </DashboardLayout>
  );
}