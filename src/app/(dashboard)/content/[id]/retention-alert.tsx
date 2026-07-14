"use client";

import { exportToNotionAction } from "@/actions/notion.actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";

interface RetentionAlertProps {
  articleId: string;
  daysUntilBodyPurge: number | null;
  bodyPurgedAt?: Date;
  notionPageId?: string;
  hasNotionConfig: boolean;
}

const URGENT_THRESHOLD_DAYS = 7;

export function RetentionAlert({
  articleId,
  daysUntilBodyPurge,
  bodyPurgedAt,
  notionPageId,
  hasNotionConfig,
}: RetentionAlertProps) {
  const [exported, setExported] = useState(!!notionPageId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (daysUntilBodyPurge === null && !bodyPurgedAt) return null;

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const res = await exportToNotionAction({ articleId });
      if (res.error) {
        setError(res.error);
        return;
      }
      setExported(true);
    });
  }

  if (bodyPurgedAt) {
    return (
      <Alert>
        <AlertTitle>Content purged</AlertTitle>
        <AlertDescription>
          The article body was purged on {bodyPurgedAt.toLocaleDateString()} per the 30-day
          retention policy. Title, SEO metadata and tags remain available.
        </AlertDescription>
      </Alert>
    );
  }

  const isUrgent = daysUntilBodyPurge !== null && daysUntilBodyPurge <= URGENT_THRESHOLD_DAYS;

  return (
    <Alert variant={isUrgent ? "destructive" : "default"}>
      <AlertTitle>Retention policy</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          The full body of this article will be automatically purged in{" "}
          <strong>{daysUntilBodyPurge} day(s)</strong>, 30 days after publication. Metadata is kept
          indefinitely.
        </p>
        {hasNotionConfig && !exported && (
          <Button size="sm" variant="outline" onClick={handleExport} disabled={isPending}>
            {isPending ? "Exporting…" : "Export to Notion before it's purged"}
          </Button>
        )}
        {exported && <p className="text-xs text-muted-foreground">Exported to Notion.</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </AlertDescription>
    </Alert>
  );
}
