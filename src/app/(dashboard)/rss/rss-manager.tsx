"use client";

import {
  addFeedAction,
  listFeedItemsAction,
  qualifyFeedItemAction,
  refreshFeedsAction,
} from "@/actions/rss.actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FeedItemDto } from "@/modules/rss/application/dto/feed-item.dto";
import type { FeedDto } from "@/modules/rss/application/dto/feed.dto";
import type { CurationStatusValue } from "@/modules/rss/domain/value-objects/curation-status.vo";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const STATUS_LABELS: Record<CurationStatusValue, string> = {
  UNREAD: "·",
  INTERESTING: "★",
  IGNORED: "✕",
  TO_USE: "✓",
};

const STATUS_TITLES: Record<CurationStatusValue, string> = {
  UNREAD: "Non lu",
  INTERESTING: "Intéressant",
  IGNORED: "Ignorer",
  TO_USE: "À utiliser",
};

interface RssManagerProps {
  initialFeeds: FeedDto[];
}

function FeedItemRow({ item }: { item: FeedItemDto }) {
  const [status, setStatus] = useState<CurationStatusValue>(item.curationStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  const statuses: CurationStatusValue[] = ["UNREAD", "INTERESTING", "IGNORED", "TO_USE"];

  function handleQualify(s: CurationStatusValue) {
    setError(null);
    start(async () => {
      const result = await qualifyFeedItemAction(item.id, s);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStatus(s);
    });
  }

  return (
    <li className="border-t pt-2 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium hover:underline"
          >
            {item.title}
          </a>
          {item.summary && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.summary}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(item.publishedAt).toLocaleDateString("fr-FR")}
          </p>
          {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
        </div>
        <div className="flex gap-0.5 shrink-0">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              title={STATUS_TITLES[s]}
              disabled={isPending}
              onClick={() => handleQualify(s)}
              className={`text-xs w-6 h-6 rounded flex items-center justify-center transition-colors ${
                status === s
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    </li>
  );
}

function FeedCard({ feed }: { feed: FeedDto }) {
  const [items, setItems] = useState<FeedItemDto[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [isLoading, startLoad] = useTransition();

  function toggleExpand() {
    if (!expanded && items.length === 0) {
      startLoad(async () => {
        const result = await listFeedItemsAction(feed.id, 20);
        if (result.data) setItems(result.data);
      });
    }
    setExpanded((v) => !v);
  }

  const lastFetched = feed.lastFetchedAt
    ? new Date(feed.lastFetchedAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Jamais";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium truncate">{feed.name}</CardTitle>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{feed.url}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs">
              {lastFetched}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleExpand}
              disabled={isLoading}
              className="text-xs"
            >
              {isLoading ? "Chargement…" : expanded ? "Réduire" : "Afficher les éléments"}
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              Aucun élément pour le moment — essayez d&apos;actualiser le flux.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <FeedItemRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function RssManager({ initialFeeds }: RssManagerProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAddFeed(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await addFeedAction({ url, name });
      if (result.error) {
        setIsError(true);
        setMessage(result.error);
      } else {
        setIsError(false);
        setMessage("Flux ajouté avec succès");
        setUrl("");
        setName("");
        router.refresh();
      }
    });
  }

  function handleRefresh() {
    setMessage(null);
    startTransition(async () => {
      const result = await refreshFeedsAction();
      if (result.error) {
        setIsError(true);
        setMessage(result.error);
      } else {
        setIsError(false);
        setMessage(`Actualisé : ${result.data?.refreshed} flux, ${result.data?.failed} échec(s)`);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={isError ? "destructive" : "success"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajouter un flux</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFeed} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL du flux *</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://exemple.com/feed.xml"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Mon blog préféré"
              />
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              Ajouter le flux
            </Button>
          </form>
        </CardContent>
      </Card>

      {initialFeeds.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {initialFeeds.length} {initialFeeds.length === 1 ? "source" : "sources"}
            </h2>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending}>
              Tout actualiser
            </Button>
          </div>
          {initialFeeds.map((feed) => (
            <FeedCard key={feed.id} feed={feed} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucun flux ajouté pour le moment. Ajoutez votre première source RSS ci-dessus.
        </p>
      )}
    </div>
  );
}
