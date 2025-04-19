import React from 'react';
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * MobileFriendlyButton Komponente
 * 
 * Eine erweiterte Button-Komponente, die für Touch-Geräte optimiert ist.
 * - Größere Touch-Bereiche
 * - Verbesserte visuelle Rückmeldung
 * - Reduzierte Doppelklick-Probleme
 */
export interface MobileFriendlyButtonProps extends ButtonProps {
  touchClassName?: string;
  touchActiveDelay?: number;
}

export const MobileFriendlyButton = React.forwardRef<HTMLButtonElement, MobileFriendlyButtonProps>(
  ({ className, touchClassName, children, onClick, touchActiveDelay = 300, ...props }, ref) => {
    const [isActive, setIsActive] = React.useState(false);
    const [isDisabled, setIsDisabled] = React.useState(false);
    
    // Click-Handler mit Debounce für bessere mobile Interaktion
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
      
      setIsActive(true);
      setIsDisabled(true);
      
      // Feedback für Benutzer aktivieren
      setTimeout(() => {
        setIsActive(false);
        
        // Kurzer Debounce, um Doppelklicks zu vermeiden
        onClick?.(event);
        
        setTimeout(() => {
          setIsDisabled(false);
        }, 50);
      }, touchActiveDelay);
    };
    
    return (
      <Button
        ref={ref}
        className={cn(
          // Grundlegende Klassen für Touch-Optimierung
          "min-h-[44px] min-w-[44px] transition-all duration-200",
          // Aktivzustand für visuelle Rückmeldung
          isActive && "scale-95 opacity-80",
          // Benutzerdefinierte Klasse vom Hauptkomponente
          className,
          // Touch-spezifische Klassen
          touchClassName
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

MobileFriendlyButton.displayName = "MobileFriendlyButton";

export default MobileFriendlyButton;