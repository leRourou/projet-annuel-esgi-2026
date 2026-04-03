"use client";

import { useState, useTransition } from "react";
import { searchNotionPagesAction, importFromNotionAction } from "@/actions/notion.actions";
import type { NotionPageDto } from "@/modules/notion/application/dto/notion-page.dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export default function NotionPage() {
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<NotionPageDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await searchNotionPagesAction(query);
      if (result.error) {
        setError(result.error);
      } else {
        setPages(result.data ?? []);
      }
    });
  }

  function handleImport(pageId: string) {
    startTransition(async () => {
      const result = await importFromNotionAction({ pageId });
      if (result.error) {
        setError(result.error);
      } else {
        alert(`Imported as article: ${result.data?.title}`);
      }
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Notion</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search and import pages from your Notion workspace
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Notion pages..."
          className="flex-1"
        />
        <Button type="submit" disabled={isPending || !query.trim()}>
          Search
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{page.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Last edited: {new Date(page.lastEditedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleImport(page.id)}
                  disabled={isPending}
                  className="shrink-0"
                >
                  Import
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
