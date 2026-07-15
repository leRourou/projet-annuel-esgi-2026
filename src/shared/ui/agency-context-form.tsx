"use client";

import { updateAgencyContextAction } from "@/actions/agency.actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
          Secteur d'activité
        </label>
        <Input
          id="ctx-sector"
          placeholder="ex. SaaS, e-commerce, services juridiques…"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="ctx-audience">
          Cible
        </label>
        <Input
          id="ctx-audience"
          placeholder="ex. PME du retail, responsables marketing 30–50 ans"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="ctx-tone">
          Ton éditorial
        </label>
        <Input
          id="ctx-tone"
          placeholder="ex. Professionnel, empathique, expert"
          value={toneOfVoice}
          onChange={(e) => setToneOfVoice(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="ctx-keywords">
          Mots-clés de marque
          <span className="text-muted-foreground font-normal ml-1">(séparés par des virgules)</span>
        </label>
        <Input
          id="ctx-keywords"
          placeholder="ex. marketing digital, ROI, growth hacking"
          value={brandKeywordsRaw}
          onChange={(e) => setBrandKeywordsRaw(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="ctx-additional">
          Contexte additionnel
          <span className="text-muted-foreground font-normal ml-1">(optionnel)</span>
        </label>
        <Textarea
          id="ctx-additional"
          className="resize-y"
          placeholder="Charte éditoriale spécifique, contexte concurrentiel, restrictions de contenu…"
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          maxLength={2000}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && (
        <Alert variant="success">
          <AlertDescription>Contexte enregistré avec succès.</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Enregistrement…" : "Enregistrer le contexte"}
      </Button>
    </form>
  );
}
