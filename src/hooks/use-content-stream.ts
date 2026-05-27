"use client";

import { useState } from "react";

export interface StreamInput {
  topic: string;
  keywords: string[];
  contentType: string;
  tone?: string;
  wordCount?: number;
  articleType?: string;
  context?: string;
}

export interface ParsedGeneratedContent {
  title: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
  suggestedKeywords: string[];
  slug: string;
}

export function useContentStream() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [parsedContent, setParsedContent] = useState<ParsedGeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startStream(input: StreamInput): Promise<void> {
    setLoading(true);
    setIsDone(false);
    setParsedContent(null);
    setText("");
    setError(null);

    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Generation failed");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("No response body");
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split("\n\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;

          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.error) {
              setError(parsed.error);
            } else if (parsed.text) {
              accumulated += parsed.text;
              setText(accumulated);
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      // Parse the accumulated JSON once streaming is complete
      try {
        const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const content = JSON.parse(jsonMatch[0]) as ParsedGeneratedContent;
          setParsedContent(content);
        }
      } catch {
        // JSON parsing failed — raw text is still in `text`
      }

      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function reset(): void {
    setText("");
    setIsDone(false);
    setParsedContent(null);
    setError(null);
  }

  return { text, loading, isDone, parsedContent, error, startStream, reset };
}
