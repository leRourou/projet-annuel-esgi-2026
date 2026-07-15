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
  imagePrompt?: string;
}

/**
 * Splits a growing SSE buffer into complete "\n\n"-terminated events plus the
 * trailing partial event (if any) that must be carried over to the next chunk.
 * A `data: ...` event can be split across two `reader.read()` calls, so the
 * buffer must be preserved across iterations instead of parsed chunk-by-chunk.
 */
export function splitSseEvents(buffer: string): { events: string[]; remainder: string } {
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";
  return { events: parts, remainder };
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
      let sseBuffer = "";

      const processLine = (line: string) => {
        if (!line.startsWith("data: ")) return false;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") return true;

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
        return false;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const { events, remainder } = splitSseEvents(sseBuffer);
        sseBuffer = remainder;

        for (const line of events) {
          if (processLine(line)) break;
        }
      }

      // The stream may end without a trailing blank line — flush whatever's left.
      if (sseBuffer) processLine(sseBuffer);

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
