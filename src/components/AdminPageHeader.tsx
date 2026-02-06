import type { ReactNode } from 'react';
import AdminTextHeader from "@/components/AdminTextHeader";

interface AdminPageHeaderProps {
    title: string;
    subtitle: string;
    actions?: ReactNode;
}

const  AdminPageHeader = ({
                              title,
                              subtitle,
                              actions,
                          }: AdminPageHeaderProps) => {
    return (
        <div className="flex items-center justify-between">
            <AdminTextHeader title={title} subtitle={subtitle} />
            {actions ? <div className="flex gap-3">{actions}</div> : null}
        </div>
    );
};

export default AdminPageHeader;