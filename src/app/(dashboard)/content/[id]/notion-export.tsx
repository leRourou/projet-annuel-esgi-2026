"use client";

import { exportToNotionAction } from "@/actions/notion.actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useTransition } from "react";

interface NotionExportProps {
  articleId: string;
  notionPageId?: string;
  hasNotionConfig: boolean;
}

export function NotionExport({ articleId, notionPageId, hasNotionConfig }: NotionExportProps) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [result, setResult] = useState<{ notionPageId?: string; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!hasNotionConfig) {
    return (
      <p className="text-xs text-muted-foreground">
        Connectez Notion et configurez une base de données dans{" "}
        <Link href="/settings" className="underline">
          Paramètres
        </Link>{" "}
        pour activer l'export.
      </p>
    );
  }

  function handleExport() {
    setResult(null);
    startTransition(async () => {
      const res = await exportToNotionAction({
        articleId,
        scheduledAt: scheduledAt || undefined,
      });
      if (res.error) {
        setResult({ error: res.error });
      } else {
        setResult({ notionPageId: res.data?.notionPageId });
      }
    });
  }

  return (
    <div className="space-y-3">
      {notionPageId && (
        <p className="text-xs text-muted-foreground">
          Déjà synchronisé avec Notion —{" "}
          <a
            href={`https://notion.so/${notionPageId.replace(/-/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            voir la page
          </a>
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="scheduled-at" className="text-xs">
          Date de publication (facultatif)
        </Label>
        <Input
          id="scheduled-at"
          type="date"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={handleExport}
        disabled={isPending}
        className="w-full"
      >
        {isPending
          ? "Exportation…"
          : notionPageId
            ? "Réexporter vers Notion"
            : "Exporter vers Notion"}
      </Button>

      {result?.error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">{result.error}</AlertDescription>
        </Alert>
      )}
      {result?.notionPageId && (
        <Alert className="py-2">
          <AlertDescription className="text-xs">
            Exporté vers Notion.{" "}
            <a
              href={`https://notion.so/${result.notionPageId.replace(/-/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Ouvrir la page
            </a>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
