"use client";

import { regenerateSectionAction, updateArticleAction } from "@/actions/content.actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface ContentEditorProps {
  articleId: string;
  initialBody: string;
  articleTitle: string;
}

export function ContentEditor({ articleId, initialBody, articleTitle }: ContentEditorProps) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [instruction, setInstruction] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isRegenerating, startRegen] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaveError(null);
    setSaved(false);
    startSave(async () => {
      const result = await updateArticleAction({ id: articleId, body });
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function handleRegenerate() {
    if (!instruction.trim()) return;
    setRegenError(null);
    startRegen(async () => {
      const result = await regenerateSectionAction({ articleId, instruction });
      if (result.error) {
        setRegenError(result.error);
        return;
      }
      setBody(result.data ?? body);
      setInstruction("");
    });
  }

  const isWorking = isSaving || isRegenerating;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Content</CardTitle>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-green-600">Saved</span>}
            <Button size="sm" onClick={handleSave} disabled={isWorking}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {saveError && (
            <Alert variant="destructive">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setSaved(false);
            }}
            disabled={isWorking}
            rows={30}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Edit body for ${articleTitle}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Regenerate with instruction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Describe what to change — Claude will rewrite the body applying your instruction.
          </p>
          {regenError && (
            <Alert variant="destructive">
              <AlertDescription>{regenError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="regen-instruction">Instruction</Label>
            <Input
              id="regen-instruction"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder='e.g. "Make the conclusion more actionable" or "Add a comparison table in section 2"'
              disabled={isWorking}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRegenerate();
                }
              }}
            />
          </div>
          <Separator />
          <Button
            onClick={handleRegenerate}
            disabled={isWorking || !instruction.trim()}
            variant="outline"
            className="w-full"
          >
            {isRegenerating ? "Regenerating…" : "Apply instruction"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
