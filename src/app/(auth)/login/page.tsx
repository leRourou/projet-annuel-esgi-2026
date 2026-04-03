import { signInWithEmail } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">ContentAI Studio</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
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
