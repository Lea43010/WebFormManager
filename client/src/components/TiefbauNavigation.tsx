import React from 'react';
import { Link } from 'wouter';
import { 
  Map, 
  Shovel, 
  Truck, 
  Calculator 
} from 'lucide-react';

interface NavigationLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
}

const NavigationLink: React.FC<NavigationLinkProps> = ({ to, icon, text }) => {
  return (
    <Link href={to}>
      <a className="flex items-center p-3 rounded-md hover:bg-slate-100 transition-colors">
        <div className="mr-3">{icon}</div>
        <span>{text}</span>
      </a>
    </Link>
  );
};

const TiefbauNavigation: React.FC = () => {
  return (
    <div className="tiefbau-navigation bg-white rounded-md shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Tiefbau-Module</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <NavigationLink 
          to="/tiefbau-map" 
          icon={<Map className="h-5 w-5 text-blue-500" />} 
          text="Streckenplanung" 
        />
        <NavigationLink 
          to="/bodenanalyse" 
          icon={<Shovel className="h-5 w-5 text-orange-500" />} 
          text="Bodenanalyse" 
        />
        <NavigationLink 
          to="/maschinen-auswahl" 
          icon={<Truck className="h-5 w-5 text-green-500" />} 
          text="Maschinenplanung" 
        />
        <NavigationLink 
          to="/kosten-kalkulation" 
          icon={<Calculator className="h-5 w-5 text-purple-500" />} 
          text="Kostenkalkulation" 
        />
      </div>
    </div>
  );
};

export default TiefbauNavigation;