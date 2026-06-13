import { listArticlesAction } from "@/actions/content.actions";
import { listFeedsAction } from "@/actions/rss.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function statusVariant(status: string) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "REVIEW") return "warning" as const;
  return "secondary" as const;
}

export default async function DashboardPage() {
  const [allResult, draftResult, reviewResult, publishedResult, feedsResult] = await Promise.all([
    listArticlesAction({ page: 1, limit: 5 }),
    listArticlesAction({ page: 1, limit: 1, status: "DRAFT" }),
    listArticlesAction({ page: 1, limit: 1, status: "REVIEW" }),
    listArticlesAction({ page: 1, limit: 1, status: "PUBLISHED" }),
    listFeedsAction(),
  ]);

  const recentArticles = allResult.data?.items ?? [];
  const totalArticles = allResult.data?.total ?? 0;
  const draftCount = draftResult.data?.total ?? 0;
  const reviewCount = reviewResult.data?.total ?? 0;
  const publishedCount = publishedResult.data?.total ?? 0;
  const feedCount = feedsResult.data?.length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your agency&apos;s content activity
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/content" className="block">
          <Card className="hover:border-foreground/20 transition-colors">
            <CardContent className="p-4">
              <p className="text-3xl font-bold tabular-nums">{totalArticles}</p>
              <p className="text-xs text-muted-foreground mt-1">Total articles</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content?status=DRAFT" className="block">
          <Card className="hover:border-foreground/20 transition-colors">
            <CardContent className="p-4">
              <p className="text-3xl font-bold tabular-nums">{draftCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Drafts</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content?status=REVIEW" className="block">
          <Card className="hover:border-foreground/20 transition-colors">
            <CardContent className="p-4">
              <p className="text-3xl font-bold tabular-nums">{reviewCount}</p>
              <p className="text-xs text-muted-foreground mt-1">In review</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content?status=PUBLISHED" className="block">
          <Card className="hover:border-foreground/20 transition-colors">
            <CardContent className="p-4">
              <p className="text-3xl font-bold tabular-nums">{publishedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Published</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/content/new">Generate content</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/ideas">Generate ideas</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/rss">Manage RSS feeds</Link>
        </Button>
      </div>

      {/* Recent articles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Recent articles</h2>
          <Link
            href="/content"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            View all
          </Link>
        </div>

        {recentArticles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No articles yet.</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/content/new">Generate your first article</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentArticles.map((article) => (
              <Link key={article.id} href={`/content/${article.id}`} className="block">
                <Card className="hover:border-foreground/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium truncate">{article.title}</p>
                      <Badge
                        variant={statusVariant(article.status)}
                        className="shrink-0 capitalize"
                      >
                        {article.status.toLowerCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* RSS sources count */}
      {feedCount > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">RSS Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {feedCount} {feedCount === 1 ? "source" : "sources"} configured.{" "}
              <Link href="/rss" className="underline underline-offset-4">
                Manage feeds →
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
