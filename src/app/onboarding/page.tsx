"use client";

import { createAgencyAction, getAgencyAction } from "@/actions/agency.actions";
import { completeOnboardingAction, signInWithNotionForOnboarding } from "@/actions/auth.actions";
import { createThemeAction } from "@/actions/theme.actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";

type Step = "agency" | "themes" | "notion";
const STEP_ORDER: Step[] = ["agency", "themes", "notion"];
const STEP_LABELS: Record<Step, string> = {
  agency: "Agency",
  themes: "Themes",
  notion: "Notion",
};

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEP_ORDER.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEP_ORDER.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={[
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
              i < currentIndex
                ? "bg-foreground text-background"
                : i === currentIndex
                  ? "border-2 border-foreground text-foreground"
                  : "border border-muted-foreground/30 text-muted-foreground",
            ].join(" ")}
          >
            {i + 1}
          </div>
          <span
            className={i === currentIndex ? "text-sm font-medium" : "text-sm text-muted-foreground"}
          >
            {STEP_LABELS[step]}
          </span>
          {i < STEP_ORDER.length - 1 && <div className="w-8 h-px bg-border ml-1" />}
        </div>
      ))}
    </div>
  );
}

function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("agency");
  const [checkingState, setCheckingState] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [themes, setThemes] = useState<{ id: string; name: string }[]>([]);
  const [newTheme, setNewTheme] = useState("");
  const [notionConnected, setNotionConnected] = useState(false);

  useEffect(() => {
    const stepParam = searchParams.get("step");
    getAgencyAction().then((result) => {
      if (result.data) {
        setNotionConnected(result.data.notionConnected);
        setStep(stepParam === "notion" ? "notion" : "themes");
      } else {
        setStep("agency");
      }
      setCheckingState(false);
    });
  }, [searchParams]);

  function handleCreateAgency(formData: FormData) {
    setError(null);
    const name = (formData.get("name") as string) ?? "";
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    startTransition(async () => {
      const result = await createAgencyAction({ name, slug });
      if (result.error) {
        setError(result.error);
        return;
      }
      setStep("themes");
    });
  }

  function handleAddTheme() {
    const name = newTheme.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const result = await createThemeAction({ name });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) setThemes((prev) => [...prev, result.data]);
      setNewTheme("");
    });
  }

  function handleFinish() {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboardingAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/content");
      router.refresh();
    });
  }

  if (checkingState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to ContentAI</h1>
          <p className="text-muted-foreground mt-2">Let's get your workspace ready.</p>
        </div>

        <StepIndicator current={step} />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "agency" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create your agency</CardTitle>
              <CardDescription>
                You can invite collaborators after setting up your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleCreateAgency} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agency name *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Acme Marketing Agency"
                    minLength={2}
                    disabled={isPending}
                  />
                </div>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Creating…" : "Create agency"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "themes" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add your first themes</CardTitle>
              <CardDescription>
                Themes guide the AI when generating content ideas. You can add more later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {themes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <Badge key={theme.id} variant="secondary">
                      {theme.name}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  placeholder="e.g. Sustainable fashion"
                  disabled={isPending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTheme();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddTheme}
                  disabled={isPending || !newTheme.trim()}
                >
                  Add
                </Button>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep("notion")}
                  disabled={isPending}
                >
                  Skip
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => setStep("notion")}
                  disabled={isPending}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "notion" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connect Notion</CardTitle>
              <CardDescription>
                Export your content to Notion and sync your curation database. Optional — you can
                connect it later in Settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notionConnected ? (
                <Badge variant="success">Notion connected</Badge>
              ) : (
                <form action={signInWithNotionForOnboarding}>
                  <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
                    Connect Notion
                  </Button>
                </form>
              )}
              <div className="flex gap-2 pt-2">
                {!notionConnected && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={handleFinish}
                    disabled={isPending}
                  >
                    Skip
                  </Button>
                )}
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleFinish}
                  disabled={isPending}
                >
                  {isPending ? "Finishing…" : "Finish setup"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingWizard />
    </Suspense>
  );
}
