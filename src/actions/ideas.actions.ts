"use server";

import { auth } from "@/lib/auth";
import type { ContentIdea } from "@/modules/content/domain/ports/ai-generator.port";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { getActiveAgencyId } from "@/shared/lib/active-agency";
import { translateError } from "@/shared/lib/translate-error";
import { z } from "zod";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

const GenerateIdeasSchema = z.object({
  themes: z.array(z.string().min(1)).min(1, "Sélectionnez au moins une thématique."),
  count: z.number().int().min(3).max(20).optional(),
});

export async function generateIdeasAction(input: unknown): Promise<ActionResult<ContentIdea[]>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const parsed = GenerateIdeasSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Saisie invalide." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };

  const agencyContext = await container.getAgencyContext.execute(membership.agencyId);
  const agencyContextString = agencyContext
    ? [
        `Industry/Sector: ${agencyContext.sector}`,
        `Target Audience: ${agencyContext.targetAudience}`,
        `Tone of Voice: ${agencyContext.toneOfVoice}`,
        agencyContext.brandKeywords.length > 0
          ? `Brand Keywords: ${agencyContext.brandKeywords.join(", ")}`
          : null,
        agencyContext.additionalContext
          ? `Additional Context: ${agencyContext.additionalContext}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : undefined;

  const result = await container.generateIdeas.execute({
    agencyId: membership.agencyId,
    themes: parsed.data.themes,
    agencyContext: agencyContextString,
    count: parsed.data.count,
  });
  if (!result.success) return { error: translateError(result.error) };
  return { data: result.value };
}
