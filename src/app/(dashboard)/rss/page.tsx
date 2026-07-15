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
          <h1 className="text-2xl font-semibold tracking-tight">Flux RSS</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Abonnez-vous à des flux de contenu pour vous inspirer
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await refreshFeedsAction();
          }}
        >
          <Button type="submit" variant="outline">
            Tout actualiser
          </Button>
        </form>
      </div>

      <RssManager initialFeeds={feeds} />
    </div>
  );
}
