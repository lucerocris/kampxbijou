import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData> {
    onDelete?: (id: string) => void;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    onCheckIn?: (id: string) => void;
  }
}
