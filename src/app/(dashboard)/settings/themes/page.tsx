import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { getActiveAgencyId } from "@/shared/lib/active-agency";
import { ThemesClient } from "./themes-client";

export default async function ThemesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return null;

  const isAdmin = membership.role === "ADMIN";
  const themes = await container.listThemes.execute(membership.agencyId);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Themes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Themes define the content categories your agency focuses on. They guide AI idea generation
          and help scope content for each collaborator.
        </p>
      </div>

      <ThemesClient
        initialThemes={themes.map((t) => ({ id: t.id, name: t.name }))}
        isAdmin={isAdmin}
      />
    </div>
  );
}
