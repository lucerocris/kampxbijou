import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Trash2,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  CreditCard,
} from 'lucide-react';

// Extend TableMeta to include our custom callbacks
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData> {
    onDelete?: (id: string) => void;
    onAccept?: (id: string) => void;
    onReject?: (id: string) => void;
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

export interface Registration {
  id: string;
  name: string;
  email: string;
  socialAccount?: string;
  paymentMethod: string;
  paymentProofUrl?: string;
  verification: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

const verificationConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
  },
} as const;

export const registrationColumns: ColumnDef<Registration>[] = [
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
    accessorKey: 'name',
    id: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        Registrant
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const registration = row.original;
      return (
        <div className="flex items-center gap-3 pl-3 min-w-[200px]">
          <div className="h-10 w-10 rounded-full border flex items-center justify-center bg-muted flex-shrink-0">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium leading-tight truncate">
              {registration.name}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{registration.email}</span>
            </div>
          </div>
        </div>
      );
    },
    sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
    filterFn: (row, id, value) => {
      const name = (row.getValue(id) as string) ?? '';
      const email = row.original.email ?? '';
      const social = row.original.socialAccount ?? '';
      const q = (value as string)?.toLowerCase() ?? '';
      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        social.toLowerCase().includes(q)
      );
    },
  },
  {
    accessorKey: 'socialAccount',
    id: 'socialAccount',
    header: 'Social',
    cell: ({ row }) => {
      const value = (row.getValue('socialAccount') as string | undefined) ?? '';
      if (!value) return <span className="pl-3 text-sm text-muted-foreground">—</span>;
      return <span className="pl-3 text-sm truncate max-w-[220px] block">{value}</span>;
    },
    enableSorting: false,
  },
  {
    accessorKey: 'paymentMethod',
    id: 'paymentMethod',
    header: 'Payment Method',
    cell: ({ row }) => {
      const method = row.getValue('paymentMethod') as string;
      return (
        <div className="flex items-center gap-2 pl-3">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">{method}</span>
        </div>
      );
    },
    enableSorting: false,
    filterFn: (row, id, value) => {
      const method = (row.getValue(id) as string) ?? '';
      const selected = value as string[];
      return selected.length === 0 || selected.includes(method);
    },
  },
  {
    accessorKey: 'paymentProofUrl',
    id: 'paymentProofUrl',
    header: 'Payment Proof',
    cell: ({ row }) => {
      const proofUrl = row.getValue('paymentProofUrl') as string | undefined;

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
          onClick={() => window.open(proofUrl, '_blank')}
        >
          <Eye className="mr-2 h-3.5 w-3.5" />
          View
        </Button>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'verification',
    id: 'verification',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        Verification
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const verification = row.getValue('verification') as keyof typeof verificationConfig;
      const cfg = verificationConfig[verification];
      const Icon = cfg.icon;

      return (
        <div className="pl-3">
          <Badge
            variant="secondary"
            className={cn(
              'font-medium flex items-center gap-1 border',
              verification === 'pending' &&
                'bg-amber-100 text-amber-800 border-amber-300',
              verification === 'accepted' &&
                'bg-green-100 text-green-800 border-green-300',
              verification === 'rejected' &&
                'bg-red-100 text-red-800 border-red-300'
            )}
          >
            <Icon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        </div>
      );
    },
    sortingFn: (a, b) => {
      const order = { pending: 0, accepted: 1, rejected: 2 };
      return (
        order[a.getValue('verification') as keyof typeof order] -
        order[b.getValue('verification') as keyof typeof order]
      );
    },
    filterFn: (row, id, value) => {
      const v = row.getValue(id) as string;
      const selected = value as string[];
      return selected.length === 0 || selected.includes(v);
    },
  },
  {
    accessorKey: 'timestamp',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        Registered
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const value = row.getValue('timestamp') as
        | { seconds: number; nanoseconds: number }
        | string
        | undefined;

      if (!value) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }

      const date =
        typeof value === 'string'
          ? new Date(value)
          : new Date(value.seconds * 1000 + value.nanoseconds / 1_000_000);

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
      const toMs = (val: unknown) => {
        if (!val) return 0;
        if (typeof val === 'string') return new Date(val).getTime();
        const ts = val as { seconds: number; nanoseconds: number };
        return ts.seconds * 1000 + ts.nanoseconds / 1_000_000;
      };
      return toMs(a.getValue('timestamp')) - toMs(b.getValue('timestamp'));
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const registration = row.original;
      const onDelete = table.options.meta?.onDelete as
        | ((id: string) => void)
        | undefined;
      const onAccept = table.options.meta?.onAccept as
        | ((id: string) => void)
        | undefined;
      const onReject = table.options.meta?.onReject as
        | ((id: string) => void)
        | undefined;

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
              {registration.verification === 'pending' && (
                <>
                  <DropdownMenuItem
                    className="text-green-600"
                    onClick={() => onAccept?.(registration.id)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Accept
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onReject?.(registration.id)}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete?.(registration.id)}
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
