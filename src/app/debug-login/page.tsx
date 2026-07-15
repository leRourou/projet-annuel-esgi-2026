import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

async function debugSignIn(callbackUrl: string) {
  "use server";
  await signIn("debug", { redirectTo: callbackUrl });
}

export default async function DebugLoginPage(props: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") {
    redirect("/login");
  }

  const { callbackUrl } = await props.searchParams;
  const target = callbackUrl ?? "/content";

  return (
    <form action={debugSignIn.bind(null, target)}>
      <button type="submit">Debug sign in</button>
    </form>
  );
}
