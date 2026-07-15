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
        <h1 className="text-2xl font-semibold tracking-tight">Thématiques</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Les thématiques définissent les catégories de contenu sur lesquelles se concentre votre
          agence. Elles guident la génération d&apos;idées par l&apos;IA et aident à cadrer le
          contenu pour chaque collaborateur.
        </p>
      </div>

      <ThemesClient
        initialThemes={themes.map((t) => ({ id: t.id, name: t.name }))}
        isAdmin={isAdmin}
      />
    </div>
  );
}
