import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Search
} from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

import { Column } from './data-table-types';

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onViewDetails?: (row: T) => void;
  title?: string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  onAdd,
  onEdit,
  onDelete,
  onViewDetails,
  title,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterText, setFilterText] = useState("");

  // Simple filtering function
  const filteredData = data.filter((row) => {
    if (!filterText) return true;
    
    return Object.values(row as any).some((value) => {
      return String(value).toLowerCase().includes(filterText.toLowerCase());
    });
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {title && <h2 className="text-lg sm:text-xl font-semibold text-gray-900 border-b-2 border-gray-200 pb-2 mb-2 sm:mb-3">{title}</h2>}
      
      <div className="rounded-md border border-gray-300 shadow-sm">
        {/* Mobile-optimierte Steuerelemente */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 flex flex-col items-center justify-between gap-2 border-b border-gray-300">
          <div className="flex flex-col w-full gap-2">
            {/* Paginierung & Filter in einer Zeile auf Mobilgeräten */}
            <div className="flex w-full gap-2">
              <Select
                defaultValue={pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-[110px] h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="10 pro Seite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 pro Seite</SelectItem>
                  <SelectItem value="25">25 pro Seite</SelectItem>
                  <SelectItem value="50">50 pro Seite</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Suchfeld mit angepasster Größe */}
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtern..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-8 w-full h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>
            
            {/* Hinzufügen-Button in separater Zeile auf Mobilgeräten */}
            {onAdd && (
              <Button 
                onClick={onAdd} 
                className="w-full h-8 sm:h-10 text-xs sm:text-sm flex items-center justify-center"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Neues Unternehmen
              </Button>
            )}
          </div>
        </div>
        
        {/* Tabelle mit horizontalem Scrollen auf Mobilgeräten */}
        <div className="overflow-x-auto">
          <Table className="border-collapse w-full">
            <TableHeader>
              <TableRow className="bg-gray-100">
                {columns.map((column) => (
                  <TableHead 
                    key={column.accessorKey as string} 
                    className="font-semibold text-black py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4"
                  >
                    {column.header}
                  </TableHead>
                ))}
                {(onEdit || onDelete || onViewDetails) && (
                  <TableHead className="text-right font-semibold text-black py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                    Aktionen
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loading state
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex} className="py-1 sm:py-2 px-2 sm:px-4">
                        <Skeleton className="h-4 sm:h-6 w-full" />
                      </TableCell>
                    ))}
                    {(onEdit || onDelete || onViewDetails) && (
                      <TableCell className="py-1 sm:py-2 px-2 sm:px-4">
                        <Skeleton className="h-4 sm:h-6 w-16 sm:w-20 ml-auto" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : currentData.length > 0 ? (
                currentData.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100"}>
                    {columns.map((column) => (
                      <TableCell 
                        key={column.accessorKey as string} 
                        className="py-1.5 sm:py-2.5 text-xs sm:text-sm px-2 sm:px-4"
                      >
                        {column.cell
                          ? column.cell(row[column.accessorKey], row)
                          : String(row[column.accessorKey] || '')}
                      </TableCell>
                    ))}
                    {(onEdit || onDelete || onViewDetails) && (
                      <TableCell className="text-right py-1.5 sm:py-2.5 px-2 sm:px-4">
                        <div className="flex justify-end space-x-1 sm:space-x-2">
                          {onViewDetails && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => onViewDetails(row)}
                              aria-label="Details"
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600"
                              >
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                              </svg>
                            </Button>
                          )}

                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => onEdit(row)}
                              aria-label="Bearbeiten"
                            >
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                            </Button>
                          )}
                          
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => onDelete(row)}
                              aria-label="Löschen"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (onEdit || onDelete || onViewDetails ? 1 : 0)}
                    className="h-24 text-center text-xs sm:text-sm"
                  >
                    Keine Daten gefunden.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile-optimierte Paginierung */}
        {filteredData.length > 0 && (
          <div className="bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-300 gap-2">
            {/* Kompakte Info für mobile Geräte */}
            <div className="text-2xs sm:text-xs text-gray-700 text-center sm:text-left w-full sm:w-auto">
              {startIndex + 1}-{Math.min(endIndex, filteredData.length)} von {filteredData.length}
            </div>
            
            {/* Kompakte Paginierung */}
            <div className="flex justify-center sm:justify-end w-full sm:w-auto">
              <nav className="flex rounded-md shadow-sm" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-l-md h-7 sm:h-8 px-1 sm:px-2 text-xs"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;
                  const isActive = page === currentPage;
                  
                  // Für Mobilgeräte zeigen wir nur aktuelle Seite und direkt daneben
                  const showOnMobile = 
                    page === currentPage || 
                    page === 1 || 
                    page === totalPages ||
                    page === currentPage + 1 || 
                    page === currentPage - 1;
                    
                  if (showOnMobile) {
                    return (
                      <Button
                        key={page}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="rounded-none h-7 sm:h-8 px-2 text-xs sm:text-sm min-w-[24px] sm:min-w-[32px]"
                      >
                        {page}
                      </Button>
                    );
                  } else if (
                    (page === currentPage - 2 && currentPage > 3) ||
                    (page === currentPage + 2 && currentPage < totalPages - 2)
                  ) {
                    // Zeige Ellipsis (...)
                    return (
                      <Button
                        key={page}
                        variant="outline"
                        size="sm"
                        disabled
                        className="rounded-none h-7 sm:h-8 px-0.5 sm:px-1 text-xs sm:text-sm min-w-[24px] sm:min-w-[32px]"
                      >
                        ...
                      </Button>
                    );
                  }
                  
                  return null;
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-r-md h-7 sm:h-8 px-1 sm:px-2 text-xs"
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
