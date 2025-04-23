import { ReactNode } from "react";
import { useScreenSize } from "@/hooks/use-mobile";

interface Column {
  key: string;
  header: ReactNode;
  cell: (item: any, index: number) => ReactNode;
  showOnMobile?: boolean;
}

interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
  keyExtractor: (item: any) => string | number;
  className?: string;
  emptyMessage?: string;
}

/**
 * Responsive Tabellen-Komponente
 * Zeigt eine Tabelle auf größeren Bildschirmen und Karten auf mobilen Geräten an
 */
export function ResponsiveTable({
  data,
  columns,
  keyExtractor,
  className = "",
  emptyMessage = "Keine Daten vorhanden"
}: ResponsiveTableProps) {
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';
  
  // Filtern der Spalten für die mobile Ansicht
  const mobileColumns = columns.filter(col => col.showOnMobile !== false);
  
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 italic">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`card-layout-for-tables ${className}`}>
      {/* Tabellen-Ansicht (Desktop/Tablet) */}
      <div className="responsive-table-container">
        <table className="responsive-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={keyExtractor(item)}>
                {columns.map((column) => (
                  <td
                    key={`${keyExtractor(item)}-${column.key}`}
                    className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600"
                  >
                    {column.cell(item, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Karten-Ansicht (Mobile) */}
      <div className="mobile-card-container">
        {data.map((item, index) => (
          <div key={keyExtractor(item)} className="mobile-card">
            {mobileColumns.map((column) => (
              <div key={`mobile-${keyExtractor(item)}-${column.key}`} className="mb-2">
                <div className="text-xs font-medium text-gray-500 mb-1">
                  {column.header}
                </div>
                <div className="text-sm text-gray-900">
                  {column.cell(item, index)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResponsiveTable;