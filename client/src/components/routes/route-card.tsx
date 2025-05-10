import React from 'react';
import { Trash2 } from 'lucide-react';

interface RouteCardProps {
  route: {
    id: number;
    name: string;
    start_address: string;
    end_address: string;
    distance: number;
    created_at: string;
  };
  onDelete?: (routeId: number) => void;
}

export function RouteCard({ route, onDelete }: RouteCardProps) {
  // Datum formatieren
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 relative">
      <div className="absolute top-3 right-3">
        {onDelete && (
          <button 
            onClick={() => onDelete(route.id)}
            className="text-destructive hover:bg-destructive/10 p-1 rounded-full transition-colors"
            aria-label="Route löschen"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <h3 className="text-base font-semibold mb-2">{route.name}</h3>
      
      <div className="text-[10px] space-y-2">
        <div className="grid grid-cols-4 gap-1">
          <span className="text-muted-foreground col-span-1">Von:</span>
          <span className="col-span-3 truncate">{route.start_address}</span>
        </div>
        
        <div className="grid grid-cols-4 gap-1">
          <span className="text-muted-foreground col-span-1">Nach:</span>
          <span className="col-span-3 truncate">{route.end_address}</span>
        </div>
        
        <div className="grid grid-cols-4 gap-1">
          <span className="text-muted-foreground col-span-1">Länge:</span>
          <span className="col-span-3">{(route.distance / 1000).toFixed(2)} km</span>
        </div>
        
        <div className="grid grid-cols-4 gap-1">
          <span className="text-muted-foreground col-span-1">Erstellt:</span>
          <span className="col-span-3">{formatDate(route.created_at)}</span>
        </div>
      </div>
    </div>
  );
}