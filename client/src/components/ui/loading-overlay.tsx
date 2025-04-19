import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "overlay" | "inline" | "skeleton";
}

/**
 * LoadingOverlay Komponente
 * 
 * Zeigt eine Ladeanimation an, während Daten geladen werden.
 * 
 * @param isLoading Ob die Daten gerade geladen werden
 * @param text Optionaler Text, der während des Ladens angezeigt wird
 * @param children Der Inhalt, der nach dem Laden angezeigt wird
 * @param className Zusätzliche CSS-Klassen
 * @param variant Art der Ladeanimation (overlay, inline, skeleton)
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text = "Daten werden geladen...",
  children,
  className,
  variant = "overlay",
}) => {
  if (variant === "inline") {
    return (
      <div className={cn("relative", className)}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            {text && <p className="text-sm text-muted-foreground">{text}</p>}
          </div>
        ) : (
          children
        )}
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("relative", className)}>
        {isLoading ? (
          <>
            {/* Wenn ein Kind vorhanden ist, verwenden wir dieses als Skeleton */}
            {React.Children.count(children) > 0 ? (
              <div className="relative">
                {children}
                <div className="absolute top-0 left-0 w-full flex flex-col items-center justify-center py-4">
                  <div className="flex items-center mb-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <p className="text-sm font-medium">{text}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            )}
          </>
        ) : (
          children
        )}
      </div>
    );
  }

  // Standard: Overlay
  return (
    <div className={cn("relative", className)}>
      {children}
      
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;