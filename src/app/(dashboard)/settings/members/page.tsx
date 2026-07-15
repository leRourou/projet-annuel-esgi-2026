import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { getActiveAgencyId } from "@/shared/lib/active-agency";
import { redirect } from "next/navigation";
import { MembersClient } from "./members-client";

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) redirect("/onboarding");

  const [agency, members] = await Promise.all([
    container.getAgency.execute({ agencyId: membership.agencyId }),
    container.listMembers.execute({ agencyId: membership.agencyId }),
  ]);

  if (!agency.success) redirect("/onboarding");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Membres de l&apos;équipe</h1>
        <p className="text-muted-foreground mt-1">{agency.value.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membres ({agency.value.memberCount})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="text-sm">
                <p className="font-medium">{m.userName ?? m.userEmail ?? m.userId}</p>
                {m.userName && m.userEmail && (
                  <p className="text-xs text-muted-foreground">{m.userEmail}</p>
                )}
                {m.isPending && (
                  <p className="text-xs text-muted-foreground mt-0.5">Invitation en attente</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <RoleBadge role={m.role} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {membership.role === "ADMIN" && (
        <>
          <Separator />
          <MembersClient actorRole={membership.role} />
        </>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    ADMIN: "default",
    MEMBER: "secondary",
    VIEWER: "outline",
  };
  const labels: Record<string, string> = {
    ADMIN: "Administrateur",
    MEMBER: "Membre",
    VIEWER: "Lecteur",
  };
  return <Badge variant={variants[role] ?? "outline"}>{labels[role] ?? role}</Badge>;
}
