import React from 'react';
import { Link } from 'wouter';
import { 
  PermissionGate, 
  AdminOnly, 
  ManagerOrAbove 
} from '@/components/ui/permission-gate';
import { 
  User, 
  Settings, 
  Building2, 
  FileText, 
  Users, 
  BarChart4,
  Shield
} from 'lucide-react';

/**
 * Beispiel-Sidebar mit rollenbasierter Zugriffssteuerung
 * 
 * Dieses Beispiel zeigt, wie die PermissionGate-Komponente verwendet werden kann,
 * um Menüpunkte basierend auf Benutzerrollen ein- oder auszublenden.
 */
export function SidebarWithPermissions() {
  return (
    <div className="w-64 h-screen bg-gray-50 border-r border-gray-200 py-6 px-3 flex flex-col">
      <div className="font-bold text-xl mb-6 px-4">Bau-Structura</div>
      
      <nav className="space-y-1 flex-1">
        {/* Menüpunkte für alle Benutzer sichtbar */}
        <NavItem to="/dashboard" icon={<BarChart4 size={18} />} label="Dashboard" />
        <NavItem to="/profile" icon={<User size={18} />} label="Mein Profil" />
        <NavItem to="/projects" icon={<FileText size={18} />} label="Projekte" />
        
        {/* Nur für Manager und Administratoren sichtbar */}
        <ManagerOrAbove>
          <NavItem to="/companies" icon={<Building2 size={18} />} label="Unternehmen" />
          <NavItem to="/team" icon={<Users size={18} />} label="Team verwalten" />
        </ManagerOrAbove>
        
        {/* Nur für Administratoren sichtbar */}
        <AdminOnly>
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Administration
            </div>
            <NavItem to="/admin/users" icon={<Users size={18} />} label="Benutzerverwaltung" />
            <NavItem to="/admin/settings" icon={<Settings size={18} />} label="Systemeinstellungen" />
            <NavItem to="/admin/security" icon={<Shield size={18} />} label="Sicherheit" />
          </div>
        </AdminOnly>
      </nav>
      
      {/* Footer-Menüpunkte - für alle sichtbar */}
      <div className="pt-4 mt-4 border-t border-gray-200">
        <NavItem to="/settings" icon={<Settings size={18} />} label="Einstellungen" />
      </div>
    </div>
  );
}

// Hilfkomponente für Navigations-Items
function NavItem({ 
  to, 
  icon, 
  label 
}: { 
  to: string; 
  icon: React.ReactNode; 
  label: string; 
}) {
  return (
    <Link href={to}>
      <a className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md group">
        <span className="text-gray-500 group-hover:text-gray-700 mr-3">{icon}</span>
        <span>{label}</span>
      </a>
    </Link>
  );
}