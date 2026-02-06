import type { ReactNode } from 'react';

interface AdminTextHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
}

const AdminTextHeader = ({ title, subtitle }: AdminTextHeaderProps) => {
  return (
    <div>
      <div className="flex gap-2 items-center">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>

      {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
};

export default AdminTextHeader;
