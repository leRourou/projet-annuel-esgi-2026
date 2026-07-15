"use client";

import { assignTagsAction } from "@/actions/tags.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Tag {
  id: string;
  name: string;
}

interface TagAssignProps {
  articleId: string;
  allTags: Tag[];
  currentTagIds: string[];
}

export function TagAssign({ articleId, allTags, currentTagIds }: TagAssignProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentTagIds));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (allTags.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Aucun tag disponible. Créez des tags dans{" "}
        <Link href="/settings/tags" className="underline">
          Paramètres → Tags
        </Link>
        .
      </p>
    );
  }

  function toggle(tagId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await assignTagsAction({ articleId, tagIds: Array.from(selected) });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const hasChanged =
    selected.size !== currentTagIds.length || currentTagIds.some((id) => !selected.has(id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button key={tag.id} type="button" onClick={() => toggle(tag.id)} disabled={isPending}>
            <Badge
              variant={selected.has(tag.id) ? "default" : "outline"}
              className="cursor-pointer text-xs"
            >
              {tag.name}
            </Badge>
          </button>
        ))}
      </div>

      {hasChanged && (
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          Enregistrer les tags
        </Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
