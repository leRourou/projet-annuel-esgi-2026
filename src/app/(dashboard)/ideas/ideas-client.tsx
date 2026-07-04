"use client";

import { generateIdeasAction } from "@/actions/ideas.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentIdea } from "@/modules/content/domain/ports/ai-generator.port";
import Link from "next/link";
import { useState, useTransition } from "react";

interface Theme {
  id: string;
  name: string;
}

interface IdeasClientProps {
  themes: Theme[];
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  ARTICLE: "Article",
  PRODUCT_SHEET: "Product Sheet",
  META: "Meta",
};

export function IdeasClient({ themes }: IdeasClientProps) {
  const [selectedThemes, setSelectedThemes] = useState<string[]>(
    themes.length > 0 && themes[0] ? [themes[0].name] : [],
  );
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleTheme(themeName: string) {
    setSelectedThemes((prev) =>
      prev.includes(themeName) ? prev.filter((t) => t !== themeName) : [...prev, themeName],
    );
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateIdeasAction({ themes: selectedThemes, count: 10 });
      if (result.error) {
        setError(result.error);
        return;
      }
      setIdeas(result.data ?? []);
    });
  }

  if (themes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">
            No themes configured for your agency yet.{" "}
            <Link href="/settings/themes" className="underline underline-offset-4">
              Add themes in Settings
            </Link>{" "}
            to start generating ideas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select themes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => toggleTheme(theme.name)}
                className="focus:outline-none"
              >
                <Badge
                  variant={selectedThemes.includes(theme.name) ? "default" : "outline"}
                  className="cursor-pointer text-sm px-3 py-1 transition-colors"
                >
                  {theme.name}
                </Badge>
              </button>
            ))}
          </div>

          <Button onClick={handleGenerate} disabled={isPending || selectedThemes.length === 0}>
            {isPending ? "Generating…" : "Generate ideas"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {ideas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {ideas.length} ideas generated
          </h2>
          {ideas.map((idea) => (
            <Card key={idea.title}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <p className="font-medium text-sm leading-snug">{idea.title}</p>
                    <p className="text-xs text-muted-foreground">{idea.angle}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {idea.keywords.map((kw) => (
                        <Badge key={kw} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      {CONTENT_TYPE_LABELS[idea.contentType] ?? idea.contentType}
                    </Badge>
                    <Link
                      href={`/content/new?topic=${encodeURIComponent(idea.title)}&keywords=${encodeURIComponent(idea.keywords.join(","))}&contentType=${encodeURIComponent(idea.contentType)}`}
                    >
                      <Button size="sm" variant="outline">
                        Write →
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
