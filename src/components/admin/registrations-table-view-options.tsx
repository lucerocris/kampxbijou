import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Table } from '@tanstack/react-table';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RegistrationsTableViewOptionsProps<TData> {
    table: Table<TData>;
}

export function RegistrationsTableViewOptions<TData>({
                                                         table,
                                                     }: RegistrationsTableViewOptionsProps<TData>) {
    const columnDisplayNames: Record<string, string> = {
        select: 'Select',
        name: 'Registrant',
        paymentMethod: 'Payment Method',
        paymentProofUrl: 'Payment Proof',
        verification: 'Verification',
        timestamp: 'Registered',
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="lg:ml-auto h-8 flex ml-0">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    View
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                    .getAllColumns()
                    .filter(
                        (column) =>
                            typeof column.accessorFn !== 'undefined' && column.getCanHide()
                    )
                    .map((column) => {
                        return (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => column.toggleVisibility(value)}
                            >
                                {columnDisplayNames[column.id] || column.id.replace(/_/g, ' ')}
                            </DropdownMenuCheckboxItem>
                        );
                    })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}