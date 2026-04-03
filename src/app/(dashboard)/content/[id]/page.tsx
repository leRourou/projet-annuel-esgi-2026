import { notFound } from "next/navigation";
import { getArticleAction, publishArticleAction } from "@/actions/content.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function statusVariant(status: string) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "REVIEW") return "warning" as const;
  return "secondary" as const;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const result = await getArticleAction(id);
  if (result.error || !result.data) notFound();

  const article = result.data;

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{article.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{article.seoMetadata.slug}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={statusVariant(article.status)}>{article.status}</Badge>
          {article.status === "REVIEW" && (
            <form
              action={async () => {
                "use server";
                await publishArticleAction(id);
              }}
            >
              <Button type="submit" size="sm">
                Publish
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">SEO Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Meta title</p>
              <p>{article.seoMetadata.metaTitle}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Meta description</p>
              <p>{article.seoMetadata.metaDescription}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Keywords</p>
              <div className="flex flex-wrap gap-1">
                {article.seoMetadata.keywords.map((kw) => (
                  <Badge key={kw} variant="secondary" className="text-xs font-normal">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{article.body}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
