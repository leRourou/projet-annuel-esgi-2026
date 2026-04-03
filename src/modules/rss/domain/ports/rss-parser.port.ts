export interface ParsedFeedItem {
  guid: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: Date;
}

export interface ParsedFeed {
  title: string;
  items: ParsedFeedItem[];
}

export interface RssParserPort {
  parse(url: string): Promise<ParsedFeed>;
}
