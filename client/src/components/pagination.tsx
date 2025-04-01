import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // If 7 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate middle pages
      if (currentPage <= 3) {
        // Near start
        pageNumbers.push(2, 3, 4, '...', totalPages - 1);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pageNumbers.push('...', totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        // Middle
        pageNumbers.push(
          '...', 
          currentPage - 1, 
          currentPage, 
          currentPage + 1,
          '...'
        );
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-neutral-100 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Zurück
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Weiter
        </Button>
      </div>
      
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-neutral-500">
            Zeige
            <span className="font-medium mx-1">
              {Math.min((currentPage - 1) * pageSize + 1, totalItems)}
            </span>
            bis
            <span className="font-medium mx-1">
              {Math.min(currentPage * pageSize, totalItems)}
            </span>
            von
            <span className="font-medium ml-1">{totalItems}</span>
            Einträgen
          </p>
        </div>
        
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="icon"
              className="relative inline-flex items-center rounded-l-md"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Zurück</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page Numbers */}
            {pageNumbers.map((page, index) => (
              typeof page === 'number' ? (
                <Button
                  key={index}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className="relative inline-flex items-center"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              ) : (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="relative inline-flex items-center"
                  disabled
                >
                  {page}
                </Button>
              )
            ))}
            
            {/* Next Button */}
            <Button
              variant="outline"
              size="icon"
              className="relative inline-flex items-center rounded-r-md"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <span className="sr-only">Weiter</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
