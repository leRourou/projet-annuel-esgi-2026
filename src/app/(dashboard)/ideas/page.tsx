import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { getActiveAgencyId } from "@/shared/lib/active-agency";
import { IdeasClient } from "./ideas-client";

export default async function IdeasPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return null;

  const themes = await container.listThemes.execute(membership.agencyId);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Ideas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate content ideas tailored to your agency themes. Select the themes you want to
          explore and let AI suggest unique angles.
        </p>
      </div>

      <IdeasClient themes={themes.map((t) => ({ id: t.id, name: t.name }))} />
    </div>
  );
}
