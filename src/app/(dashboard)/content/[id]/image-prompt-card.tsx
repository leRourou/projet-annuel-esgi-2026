"use client";

import { updateArticleAction } from "@/actions/content.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition } from "react";

interface ImagePromptCardProps {
  articleId: string;
  initialPrompt: string | undefined;
}

export function ImagePromptCard({ articleId, initialPrompt }: ImagePromptCardProps) {
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!initialPrompt && prompt === "") {
    return null;
  }

  function handleCopy() {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateArticleAction({ id: articleId, imagePrompt: prompt });
      if (result.error) setError(result.error);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Prompt d'image IA</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2 text-xs">
          {copied ? "Copié !" : "Copier"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isPending}
          rows={3}
          className="text-sm"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={isPending || prompt === (initialPrompt ?? "")}
        >
          {isPending ? "Enregistrement…" : "Enregistrer le prompt"}
        </Button>
      </CardContent>
    </Card>
  );
}
