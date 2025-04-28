import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxPageButtons?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxPageButtons = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageButtons = () => {
    let buttons = [];
    
    // Always show first page
    buttons.push(
      <Button
        key="page-1"
        variant={currentPage === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => onPageChange(1)}
        className="h-8 w-8 p-0"
      >
        1
      </Button>
    );

    // Calculate the range of buttons to show
    const leftSiblingIndex = Math.max(currentPage - 1, 2);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages - 1);

    // Should we show left dots?
    const shouldShowLeftDots = leftSiblingIndex > 2;
    // Should we show right dots?
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    // Show left dots if needed
    if (shouldShowLeftDots) {
      buttons.push(
        <Button
          key="dots-left"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 cursor-default"
          disabled
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      );
    }

    // Generate page buttons in the middle
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last page as they are always shown
      
      buttons.push(
        <Button
          key={`page-${i}`}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(i)}
          className="h-8 w-8 p-0"
        >
          {i}
        </Button>
      );
    }

    // Show right dots if needed
    if (shouldShowRightDots) {
      buttons.push(
        <Button
          key="dots-right"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 cursor-default"
          disabled
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      );
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      buttons.push(
        <Button
          key={`page-${totalPages}`}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(totalPages)}
          className="h-8 w-8 p-0"
        >
          {totalPages}
        </Button>
      );
    }

    return buttons;
  };

  // Text representation of pages for accessibility
  const paginationText = `Seite ${currentPage} von ${totalPages}`;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Vorherige Seite</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {renderPageButtons()}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Nächste Seite</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {paginationText}
      </div>
    </div>
  );
}