import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Stellt sicher, dass die Seite innerhalb gültiger Grenzen liegt
  const validPage = Math.max(1, Math.min(currentPage, totalPages));
  
  // Berechnet die anzuzeigenden Seitenzahlen
  const getPageNumbers = () => {
    // Maximale Anzahl von Seitenzahlen, die angezeigt werden sollen
    const maxVisiblePages = 5;
    
    // Wenn weniger oder gleich max Seiten vorhanden sind, zeige alle
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Mindestens 2 Seiten am Anfang und Ende anzeigen
    let startPage = Math.max(1, validPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    // Anpassung, wenn endPage die Gesamtanzahl der Seiten überschreitet
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };
  
  // Wenn keine Seiten vorhanden sind, zeige nichts an
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-center gap-1 w-full">
      {/* Zur ersten Seite */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(1)}
        disabled={validPage === 1}
        title="Erste Seite"
        className="hidden sm:flex"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      
      {/* Zur vorherigen Seite */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(validPage - 1)}
        disabled={validPage === 1}
        title="Vorherige Seite"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Seitenzahlen */}
      <div className="flex items-center">
        {getPageNumbers().map((page) => (
          <Button
            key={page}
            variant={page === validPage ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page)}
            className="h-8 w-8 font-medium"
          >
            {page}
          </Button>
        ))}
      </div>
      
      {/* Zur nächsten Seite */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(validPage + 1)}
        disabled={validPage === totalPages}
        title="Nächste Seite"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {/* Zur letzten Seite */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages)}
        disabled={validPage === totalPages}
        title="Letzte Seite"
        className="hidden sm:flex"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
      
      {/* Seiteninformation */}
      <div className="text-sm text-muted-foreground ml-2">
        Seite {validPage} von {totalPages}
      </div>
    </div>
  );
}