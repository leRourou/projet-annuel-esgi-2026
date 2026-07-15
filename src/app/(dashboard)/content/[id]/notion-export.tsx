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
        Connect Notion and configure a database in{" "}
        <Link href="/settings" className="underline">
          Settings
        </Link>{" "}
        to enable export.
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
          Already synced to Notion —{" "}
          <a
            href={`https://notion.so/${notionPageId.replace(/-/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            view page
          </a>
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="scheduled-at" className="text-xs">
          Publication date (optional)
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
        {isPending ? "Exporting…" : notionPageId ? "Re-export to Notion" : "Export to Notion"}
      </Button>

      {result?.error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">{result.error}</AlertDescription>
        </Alert>
      )}
      {result?.notionPageId && (
        <Alert className="py-2">
          <AlertDescription className="text-xs">
            Exported to Notion.{" "}
            <a
              href={`https://notion.so/${result.notionPageId.replace(/-/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Open page
            </a>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
