'use client';

import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import {ReactNode} from "react";
import {usePathname} from "next/navigation";
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminLayout({children}: {children: ReactNode}) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/admin';

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (

        <SidebarProvider>
            <AdminGuard>
            <AdminSidebar/>
            <SidebarInset className="flex-grow overflow-hidden">
                <div className="flex min-h-screen w-full">
                    <div className="w-full flex-1">
                        <AdminHeader trigger={<SidebarTrigger />} />
                        <div className="w-full px-5 py-8 md:px-[24px]">
                            <div className="flex min-h-screen w-full flex-col gap-[32px]">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
            </AdminGuard>
        </SidebarProvider>
    )
}