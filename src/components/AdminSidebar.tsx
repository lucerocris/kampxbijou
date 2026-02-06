'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { LogOut, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminSidebar() {
  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    window.location.href = '/admin';
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarHeader>
          <div className="flex items-center gap-2 py-2">
            {/* Icon stays visible in collapsed state */}
            <div className="flex size-8 items-center justify-center">
              <Image
                src="/pocketConcertsLogo.jpg"
                alt="Logo"
                width={20}
                height={20}
                className="h-5 w-auto"
              />
            </div>

            {/* This section hides in collapsed icon mode */}
            <div className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
              <span className="truncate text-xs font-semibold">
                Pocket Concerts
              </span>
              <span className="text-sidebar-foreground/70 truncate text-xs">
                Registration System
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/registrations">
                    <Users size={16} />
                    <span>Registrations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-3 text-sm text-red-600 hover:text-red-700 w-full"
        >
          <LogOut size={16} />
          <span className="group-data-[collapsible=icon]:hidden">Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
