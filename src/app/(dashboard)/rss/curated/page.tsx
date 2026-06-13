import { listCuratedItemsAction } from "@/actions/rss.actions";
import { listTagsAction } from "@/actions/tags.actions";
import { CuratedItemsClient } from "./curated-items-client";

export default async function CuratedPage() {
  const [itemsResult, tagsResult] = await Promise.all([listCuratedItemsAction(), listTagsAction()]);

  const items = itemsResult.data ?? [];
  const tags = tagsResult.data ?? [];

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Curation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Qualify articles from your RSS feeds to build your content sources
        </p>
      </div>
      <CuratedItemsClient initialItems={items} tags={tags} />
    </div>
  );
}
