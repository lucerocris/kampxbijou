import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Trash2,
  User,
  DollarSign,
  Package,
  Smartphone,
  MessageSquare,
  CheckCircle,
  Clock,
} from 'lucide-react';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData> {
    onDelete?: (id: string) => void;
    onViewProof?: (url: string) => void;
    onVerify?: (id: string) => void;
  }
}

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface Donor {
  id: string;
  donorName: string;
  donationType: 'cash' | 'goods' | 'online';
  amount?: number;
  goodsCategory?: string;
  quantity?: number;
  notes?: string;
  message?: string;
  gcashProofUrl?: string;
  createdAt: string;
  registeredBy: string;
  source: 'onsite' | 'online';
  verified?: 'pending' | 'verified';
  verifiedAt?: string;
}

export const donorColumns: ColumnDef<Donor>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 32,
  },
  {
    accessorKey: 'donorName',
    id: 'donorName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        Donor
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const donor = row.original;
      return (
        <div className="flex items-center gap-3 pl-3 min-w-[180px]">
          <div className="h-10 w-10 rounded-full border flex items-center justify-center bg-muted flex-shrink-0">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium leading-tight truncate">
              {donor.donorName}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="capitalize">{donor.source}</span>
            </div>
          </div>
        </div>
      );
    },
    sortingFn: (a, b) =>
      a.original.donorName.localeCompare(b.original.donorName),
    filterFn: (row, id, value) => {
      const name = (row.getValue(id) as string) ?? '';
      const q = (value as string)?.toLowerCase() ?? '';
      return name.toLowerCase().includes(q);
    },
  },
  {
    accessorKey: 'donationType',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        Type
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const donationType = row.getValue('donationType') as string;

      return (
        <div className="pl-3">
          <Badge
            variant="secondary"
            className={cn(
              'font-medium flex items-center gap-1 border',
              donationType === 'cash' &&
                'bg-green-100 text-green-800 border-green-300',
              donationType === 'goods' &&
                'bg-purple-100 text-purple-800 border-purple-300',
              donationType === 'online' &&
                'bg-blue-100 text-blue-800 border-blue-300'
            )}
          >
            {donationType === 'cash' && <DollarSign className="h-3 w-3" />}
            {donationType === 'goods' && <Package className="h-3 w-3" />}
            {donationType === 'online' && <Smartphone className="h-3 w-3" />}
            <span className="capitalize">{donationType}</span>
          </Badge>
        </div>
      );
    },
    sortingFn: (a, b) => {
      const aType = a.getValue('donationType') as string;
      const bType = b.getValue('donationType') as string;
      return aType.localeCompare(bType);
    },
    filterFn: (row, id, value) => {
      const type = row.getValue(id) as string;
      const selected = value as string[];
      return selected.length === 0 || selected.includes(type);
    },
  },
  {
    accessorKey: 'amount',
    id: 'details',
    header: 'Details',
    cell: ({ row }) => {
      const donor = row.original;

      if (donor.donationType === 'cash' || donor.donationType === 'online') {
        return (
          <div className="pl-3">
            <span className="font-semibold text-green-700">
              ₱{donor.amount?.toLocaleString() || '0'}
            </span>
          </div>
        );
      }

      if (donor.donationType === 'goods') {
        return (
          <div className="pl-3">
            <div className="text-sm">
              <span className="font-medium">{donor.quantity}x</span>{' '}
              <span className="capitalize">{donor.goodsCategory}</span>
            </div>
          </div>
        );
      }

      return <span className="text-muted-foreground pl-3">—</span>;
    },
    enableSorting: true,
    sortingFn: (a, b) => {
      const aAmount = a.original.amount || 0;
      const bAmount = b.original.amount || 0;
      return aAmount - bAmount;
    },
  },
  {
    accessorKey: 'notes',
    id: 'message',
    header: 'Message/Notes',
    cell: ({ row }) => {
      const donor = row.original;
      const message = donor.message || donor.notes;

      if (!message) {
        return (
          <span className="text-muted-foreground text-sm italic pl-3">
            No message
          </span>
        );
      }

      return (
        <div className="pl-3 max-w-[200px]">
          <div className="flex items-start gap-1 text-sm">
            <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="line-clamp-2">{message}</span>
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'gcashProofUrl',
    id: 'proof',
    header: 'Proof',
    cell: ({ row, table }) => {
      const donor = row.original;
      const proofUrl = donor.gcashProofUrl;
      const onViewProof = table.options.meta?.onViewProof;

      if (!proofUrl) {
        return (
          <div className="flex items-center gap-2 pl-3 text-muted-foreground">
            <span className="text-sm italic">No proof</span>
          </div>
        );
      }

      return (
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => onViewProof?.(proofUrl)}
        >
          <Eye className="mr-2 h-3.5 w-3.5" />
          View
        </Button>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'verified',
    id: 'status',
    header: 'Status',
    cell: ({ row, table }) => {
      const donor = row.original;
      const onVerify = table.options.meta?.onVerify;
      const verified = donor.verified || 'verified';

      if (donor.donationType !== 'online') {
        return (
          <div className="flex items-center gap-2 pl-3">
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 border-green-300 border"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              N/A
            </Badge>
          </div>
        );
      }

      if (verified === 'verified') {
        return (
          <div className="flex items-center gap-2 pl-3">
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 border-green-300 border"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2 pl-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-orange-300 bg-orange-50 hover:bg-orange-100"
            onClick={() => onVerify?.(donor.id)}
          >
            <Clock className="mr-2 h-3.5 w-3.5 text-orange-600" />
            <span className="text-orange-600">Verify</span>
          </Button>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const verified = row.original.verified || 'verified';
      const selected = value as string[];
      return selected.length === 0 || selected.includes(verified);
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const dateString = row.getValue('createdAt') as string;

      if (!dateString) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }

      const date = new Date(dateString);

      return (
        <div className="pl-3 flex flex-col">
          <span className="text-sm">{date.toLocaleDateString()}</span>
          <span className="text-xs text-muted-foreground">
            {date.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      );
    },
    sortingFn: (a, b) => {
      const aDate = new Date(a.getValue('createdAt') as string).getTime();
      const bDate = new Date(b.getValue('createdAt') as string).getTime();
      return aDate - bDate;
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const donor = row.original;
      const onDelete = table.options.meta?.onDelete;

      return (
        <div className="flex items-center gap-1 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete?.(donor.id)}
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-600" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
