import { getArticleAction, publishArticleAction } from "@/actions/content.actions";
import { listTagsAction } from "@/actions/tags.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreContentSeoQuery } from "@/modules/content/application/queries/score-content-seo.query";
import { notFound } from "next/navigation";
import { ContentEditor } from "./content-editor";
import { TagAssign } from "./tag-assign";

const seoQuery = new ScoreContentSeoQuery();

function statusVariant(status: string) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "REVIEW") return "warning" as const;
  return "secondary" as const;
}

function seoScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function seoScoreLabel(score: number): string {
  if (score >= 80) return "Good";
  if (score >= 50) return "Needs improvement";
  return "Poor";
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const [result, tagsResult] = await Promise.all([getArticleAction(id), listTagsAction()]);
  if (result.error || !result.data) notFound();

  const article = result.data;
  const allTags = tagsResult.data ?? [];

  const seoScore = seoQuery.execute({
    title: article.title,
    body: article.body,
    seoMetadata: {
      metaTitle: article.seoMetadata.metaTitle,
      metaDescription: article.seoMetadata.metaDescription,
      keywords: article.seoMetadata.keywords,
      slug: article.seoMetadata.slug,
      excerpt: article.seoMetadata.excerpt,
    },
  });

  const scoreBreakdownItems = [
    { label: "H1 heading", pts: seoScore.breakdown.h1, max: 15 },
    { label: "H2 headings (×2 min)", pts: seoScore.breakdown.h2, max: 15 },
    { label: "H3 headings", pts: seoScore.breakdown.h3, max: 10 },
    { label: "Meta title", pts: seoScore.breakdown.metaTitle, max: 15 },
    { label: "Meta description", pts: seoScore.breakdown.metaDescription, max: 10 },
    { label: "Keyword in title", pts: seoScore.breakdown.keywordInTitle, max: 15 },
    { label: "Keyword density", pts: seoScore.breakdown.keywordInBody, max: 10 },
    { label: "Content length", pts: seoScore.breakdown.wordCount, max: 5 },
    { label: "Excerpt", pts: seoScore.breakdown.excerpt, max: 5 },
  ];

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
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>SEO Score</span>
              <span className={`text-2xl font-bold ${seoScoreColor(seoScore.overall)}`}>
                {seoScore.overall}
                <span className="text-sm font-normal text-muted-foreground">/100</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm font-medium mb-3 ${seoScoreColor(seoScore.overall)}`}>
              {seoScoreLabel(seoScore.overall)}
            </p>
            <div className="space-y-1.5">
              {scoreBreakdownItems.map(({ label, pts, max }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span
                    className={`shrink-0 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold ${pts > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                  >
                    {pts > 0 ? "✓" : "✗"}
                  </span>
                  <span className="flex-1 text-muted-foreground">{label}</span>
                  <span className={pts > 0 ? "text-foreground" : "text-muted-foreground"}>
                    {pts}/{max}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
            {article.seoMetadata.excerpt && (
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Excerpt</p>
                <p className="italic">{article.seoMetadata.excerpt}</p>
              </div>
            )}
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
            <CardTitle className="text-sm font-medium">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <TagAssign articleId={article.id} allTags={allTags} currentTagIds={article.tagIds} />
          </CardContent>
        </Card>

        <ContentEditor
          articleId={article.id}
          initialBody={article.body}
          articleTitle={article.title}
        />
      </div>
    </div>
  );
}
