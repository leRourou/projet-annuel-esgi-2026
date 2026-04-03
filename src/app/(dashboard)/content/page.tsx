import { listArticlesAction } from "@/actions/content.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

function statusVariant(status: string) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "REVIEW") return "warning" as const;
  return "secondary" as const;
}

export default async function ContentPage() {
  const result = await listArticlesAction({ page: 1, limit: 20 });
  const articles = result.data?.items ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your SEO content</p>
        </div>
        <Button asChild>
          <Link href="/content/new">Generate content</Link>
        </Button>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-base font-medium mb-1">No content yet</p>
          <p className="text-sm">Generate your first article to get started.</p>
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
                    </div>
                    <Badge variant={statusVariant(article.status)} className="shrink-0">
                      {article.status}
                    </Badge>
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
