import React, { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipButtonProps {
  children: ReactNode;
  tooltipText: string;
  side?: "top" | "right" | "bottom" | "left";
  delay?: number;
  className?: string;
  asChild?: boolean;
}

/**
 * Eine wiederverwendbare Komponente, die einen beliebigen Button mit einem Tooltip umschließt.
 * 
 * @param children Der Button oder andere Komponente, die als Trigger dient
 * @param tooltipText Der Text, der im Tooltip angezeigt werden soll
 * @param side Die Seite, auf der der Tooltip erscheinen soll
 * @param delay Die Verzögerung in Millisekunden, bevor der Tooltip erscheint
 * @param className Zusätzliche CSS-Klassen für den Tooltip-Content
 * @param asChild Wenn true, wird der erste untergeordnete Knoten als Trigger verwendet
 */
export function TooltipButton({
  children,
  tooltipText,
  side = "bottom",
  delay = 300,
  className = "",
  asChild = true,
}: TooltipButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={delay}>
        <TooltipTrigger asChild={asChild}>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className={className}
        >
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}