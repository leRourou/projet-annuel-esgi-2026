"use client";

import { updateAgencyContextAction } from "@/actions/agency.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AgencyContextDto } from "@/modules/agency/application/dto/agency-context.dto";
import { useState, useTransition } from "react";

interface Props {
  initial: AgencyContextDto | null;
}

export function AgencyContextForm({ initial }: Props) {
  const [sector, setSector] = useState(initial?.sector ?? "");
  const [targetAudience, setTargetAudience] = useState(initial?.targetAudience ?? "");
  const [toneOfVoice, setToneOfVoice] = useState(initial?.toneOfVoice ?? "");
  const [brandKeywordsRaw, setBrandKeywordsRaw] = useState(
    initial?.brandKeywords?.join(", ") ?? "",
  );
  const [additionalContext, setAdditionalContext] = useState(initial?.additionalContext ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const brandKeywords = brandKeywordsRaw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    startTransition(async () => {
      const result = await updateAgencyContextAction({
        sector,
        targetAudience,
        toneOfVoice,
        brandKeywords,
        additionalContext: additionalContext || null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="ctx-sector">
          Industry / Sector
        </label>
        <Input
          id="ctx-sector"
          placeholder="e.g. SaaS, E-commerce, Legal services…"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="ctx-audience">
          Target Audience
        </label>
        <Input
          id="ctx-audience"
          placeholder="e.g. SMBs in retail, marketing managers 30–50"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="ctx-tone">
          Tone of Voice
        </label>
        <Input
          id="ctx-tone"
          placeholder="e.g. Professional, empathetic, authoritative"
          value={toneOfVoice}
          onChange={(e) => setToneOfVoice(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="ctx-keywords">
          Brand Keywords
          <span className="text-muted-foreground font-normal ml-1">(comma-separated)</span>
        </label>
        <Input
          id="ctx-keywords"
          placeholder="e.g. digital marketing, ROI, growth hacking"
          value={brandKeywordsRaw}
          onChange={(e) => setBrandKeywordsRaw(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="ctx-additional">
          Additional Context
          <span className="text-muted-foreground font-normal ml-1">(optional)</span>
        </label>
        <textarea
          id="ctx-additional"
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
          placeholder="Any specific brand guidelines, competitor context, or content restrictions…"
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          maxLength={2000}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-green-600">Context saved successfully.</p>}

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Saving…" : "Save context"}
      </Button>
    </form>
  );
}
