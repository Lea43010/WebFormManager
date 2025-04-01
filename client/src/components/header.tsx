import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden text-white hover:bg-primary-700" 
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Daten Erfassungs App</h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="hidden md:inline-block text-sm mr-2">
            {user?.username}
          </span>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-primary-700 hover:bg-primary-600 text-white"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span className="hidden md:inline-block">Abmelden</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
