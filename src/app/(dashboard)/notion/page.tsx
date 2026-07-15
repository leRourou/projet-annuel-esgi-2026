"use client";

import { getAgencyAction } from "@/actions/agency.actions";
import {
  importFromNotionAction,
  importNotionEntriesAction,
  searchNotionPagesAction,
} from "@/actions/notion.actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { NotionPageDto } from "@/modules/notion/application/dto/notion-page.dto";
import { useEffect, useState, useTransition } from "react";

function CurationSyncPanel() {
  const [databaseId, setDatabaseId] = useState<string | null>(null);
  const [stats, setStats] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getAgencyAction().then((result) => {
      setDatabaseId(result.data?.notionDatabaseId ?? null);
    });
  }, []);

  function handleSync() {
    if (!databaseId) return;
    setError(null);
    setStats(null);
    startTransition(async () => {
      const result = await importNotionEntriesAction(databaseId);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setStats({ imported: result.data.imported, skipped: result.data.skipped });
      }
    });
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Curation database sync</CardTitle>
        <CardDescription className="text-xs">
          Imports new pages from the configured Notion database as curation sources.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!databaseId ? (
          <p className="text-xs text-muted-foreground">
            No Notion database configured. Choose one in Settings.
          </p>
        ) : (
          <Button size="sm" onClick={handleSync} disabled={isPending}>
            Import new entries
          </Button>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {stats && (
          <p className="text-xs text-muted-foreground">
            {stats.imported} new entry(ies) imported, {stats.skipped} already known.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

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

      <CurationSyncPanel />

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
