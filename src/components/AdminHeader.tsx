import type { ReactNode } from 'react';

interface AdminHeaderProps {
    trigger: ReactNode;
}

const AdminHeader = ({ trigger }: AdminHeaderProps) => {
    return (
        <div className="sticky top-0 z-50 flex justify-center items-center h-[75px] w-full p-5 border-b bg-white">
            <div className="flex justify-between items-center w-full">
                <div className="flex gap-3">{trigger}</div>
            </div>
        </div>
    );
};

export default AdminHeader;