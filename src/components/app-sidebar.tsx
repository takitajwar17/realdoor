"use client";

import * as React from "react";
import DashboardLogo from "@/components/dashboard-logo";
import {
  BookOpenCheckIcon,
  CircleUserRoundIcon,
  DatabaseIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  SettingsIcon,
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
import { useParams } from "next/navigation";

const defaultUser = {
  name: "User",
  email: "",
  avatar: "",
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: { name: string; email: string; avatar: string };
}) {
  const { setOpenMobile } = useSidebar();
  const params = useParams<{ appId?: string }>();
  const sessionId =
    typeof params.appId === "string" && params.appId.startsWith("rds_") ? params.appId : null;
  const base = sessionId ? `/dashboard/${sessionId}` : null;

  const navMain = [
    { title: "Sessions", url: "/dashboard", icon: LayoutDashboardIcon },
    ...(base
      ? [
          { title: "Profile", url: `${base}/profile`, icon: CircleUserRoundIcon },
          { title: "Understand", url: `${base}/understand`, icon: BookOpenCheckIcon },
          { title: "Prepare", url: `${base}/prepare`, icon: ListChecksIcon },
          { title: "Evidence trail", url: `${base}/evidence`, icon: HistoryIcon },
        ]
      : []),
  ];

  const secondaryItems: {
    title: string;
    url: string;
    icon: typeof SettingsIcon;
    badge?: number | string | null;
  }[] = [
    { title: "Data we use", url: "/dashboard/data-we-use", icon: DatabaseIcon },
    { title: "Settings", url: "/settings", icon: SettingsIcon },
  ];

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
        <NavMain
          items={navMain}
          label="This session"
          action={{ title: "New practice session", url: "/dashboard?new=1" }}
        />
        {secondaryItems.length > 0 ? (
          <NavSecondary items={secondaryItems} className="mt-auto" />
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user || defaultUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
