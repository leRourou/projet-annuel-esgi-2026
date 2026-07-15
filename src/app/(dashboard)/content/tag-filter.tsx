"use client";

import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface Tag {
  id: string;
  name: string;
}

interface TagFilterProps {
  tags: Tag[];
  activeTagId?: string;
}

export function TagFilter({ tags, activeTagId }: TagFilterProps) {
  const router = useRouter();

  function select(tagId: string | undefined) {
    const url = tagId ? `/content?tagId=${tagId}` : "/content";
    router.push(url);
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs text-muted-foreground">Filtrer :</span>
      <button
        type="button"
        onClick={() => select(undefined)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Tous
      </button>
      {tags.map((tag) => (
        <button key={tag.id} type="button" onClick={() => select(tag.id)}>
          <Badge
            variant={activeTagId === tag.id ? "default" : "outline"}
            className="cursor-pointer text-xs"
          >
            {tag.name}
          </Badge>
        </button>
      ))}
    </div>
  );
}
