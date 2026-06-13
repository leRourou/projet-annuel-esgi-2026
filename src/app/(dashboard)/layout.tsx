import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { AppSidebar } from "@/shared/ui/app-sidebar";
import { Search } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) {
    redirect("/onboarding");
  }

  return (
    <SidebarProvider>
      <AppSidebar userEmail={session.user.email ?? ""} />
      <SidebarInset>
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <SidebarTrigger />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Rechercher..." className="pl-9 w-full" />
          </div>
        </header>
        <div className="p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
