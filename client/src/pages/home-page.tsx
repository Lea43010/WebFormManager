import { useState } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import Dashboard from "@/pages/dashboard";
import DataEntry from "@/pages/data-entry";
import DataView from "@/pages/data-view";

type Section = "dashboard" | "data-entry" | "data-view" | "profile" | "settings";

export default function HomePage() {
  const [currentSection, setCurrentSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderSection = () => {
    switch (currentSection) {
      case "dashboard":
        return <Dashboard />;
      case "data-entry":
        return <DataEntry />;
      case "data-view":
        return <DataView />;
      case "profile":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Profil</h1>
            <p className="text-neutral-600">Profilseite ist in Entwicklung.</p>
          </div>
        );
      case "settings":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Einstellungen</h1>
            <p className="text-neutral-600">Einstellungsseite ist in Entwicklung.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentSection={currentSection} 
          onNavigate={setCurrentSection} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
