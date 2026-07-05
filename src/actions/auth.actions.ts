"use server";

import { auth, signIn, signOut } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { z } from "zod";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

const SignInInputSchema = z.object({
  email: z.string().email(),
});

export async function signInWithEmail(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const raw = Object.fromEntries(formData);
  const parsed = SignInInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.email?.[0] ?? "Invalid email" };
  }

  try {
    await signIn("resend", { email: parsed.data.email, redirectTo: "/content" });
    return {};
  } catch {
    return { error: "Failed to send magic link. Please try again." };
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

export async function signInWithNotion(): Promise<void> {
  await signIn("notion", { redirectTo: "/content" });
}

export async function signInWithNotionForOnboarding(): Promise<void> {
  await signIn("notion", { redirectTo: "/onboarding?step=notion" });
}

const CreateUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export async function createUserAction(
  input: unknown,
): Promise<{ error?: string; userId?: string }> {
  const parsed = CreateUserInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const container = await buildContainer();
  const result = await container.createUser.execute(parsed.data);
  if (!result.success) {
    return { error: result.error.message };
  }
  return { userId: result.value.id };
}

export async function completeOnboardingAction(): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const container = await buildContainer();
  const result = await container.completeOnboarding.execute(session.user.id);
  if (!result.success) return { error: result.error.message };
  return { data: undefined };
}
