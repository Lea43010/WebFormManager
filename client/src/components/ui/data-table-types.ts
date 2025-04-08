export interface Column<T> {
  accessorKey: keyof T;
  header: string;
  cell?: (value: any, row: T) => React.ReactNode;
}