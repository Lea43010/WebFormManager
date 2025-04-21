import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Folders, 
  Settings, 
  Menu, 
  X,
  Database,
  Paperclip,
  Map,
  Info,
  UserCircle,
  ShieldAlert,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { TooltipButton } from "@/components/ui/tooltip-button";
import logoImage from "@/assets/Logo.webp";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  showFor?: string[]; // Benutzerrollen, für die dieser Menüpunkt angezeigt werden soll
  tooltip?: string; // Tooltip-Text, der angezeigt wird, wenn über den Menüpunkt gefahren wird
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    tooltip: "Übersicht und Zusammenfassung aller Aktivitäten",
  },
  {
    title: "Firmendaten",
    href: "/companies",
    icon: Building2,
    tooltip: "Verwaltung von Firmen und Geschäftspartnern",
  },
  {
    title: "Kundendaten",
    href: "/customers",
    icon: Users,
    tooltip: "Kunden- und Ansprechpartner verwalten",
  },
  {
    title: "Projektverwaltung",
    href: "/projects",
    icon: Folders,
    tooltip: "Projekte erstellen, bearbeiten und verwalten",
  },
  {
    title: "Geo-Informationen",
    href: "/geo-map",
    icon: Map,
    tooltip: "Geografische Informationen und Kartenfunktionen",
  },
  {
    title: "Dokumente",
    href: "/attachments",
    icon: Paperclip,
    tooltip: "Projektbezogene Dokumente und Anhänge verwalten",
  },
  {
    title: "Abonnement",
    href: "/subscription",
    icon: CreditCard,
    tooltip: "Abonnement verwalten und Zahlungsinformationen",
  },
  {
    title: "Hilfe & Info",
    href: "/information",
    icon: Info,
    tooltip: "Hilfe, Dokumentation und Informationen zur App",
  },
  // Nutzerverwaltung wurde in den Admin-Bereich verschoben
  {
    title: "Admin-Bereich",
    href: "/admin",
    icon: ShieldAlert,
    showFor: ['administrator', 'manager'],
    tooltip: "Benutzer- und Systemadministration",
  },
  {
    title: "Datenübertragung",
    href: "/db-migration",
    icon: Database,
    showFor: ['administrator'],
    tooltip: "Datenaustausch und Datenbankmigration",
  },
];

export function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useMobile();

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-primary-dark text-black">
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary">
        <div className="flex items-center">
          <img 
            src={logoImage} 
            alt="Sachverständigenbüro - Justitia" 
            className="h-8 mr-3" 
            loading="eager" 
            width="32" 
            height="32" 
          />
          <span className="text-xl font-medium" style={{ color: "#6a961f" }}>Bau - Structura App</span>
        </div>
        {isMobile && (
          <TooltipButton tooltipText="Menü schließen" side="bottom">
            <Button variant="ghost" className="ml-auto text-black" onClick={toggleMobileMenu}>
              <X className="h-6 w-6" />
            </Button>
          </TooltipButton>
        )}
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              // Berechtigungsprüfung: Menüpunkt nur anzeigen, wenn der Benutzer die erforderliche Rolle hat
              // oder wenn keine Rolle erforderlich ist
              const hasPermission = !item.showFor || (user && user.role && item.showFor.includes(user.role));
              
              if (!hasPermission) return null;
              
              const menuItem = (
                <div
                  className={cn(
                    "group flex items-center px-2 py-2 text-base font-medium rounded-md",
                    isActive
                      ? "bg-primary-light text-black"
                      : "text-black hover:bg-primary-light"
                  )}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.title}
                </div>
              );

              // Wenn ein Tooltip-Text existiert, umschließe das Element mit der Tooltip-Komponente
              return item.tooltip ? (
                <TooltipButton 
                  key={item.href}
                  tooltipText={item.tooltip}
                  side="right"
                >
                  <Link
                    href={item.href}
                    onClick={() => isMobile && setIsMobileOpen(false)}
                  >
                    {menuItem}
                  </Link>
                </TooltipButton>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                >
                  {menuItem}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      {user && (
        <div className="p-4 border-t border-primary-light">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-primary">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-black">{user.username}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile && (
        <TooltipButton tooltipText="Menü öffnen" side="right">
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-4 left-4 z-40" 
            onClick={toggleMobileMenu}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </TooltipButton>
      )}
      
      {isMobile ? (
        <div
          className={cn(
            "fixed inset-0 z-30 transform transition-transform duration-300 ease-in-out",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-full w-64">
            {sidebarContent}
          </div>
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 -z-10"
            onClick={() => setIsMobileOpen(false)}
          />
        </div>
      ) : (
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
