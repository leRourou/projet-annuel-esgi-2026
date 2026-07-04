import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth, signIn } from "@/lib/auth";
import type { AgencyContextDto } from "@/modules/agency/application/dto/agency-context.dto";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { AgencyContextForm } from "@/shared/ui/agency-context-form";
import { NotionConfigPanel } from "@/shared/ui/notion-config-panel";

export default async function SettingsPage() {
  const session = await auth();

  let hasNotion = false;
  let notionDatabaseId: string | null = null;
  let agencyContext: AgencyContextDto | null = null;

  if (session?.user?.id) {
    const container = await buildContainer();
    const membership = await container.getUserMembership.execute(session.user.id);
    if (membership && !membership.isPending) {
      const [agency, context] = await Promise.all([
        container.getAgency.execute({ agencyId: membership.agencyId }),
        container.getAgencyContext.execute(membership.agencyId),
      ]);
      if (agency.success) {
        hasNotion = agency.value.notionConnected;
        notionDatabaseId = agency.value.notionDatabaseId ?? null;
      }
      agencyContext = context;
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">Settings</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Email</span>
              <span>{session?.user?.email}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Name</span>
              <span>{session?.user?.name ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notion</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasNotion
                    ? notionDatabaseId
                      ? "Connected · database configured"
                      : "Connected · no database selected"
                    : "Not connected"}
                </p>
              </div>
              {!hasNotion ? (
                <form
                  action={async () => {
                    "use server";
                    await signIn("notion", { redirectTo: "/settings" });
                  }}
                >
                  <Button type="submit" size="sm">
                    Connect Notion
                  </Button>
                </form>
              ) : (
                <Badge variant="success">Active</Badge>
              )}
            </div>
            <NotionConfigPanel hasNotion={hasNotion} initialDatabaseId={notionDatabaseId} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agency Context</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              This context is automatically injected into every AI generation prompt to make content
              relevant to your agency's business.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgencyContextForm initial={agencyContext} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
