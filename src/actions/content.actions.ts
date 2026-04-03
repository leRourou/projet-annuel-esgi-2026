"use server";

import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { GenerateArticleInputSchema } from "@/modules/content/application/dto/generate-article.dto";
import { UpdateArticleInputSchema } from "@/modules/content/application/commands/update-article.command";
import { ListArticlesInputSchema } from "@/modules/content/application/queries/list-articles.query";
import type { ArticleDto } from "@/modules/content/application/dto/article.dto";
import type { PaginatedResult } from "@/shared/domain/types/pagination.type";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

export async function generateArticleAction(
  input: unknown,
): Promise<ActionResult<ArticleDto>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = GenerateArticleInputSchema.safeParse({ ...(input as object), authorId: session.user.id });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.toString() };
  }

  const container = await buildContainer();
  const result = await container.generateArticle.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function updateArticleAction(
  input: unknown,
): Promise<ActionResult<ArticleDto>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = UpdateArticleInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const container = await buildContainer();
  const result = await container.updateArticle.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function publishArticleAction(
  articleId: string,
): Promise<ActionResult<ArticleDto>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const container = await buildContainer();
  const result = await container.publishArticle.execute(articleId);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function listArticlesAction(
  input: unknown,
): Promise<ActionResult<PaginatedResult<ArticleDto>>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = ListArticlesInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const container = await buildContainer();
  const result = await container.listArticles.execute(parsed.data);
  return { data: result };
}

export async function getArticleAction(
  id: string,
): Promise<ActionResult<ArticleDto>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const container = await buildContainer();
  const result = await container.getArticle.execute(id);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}
