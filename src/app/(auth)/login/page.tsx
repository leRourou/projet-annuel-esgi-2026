import { signInWithEmail, signInWithNotion } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">ContentAI Studio</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={signInWithNotion}>
            <Button type="submit" variant="outline" className="w-full gap-2">
              <svg width="16" height="16" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
                <path d="M6 6.4C6 3.5 8.3 1 11.6 1h76.8C91.7 1 94 3.5 94 6.4V94c0 2.9-2.3 5-5.6 5H11.6C8.3 99 6 96.9 6 94V6.4zm78 6.1L73.6 19c-1.3 1-1.8 2.5-1.8 4.3v48.8c0 1.8.5 3.3 1.8 4.3l10 6.1v1.5H16.4v-1.5l10.3-6.7c1-1 1-1.3 1-2.8V27.5c0-1.3-.5-2.5-1-3.1L16.4 18v-1.5h27.2l21 46.2L83 16.5h22v2z"/>
              </svg>
              Sign in with Notion
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              await signInWithEmail(null, formData);
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" className="w-full">
                Send magic link
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
