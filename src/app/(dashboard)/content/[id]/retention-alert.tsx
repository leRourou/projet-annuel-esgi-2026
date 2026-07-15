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
        <AlertTitle>Contenu purgé</AlertTitle>
        <AlertDescription>
          Le contenu de l'article a été purgé le {bodyPurgedAt.toLocaleDateString("fr-FR")}{" "}
          conformément à la politique de rétention de 30 jours. Le titre, les métadonnées SEO et les
          tags restent disponibles.
        </AlertDescription>
      </Alert>
    );
  }

  const isUrgent = daysUntilBodyPurge !== null && daysUntilBodyPurge <= URGENT_THRESHOLD_DAYS;

  return (
    <Alert variant={isUrgent ? "destructive" : "default"}>
      <AlertTitle>Politique de rétention</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Le contenu complet de cet article sera automatiquement purgé dans{" "}
          <strong>{daysUntilBodyPurge} jour(s)</strong>, 30 jours après la publication. Les
          métadonnées sont conservées indéfiniment.
        </p>
        {hasNotionConfig && !exported && (
          <Button size="sm" variant="outline" onClick={handleExport} disabled={isPending}>
            {isPending ? "Exportation…" : "Exporter vers Notion avant la purge"}
          </Button>
        )}
        {exported && <p className="text-xs text-muted-foreground">Exporté vers Notion.</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </AlertDescription>
    </Alert>
  );
}
