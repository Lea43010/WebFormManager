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
    <div className="space-y-4">
      {title && <h2 className="text-xl font-semibold text-gray-900 border-b-2 border-gray-200 pb-2 mb-3">{title}</h2>}
      
      <div className="rounded-md border-2 border-gray-300 shadow-sm">
        <div className="px-4 py-3 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-300">
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <Select
              defaultValue={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="10 pro Seite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 pro Seite</SelectItem>
                <SelectItem value="25">25 pro Seite</SelectItem>
                <SelectItem value="50">50 pro Seite</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtern..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
          </div>
          
          {onAdd && (
            <Button 
              onClick={onAdd} 
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-1" />
              Neu
            </Button>
          )}
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey as string}>
                  {column.header}
                </TableHead>
              ))}
              {(onEdit || onDelete || onViewDetails) && (
                <TableHead className="text-right">Aktionen</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton loading state
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || onViewDetails) && (
                    <TableCell>
                      <Skeleton className="h-6 w-20 ml-auto" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <TableRow key={rowIndex} isEven={rowIndex % 2 === 0}>
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey as string}>
                      {column.cell
                        ? column.cell(row[column.accessorKey], row)
                        : String(row[column.accessorKey] || '')}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || onViewDetails) && (
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex justify-end space-x-2">
                          {onViewDetails && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onViewDetails(row)}
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    className="h-4 w-4 text-green-600"
                                  >
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                  </svg>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Details</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {onEdit && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(row)}
                                >
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bearbeiten</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          {onDelete && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDelete(row)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Löschen</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onEdit || onDelete || onViewDetails ? 1 : 0)}
                  className="h-24 text-center"
                >
                  Keine Daten gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {filteredData.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-300 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Zeige <span className="font-medium">{startIndex + 1}</span> bis{" "}
                  <span className="font-medium">
                    {Math.min(endIndex, filteredData.length)}
                  </span>{" "}
                  von <span className="font-medium">{filteredData.length}</span> Einträgen
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-l-md"
                  >
                    <span className="sr-only">Vorherige</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const page = index + 1;
                    const isActive = page === currentPage;
                    
                    // For simplicity, show only 5 page buttons
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="rounded-none"
                        >
                          {page}
                        </Button>
                      );
                    } else if (
                      (page === currentPage - 2 && currentPage > 3) ||
                      (page === currentPage + 2 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant="outline"
                          size="sm"
                          disabled
                          className="rounded-none"
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
                    className="rounded-r-md"
                  >
                    <span className="sr-only">Nächste</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
