import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { signIn } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await auth();
  const hasNotion = !!(session as typeof session & { notionAccessToken?: string })
    ?.notionAccessToken;

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
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notion</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasNotion ? "Connected" : "Not connected"}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
