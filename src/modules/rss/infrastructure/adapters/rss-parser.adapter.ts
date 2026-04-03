import Parser from "rss-parser";
import type { ParsedFeed, RssParserPort } from "../../domain/ports/rss-parser.port";

const parser = new Parser();

export class RssParserAdapter implements RssParserPort {
  async parse(url: string): Promise<ParsedFeed> {
    const feed = await parser.parseURL(url);
    return {
      title: feed.title ?? url,
      items: (feed.items ?? []).map((item) => ({
        guid: item.guid ?? item.link ?? item.title ?? String(Date.now()),
        title: item.title ?? "Untitled",
        link: item.link ?? "",
        summary: item.contentSnippet ?? item.content ?? "",
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      })),
    };
  }
}
