"use client";

import { listCuratedItemsAction, qualifyFeedItemAction } from "@/actions/rss.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FeedItemDto } from "@/modules/rss/application/dto/feed-item.dto";
import {
  CURATION_STATUSES,
  type CurationStatusValue,
} from "@/modules/rss/domain/value-objects/curation-status.vo";
import { useState, useTransition } from "react";

const STATUS_LABELS: Record<CurationStatusValue, string> = {
  UNREAD: "Non lu",
  INTERESTING: "Intéressant",
  IGNORED: "Ignoré",
  TO_USE: "À utiliser",
};

const STATUS_VARIANTS: Record<
  CurationStatusValue,
  "outline" | "secondary" | "destructive" | "default"
> = {
  UNREAD: "outline",
  INTERESTING: "secondary",
  IGNORED: "destructive",
  TO_USE: "default",
};

interface Tag {
  id: string;
  name: string;
}

interface CuratedItemsClientProps {
  initialItems: FeedItemDto[];
  tags: Tag[];
}

function StatusFilter({
  current,
  onChange,
}: {
  current: CurationStatusValue | "ALL";
  onChange: (v: CurationStatusValue | "ALL") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={current === "ALL" ? "default" : "outline"}
        onClick={() => onChange("ALL")}
      >
        Tous
      </Button>
      {CURATION_STATUSES.map((s) => (
        <Button
          key={s}
          size="sm"
          variant={current === s ? "default" : "outline"}
          onClick={() => onChange(s)}
        >
          {STATUS_LABELS[s]}
        </Button>
      ))}
    </div>
  );
}

function ItemTagPicker({
  allTags,
  selectedIds,
  onChange,
}: {
  allTags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  if (allTags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {allTags.map((tag) => {
        const selected = selectedIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => {
              onChange(
                selected ? selectedIds.filter((id) => id !== tag.id) : [...selectedIds, tag.id],
              );
            }}
            className="focus:outline-none"
          >
            <Badge variant={selected ? "default" : "outline"} className="cursor-pointer text-xs">
              {tag.name}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}

function FeedItemCard({
  item,
  tags,
  onQualify,
}: {
  item: FeedItemDto;
  tags: Tag[];
  onQualify: (id: string, status: CurationStatusValue, tagIds: string[]) => void;
}) {
  const [tagIds, setTagIds] = useState<string[]>(item.tagIds);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatus(status: CurationStatusValue) {
    setError(null);
    startTransition(async () => {
      const result = await qualifyFeedItemAction(item.id, status, tagIds);
      if (result.error) {
        setError(result.error);
        return;
      }
      onQualify(item.id, status, tagIds);
    });
  }

  function handleTagChange(ids: string[]) {
    const previousTagIds = tagIds;
    setTagIds(ids);
    setError(null);
    startTransition(async () => {
      const result = await qualifyFeedItemAction(item.id, item.curationStatus, ids);
      if (result.error) {
        setError(result.error);
        setTagIds(previousTagIds);
      }
    });
  }

  return (
    <Card className={isPending ? "opacity-60" : ""}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline line-clamp-2"
            >
              {item.title}
            </a>
            {item.summary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(item.publishedAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
            <ItemTagPicker allTags={tags} selectedIds={tagIds} onChange={handleTagChange} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {CURATION_STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={item.curationStatus === s ? STATUS_VARIANTS[s] : "ghost"}
                className="text-xs h-7 px-2"
                onClick={() => handleStatus(s)}
                disabled={isPending}
              >
                {STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CuratedItemsClient({ initialItems, tags }: CuratedItemsClientProps) {
  const [statusFilter, setStatusFilter] = useState<CurationStatusValue | "ALL">("ALL");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [items, setItems] = useState<FeedItemDto[]>(initialItems);
  const [isLoading, startTransition] = useTransition();

  function handleFilterChange(status: CurationStatusValue | "ALL") {
    setStatusFilter(status);
    startTransition(async () => {
      const result = await listCuratedItemsAction({
        curationStatus: status === "ALL" ? undefined : status,
        tagId: tagFilter ?? undefined,
      });
      if (result.data) setItems(result.data);
    });
  }

  function handleTagFilterChange(tagId: string | null) {
    setTagFilter(tagId);
    startTransition(async () => {
      const result = await listCuratedItemsAction({
        curationStatus: statusFilter === "ALL" ? undefined : statusFilter,
        tagId: tagId ?? undefined,
      });
      if (result.data) setItems(result.data);
    });
  }

  function handleItemQualified(id: string, status: CurationStatusValue, tagIds: string[]) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, curationStatus: status, tagIds } : item)),
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <StatusFilter current={statusFilter} onChange={handleFilterChange} />

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Filtrer par tag :</span>
            <button type="button" onClick={() => handleTagFilterChange(null)}>
              <Badge
                variant={tagFilter === null ? "default" : "outline"}
                className="cursor-pointer"
              >
                Tous les tags
              </Badge>
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagFilterChange(tag.id === tagFilter ? null : tag.id)}
              >
                <Badge
                  variant={tagFilter === tag.id ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {tag.name}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`space-y-3 ${isLoading ? "opacity-70" : ""}`}>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Aucun article trouvé. Ajoutez des flux RSS et actualisez-les pour commencer la curation.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{items.length} articles</p>
            {items.map((item) => (
              <FeedItemCard key={item.id} item={item} tags={tags} onQualify={handleItemQualified} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
