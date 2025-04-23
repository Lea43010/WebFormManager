import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useScreenSize } from "@/hooks/use-mobile";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Responsive Form-Sektion
 * Stellt einen Abschnitt innerhalb eines Formulars dar,
 * komplett mit Titel und optionaler Beschreibung
 */
export function FormSection({
  title,
  description,
  children,
  className = "",
}: FormSectionProps) {
  return (
    <div className={cn("form-section", className)}>
      <div className="form-heading">
        <h3 className="text-lg sm:text-xl font-medium text-gray-800">{title}</h3>
      </div>
      
      {description && (
        <p className="mt-1 mb-4 text-sm text-gray-500">{description}</p>
      )}
      
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface FormRowProps {
  children: ReactNode;
  className?: string;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
  gap?: number;
}

/**
 * Responsive Form-Zeile
 * Organisiert Formular-Eingabefelder in einer flexiblen Zeile,
 * die sich an verschiedene Bildschirmgrößen anpasst
 */
export function FormRow({
  children,
  className = "",
  columns = { sm: 1, md: 2, lg: 3 },
  gap = 4,
}: FormRowProps) {
  const screenSize = useScreenSize();
  
  return (
    <div
      className={cn(
        "grid",
        `grid-cols-1`,
        screenSize !== 'mobile' && `sm:grid-cols-${columns.sm || 1}`,
        screenSize === 'desktop' && `md:grid-cols-${columns.md || 2}`,
        screenSize === 'desktop' && `lg:grid-cols-${columns.lg || 3}`,
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
}

interface FormItemProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Responsive Form-Item
 * Stellt ein einzelnes Formularfeld mit Label, Beschreibung und Fehlermeldung dar
 */
export function FormItem({
  label,
  description,
  error,
  required = false,
  children,
  className = "",
}: FormItemProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="modern-form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 -mt-1">{description}</p>
      )}
      
      {children}
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

interface FormActionsProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right" | "space-between";
}

/**
 * Responsive Form-Aktionen
 * Container für Formular-Aktionen (Buttons) mit flexibler Ausrichtung
 */
export function FormActions({
  children,
  className = "",
  align = "right",
}: FormActionsProps) {
  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    "space-between": "justify-between",
  };
  
  return (
    <div className={cn(
      "flex flex-wrap items-center gap-3 mt-6 py-4",
      alignmentClasses[align],
      className
    )}>
      {children}
    </div>
  );
}

export { FormSection, FormRow, FormItem, FormActions };