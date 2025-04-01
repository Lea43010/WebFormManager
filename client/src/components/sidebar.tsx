import { useEffect } from "react";
import { 
  LayoutDashboard, 
  FileEdit, 
  Table, 
  User, 
  Settings, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SectionType = "dashboard" | "data-entry" | "data-view" | "profile" | "settings";

interface SidebarProps {
  currentSection: SectionType;
  onNavigate: (section: SectionType) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    title: "Hauptmenü",
    items: [
      { 
        name: "Dashboard", 
        icon: <LayoutDashboard className="h-4 w-4 mr-3" />, 
        section: "dashboard" as SectionType 
      },
      { 
        name: "Daten Erfassung", 
        icon: <FileEdit className="h-4 w-4 mr-3" />, 
        section: "data-entry" as SectionType 
      },
      { 
        name: "Daten Ansicht", 
        icon: <Table className="h-4 w-4 mr-3" />, 
        section: "data-view" as SectionType 
      },
    ]
  },
  {
    title: "Einstellungen",
    items: [
      { 
        name: "Profil", 
        icon: <User className="h-4 w-4 mr-3" />, 
        section: "profile" as SectionType 
      },
      { 
        name: "Einstellungen", 
        icon: <Settings className="h-4 w-4 mr-3" />, 
        section: "settings" as SectionType 
      },
    ]
  }
];

export default function Sidebar({ 
  currentSection, 
  onNavigate, 
  isOpen, 
  onClose 
}: SidebarProps) {
  // Close sidebar on navigation on mobile
  const handleNavigation = (section: SectionType) => {
    onNavigate(section);
    if (window.innerWidth < 768) {
      onClose();
    }
  };
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      if (
        isOpen && 
        sidebar && 
        !sidebar.contains(event.target as Node) && 
        window.innerWidth < 768
      ) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Close sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, onClose]);
  
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-10 bg-black bg-opacity-50"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        id="sidebar"
        className={cn(
          "fixed md:static z-20 h-full w-64 bg-white border-r border-neutral-100 shadow-sm overflow-y-auto transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex justify-between items-center p-4 md:hidden">
          <h2 className="font-medium">Menü</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="p-4">
          {navItems.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                {group.title}
              </h2>
              <ul className="space-y-1">
                {group.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <button
                      className={cn(
                        "flex w-full items-center px-3 py-2 text-sm font-medium rounded-md",
                        currentSection === item.section
                          ? "bg-primary text-white"
                          : "text-neutral-700 hover:bg-gray-100"
                      )}
                      onClick={() => handleNavigation(item.section)}
                    >
                      {item.icon}
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
