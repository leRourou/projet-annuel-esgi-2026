"use client";

import {
  searchNotionDatabasesAction,
  testNotionConnectionAction,
  updateAgencyNotionConfigAction,
} from "@/actions/notion.actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NotionDatabaseSummary } from "@/modules/notion/domain/ports/notion-client.port";
import { useState, useTransition } from "react";

interface NotionConfigPanelProps {
  hasNotion: boolean;
  initialDatabaseId: string | null;
}

export function NotionConfigPanel({ hasNotion, initialDatabaseId }: NotionConfigPanelProps) {
  const [databaseId, setDatabaseId] = useState(initialDatabaseId);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NotionDatabaseSummary[]>([]);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!hasNotion) return null;

  function handleTestConnection() {
    setTestResult(null);
    setError(null);
    startTransition(async () => {
      const result = await testNotionConnectionAction();
      if (result.error) {
        setError(result.error);
      } else {
        setTestResult(result.data ?? null);
      }
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await searchNotionDatabasesAction(query);
      if (result.error) {
        setError(result.error);
      } else {
        setResults(result.data ?? []);
      }
    });
  }

  function handleSelect(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateAgencyNotionConfigAction(id);
      if (result.error) {
        setError(result.error);
      } else {
        setDatabaseId(result.data?.notionDatabaseId ?? id);
      }
    });
  }

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {databaseId ? `Target database: ${databaseId}` : "No target database selected"}
        </p>
        <Button size="sm" variant="outline" onClick={handleTestConnection} disabled={isPending}>
          Tester la connexion
        </Button>
      </div>

      {testResult && (
        <Alert variant={testResult.ok ? "default" : "destructive"}>
          <AlertDescription>
            {testResult.ok ? "Connexion Notion opérationnelle." : testResult.error}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une base Notion..."
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          Rechercher
        </Button>
      </form>

      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((db) => (
            <div
              key={db.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span className="truncate min-w-0">{db.title}</span>
              {db.id === databaseId ? (
                <Badge variant="success">Sélectionnée</Badge>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => handleSelect(db.id)}>
                  Choisir
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
