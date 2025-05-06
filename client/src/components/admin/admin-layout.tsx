import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { 
  Laptop, 
  Users, 
  Database, 
  FileText, 
  BarChart2, 
  Settings, 
  HardDrive, 
  Home, 
  LogOut,
  AlertCircle
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: <Home className="w-5 h-5 mr-2" /> },
    { path: '/admin/users', label: 'Benutzerverwaltung', icon: <Users className="w-5 h-5 mr-2" /> },
    { path: '/admin/data-quality', label: 'Datenqualität', icon: <Database className="w-5 h-5 mr-2" /> },
    { path: '/admin/logs', label: 'System-Logs', icon: <FileText className="w-5 h-5 mr-2" /> },
    { path: '/admin/sql-analytics', label: 'SQL-Analyse', icon: <BarChart2 className="w-5 h-5 mr-2" /> },
    { path: '/admin/backup-status', label: 'Backups', icon: <HardDrive className="w-5 h-5 mr-2" /> },
    { path: '/admin/emails', label: 'E-Mail-Vorlagen', icon: <AlertCircle className="w-5 h-5 mr-2" /> },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Seitenleiste */}
      <div className="w-64 bg-slate-800 text-white">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center">
            <Laptop className="mr-2" /> Admin-Bereich
          </h1>
        </div>
        <nav className="mt-4">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path} className="mb-1">
                <Link href={item.path}>
                  <a className={`flex items-center p-3 mx-2 rounded-md transition-colors ${
                    location === item.path
                      ? 'bg-slate-700 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}>
                    {item.icon}
                    {item.label}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full text-slate-300 hover:text-white justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" /> Abmelden
          </Button>
        </div>
      </div>

      {/* Hauptinhalt */}
      <div className="flex-1 bg-slate-50">
        <div className="min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
export { AdminLayout };