import { acceptInviteAction } from "@/actions/agency.actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/invite/${token}`);

  const result = await acceptInviteAction(token);

  if (!result.error) {
    redirect("/content");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Join agency</CardTitle>
            <CardDescription>You have been invited to collaborate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full" onClick={() => redirect("/content")}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
