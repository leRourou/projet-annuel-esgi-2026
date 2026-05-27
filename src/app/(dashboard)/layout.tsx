import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { AppSidebar } from "@/shared/ui/app-sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout(
  { children }: { children: React.ReactNode },
) {
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
        <div className="p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
