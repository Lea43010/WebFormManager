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
  LogOut,
  Database,
  Paperclip,
  Map,
  Info,
  UserCircle,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  showFor?: string[]; // Benutzerrollen, für die dieser Menüpunkt angezeigt werden soll
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Firmendaten",
    href: "/companies",
    icon: Building2,
    showFor: ['administrator', 'manager'],
  },
  {
    title: "Kundendaten",
    href: "/customers",
    icon: Users,
    showFor: ['administrator', 'manager'],
  },
  {
    title: "Projektverwaltung",
    href: "/projects",
    icon: Folders,
  },
  {
    title: "Geo-Informationen",
    href: "/geo-map",
    icon: Map,
  },
  {
    title: "Dokumente",
    href: "/attachments",
    icon: Paperclip,
  },
  {
    title: "Hilfe & Info",
    href: "/information",
    icon: Info,
  },
  {
    title: "Nutzerverwaltung",
    href: "/users",
    icon: Settings,
    showFor: ['administrator'],
  },
  {
    title: "Admin-Bereich",
    href: "/admin",
    icon: ShieldAlert,
    showFor: ['administrator', 'manager'],
  },
  {
    title: "Datenübertragung",
    href: "/db-migration",
    icon: Database,
    showFor: ['administrator'],
  },
];

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useMobile();

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-primary-dark text-black">
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary">
        <span className="text-xl font-medium" style={{ color: "#6a961f" }}>Baustellen App</span>
        {isMobile && (
          <Button variant="ghost" className="ml-auto text-black" onClick={toggleMobileMenu}>
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              // Berechtigungsprüfung: Menüpunkt nur anzeigen, wenn der Benutzer die erforderliche Rolle hat
              // oder wenn keine Rolle erforderlich ist
              const hasPermission = !item.showFor || (user && item.showFor.includes(user.role));
              
              if (!hasPermission) return null;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                >
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
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      {user && (
        <div className="p-4 border-t border-primary-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-primary">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-black">{user.username}</p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-black" 
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Abmelden</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
          className="fixed top-4 left-4 z-40" 
          onClick={toggleMobileMenu}
        >
          <Menu className="h-6 w-6" />
        </Button>
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
