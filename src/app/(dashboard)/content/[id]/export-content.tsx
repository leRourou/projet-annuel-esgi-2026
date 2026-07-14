"use client";

import { exportArticleAction } from "@/actions/content.actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useTransition } from "react";

const FORMAT_LABELS = {
  MARKDOWN: "Markdown (.md)",
  HTML: "HTML (.html)",
  TEXT: "Plain text (.txt)",
} as const;

type ExportFormat = keyof typeof FORMAT_LABELS;

interface ExportContentProps {
  articleId: string;
}

export function ExportContent({ articleId }: ExportContentProps) {
  const [format, setFormat] = useState<ExportFormat>("MARKDOWN");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const res = await exportArticleAction({ articleId, format });
      if (res.error || !res.data) {
        setError(res.error ?? "Export failed");
        return;
      }
      const blob = new Blob([res.data.content], { type: res.data.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.data.filename;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(FORMAT_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" onClick={handleExport} disabled={isPending}>
        {isPending ? "Exporting…" : "Export"}
      </Button>
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
