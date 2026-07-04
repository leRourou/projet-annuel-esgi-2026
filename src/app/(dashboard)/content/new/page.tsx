"use client";

import {
  generateEnrichedArticleAction,
  saveGeneratedArticleAction,
} from "@/actions/content.actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useContentStream } from "@/hooks/use-content-stream";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  ARTICLE: "Blog article",
  PRODUCT_SHEET: "Product sheet",
  META: "Meta description",
  LINKEDIN_POST: "LinkedIn post",
  FACEBOOK_POST: "Facebook post",
};

const LANGUAGE_LABELS: Record<string, string> = {
  FR: "Français",
  EN: "English",
};

const ARTICLE_TYPE_OPTIONS = [
  { value: "HOW_TO", label: "How-to guide" },
  { value: "LISTICLE", label: "Listicle" },
  { value: "COMPARISON", label: "Comparison" },
  { value: "CASE_STUDY", label: "Case study" },
  { value: "OPINION", label: "Opinion" },
  { value: "NEWS", label: "News" },
] as const;

const DEFAULT_WORD_COUNT = 1200;

function NewContentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledTopic = searchParams.get("topic") ?? "";
  const prefilledKeywords = searchParams.get("keywords") ?? "";
  const prefilledContentType = searchParams.get("contentType") ?? "ARTICLE";

  const [contentType, setContentType] = useState(
    Object.keys(CONTENT_TYPE_LABELS).includes(prefilledContentType)
      ? prefilledContentType
      : "ARTICLE",
  );
  const [articleType, setArticleType] = useState<string | null>(null);
  const [language, setLanguage] = useState("FR");
  const [wordCount, setWordCount] = useState(DEFAULT_WORD_COUNT);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [enriched, setEnriched] = useState(false);
  const [enrichedLoading, setEnrichedLoading] = useState(false);
  const {
    text,
    loading,
    isDone,
    parsedContent,
    error: streamError,
    startStream,
    reset,
  } = useContentStream();
  const formRef = useRef<HTMLFormElement>(null);

  function getFormInput() {
    const form = formRef.current;
    if (!form) return null;
    const data = new FormData(form);
    return {
      topic: data.get("topic") as string,
      keywords: ((data.get("keywords") as string) ?? "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      contentType,
      tone: (data.get("tone") as string) || undefined,
      wordCount,
      articleType: articleType ?? undefined,
      language,
    };
  }

  async function handleGenerate() {
    if (enriched) {
      await handleEnrichedGenerate();
      return;
    }
    reset();
    setSaveError(null);
    const input = getFormInput();
    if (!input) return;
    await startStream(input);
  }

  async function handleEnrichedGenerate() {
    const input = getFormInput();
    if (!input) return;
    setEnrichedLoading(true);
    setSaveError(null);
    const result = await generateEnrichedArticleAction(input);
    setEnrichedLoading(false);
    if (result.error || !result.data) {
      setSaveError(result.error ?? "Generation failed");
      return;
    }
    router.push(`/content/${result.data.id}`);
  }

  async function handleSave() {
    if (!parsedContent) return;
    setSaving(true);
    setSaveError(null);
    const result = await saveGeneratedArticleAction({
      title: parsedContent.title,
      body: parsedContent.body,
      metaTitle: parsedContent.metaTitle,
      metaDescription: parsedContent.metaDescription,
      slug: parsedContent.slug,
      suggestedKeywords: parsedContent.suggestedKeywords,
      contentType,
    });
    setSaving(false);
    if (result.error || !result.data) {
      setSaveError(result.error ?? "Unknown error");
      return;
    }
    router.push(`/content/${result.data.id}`);
  }

  const hasError = streamError ?? saveError;
  const isGenerating = loading || enrichedLoading;
  const showPreview = isDone && parsedContent && !enriched;
  const isArticle = contentType === "ARTICLE";

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Generate content</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Article details</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} className="space-y-5">
            {hasError && (
              <Alert variant="destructive">
                <AlertDescription>{hasError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                name="topic"
                required
                placeholder="e.g. Best practices for TypeScript in 2025"
                defaultValue={prefilledTopic}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">
                Keywords *{" "}
                <span className="text-muted-foreground font-normal">(comma-separated)</span>
              </Label>
              <Input
                id="keywords"
                name="keywords"
                required
                placeholder="typescript, clean code, developer tools"
                defaultValue={prefilledKeywords}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contentType">Content type *</Label>
              <Select
                value={contentType}
                onValueChange={(v) => {
                  setContentType(v);
                  if (v !== "ARTICLE") setArticleType(null);
                }}
                disabled={isGenerating}
              >
                <SelectTrigger id="contentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language *</Label>
              <Select value={language} onValueChange={setLanguage} disabled={isGenerating}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isArticle && (
              <div className="space-y-3">
                <Label>Article type</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ARTICLE_TYPE_OPTIONS.map((option) => {
                    const selected = articleType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => setArticleType(selected ? null : option.value)}
                        className={[
                          "rounded-md border px-3 py-2 text-sm text-left transition-colors",
                          selected
                            ? "border-foreground bg-foreground text-background"
                            : "border-input bg-background text-foreground hover:bg-muted",
                          isGenerating ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Optional — shapes the structure of the generated article.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Length</Label>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {wordCount.toLocaleString()} words
                </span>
              </div>
              <Slider
                min={200}
                max={3000}
                step={100}
                value={[wordCount]}
                onValueChange={([v]) => setWordCount(v ?? DEFAULT_WORD_COUNT)}
                disabled={isGenerating}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>200</span>
                <span>1 500</span>
                <span>3 000</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Input
                id="tone"
                name="tone"
                placeholder="e.g. professional, friendly, technical"
                disabled={isGenerating}
              />
            </div>

            <div className="rounded-lg border border-input p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enrich with curated sources</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically injects your "To use" RSS articles as research context
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enriched}
                  onClick={() => setEnriched(!enriched)}
                  disabled={isGenerating}
                  className={[
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                    enriched ? "bg-foreground" : "bg-input",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                      enriched ? "translate-x-5" : "translate-x-0",
                    ].join(" ")}
                  />
                </button>
              </div>
              {enriched && (
                <p className="text-xs text-muted-foreground bg-muted rounded px-3 py-2">
                  The article will be generated and saved immediately — no streaming preview. Make
                  sure you have articles marked as "To use" in the RSS curation feed.
                </p>
              )}
            </div>

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || saving}
              className="w-full"
            >
              {enrichedLoading
                ? "Generating enriched article…"
                : isGenerating
                  ? "Writing your content…"
                  : enriched
                    ? "Generate enriched article"
                    : "Generate"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isGenerating && !isDone && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="animate-pulse">●</span>
              <span className="text-sm">Claude is writing your content…</span>
            </div>
          </CardContent>
        </Card>
      )}

      {showPreview && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Generated content</CardTitle>
            <Badge variant="outline">{CONTENT_TYPE_LABELS[contentType]}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Title
              </p>
              <p className="font-semibold">{parsedContent.title}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Content
              </p>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {parsedContent.body}
              </pre>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Meta title
                </p>
                <p className="text-sm">{parsedContent.metaTitle}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Meta description
                </p>
                <p className="text-sm text-muted-foreground">{parsedContent.metaDescription}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Keywords
                </p>
                <div className="flex flex-wrap gap-1">
                  {parsedContent.suggestedKeywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {saveError && (
              <Alert variant="destructive">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleGenerate} disabled={saving}>
                Regenerate
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving…" : "Save article"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isDone && !parsedContent && text && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Raw output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{text}</pre>
            <Button variant="outline" onClick={handleGenerate} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function NewContentPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
      }
    >
      <NewContentForm />
    </Suspense>
  );
}
