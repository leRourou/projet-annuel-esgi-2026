import { listArticlesAction } from "@/actions/content.actions";
import { listTagsAction } from "@/actions/tags.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeoScoreBadge } from "@/shared/ui/seo-score-badge";
import Link from "next/link";
import { Suspense } from "react";
import { StatusFilter } from "./status-filter";
import { TagFilter } from "./tag-filter";

function statusVariant(status: string) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "REVIEW") return "warning" as const;
  return "secondary" as const;
}

interface Props {
  searchParams: Promise<{ tagId?: string; status?: string }>;
}

export default async function ContentPage({ searchParams }: Props) {
  const { tagId, status } = await searchParams;
  const validStatus =
    status === "DRAFT" || status === "REVIEW" || status === "PUBLISHED" ? status : undefined;

  const [result, tagsResult] = await Promise.all([
    listArticlesAction({ page: 1, limit: 50, tagId, status: validStatus }),
    listTagsAction(),
  ]);
  const articles = result.data?.items ?? [];
  const total = result.data?.total ?? 0;
  const tags = tagsResult.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} {total === 1 ? "article" : "articles"} in your agency
          </p>
        </div>
        <Button asChild>
          <Link href="/content/new">Generate content</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <Suspense>
          <StatusFilter />
        </Suspense>
        {tags.length > 0 && <TagFilter tags={tags} activeTagId={tagId} />}
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-base font-medium mb-1">No content found</p>
          <p className="text-sm">
            {validStatus || tagId
              ? "Try removing filters or"
              : "Generate your first article to get started."}
            {(validStatus || tagId) && (
              <Link href="/content" className="underline underline-offset-4 ml-1">
                clear filters
              </Link>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map((article) => (
            <Link key={article.id} href={`/content/${article.id}`} className="block">
              <Card className="hover:border-foreground/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-sm font-medium truncate">{article.title}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {article.seoMetadata.slug}
                      </p>
                      {article.tagIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {article.tagIds.map((tid) => {
                            const tag = tags.find((t) => t.id === tid);
                            if (!tag) return null;
                            return (
                              <Badge key={tid} variant="outline" className="text-xs font-normal">
                                {tag.name}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant={statusVariant(article.status)} className="capitalize">
                        {article.status.toLowerCase()}
                      </Badge>
                      <SeoScoreBadge score={article.seoScore.overall} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
