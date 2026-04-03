import { signOutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import Link from "next/link";
import { redirect } from "next/navigation";

const NAV_LINKS = [
  { href: "/content", label: "Content" },
  { href: "/notion", label: "Notion" },
  { href: "/rss", label: "RSS Feeds" },
  { href: "/settings/members", label: "Members" },
  { href: "/settings", label: "Settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-muted/40 flex">
      <aside className="w-60 bg-background border-r flex flex-col">
        <div className="px-6 py-5">
          <span className="text-lg font-semibold tracking-tight">ContentAI</span>
        </div>
        <Separator />
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Separator />
        <div className="px-3 py-4 space-y-1">
          <p className="text-xs text-muted-foreground px-3 mb-1 truncate">{session.user.email}</p>
          <form action={signOutAction}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="w-full justify-start text-muted-foreground"
            >
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
