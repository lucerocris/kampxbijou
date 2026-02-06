import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';

import { RegistrationsTableViewOptions } from './registrations-table-view-options';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
import { DataTablePagination } from '@/components/data-table-pagination';
import type { Registration } from './registration-columns';

interface RegistrationsDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onDelete: (id: string) => void;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function RegistrationsDataTable<TData extends Registration, TValue>({
  columns,
  data,
  onDelete,
  onAccept,
  onReject,
}: RegistrationsDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    meta: { onDelete, onAccept, onReject },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col md:flex-row flex-1 items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn('name')?.setFilterValue(event.target.value)
              }
              className="h-8 w-full md:w-[200px] lg:w-[300px] pl-8"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasSelectedRows && (
            <Button variant="outline" size="sm" className="h-8">
              <Download className="mr-2 h-4 w-4" />
              Export ({selectedRows.length})
            </Button>
          )}
          <RegistrationsTableViewOptions table={table} />
        </div>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-muted-foreground">No registrations found.</div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
