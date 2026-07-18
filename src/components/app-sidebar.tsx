"use client";

import * as React from "react";
import DashboardLogo from "@/components/dashboard-logo";
import {
  BriefcaseBusinessIcon,
  CircleAlertIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  LineChartIcon,
  ShieldIcon,
  ActivityIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import type { Route } from "next";
import { AGENCY_NAV_ITEMS } from "@/lib/agency-workflow";

const defaultUser = {
  name: "User",
  email: "",
  avatar: "",
};

export function AppSidebar({
  user,
  isAdmin = false,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: { name: string; email: string; avatar: string };
  isAdmin?: boolean;
}) {
  const { setOpenMobile } = useSidebar();

  const iconByTitle = {
    Dashboard: LayoutDashboardIcon,
    Applications: BriefcaseBusinessIcon,
    Issues: CircleAlertIcon,
    Clients: UsersIcon,
    Documents: LibraryBigIcon,
    Team: ShieldIcon,
    Reports: LineChartIcon,
    Settings: SettingsIcon,
  } as const;

  const navMain = AGENCY_NAV_ITEMS.map((item) => ({
    ...item,
    icon: iconByTitle[item.title] ?? FileTextIcon,
  }));

  const secondaryItems: {
    title: string;
    url: string;
    icon: typeof ShieldIcon;
    badge?: number | string | null;
  }[] = [];

  if (isAdmin) {
    secondaryItems.unshift(
      {
        title: "Admin",
        url: "/admin",
        icon: ShieldIcon,
      },
    );
    secondaryItems.push({
      title: "System Status",
      url: "/admin/status",
      icon: ActivityIcon,
    });
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="pb-1">
        <SidebarMenu>
          <SidebarMenuItem className="mt-1">
            <Link
              href={"/" as Route}
              onClick={() => setOpenMobile(false)}
              className="w-full flex justify-start rounded-lg px-2.5 py-2 hover:bg-sidebar-primary/12 transition-colors"
            >
              <DashboardLogo className="w-[96px] h-auto" />
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-1.5">
        <NavMain items={navMain} />
        {secondaryItems.length > 0 ? <NavSecondary items={secondaryItems} className="mt-auto" /> : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user || defaultUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
