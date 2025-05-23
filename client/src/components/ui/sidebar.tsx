import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { PermissionGate } from "@/components/ui/permission-gate";
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
  ShieldCheck,
  CreditCard,
  BarChart2, 
  FileCheck,
  HelpCircle,
  Shovel,
  Truck,
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { TooltipButton } from "@/components/ui/tooltip-button";
import logoImage from "@/assets/Logo.png";

type Role = 'administrator' | 'manager' | 'user';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  showFor?: Role[]; // Benutzerrollen, für die dieser Menüpunkt angezeigt werden soll
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
    title: "Tiefbau-Planung",
    href: "/tiefbau-map",
    icon: Shovel,
    tooltip: "Tiefbau-Planung und Baustellen-Management",
  },
  {
    title: "Kostenkalkulation",
    href: "/kostenkalkulation",
    icon: CreditCard,
    tooltip: "Kosten für Bauvorhaben kalkulieren",
  },
  // DenkmalAtlas in TiefbauMap integriert
  /*
  {
    title: "DenkmalAtlas",
    href: "/denkmal-atlas",
    icon: Map,
    tooltip: "Denkmalatlas und Geoportale für die Bauplanung",
  },
  */
  {
    title: "Dokumente",
    href: "/attachments",
    icon: Paperclip,
    tooltip: "Projektbezogene Dokumente und Anhänge verwalten",
  },
  {
    title: "Datenqualität",
    href: "/data-quality",
    icon: FileCheck,
    showFor: ['administrator', 'manager'] as Role[],
    tooltip: "Datenqualität überwachen und verbessern",
  },
  {
    title: "Hilfe & Info",
    href: "/information",
    icon: Info,
    tooltip: "Hilfe, Dokumentation und Informationen zur App",
  },
  // Nutzerverwaltung wurde in den Admin-Bereich verschoben
  {
    title: "Abonnement",
    href: "/subscription",
    icon: BarChart2,
    tooltip: "Abonnement-Verwaltung und Preispläne",
  },

  {
    title: "Admin-Bereich",
    href: "/admin",
    icon: ShieldAlert,
    showFor: ['administrator', 'manager'] as Role[],
    tooltip: "Benutzer- und Systemadministration",
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
    <div className="flex flex-col h-full bg-white text-gray-800 border-r border-gray-200">
      <div className="flex items-center h-20 flex-shrink-0 px-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <img 
            src={logoImage} 
            alt="Bau - Structura Logo" 
            className="h-auto w-auto max-h-[52px] mr-3" 
            loading="eager" 
            style={{ objectFit: 'contain' }}
          />
          <span className="text-xl font-medium text-[#6a961f]">Bau - Structura</span>
        </div>
        {isMobile && (
          <TooltipButton tooltipText="Menü schließen" side="bottom">
            <Button variant="ghost" className="ml-auto text-[#6a961f] hover:bg-gray-100" onClick={toggleMobileMenu}>
              <X className="h-6 w-6" />
            </Button>
          </TooltipButton>
        )}
      </div>
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <h2 className="px-4 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">Navigieren</h2>
        <nav className="flex-1 px-2 pb-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              
              // Generiere das Menüelement
              const menuItem = (
                <div
                  className={cn(
                    "group flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors duration-150",
                    isActive
                      ? "bg-green-50 text-[#6a961f]"
                      : "text-gray-700 hover:bg-gray-100 hover:text-[#6a961f]"
                  )}
                >
                  <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-[#6a961f]" : "text-gray-500")} />
                  {item.title}
                </div>
              );

              // Data-tour Attribut für die Tour hinzufügen
              // Konvertiere den Titel in einen tour-identifier (z.B. "Firmendaten" zu "companies-link")
              const tourId = item.href.replace(/\//g, '') || 'dashboard';
              const dataTourAttr = { 'data-tour': `${tourId}-link` };
              
              // Erstelle den Menüpunkt mit oder ohne Tooltip
              const navigationItem = item.tooltip ? (
                <TooltipButton 
                  key={item.href}
                  tooltipText={item.tooltip}
                  side="right"
                  {...dataTourAttr}
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
                  {...dataTourAttr}
                >
                  {menuItem}
                </Link>
              );
              
              // Überprüfe Berechtigungen durch PermissionGate, wenn eine Rolle erforderlich ist
              if (item.showFor) {
                return (
                  <PermissionGate key={item.href} requiredRole={item.showFor}>
                    {navigationItem}
                  </PermissionGate>
                );
              }
              
              // Wenn keine spezielle Berechtigungsprüfung erforderlich ist, wird der Menüpunkt für alle angezeigt
              return navigationItem;
            })}
          </div>
        </nav>
      </div>
      {user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <Avatar className="border-2 border-gray-200">
                <AvatarFallback className="bg-[#6a961f] text-white">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-800">{user.username}</p>
                <p className="text-xs text-gray-500 mt-0.5">Angemeldet</p>
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
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-3 left-3 z-40 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white" 
          onClick={toggleMobileMenu}
          aria-label="Menü öffnen"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      
      {isMobile ? (
        <div
          className={cn(
            "fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Sidebar mit erhöhtem z-index um über allem zu sein */}
          <div className="h-full w-72 max-w-[85vw] relative z-10">
            {sidebarContent}
          </div>
          {/* Abdunkelnder Hintergrund */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
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
