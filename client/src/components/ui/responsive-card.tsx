import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveCardProps {
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  actionsClassName?: string;
  onClick?: () => void;
}

/**
 * Responsive Card-Komponente
 * Stellt eine Karte mit Titel, Inhalt und optionalen Aktionen dar,
 * die sich an verschiedene Bildschirmgrößen anpasst
 */
export function ResponsiveCard({
  title,
  children,
  actions,
  className = "",
  titleClassName = "",
  contentClassName = "",
  actionsClassName = "",
  onClick
}: ResponsiveCardProps) {
  return (
    <div 
      className={cn(
        "bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )} 
      onClick={onClick}
    >
      <div className={cn("px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-200 bg-gray-50", titleClassName)}>
        <h3 className="text-base sm:text-lg font-medium text-gray-800">
          {title}
        </h3>
      </div>
      
      <div className={cn("px-4 py-3 sm:px-5 sm:py-4", contentClassName)}>
        {children}
      </div>
      
      {actions && (
        <div className={cn("px-4 py-3 sm:px-5 sm:py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2", actionsClassName)}>
          {actions}
        </div>
      )}
    </div>
  );
}

interface ResponsiveCardGridProps {
  children: ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
  gap?: {
    x?: number;
    y?: number;
  };
  className?: string;
}

/**
 * Responsive Card Grid
 * Organisiert responsive Karten in einem Grid-Layout,
 * das sich je nach Bildschirmgröße anpasst
 */
export function ResponsiveCardGrid({
  children,
  columns = { sm: 1, md: 2, lg: 3 },
  gap = { x: 4, y: 4 },
  className = ""
}: ResponsiveCardGridProps) {
  // Grid-Template-Columns basierend auf der Anzahl der Spalten erzeugen
  const gridTemplateColumns = {
    sm: `repeat(${columns.sm || 1}, minmax(0, 1fr))`,
    md: `repeat(${columns.md || 2}, minmax(0, 1fr))`,
    lg: `repeat(${columns.lg || 3}, minmax(0, 1fr))`,
  };
  
  // Gap-Werte in Tailwind-Klassen umwandeln
  const gapClasses = `gap-${gap.y} gap-x-${gap.x}`;
  
  return (
    <div 
      className={cn(
        "grid", 
        `grid-cols-${columns.sm}`, 
        `md:grid-cols-${columns.md}`, 
        `lg:grid-cols-${columns.lg}`, 
        gapClasses, 
        className
      )}
    >
      {children}
    </div>
  );
}

export default ResponsiveCard;