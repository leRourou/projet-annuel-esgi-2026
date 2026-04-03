"use server";

import { auth } from "@/lib/auth";
import { UpdateArticleInputSchema } from "@/modules/content/application/commands/update-article.command";
import type { ArticleDto } from "@/modules/content/application/dto/article.dto";
import { GenerateArticleInputSchema } from "@/modules/content/application/dto/generate-article.dto";
import { ListArticlesInputSchema } from "@/modules/content/application/queries/list-articles.query";
import type { PaginatedResult } from "@/shared/domain/types/pagination.type";
import { buildContainer } from "@/shared/infrastructure/di/container";

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
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  if (!membership.role || membership.role === "VIEWER")
    return { error: "Insufficient permissions" };

  const parsed = GenerateArticleInputSchema.safeParse({
    ...(input as object),
    authorId: session.user.id,
    agencyId: membership.agencyId,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.toString() };
  }

  const result = await container.generateArticle.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function updateArticleAction(input: unknown): Promise<ActionResult<ArticleDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
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
  const membership = await container.getUserMembership.execute(session.user.id);
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
  const membership = await container.getUserMembership.execute(session.user.id);
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
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const result = await container.getArticle.execute(id);
  if (!result.success) return { error: result.error.message };
  if (result.value.agencyId !== membership.agencyId) return { error: "Forbidden" };
  return { data: result.value };
}
