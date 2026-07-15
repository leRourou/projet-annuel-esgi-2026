import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { getActiveAgencyId } from "@/shared/lib/active-agency";
import { TagsClient } from "./tags-client";

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return null;

  const isAdmin = membership.role === "ADMIN";
  const tags = await container.listTags.execute(membership.agencyId);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tags help you classify your content across articles, ideas and curated sources.
        </p>
      </div>

      <TagsClient initialTags={tags.map((t) => ({ id: t.id, name: t.name }))} isAdmin={isAdmin} />
    </div>
  );
}
