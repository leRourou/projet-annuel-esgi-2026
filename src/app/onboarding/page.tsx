"use client";

import { createAgencyAction } from "@/actions/agency.actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

type State = { error?: string };

export default function OnboardingPage() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const name = formData.get("name") as string;
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const result = await createAgencyAction({ name, slug });
      if (result.error) return { error: result.error };
      router.push("/content");
      return {};
    },
    {},
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to ContentAI</h1>
          <p className="text-muted-foreground mt-2">Create your agency to get started.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create your agency</CardTitle>
            <CardDescription>
              You can invite collaborators after setting up your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {state.error && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Agency name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Acme Marketing Agency"
                  minLength={2}
                />
              </div>

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Creating…" : "Create agency"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
