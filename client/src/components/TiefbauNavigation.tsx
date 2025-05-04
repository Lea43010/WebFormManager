import React from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { Shovel, Database, Truck, MapPin, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * Komponente für die Navigation im Tiefbau-Bereich
 * Bietet einfachen Zugriff auf Tiefbau-spezifische Funktionen
 */
const TiefbauNavigation = () => {
  const [location] = useLocation();

  // Definieren der Navigationsitems
  const navItems = [
    {
      title: 'Tiefbau Karte',
      href: '/tiefbau-map',
      icon: MapPin,
      description: 'Höhenprofil und Baustellen-Übersicht'
    },
    {
      title: 'Bodenanalyse',
      href: '/bodenanalyse',
      icon: Database,
      description: 'Analyse von Bodenarten und Eigenschaften'
    },
    {
      title: 'Maschinenauswahl',
      href: '/maschinen-auswahl',
      icon: Truck,
      description: 'Passende Baumaschinen finden'
    },
    {
      title: 'Kostenkalkulation',
      href: '/tiefbau-kostenkalkulation',
      icon: Calculator,
      description: 'Projektkosten kalkulieren',
      comingSoon: true
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center mb-4">
        <Shovel className="h-6 w-6 mr-2 text-primary" />
        <h2 className="text-xl font-semibold">Tiefbau-Navigation</h2>
      </div>
      <Separator className="mb-4" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {navItems.map((item) => {
          const isActive = location === item.href;
          
          return (
            <div key={item.href} className="relative">
              {item.comingSoon && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg rounded-tl-lg z-10">
                  Demnächst
                </div>
              )}
              
              <Link href={item.comingSoon ? "#" : item.href}>
                <Button 
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "w-full h-full min-h-24 flex flex-col items-center justify-center p-4 space-y-2",
                    isActive ? "bg-primary text-white" : "hover:bg-gray-50",
                    item.comingSoon ? "opacity-70 cursor-not-allowed" : ""
                  )}
                  disabled={item.comingSoon}
                >
                  <item.icon className={cn("h-8 w-8 mb-2", isActive ? "text-white" : "text-primary")} />
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-center">
                    {item.description}
                  </span>
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TiefbauNavigation;