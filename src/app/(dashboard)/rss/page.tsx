import { listFeedsAction, refreshFeedsAction } from "@/actions/rss.actions";
import { Button } from "@/components/ui/button";
import { RssManager } from "./rss-manager";

export default async function RssPage() {
  const feedsResult = await listFeedsAction();
  const feeds = feedsResult.data ?? [];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">RSS Feeds</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Subscribe to content feeds for inspiration
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await refreshFeedsAction();
          }}
        >
          <Button type="submit" variant="outline">
            Refresh all
          </Button>
        </form>
      </div>

      <RssManager initialFeeds={feeds} />
    </div>
  );
}
