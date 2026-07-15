import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { getActiveAgencyId } from "@/shared/lib/active-agency";
import { AppSidebar } from "@/shared/ui/app-sidebar";
import { Search } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) {
    redirect("/onboarding");
  }

  const userResult = await container.getUserById.execute(session.user.id);
  if (userResult.success && !userResult.value.onboardingCompleted) {
    redirect("/onboarding");
  }

  const agencies = await container.listUserAgencies.execute(session.user.id);

  return (
    <SidebarProvider>
      <AppSidebar
        userEmail={session.user.email ?? ""}
        currentAgencyId={membership.agencyId}
        agencies={agencies}
      />
      <SidebarInset>
        <header className="flex items-center gap-3 border-b px-3 py-3 sm:px-4">
          <SidebarTrigger />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Rechercher..." className="pl-9 w-full" />
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
