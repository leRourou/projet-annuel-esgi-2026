"use client";

import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";

const STATUSES = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "REVIEW", label: "Révision" },
  { value: "PUBLISHED", label: "Publié" },
] as const;

type StatusValue = (typeof STATUSES)[number]["value"];

export function StatusFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("status") as StatusValue | null;

  function select(status: StatusValue | null) {
    const next = new URLSearchParams(params.toString());
    if (status) {
      next.set("status", status);
    } else {
      next.delete("status");
    }
    next.delete("page");
    router.push(`/content?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs text-muted-foreground">Statut :</span>
      <button
        type="button"
        onClick={() => select(null)}
        className={`text-xs transition-colors ${!active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
      >
        Tous
      </button>
      {STATUSES.map((s) => (
        <button key={s.value} type="button" onClick={() => select(s.value)}>
          <Badge
            variant={active === s.value ? "default" : "outline"}
            className="cursor-pointer text-xs"
          >
            {s.label}
          </Badge>
        </button>
      ))}
    </div>
  );
}
