import { getAgencyAction } from "@/actions/agency.actions";
import { getArticleAction, publishArticleAction } from "@/actions/content.actions";
import { getSourceItemsAction } from "@/actions/rss.actions";
import { listTagsAction } from "@/actions/tags.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { seoScoreVariant } from "@/shared/ui/seo-score-badge";
import { notFound } from "next/navigation";
import { ContentEditor } from "./content-editor";
import { ExportContent } from "./export-content";
import { ImagePromptCard } from "./image-prompt-card";
import { NotionExport } from "./notion-export";
import { RetentionAlert } from "./retention-alert";
import { TagAssign } from "./tag-assign";

function statusVariant(status: string) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "REVIEW") return "warning" as const;
  return "secondary" as const;
}

const SCORE_TEXT_COLOR: Record<ReturnType<typeof seoScoreVariant>, string> = {
  success: "text-green-600",
  warning: "text-amber-500",
  destructive: "text-red-500",
};

function seoScoreColor(score: number): string {
  return SCORE_TEXT_COLOR[seoScoreVariant(score)];
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
  const [result, tagsResult, agencyResult] = await Promise.all([
    getArticleAction(id),
    listTagsAction(),
    getAgencyAction(),
  ]);
  if (result.error || !result.data) notFound();

  const sourceItems =
    result.data.sourceIds.length > 0
      ? ((await getSourceItemsAction(result.data.sourceIds)).data ?? [])
      : [];

  const article = result.data;
  const allTags = tagsResult.data ?? [];
  const agency = agencyResult.data;
  const hasNotionConfig = !!(agency?.notionConnected && agency?.notionDatabaseId);

  const seoScore = article.seoScore;

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
        <RetentionAlert
          articleId={article.id}
          daysUntilBodyPurge={article.daysUntilBodyPurge}
          bodyPurgedAt={article.bodyPurgedAt}
          notionPageId={article.notionPageId}
          hasNotionConfig={hasNotionConfig}
        />

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
            <p className="text-xs text-muted-foreground mt-3">
              Keyword density: {seoScore.details.keywordDensityPercent}% (target 1–3%)
            </p>
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

        <ImagePromptCard articleId={article.id} initialPrompt={article.imagePrompt} />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <TagAssign articleId={article.id} allTags={allTags} currentTagIds={article.tagIds} />
          </CardContent>
        </Card>

        {sourceItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Curated sources used ({sourceItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sourceItems.map((source) => (
                <div key={source.id} className="text-sm">
                  <a
                    href={source.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline text-foreground"
                  >
                    {source.title}
                  </a>
                  {source.summary && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {source.summary}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Export to Notion</CardTitle>
          </CardHeader>
          <CardContent>
            <NotionExport
              articleId={article.id}
              notionPageId={article.notionPageId}
              hasNotionConfig={hasNotionConfig}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Download</CardTitle>
          </CardHeader>
          <CardContent>
            <ExportContent articleId={article.id} />
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
