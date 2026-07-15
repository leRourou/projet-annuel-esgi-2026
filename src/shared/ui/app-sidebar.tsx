"use client";

import { signOutAction } from "@/actions/auth.actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Rss,
  Settings,
  Star,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AgencySwitcher } from "./agency-switcher";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/rss", label: "RSS feeds", icon: Rss },
  { href: "/rss/curated", label: "Curation", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  userEmail: string;
  currentAgencyId?: string;
  agencies?: { agencyId: string; agencyName: string }[];
}

export function AppSidebar({ userEmail, currentAgencyId, agencies }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-2 space-y-2">
          <span className="text-lg font-semibold tracking-tight">ContentAI</span>
          {currentAgencyId && agencies && (
            <AgencySwitcher currentAgencyId={currentAgencyId} agencies={agencies} />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="text-xs text-muted-foreground px-2 truncate">{userEmail}</p>
        <form action={signOutAction}>
          <SidebarMenuButton type="submit" className="w-full">
            <LogOut />
            <span>Sign out</span>
          </SidebarMenuButton>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
