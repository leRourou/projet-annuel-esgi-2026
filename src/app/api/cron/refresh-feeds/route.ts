import { buildContainer } from "@/shared/infrastructure/di/container";
import { NextResponse } from "next/server";

/**
 * GET /api/cron/refresh-feeds
 * Called by Vercel Cron (or any external scheduler) to refresh all RSS feeds.
 * Protected by a shared secret via the CRON_SECRET env variable.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const container = await buildContainer();
    const stats = await container.refreshFeeds.execute();
    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    console.error("[cron/refresh-feeds]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
