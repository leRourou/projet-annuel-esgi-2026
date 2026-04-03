"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { generateArticleAction } from "@/actions/content.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type State = { error?: string };

const initialState: State = {};

export default function NewContentPage() {
  const router = useRouter();
  const [contentType, setContentType] = useState("ARTICLE");

  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const input = {
        topic: formData.get("topic") as string,
        keywords: (formData.get("keywords") as string)
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        contentType: formData.get("contentType") as string,
        tone: (formData.get("tone") as string) || undefined,
        wordCount: formData.get("wordCount")
          ? Number(formData.get("wordCount"))
          : undefined,
      };
      const result = await generateArticleAction(input);
      if (result.error || !result.data) return { error: result.error ?? "Unknown error" };
      router.push(`/content/${result.data.id}`);
      return {};
    },
    initialState,
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">Generate content</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Article details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                name="topic"
                required
                placeholder="e.g. Best practices for TypeScript in 2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">
                Keywords *{" "}
                <span className="text-muted-foreground font-normal">(comma-separated)</span>
              </Label>
              <Input
                id="keywords"
                name="keywords"
                required
                placeholder="typescript, clean code, developer tools"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contentType">Content type *</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger id="contentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARTICLE">Article</SelectItem>
                  <SelectItem value="PRODUCT_SHEET">Product sheet</SelectItem>
                  <SelectItem value="META">Meta description</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="contentType" value={contentType} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Input
                id="tone"
                name="tone"
                placeholder="e.g. professional, friendly, technical"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wordCount">Word count</Label>
              <Input
                id="wordCount"
                name="wordCount"
                type="number"
                min={100}
                max={5000}
                placeholder="800"
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Generating…" : "Generate with AI"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
