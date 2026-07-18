"use client"

import { PlusCircleIcon } from "lucide-react"
import Link from "next/link"
import type { Route } from "next"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  label,
  action,
}: {
  items: {
    title: string
    url: string
    icon?: React.ElementType
    badge?: number | null
  }[]
  label?: string
  action?: {
    title: string
    url: string
    tooltip?: string
  }
}) {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const primaryAction = action ?? {
    title: "New client file",
    url: "/dashboard/applications/new",
    tooltip: "New client file",
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={primaryAction.tooltip ?? primaryAction.title}
              className="min-w-8 rounded-full border border-[var(--sidebar-action-border)] bg-[var(--sidebar-action)] text-[var(--sidebar-action-foreground)] duration-200 ease-linear hover:bg-[var(--sidebar-action-hover)] hover:text-[var(--sidebar-action-foreground)] active:bg-[var(--sidebar-action-active)]"
            >
              <Link href={primaryAction.url as Route} onClick={() => setOpenMobile(false)}>
                <PlusCircleIcon />
                <span>{primaryAction.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={
                  item.url === "/dashboard"
                    ? pathname === item.url
                    : pathname === item.url || pathname.startsWith(`${item.url}/`)
                }
              >
                <Link href={item.url as Route} onClick={() => setOpenMobile(false)}>
                  {item.icon ? <item.icon /> : null}
                  <span>{item.title}</span>
                  {item.badge ? (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-2xs font-medium text-primary-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
