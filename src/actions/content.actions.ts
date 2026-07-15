"use server";

import { getAgencyNotionToken } from "@/actions/notion.actions";
import { auth } from "@/lib/auth";
import { CreateArticleInputSchema } from "@/modules/content/application/commands/create-article.command";
import { RegenerateSectionInputSchema } from "@/modules/content/application/commands/regenerate-section.command";
import { RescheduleArticleInputSchema } from "@/modules/content/application/commands/reschedule-article.command";
import { UpdateArticleInputSchema } from "@/modules/content/application/commands/update-article.command";
import type { ArticleDto } from "@/modules/content/application/dto/article.dto";
import { GenerateArticleInputSchema } from "@/modules/content/application/dto/generate-article.dto";
import type { ExportedArticleDto } from "@/modules/content/application/queries/export-article.query";
import { ListArticlesInputSchema } from "@/modules/content/application/queries/list-articles.query";
import { EXPORT_FORMATS } from "@/modules/content/domain/value-objects/export-format.vo";
import type { PaginatedResult } from "@/shared/domain/types/pagination.type";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { getActiveAgencyId } from "@/shared/lib/active-agency";
import { z } from "zod";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

async function requireSession(): Promise<{ user: { id: string } } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session as { user: { id: string } };
}

export async function generateArticleAction(input: unknown): Promise<ActionResult<ArticleDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  if (!membership.role || membership.role === "VIEWER")
    return { error: "Insufficient permissions" };

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

  const inputWithContext = {
    ...(input as object),
    context: agencyContextString,
  };

  const parsed = GenerateArticleInputSchema.safeParse({
    ...inputWithContext,
    authorId: session.user.id,
    agencyId: membership.agencyId,
  });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(fieldErrors).flat()[0] ?? "Invalid input" };
  }

  const result = await container.generateArticle.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function updateArticleAction(input: unknown): Promise<ActionResult<ArticleDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };
  if (membership.role === "VIEWER") return { error: "Insufficient permissions" };

  const parsed = UpdateArticleInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const article = await container.getArticle.execute(parsed.data.id);
  if (!article.success) return { error: article.error.message };
  if (article.value.agencyId !== membership.agencyId) return { error: "Forbidden" };

  const result = await container.updateArticle.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function publishArticleAction(articleId: string): Promise<ActionResult<ArticleDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };
  if (membership.role === "VIEWER") return { error: "Insufficient permissions" };

  const article = await container.getArticle.execute(articleId);
  if (!article.success) return { error: article.error.message };
  if (article.value.agencyId !== membership.agencyId) return { error: "Forbidden" };

  const result = await container.publishArticle.execute(articleId);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function listArticlesAction(
  input: unknown,
): Promise<ActionResult<PaginatedResult<ArticleDto>>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const parsed = ListArticlesInputSchema.safeParse({
    ...(input as object),
    agencyId: membership.agencyId,
  });
  if (!parsed.success) return { error: "Invalid input" };

  const result = await container.listArticles.execute(parsed.data);
  return { data: result };
}

export async function getArticleAction(id: string): Promise<ActionResult<ArticleDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const result = await container.getArticle.execute(id);
  if (!result.success) return { error: result.error.message };
  if (result.value.agencyId !== membership.agencyId) return { error: "Forbidden" };
  return { data: result.value };
}

export async function regenerateSectionAction(input: unknown): Promise<ActionResult<string>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };
  if (membership.role === "VIEWER") return { error: "Insufficient permissions" };

  const agencyContext = await container.getAgencyContext.execute(membership.agencyId);
  const agencyContextString = agencyContext
    ? [
        `Industry/Sector: ${agencyContext.sector}`,
        `Target Audience: ${agencyContext.targetAudience}`,
        `Tone of Voice: ${agencyContext.toneOfVoice}`,
      ]
        .filter(Boolean)
        .join("\n")
    : undefined;

  const parsed = RegenerateSectionInputSchema.safeParse({
    ...(input as object),
    context: agencyContextString,
  });
  if (!parsed.success) return { error: "Invalid input" };

  const article = await container.getArticle.execute(parsed.data.articleId);
  if (!article.success) return { error: article.error.message };
  if (article.value.agencyId !== membership.agencyId) return { error: "Forbidden" };

  const result = await container.regenerateSection.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function saveGeneratedArticleAction(
  input: unknown,
): Promise<ActionResult<ArticleDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };
  if (!membership.role || membership.role === "VIEWER")
    return { error: "Insufficient permissions" };

  const parsed = CreateArticleInputSchema.safeParse({
    ...(input as object),
    authorId: session.user.id,
    agencyId: membership.agencyId,
  });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(fieldErrors).flat()[0] ?? "Invalid input" };
  }

  const result = await container.createArticle.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function generateEnrichedArticleAction(
  input: unknown,
): Promise<ActionResult<ArticleDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };
  if (!membership.role || membership.role === "VIEWER")
    return { error: "Insufficient permissions" };

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

  const { GenerateEnrichedArticleInputSchema } = await import(
    "@/modules/content/application/commands/generate-enriched-article.command"
  );

  const parsed = GenerateEnrichedArticleInputSchema.safeParse({
    ...(input as object),
    context: agencyContextString,
    authorId: session.user.id,
    agencyId: membership.agencyId,
  });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(fieldErrors).flat()[0] ?? "Invalid input" };
  }

  const result = await container.generateEnrichedArticle.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function listScheduledArticlesAction(): Promise<ActionResult<ArticleDto[]>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const articles = await container.listScheduledArticles.execute(membership.agencyId);
  return { data: articles };
}

export async function rescheduleArticleAction(
  articleId: string,
  scheduledAt: Date,
): Promise<ActionResult<ArticleDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };
  if (!membership.role || membership.role === "VIEWER")
    return { error: "Insufficient permissions" };

  const parsed = RescheduleArticleInputSchema.safeParse({ articleId, scheduledAt });
  if (!parsed.success) return { error: "Invalid input" };

  const result = await container.rescheduleArticle.execute(parsed.data);
  if (!result.success) return { error: result.error.message };

  // Best-effort push of the new date to Notion for already-exported articles.
  const notionToken = await getAgencyNotionToken(membership.agencyId);
  if (notionToken) {
    await container.syncArticleScheduleToNotion
      .execute({ articleId, accessToken: notionToken })
      .catch(() => undefined);
  }

  return { data: result.value };
}

const ExportArticleInputSchema = z.object({
  articleId: z.string().uuid(),
  format: z.enum(EXPORT_FORMATS),
});

export async function exportArticleAction(
  input: unknown,
): Promise<ActionResult<ExportedArticleDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const parsed = ExportArticleInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const article = await container.getArticle.execute(parsed.data.articleId);
  if (!article.success) return { error: article.error.message };
  if (article.value.agencyId !== membership.agencyId) return { error: "Forbidden" };

  const result = await container.exportArticle.execute(parsed.data.articleId, parsed.data.format);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}
